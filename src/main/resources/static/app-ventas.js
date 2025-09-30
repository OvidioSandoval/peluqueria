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
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text('Reporte de Ventas', 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total de ventas: ${this.ventasFiltradas.length}`, 150, 25);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                this.ventasFiltradas.forEach((venta, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text(`${index + 1}. Venta ID: ${venta.id}`, 20, y);
                    y += 8;
                    
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    
                    doc.text(`   Cliente: ${this.getClienteName(venta)}`, 25, y);
                    y += 6;
                    doc.text(`   Empleado: ${this.getEmpleadoName(venta)}`, 25, y);
                    y += 6;
                    doc.text(`   Fecha: ${this.formatearFecha(venta.fechaVenta)}`, 25, y);
                    y += 6;
                    doc.text(`   Monto: ${this.formatearNumero(venta.montoTotal)}`, 25, y);
                    y += 6;
                    doc.text(`   Método de Pago: ${venta.metodoPago || 'N/A'}`, 25, y);
                    y += 10;
                });
                
                y += 10;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`TOTAL: ${this.formatearNumero(this.totalVentas)}`, 20, y);
                
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(20, 280, 190, 280);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(8);
                    doc.text('Peluquería LUNA - Sistema de Gestión', 20, 290);
                    doc.text(`Página ${i} de ${pageCount}`, 170, 290);
                }
                
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
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Empleado</th>
                                <th>Fecha</th>
                                <th>Monto Total</th>
                                <th>Método Pago</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="venta in ventasPaginadas" :key="venta.id">
                                <td>{{ venta.id }}</td>
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




