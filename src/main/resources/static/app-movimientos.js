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
            this.paginaActual = 1;
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
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Header profesional
                doc.setLineWidth(2);
                doc.line(20, 25, 190, 25);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('PELUQUERÍA LUNA', 105, 20, { align: 'center' });
                
                doc.setLineWidth(0.5);
                doc.line(20, 28, 190, 28);
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'normal');
                doc.text('REPORTE DE MOVIMIENTOS', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de movimientos: ${this.movimientosFiltrados.length}`, 20, 62);
                
                const headers = [['MONTO', 'CAJA', 'ID ASOCIADO', 'TIPO']];
                const data = this.movimientosFiltrados.map(movimiento => [
                    this.formatearNumero(movimiento.monto),
                    movimiento.caja ? movimiento.caja.nombre || 'Caja ' + movimiento.caja.id : '-',
                    movimiento.idAsociado || '-',
                    movimiento.tipo
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 68,
                    styles: { 
                        fontSize: 9,
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255],
                        font: 'helvetica',
                        cellPadding: 4,
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1
                    },
                    headStyles: { 
                        fontSize: 10,
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold',
                        font: 'helvetica',
                        halign: 'center',
                        cellPadding: 5
                    },
                    bodyStyles: {
                        fontSize: 9,
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255],
                        font: 'helvetica'
                    },
                    alternateRowStyles: {
                        fillColor: [255, 255, 255]
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto', halign: 'right' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 'auto', halign: 'center' },
                        3: { cellWidth: 'auto', halign: 'center' }
                    },
                    foot: [
                        ['Ingresos: ' + this.formatearNumero(this.totalIngresos), 'Egresos: ' + this.formatearNumero(this.totalEgresos), '', ''],
                        ['Ventas: ' + this.formatearNumero(this.totalVentas), 'Compras: ' + this.formatearNumero(this.totalCompras), '', '']
                    ],
                    footStyles: { 
                        fontSize: 10,
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold',
                        font: 'helvetica',
                        halign: 'left'
                    },
                    margin: { bottom: 40 }
                });
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
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
                <h1 class="page-title">Lista de Movimientos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 20px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group">
                            <label>Buscar Movimiento:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarMovimientos" placeholder="Buscar por monto, caja, ID asociado o tipo..." class="search-bar" style="width: 350px;"/>
                        </div>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
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





