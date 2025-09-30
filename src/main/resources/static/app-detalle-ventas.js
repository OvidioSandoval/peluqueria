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
            detalles: [],
            detallesFiltrados: [],
            filtroBusqueda: '',
            filtroVenta: '',
            filtroProducto: '',
            filtroServicio: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchDetalles();

        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.detallesFiltrados.length / this.itemsPorPagina);
        },
        detallesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.detallesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/detalle-ventas';
            }
        },
        async fetchDetalles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.detalles = await response.json();
                this.filtrarDetalles();
            } catch (error) {
                console.error('Error al cargar detalles:', error);
                NotificationSystem.error(`Error al cargar detalles de ventas: ${error.message}`);
            }
        },

        filtrarDetalles() {
            let filtrados = this.detalles;
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    (detalle.venta && detalle.venta.id.toString().includes(busqueda)) ||
                    (detalle.servicio && detalle.servicio.nombre.toLowerCase().includes(busqueda)) ||
                    (detalle.producto && detalle.producto.nombre.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroVenta.trim() !== '') {
                filtrados = filtrados.filter(detalle =>
                    detalle.venta && detalle.venta.id.toString().includes(this.filtroVenta)
                );
            }
            
            if (this.filtroProducto.trim() !== '') {
                const producto = this.filtroProducto.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    detalle.producto && detalle.producto.nombre.toLowerCase().includes(producto)
                );
            }
            
            if (this.filtroServicio.trim() !== '') {
                const servicio = this.filtroServicio.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    detalle.servicio && detalle.servicio.nombre.toLowerCase().includes(servicio)
                );
            }
            
            if (this.filtroFecha) {
                filtrados = filtrados.filter(detalle => {
                    if (!detalle.venta || !detalle.venta.fechaVenta) return false;
                    const fechaVenta = this.formatearFechaParaFiltro(detalle.venta.fechaVenta);
                    return fechaVenta === this.filtroFecha;
                });
            }
            
            this.detallesFiltrados = filtrados;
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
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            }
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        },
        formatearFechaParaFiltro(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarDetalles();
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchDetalles();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirDetalleVentas() {
            window.location.href = '/web/detalle-ventas';
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
                doc.text('Detalle de Ventas', 20, 35);
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total registros: ${this.detallesFiltrados.length}`, 150, 25);
                
                const headers = [['Venta', 'Fecha', 'Servicio/Producto', 'Cantidad', 'Precio', 'Desc.%', 'Total']];
                const data = this.detallesFiltrados.map(detalle => [
                    detalle.venta ? 'Venta #' + detalle.venta.id : 'N/A',
                    detalle.venta ? this.formatearFecha(detalle.venta.fechaVenta) : 'N/A',
                    detalle.servicio ? detalle.servicio.nombre : (detalle.producto ? detalle.producto.nombre : 'N/A'),
                    this.formatearNumero(detalle.cantidad),
                    '$' + this.formatearNumero(detalle.precioUnitarioBruto),
                    detalle.descuento + '%',
                    '$' + this.formatearNumero(detalle.precioTotal)
                ]);
                
                const totalGeneral = this.detallesFiltrados.reduce((sum, detalle) => sum + (detalle.precioTotal || 0), 0);
                
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
                    foot: [['', '', '', '', '', 'TOTAL:', '$' + this.formatearNumero(totalGeneral)]],
                    footStyles: { 
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    }
                });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`detalle-ventas-${fecha}.pdf`);
                NotificationSystem.success('Detalle de ventas exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Detalle de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 25px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="min-width: 340px;">
                            <label>Buscar Detalle:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarDetalles" placeholder="Buscar por venta, producto o servicio..." class="search-bar" style="width: 340px;"/>
                        </div>
                        <div class="filter-group" style="min-width: 220px;">
                            <label>Filtrar por Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarDetalles" class="search-bar" style="width: 220px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>

                    
                    <table>
                        <thead>
                            <tr>
                                <th>Venta</th>
                                <th>Fecha Venta</th>
                                <th>Servicio</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio sin Desc.</th>
                                <th>Descuento (%)</th>
                                <th>Precio Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detalle in detallesPaginados" :key="detalle.id">
                                <td>{{ detalle.venta ? 'Venta #' + detalle.venta.id : 'N/A' }}</td>
                                <td>{{ detalle.venta ? formatearFecha(detalle.venta.fechaVenta) : 'N/A' }}</td>
                                <td>{{ detalle.servicio ? detalle.servicio.nombre : 'N/A' }}</td>
                                <td>{{ detalle.producto ? detalle.producto.nombre : 'N/A' }}</td>
                                <td>{{ formatearNumero(detalle.cantidad) }}</td>
                                <td>{{ formatearNumero(detalle.precioUnitarioBruto) }}</td>
                                <td>{{ detalle.descuento }}%</td>
                                <td>{{ formatearNumero(detalle.precioTotal) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
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
document.head.appendChild(style);




