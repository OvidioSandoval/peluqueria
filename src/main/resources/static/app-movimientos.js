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
        },
        totalVentas() {
            return this.movimientosFiltrados
                .filter(m => m.tipo && m.tipo.toLowerCase().includes('venta'))
                .reduce((sum, m) => sum + (m.monto || 0), 0);
        },
        totalCompras() {
            return this.movimientosFiltrados
                .filter(m => m.tipo && m.tipo.toLowerCase().includes('compra'))
                .reduce((sum, m) => sum + (m.monto || 0), 0);
        },
        cajasAbiertas() {
            return this.cajas.filter(caja => caja.estado && caja.estado.toLowerCase() === 'abierto');
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
            if (this.filtroBusqueda.trim() === '') {
                this.movimientosFiltrados = [...this.movimientos];
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.movimientosFiltrados = this.movimientos.filter(movimiento =>
                    (movimiento.monto && movimiento.monto.toString().includes(busqueda)) ||
                    (movimiento.caja && movimiento.caja.nombre && movimiento.caja.nombre.toLowerCase().includes(busqueda)) ||
                    (movimiento.idAsociado && movimiento.idAsociado.toString().includes(busqueda)) ||
                    (movimiento.tipo && movimiento.tipo.toLowerCase().includes(busqueda))
                );
            }
        },
        
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtrarMovimientos();
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
        
        exportarPDF() {
            try {
                const doc = new window.jspdf.jsPDF();
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text('Reporte de Movimientos', 20, 35);
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total movimientos: ${this.movimientosFiltrados.length}`, 150, 25);
                
                const headers = [['Monto', 'Caja', 'ID Asociado', 'Tipo']];
                const data = this.movimientosFiltrados.map(movimiento => [
                    '$' + this.formatearNumero(movimiento.monto),
                    movimiento.caja ? movimiento.caja.nombre || 'Caja ' + movimiento.caja.id : '-',
                    movimiento.idAsociado || '-',
                    movimiento.tipo
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 45,
                    styles: { 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255]
                    },
                    headStyles: { 
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 255, 255]
                    },
                    foot: [
                        ['Ingresos: $' + this.formatearNumero(this.totalIngresos), 'Egresos: $' + this.formatearNumero(this.totalEgresos), '', ''],
                        ['Ventas: $' + this.formatearNumero(this.totalVentas), 'Compras: $' + this.formatearNumero(this.totalCompras), '', '']
                    ],
                    footStyles: { 
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    }
                });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`movimientos-${fecha}.pdf`);
                NotificationSystem.success('Reporte de movimientos exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Movimientos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 20px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group">
                            <label>Buscar Movimiento:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarMovimientos" placeholder="Buscar por monto, caja, ID asociado o tipo..." class="search-bar" style="width: 350px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small">Nuevo Movimiento</button>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container" style="width: fit-content; max-width: 800px;">
                        <h3>{{ nuevoMovimiento.id ? 'Modificar Movimiento - ' + (cajas.find(c => c.id == nuevoMovimiento.cajaId)?.nombre || 'Caja') : 'Nuevo Movimiento' }}</h3>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Monto: *</label>
                                <input type="number" v-model="nuevoMovimiento.monto" placeholder="Ingrese el monto" required/>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label>Caja: *</label>
                                <select v-model="nuevoMovimiento.cajaId" required>
                                    <option value="" disabled>Seleccionar Caja</option>
                                    <option v-for="caja in cajasAbiertas" :key="caja.id" :value="caja.id">
                                        Caja {{ caja.id }} - {{ caja.nombre }} 
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>ID Asociado:</label>
                                <input type="number" v-model="nuevoMovimiento.idAsociado" placeholder="ID Asociado (opcional)"/>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label>Tipo: *</label>
                                <select v-model="nuevoMovimiento.tipo" required>
                                    <option value="" disabled>Seleccionar Tipo</option>
                                    <option value="INGRESO">Ingreso</option>
                                    <option value="EGRESO">Egreso</option>
                                    <option value="VENTA">Venta</option>
                                    <option value="COMPRA">Compra</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="nuevoMovimiento.id ? modificarMovimiento() : agregarMovimiento()" class="btn">
                                {{ nuevoMovimiento.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Monto</th>
                                <th>Caja</th>
                                <th>ID Asociado</th>
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="movimiento in movimientosPaginados" :key="movimiento.id">
                                <td>{{ formatearNumero(movimiento.monto) }}</td>
                                <td>{{ movimiento.caja ? movimiento.caja.nombre || 'Caja ' + movimiento.caja.id : '-' }}</td>
                                <td>{{ movimiento.idAsociado || '-' }}</td>
                                <td>{{ movimiento.tipo }}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total" style="margin-top: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); border-radius: 10px; text-align: center;">
                        <strong>Ingresos: {{ formatearNumero(totalIngresos) }} | Egresos: {{ formatearNumero(totalEgresos) }} | Ventas: {{ formatearNumero(totalVentas) }} | Compras: {{ formatearNumero(totalCompras) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});





