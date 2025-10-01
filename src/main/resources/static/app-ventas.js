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
            ventas: [],
            ventasFiltradas: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchVentas();

        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.ventasFiltradas.length / this.itemsPorPagina);
        },
        ventasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.ventasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalVentas() {
            return this.ventasFiltradas.reduce((sum, venta) => sum + (venta.montoTotal || 0), 0);
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
                window.location.href = '/web/ventas';
            }
        },
        async fetchVentas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.ventas = await response.json();
                this.filtrarVentas();
            } catch (error) {
                console.error('Error al cargar ventas:', error);
                NotificationSystem.error(`Error al cargar las ventas: ${error.message}`);
            }
        },


        filtrarVentas() {
            let filtradas = [...this.ventas];
            
            if (this.filtroBusqueda) {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtradas = filtradas.filter(venta =>
                    venta.id.toString().includes(busqueda) ||
                    venta.montoTotal.toString().includes(busqueda) ||
                    this.getClienteName(venta).toLowerCase().includes(busqueda) ||
                    this.getEmpleadoName(venta).toLowerCase().includes(busqueda) ||
                    (venta.metodoPago && venta.metodoPago.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroFecha) {
                filtradas = filtradas.filter(venta => {
                    if (!venta.fechaVenta) return false;
                    const fechaVenta = this.formatearFechaParaFiltro(venta.fechaVenta);
                    return fechaVenta === this.filtroFecha;
                });
            }
            
            this.ventasFiltradas = filtradas;
        },

        getClienteName(venta) {
            return venta.cliente ? venta.cliente.nombreCompleto || venta.cliente.nombre : '-';
        },
        getEmpleadoName(venta) {
            return venta.empleado ? venta.empleado.nombreCompleto || venta.empleado.nombre : '-';
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
            try {
                const date = new Date(fecha);
                if (isNaN(date.getTime())) return fecha;
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            } catch (error) {
                return fecha;
            }
        },
        formatearFechaParaFiltro(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchVentas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirVentas() {
            window.location.href = '/web/ventas';
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
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarVentas();
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
                doc.text('REPORTE DE VENTAS', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de ventas: ${this.ventasFiltradas.length}`, 20, 62);
                
                // Tabla de ventas
                if (this.ventasFiltradas.length > 0) {
                    const headers = [['CLIENTE', 'EMPLEADO', 'FECHA', 'MONTO', 'MÉTODO PAGO']];
                    const data = this.ventasFiltradas.map((venta) => [
                        this.getClienteName(venta),
                        this.getEmpleadoName(venta),
                        this.formatearFecha(venta.fechaVenta),
                        this.formatearNumero(venta.montoTotal),
                        venta.metodoPago || 'N/A'
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 75,
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
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 'auto', halign: 'center' },
                            3: { cellWidth: 'auto', halign: 'right' },
                            4: { cellWidth: 'auto', halign: 'center' }
                        },
                        margin: { bottom: 40 },
                        foot: [['', '', '', 'TOTAL FINAL:', this.formatearNumero(this.totalVentas)]],
                        footStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        }
                    };
                    
                    doc.autoTable(tableConfig);
                }
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`reporte-ventas-${fecha}.pdf`);
                NotificationSystem.success('Reporte de ventas exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 25px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="min-width: 400px;">
                            <label>Buscar Venta:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarVentas" placeholder="Buscar por ID, monto, cliente, empleado o método de pago..." class="search-bar" style="width: 400px;"/>
                        </div>
                        <div class="filter-group" style="min-width: 150px;">
                            <label>Filtrar por Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarVentas" class="search-bar" style="width: 150px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>

                    
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Empleado</th>
                                <th>Fecha</th>
                                <th>Monto Total</th>
                                <th>Método Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="venta in ventasPaginadas" :key="venta.id">
                                <td>{{ getClienteName(venta) }}</td>
                                <td>{{ getEmpleadoName(venta) }}</td>
                                <td>{{ formatearFecha(venta.fechaVenta) }}</td>
                                <td>{{ formatearNumero(venta.montoTotal) }}</td>
                                <td>{{ venta.metodoPago }}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total: {{ formatearNumero(totalVentas) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});
// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);




