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
            gastos: [],
            gastosFiltrados: [],
            empleados: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoGasto: { 
                id: null, 
                descripcion: '', 
                monto: 0,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            },
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchGastos();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.gastosFiltrados.length / this.itemsPorPagina);
        },
        gastosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.gastosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalGastos() {
            return this.gastosFiltrados.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/panel-control';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/gastos';
            }
        },
        async fetchGastos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/gastos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.gastos = await response.json();
                this.filtrarGastos();
            } catch (error) {
                console.error('Error al cargar gastos:', error);
                NotificationSystem.error(`Error al cargar los gastos: ${error.message}`);
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error(`Error al cargar empleados: ${error.message}`);
            }
        },
        filtrarGastos() {
            let filtrados = [...this.gastos];
            if (this.filtroBusqueda) {
                filtrados = filtrados.filter(gasto =>
                    gasto.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
                    gasto.categoriaGasto.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            }
            if (this.filtroFecha) {
                filtrados = filtrados.filter(gasto => {
                    if (!gasto.fechaGasto) return false;
                    const fechaGasto = typeof gasto.fechaGasto === 'string' ? gasto.fechaGasto : new Date(gasto.fechaGasto).toISOString().split('T')[0];
                    return fechaGasto.startsWith(this.filtroFecha);
                });
            }
            this.gastosFiltrados = filtrados;
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarGastos();
        },
        async agregarGasto() {
            try {
                const gastoData = {
                    ...this.nuevoGasto,
                    descripcion: this.capitalizarTexto(this.nuevoGasto.descripcion),
                    categoriaGasto: this.capitalizarTexto(this.nuevoGasto.categoriaGasto)
                };
                const response = await fetch(`${config.apiBaseUrl}/gastos/agregar_gasto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gastoData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchGastos();
                    NotificationSystem.success('Gasto agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar gasto:', error);
                NotificationSystem.error(`Error al agregar gasto: ${error.message}`);
            }
        },

        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoGasto = { 
                id: null, 
                descripcion: '', 
                monto: 0,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            };
            if (!this.formularioVisible) {
                await this.fetchGastos();
            }
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
                this.fetchGastos();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirGastos() {
            window.location.href = '/web/gastos';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 120px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Gastos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-field">
                            <label>Buscar:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarGastos" placeholder="Buscar gasto..." class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <label>Filtrar por fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarGastos" class="search-bar"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
                    </div>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Gasto</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoGasto.id ? 'Modificar Gasto: ' + nuevoGasto.descripcion : 'Agregar Gasto' }}</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Descripción *</label>
                                <input type="text" v-model="nuevoGasto.descripcion" :readonly="nuevoGasto.id" required/>
                            </div>
                            <div class="form-field">
                                <label>Monto *</label>
                                <input type="number" v-model="nuevoGasto.monto" :readonly="nuevoGasto.id" min="0" required/>
                            </div>
                            <div class="form-field">
                                <label>Fecha del Gasto *</label>
                                <input type="date" v-model="nuevoGasto.fechaGasto" :readonly="nuevoGasto.id" required/>
                            </div>
                            <div class="form-field">
                                <label>Categoría</label>
                                <input type="text" v-model="nuevoGasto.categoriaGasto" :readonly="nuevoGasto.id"/>
                            </div>
                            <div class="form-field">
                                <label>Empleado</label>
                                <select v-model="nuevoGasto.empleado" :disabled="nuevoGasto.id">
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado">{{ empleado.nombreCompleto }}</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="agregarGasto()" class="btn" v-if="!nuevoGasto.id">
                                Agregar
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Empleado</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="gasto in gastosPaginados" :key="gasto.id">
                                <td>{{ gasto.id }}</td>
                                <td>{{ gasto.descripcion }}</td>
                                <td>{{ formatearNumero(gasto.monto) }}</td>
                                <td>{{ formatearFecha(gasto.fechaGasto) }}</td>
                                <td>{{ gasto.categoriaGasto }}</td>
                                <td>{{ gasto.empleado ? gasto.empleado.nombreCompleto : 'N/A' }}</td>

                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total: {{ formatearNumero(totalGastos) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});

// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
    }
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .form-field label {
        font-weight: bold;
        color: #333;
        font-size: 14px;
    }
    .form-field input, .form-field select {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Estilos para filtros
const filterStyle = document.createElement('style');
filterStyle.textContent = `
    .filters-container {
        display: flex !important;
        gap: 20px;
        margin-bottom: 15px;
        align-items: end;
    }
    .filter-field {
        display: flex !important;
        flex-direction: column !important;
        gap: 5px;
    }
    .filter-field label {
        font-weight: bold !important;
        color: #333 !important;
        font-size: 14px !important;
        margin-bottom: 5px !important;
    }
`;
document.head.appendChild(filterStyle);
// Estilos para info section
const infoStyle = document.createElement('style');
infoStyle.textContent = `
    .info-section {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        border-left: 4px solid #007bff;
    }
    .info-section p {
        margin: 5px 0;
        color: #333;
    }
`;
document.head.appendChild(infoStyle);

