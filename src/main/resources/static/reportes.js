import config from './config.js';
import NotificationSystem from './notification-system.js';

new Vue({
    vuetify: new Vuetify({
        locale: { current: 'es' }
    }),
    el: '#app',
    data() {
        return {
            reporteActivo: 'servicios',
            serviciosMasSolicitados: [],
            clientesMasFrecuentes: [],
            productosBajoStock: [],
            sueldosComisiones: [],
            historialDescuentos: [],
            filtros: {
                nombre: '',
                fecha: '',
                monto: ''
            },
            loading: false
        };
    },
    mounted() {
        this.cargarReportes();
    },
    computed: {
        datosReporteFiltrados() {
            let datos = [];
            switch(this.reporteActivo) {
                case 'servicios': datos = this.serviciosMasSolicitados; break;
                case 'clientes': datos = this.clientesMasFrecuentes; break;
                case 'productos': datos = this.productosBajoStock; break;
                case 'empleados': datos = this.sueldosComisiones; break;
                case 'descuentos': datos = this.historialDescuentos; break;
            }
            
            return datos.filter(item => {
                const nombre = (item.nombre || item.nombreCompleto || '').toLowerCase();
                const fecha = item.fecha || '';
                const monto = item.monto || item.total || item.sueldo || 0;
                
                return (!this.filtros.nombre || nombre.includes(this.filtros.nombre.toLowerCase())) &&
                       (!this.filtros.fecha || fecha.includes(this.filtros.fecha)) &&
                       (!this.filtros.monto || monto.toString().includes(this.filtros.monto));
            });
        }
    },
    methods: {
        async cargarReportes() {
            this.loading = true;
            try {
                await Promise.all([
                    this.cargarServiciosMasSolicitados(),
                    this.cargarClientesMasFrecuentes(),
                    this.cargarProductosBajoStock(),
                    this.cargarSueldosComisiones(),
                    this.cargarHistorialDescuentos()
                ]);
            } catch (error) {
                NotificationSystem.error('Error al cargar reportes');
            } finally {
                this.loading = false;
            }
        },

        async cargarServiciosMasSolicitados() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/servicios-mas-solicitados`);
            this.serviciosMasSolicitados = await response.json();
        },

        async cargarClientesMasFrecuentes() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/clientes-mas-frecuentes`);
            this.clientesMasFrecuentes = await response.json();
        },

        async cargarProductosBajoStock() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/productos-bajo-stock`);
            this.productosBajoStock = await response.json();
        },

        async cargarSueldosComisiones() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/sueldos-comisiones`);
            this.sueldosComisiones = await response.json();
        },

        async cargarHistorialDescuentos() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/historial-descuentos`);
            this.historialDescuentos = await response.json();
        },

        exportarPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            
            // Título principal "Peluquería Luna" en dorado
            doc.setTextColor(218, 165, 32); // Dorado
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('Peluqueria Luna', 20, 25);
            
            // Fecha en la esquina superior derecha
            doc.setTextColor(139, 69, 19); // Marrón
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date().toLocaleDateString('es-ES'), pageWidth - 40, 15);
            
            // Subtítulo del reporte en dorado
            doc.setTextColor(184, 134, 11); // Dorado oscuro
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(this.getTituloReporte(), 20, 45);
            
            // Línea decorativa dorada simple
            doc.setDrawColor(218, 165, 32);
            doc.setLineWidth(1);
            doc.line(20, 50, pageWidth - 20, 50);
            
            let y = 65;
            let itemCount = 0;
            
            this.datosReporteFiltrados.forEach((item, index) => {
                if (y > pageHeight - 30) {
                    doc.addPage();
                    y = 20;
                }
                
                // Número de item en dorado (solo texto, sin círculo)
                doc.setTextColor(218, 165, 32); // Dorado
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}.`, 20, y);
                
                // Contenido del item en negro
                doc.setTextColor(0, 0, 0); // Negro
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const texto = this.formatearItemParaPDF(item);
                doc.text(texto, 30, y);
                
                y += 15;
                itemCount++;
            });
            
            // Footer simple con línea dorada
            doc.setDrawColor(218, 165, 32);
            doc.setLineWidth(1);
            doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
            
            doc.setTextColor(139, 69, 19); // Marrón
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total de registros: ${itemCount}`, 20, pageHeight - 15);
            doc.text('Peluquería Luna - Sistema de Gestión', pageWidth - 80, pageHeight - 15);
            
            doc.save(`reporte-${this.reporteActivo}-${new Date().toISOString().split('T')[0]}.pdf`);
        },

        getTituloReporte() {
            const titulos = {
                servicios: 'Servicios Más Solicitados',
                clientes: 'Clientes Más Frecuentes',
                productos: 'Productos con Bajo Stock',
                empleados: 'Sueldos y Comisiones',
                descuentos: 'Historial de Descuentos'
            };
            return titulos[this.reporteActivo];
        },

        formatearItemParaPDF(item) {
            switch(this.reporteActivo) {
                case 'servicios':
                    return `${item.nombre} - Precio: $${this.formatearNumero(item.precio || 0)}`;
                case 'clientes':
                    return `${item.nombreCompleto} - Visitas: ${item.visitas || 0} - Total: $${this.formatearNumero(item.totalGastado || 0)} - Tel: ${item.telefono || 'N/A'}`;
                case 'productos':
                    return `${item.nombre} - Stock: ${item.stock} - Min: ${item.stockMinimo} - Precio: $${this.formatearNumero(item.precio || 0)}`;
                case 'empleados':
                    return `${item.nombreCompleto} - Sueldo Base: $${this.formatearNumero(item.sueldoBase || 0)} - Comision: ${item.comisionPorcentaje || 0}% - Total: $${this.formatearNumero(item.sueldoTotal || 0)}`;
                case 'descuentos':
                    return `Venta ${item.ventaId} - Cliente: ${item.cliente} - Descuento: $${this.formatearNumero(item.descuento || 0)}`;
                default:
                    return JSON.stringify(item);
            }
        },

        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },

        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        }
    },
    template: `
        <div class="glass-container">
            <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037;">
                Reportes y Estadísticas
            </h1>
            
            <div class="reportes-nav">
                <button @click="reporteActivo = 'servicios'" :class="{'active': reporteActivo === 'servicios'}" class="btn">
                    Servicios Más Solicitados
                </button>
                <button @click="reporteActivo = 'clientes'" :class="{'active': reporteActivo === 'clientes'}" class="btn">
                    Clientes Más Frecuentes
                </button>
                <button @click="reporteActivo = 'productos'" :class="{'active': reporteActivo === 'productos'}" class="btn">
                    Productos Bajo Stock
                </button>
                <button @click="reporteActivo = 'empleados'" :class="{'active': reporteActivo === 'empleados'}" class="btn">
                    Sueldos y Comisiones
                </button>
                <button @click="reporteActivo = 'descuentos'" :class="{'active': reporteActivo === 'descuentos'}" class="btn">
                    Historial Descuentos
                </button>
            </div>

            <div class="filtros-container">
                <input v-model="filtros.nombre" placeholder="Filtrar por nombre" class="search-bar">
                <input v-model="filtros.fecha" type="date" class="search-bar">
                <input v-model="filtros.monto" placeholder="Filtrar por monto" class="search-bar">
                <button @click="exportarPDF()" class="btn btn-export">
                    <i class="fas fa-file-pdf"></i> Exportar PDF
                </button>
            </div>

            <div v-if="loading" class="loading">Cargando reportes...</div>

            <div v-else class="reporte-content">
                <!-- Servicios Más Solicitados -->
                <div v-if="reporteActivo === 'servicios'">
                    <h3>Servicios Más Solicitados</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Cantidad Solicitada</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="servicio in datosReporteFiltrados" :key="servicio.id">
                                <td>{{ servicio.nombre }}</td>
                                <td>{{ servicio.cantidad || 0 }}</td>
                                <td>{{ formatearNumero(servicio.precio || 0) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Clientes Más Frecuentes -->
                <div v-if="reporteActivo === 'clientes'">
                    <h3>Clientes Más Frecuentes</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Visitas</th>
                                <th>Total Gastado</th>
                                <th>Fecha Nacimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="cliente in datosReporteFiltrados" :key="cliente.id">
                                <td>{{ cliente.nombreCompleto }}</td>
                                <td>{{ cliente.telefono || 'N/A' }}</td>
                                <td>{{ cliente.correo || 'N/A' }}</td>
                                <td><strong>{{ cliente.visitas || 0 }}</strong></td>
                                <td><strong>{{ formatearNumero(cliente.totalGastado || 0) }}</strong></td>
                                <td>{{ formatearFecha(cliente.fechaNacimiento) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Productos Bajo Stock -->
                <div v-if="reporteActivo === 'productos'">
                    <h3>Productos con Bajo Stock</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Stock Mínimo</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="producto in datosReporteFiltrados" :key="producto.id">
                                <td>{{ producto.nombre }}</td>
                                <td>{{ producto.stock || 0 }}</td>
                                <td>{{ producto.stockMinimo || 0 }}</td>
                                <td>{{ formatearNumero(producto.precio || 0) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Sueldos y Comisiones -->
                <div v-if="reporteActivo === 'empleados'">
                    <h3>Sueldos y Comisiones de Empleados</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Sueldo Base</th>
                                <th>% Comisión</th>
                                <th>Comisiones</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="empleado in datosReporteFiltrados" :key="empleado.id">
                                <td>{{ empleado.nombreCompleto }}</td>
                                <td>{{ formatearNumero(empleado.sueldoBase || 0) }}</td>
                                <td>{{ empleado.comisionPorcentaje || 0 }}%</td>
                                <td>{{ formatearNumero(empleado.comisiones || 0) }}</td>
                                <td>{{ formatearNumero(empleado.sueldoTotal || 0) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Historial de Descuentos -->
                <div v-if="reporteActivo === 'descuentos'">
                    <h3>Historial de Descuentos Realizados</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Venta ID</th>
                                <th>Cliente</th>
                                <th>Descuento</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="descuento in datosReporteFiltrados" :key="descuento.id">
                                <td>{{ descuento.ventaId }}</td>
                                <td>{{ descuento.cliente }}</td>
                                <td>{{ formatearNumero(descuento.descuento || 0) }}</td>
                                <td>{{ formatearFecha(descuento.fecha) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
});