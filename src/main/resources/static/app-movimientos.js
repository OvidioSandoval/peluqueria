import config from './config.js';
import NotificationSystem from './notification-system.js';

new Vue({
    vuetify: new Vuetify({
        locale: {
            current: 'es',
        },
    }),
    el: '#app',
    data() {
        return {
            movimientos: [],
            movimientosFiltrados: [],
            filtroBusqueda: '',
            filtroTipo: '',
            fechaDesde: new Date().toISOString().split('T')[0],
            fechaHasta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoMovimiento: { 
                id: null, 
                monto: null,
                cajaId: null,
                idAsociado: null,
                tipo: ''
            },
            cajas: [],
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchMovimientos();
        this.fetchCajas();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.movimientosFiltrados.length / this.itemsPorPagina);
        },
        movimientosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.movimientosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalIngresos() {
            return this.movimientosFiltrados
                .filter(m => m.tipo && m.tipo.toLowerCase().includes('ingreso'))
                .reduce((sum, m) => sum + (m.monto || 0), 0);
        },
        totalEgresos() {
            return this.movimientosFiltrados
                .filter(m => m.tipo && m.tipo.toLowerCase().includes('egreso'))
                .reduce((sum, m) => sum + (m.monto || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/movimientos';
            }
        },
        async fetchMovimientos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/movimientos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.movimientos = await response.json();
                this.filtrarMovimientos();
            } catch (error) {
                console.error('Error al cargar movimientos:', error);
                NotificationSystem.error(`Error al cargar los movimientos: ${error.message}`);
            }
        },
        async fetchCajas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/cajas`);
                this.cajas = await response.json();
            } catch (error) {
                console.error('Error al cargar cajas:', error);
            }
        },
        filtrarMovimientos() {
            let filtrados = [...this.movimientos];
            
            if (this.filtroBusqueda) {
                filtrados = filtrados.filter(mov =>
                    mov.tipo.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
                    mov.idAsociado.toString().includes(this.filtroBusqueda)
                );
            }
            
            if (this.filtroTipo) {
                filtrados = filtrados.filter(mov => mov.tipo === this.filtroTipo);
            }
            
            if (this.fechaDesde) {
                filtrados = filtrados.filter(mov => {
                    const fechaMov = new Date(mov.fecha || mov.fechaCreacion);
                    return fechaMov >= new Date(this.fechaDesde);
                });
            }
            
            if (this.fechaHasta) {
                filtrados = filtrados.filter(mov => {
                    const fechaMov = new Date(mov.fecha || mov.fechaCreacion);
                    return fechaMov <= new Date(this.fechaHasta);
                });
            }
            
            this.movimientosFiltrados = filtrados;
        },
        async agregarMovimiento() {
            if (!this.nuevoMovimiento.monto || !this.nuevoMovimiento.cajaId || !this.nuevoMovimiento.tipo) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const movimientoData = {
                    monto: parseInt(this.nuevoMovimiento.monto),
                    caja: { id: this.nuevoMovimiento.cajaId },
                    idAsociado: this.nuevoMovimiento.idAsociado || 0,
                    tipo: this.nuevoMovimiento.tipo
                };
                const response = await fetch(`${config.apiBaseUrl}/movimientos/agregar_movimiento`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(movimientoData)
                });
                if (response.ok) {
                    const movimiento = await response.json();
                    this.movimientos.push(movimiento);
                    this.filtrarMovimientos();
                    this.toggleFormulario();
                    NotificationSystem.success('Movimiento agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar movimiento:', error);
                NotificationSystem.error(`Error al agregar movimiento: ${error.message}`);
            }
        },
        async modificarMovimiento() {
            if (!this.nuevoMovimiento.monto || !this.nuevoMovimiento.cajaId || !this.nuevoMovimiento.tipo) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const movimientoData = {
                    monto: parseInt(this.nuevoMovimiento.monto),
                    caja: { id: this.nuevoMovimiento.cajaId },
                    idAsociado: this.nuevoMovimiento.idAsociado || 0,
                    tipo: this.nuevoMovimiento.tipo
                };
                const response = await fetch(`${config.apiBaseUrl}/movimientos/actualizar_movimiento/${this.nuevoMovimiento.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(movimientoData)
                });
                if (response.ok) {
                    const movimiento = await response.json();
                    const index = this.movimientos.findIndex(m => m.id === movimiento.id);
                    if (index !== -1) this.movimientos[index] = movimiento;
                    this.filtrarMovimientos();
                    this.toggleFormulario();
                    NotificationSystem.success('Movimiento actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar movimiento:', error);
                NotificationSystem.error(`Error al modificar movimiento: ${error.message}`);
            }
        },
        async eliminarMovimiento(movimiento) {
            NotificationSystem.confirm(`¿Eliminar movimiento ID ${movimiento.id}?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/movimientos/eliminar_movimiento/${movimiento.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        this.movimientos = this.movimientos.filter(m => m.id !== movimiento.id);
                        this.filtrarMovimientos();
                        NotificationSystem.success('Movimiento eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar movimiento:', error);
                    NotificationSystem.error(`Error al eliminar movimiento: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoMovimiento = { 
                id: null, 
                monto: null,
                cajaId: null,
                idAsociado: null,
                tipo: ''
            };
        },
        cargarMovimiento(movimiento) {
            this.nuevoMovimiento = {
                id: movimiento.id,
                monto: movimiento.monto,
                cajaId: movimiento.caja ? movimiento.caja.id : null,
                idAsociado: movimiento.idAsociado,
                tipo: movimiento.tipo
            };
            this.formularioVisible = true;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchMovimientos();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirMovimientos() {
            window.location.href = '/web/movimientos';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Movimientos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Movimiento:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarMovimientos" placeholder="Buscar por tipo o ID asociado..." class="search-bar"/>
                    <label>Filtrar por Tipo:</label>
                    <select v-model="filtroTipo" @change="filtrarMovimientos" class="search-bar">
                        <option value="">Todos los tipos</option>
                        <option value="INGRESO">Ingreso</option>
                        <option value="EGRESO">Egreso</option>
                        <option value="VENTA">Venta</option>
                        <option value="COMPRA">Compra</option>
                    </select>
                    <br>
                    <label>Desde:</label>
                    <input type="date" v-model="fechaDesde" @change="filtrarMovimientos" class="search-bar"/>
                    <label>Hasta:</label>
                    <input type="date" v-model="fechaHasta" @change="filtrarMovimientos" class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn">Nuevo Movimiento</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoMovimiento.id ? 'Modificar Movimiento - ' + (cajas.find(c => c.id == nuevoMovimiento.cajaId)?.nombre || 'Caja') : 'Agregar Movimiento' }}</h3>
                        <label>Monto:</label>
                        <input type="number" v-model="nuevoMovimiento.monto" placeholder="Monto" required/>
                        <label>Caja:</label>
                        <select v-model="nuevoMovimiento.cajaId" required>
                            <option value="" disabled>Seleccionar Caja</option>
                            <option v-for="caja in cajas" :key="caja.id" :value="caja.id">
                                Caja {{ caja.id }} - {{ caja.nombre }} 
                            </option>
                        </select>
                        <br>
                        <label>ID Asociado:</label>
                        <input type="number" v-model="nuevoMovimiento.idAsociado" placeholder="ID Asociado (opcional)"/>
                        <label>Tipo:</label>
                        <select v-model="nuevoMovimiento.tipo" required>
                            <option value="" disabled>Seleccionar Tipo</option>
                            <option value="INGRESO">Ingreso</option>
                            <option value="EGRESO">Egreso</option>
                            <option value="VENTA">Venta</option>
                            <option value="COMPRA">Compra</option>
                        </select>
                        <div class="form-buttons">
                            <button @click="nuevoMovimiento.id ? modificarMovimiento() : agregarMovimiento()" class="btn">
                                {{ nuevoMovimiento.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Monto</th>
                                <th>Caja</th>
                                <th>ID Asociado</th>
                                <th>Tipo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="movimiento in movimientosPaginados" :key="movimiento.id">
                                <td>{{ movimiento.id }}</td>
                                <td>{{ formatearNumero(movimiento.monto) }}</td>
                                <td>{{ movimiento.caja ? movimiento.caja.nombre || 'Caja ' + movimiento.caja.id : '-' }}</td>
                                <td>{{ movimiento.idAsociado || '-' }}</td>
                                <td>{{ movimiento.tipo }}</td>
                                <td>
                                    <button @click="cargarMovimiento(movimiento)" class="btn-small">Editar</button>
                                    <button @click="eliminarMovimiento(movimiento)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Ingresos: {{ formatearNumero(totalIngresos) }} | Egresos: {{ formatearNumero(totalEgresos) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});
