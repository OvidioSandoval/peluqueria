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

            historialDescuentos: [],
            ventasCliente: [],
            clientes: [],
            clienteSeleccionado: null,
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

                case 'descuentos': datos = this.historialDescuentos; break;
                case 'ventas-cliente': datos = this.ventasCliente; break;
            }
            
            if (!this.filtros.busqueda && !this.filtros.fecha) {
                return datos;
            }
            
            return datos.filter(item => {
                let cumpleBusqueda = true;
                let cumpleFecha = true;
                
                if (this.filtros.busqueda) {
                    const busqueda = this.filtros.busqueda.toLowerCase();
                    switch(this.reporteActivo) {
                        case 'servicios':
                            cumpleBusqueda = (item.nombre || '').toLowerCase().includes(busqueda) || 
                                           (item.precio || 0).toString().includes(busqueda) ||
                                           (item.cantidad || 0).toString().includes(busqueda);
                            break;
                        case 'clientes':
                            cumpleBusqueda = (item.nombreCompleto || '').toLowerCase().includes(busqueda) ||
                                           (item.telefono || '').includes(busqueda) ||
                                           (item.correo || '').toLowerCase().includes(busqueda) ||
                                           (item.visitas || 0).toString().includes(busqueda) ||
                                           (item.totalGastado || 0).toString().includes(busqueda);
                            break;
                        case 'productos':
                            cumpleBusqueda = (item.nombre || '').toLowerCase().includes(busqueda) ||
                                           (item.stock || 0).toString().includes(busqueda) ||
                                           (item.stockMinimo || 0).toString().includes(busqueda) ||
                                           (item.precio || 0).toString().includes(busqueda);
                            break;
                        case 'descuentos':
                            cumpleBusqueda = (item.cliente || '').toLowerCase().includes(busqueda) ||
                                           (item.ventaId || '').toString().includes(busqueda) ||
                                           (item.descuento || 0).toString().includes(busqueda);
                            break;
                        case 'ventas-cliente':
                            cumpleBusqueda = (item.cliente || '').toLowerCase().includes(busqueda) ||
                                           (item.empleado || '').toLowerCase().includes(busqueda) ||
                                           (item.total || 0).toString().includes(busqueda) ||
                                           (item.metodoPago || '').toLowerCase().includes(busqueda) ||
                                           (item.productos || '').toLowerCase().includes(busqueda) ||
                                           (item.servicios || '').toLowerCase().includes(busqueda);
                            break;
                    }
                }
                
                if (this.filtros.fecha) {
                    const fechaItem = item.fecha || item.fechaNacimiento || '';
                    cumpleFecha = fechaItem.includes(this.filtros.fecha);
                }
                
                return cumpleBusqueda && cumpleFecha;
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
                    this.cargarHistorialDescuentos(),
                    this.cargarClientes(),
                    this.cargarVentasCliente()
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



        async cargarHistorialDescuentos() {
            const response = await fetch(`${config.apiBaseUrl}/reportes/historial-descuentos`);
            this.historialDescuentos = await response.json();
        },

        async cargarClientes() {
            const response = await fetch(`${config.apiBaseUrl}/clientes`);
            this.clientes = await response.json();
        },

        async cargarVentasCliente() {
            const ventasResponse = await fetch(`${config.apiBaseUrl}/ventas`);
            const detalleVentasResponse = await fetch(`${config.apiBaseUrl}/detalle-ventas`);
            const ventas = await ventasResponse.json();
            const detalleVentas = await detalleVentasResponse.json();
            
            this.ventasCliente = ventas
                .filter(venta => venta.cliente)
                .map(venta => {
                    const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    const productos = detalles.filter(d => d.producto).map(d => d.producto.nombre).join(', ');
                    const servicios = detalles.filter(d => d.servicio).map(d => d.servicio.nombre).join(', ');
                    
                    return {
                        id: venta.id,
                        fecha: venta.fechaVenta,
                        cliente: venta.cliente.nombreCompleto,
                        empleado: venta.empleado ? venta.empleado.nombreCompleto : 'N/A',
                        total: venta.total,
                        metodoPago: venta.metodoPago || 'N/A',
                        descuento: venta.descuento || 0,
                        productos: productos || 'N/A',
                        servicios: servicios || 'N/A'
                    };
                });
        },

        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const datosParaExportar = this.datosReporteFiltrados;
                const itemsPorPagina = 15;
                const totalPaginas = Math.ceil(datosParaExportar.length / itemsPorPagina);
                
                for (let pagina = 0; pagina < totalPaginas; pagina++) {
                    if (pagina > 0) doc.addPage();
                    
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
                    doc.text(this.getTituloReporte().toUpperCase(), 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${datosParaExportar.length}`, 20, 62);
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, datosParaExportar.length);
                    const datosPagina = datosParaExportar.slice(inicio, fin);
                    
                    const headers = [this.getHeadersParaPDF()];
                    const data = datosPagina.map(item => this.getRowDataParaPDF(item));
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 68,
                        styles: { 
                            fontSize: 8,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 2,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            overflow: 'linebreak'
                        },
                        headStyles: { 
                            fontSize: 8,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 3
                        },
                        bodyStyles: {
                            fontSize: 8,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: this.getColumnStyles(),
                        margin: { bottom: 40 }
                    };
                    
                    doc.autoTable(tableConfig);
                    
                    // Footer profesional
                    const pageHeight = doc.internal.pageSize.height;
                    doc.setLineWidth(0.5);
                    doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                    
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Página ${pagina + 1} de ${totalPaginas}`, 20, pageHeight - 15);
                    doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`reporte-${this.reporteActivo}-${fecha}.pdf`);
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },

        getTituloReporte() {
            const titulos = {
                servicios: 'Servicios Más Solicitados',
                clientes: 'Clientes Más Frecuentes',
                productos: 'Productos con Bajo Stock',
                descuentos: 'Historial de Descuentos',
                'ventas-cliente': 'Ventas de Clientes'
            };
            return titulos[this.reporteActivo];
        },

        getHeadersParaPDF() {
            switch(this.reporteActivo) {
                case 'servicios':
                    return ['Servicio', 'Cantidad Solicitada', 'Precio'];
                case 'clientes':
                    return ['Cliente', 'Teléfono', 'Email', 'Visitas', 'Total Gastado', 'Fecha Nacimiento'];
                case 'productos':
                    return ['Producto', 'Stock Actual', 'Stock Mínimo', 'Precio'];
                case 'descuentos':
                    return ['Cliente', 'Descuento', 'Fecha'];
                case 'ventas-cliente':
                    return ['Fecha', 'Cliente', 'Empleado', 'Total', 'Productos', 'Servicios'];
                default:
                    return ['Datos'];
            }
        },
        
        getRowDataParaPDF(item) {
            switch(this.reporteActivo) {
                case 'servicios':
                    return [item.nombre, item.cantidad || 0, this.formatearNumero(item.precio || 0)];
                case 'clientes':
                    return [item.nombreCompleto, item.telefono || 'N/A', item.correo || 'N/A', item.visitas || 0, this.formatearNumero(item.totalGastado || 0), this.formatearFecha(item.fechaNacimiento)];
                case 'productos':
                    return [item.nombre, item.stock || 0, item.stockMinimo || 0, this.formatearNumero(item.precio || 0)];
                case 'descuentos':
                    return [item.cliente, this.formatearNumero(item.descuento || 0), this.formatearFecha(item.fecha)];
                case 'ventas-cliente':
                    return [this.formatearFecha(item.fecha), item.cliente, item.empleado, this.formatearNumero(item.total), item.productos, item.servicios];
                default:
                    return [JSON.stringify(item)];
            }
        },

        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },

        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        },
        
        getColumnStyles() {
            switch(this.reporteActivo) {
                case 'servicios':
                    return {
                        0: { cellWidth: 'auto', overflow: 'linebreak' },
                        1: { cellWidth: 'auto', halign: 'center' },
                        2: { cellWidth: 'auto', halign: 'right' }
                    };
                case 'clientes':
                    return {
                        0: { cellWidth: 'auto', overflow: 'linebreak' },
                        1: { cellWidth: 'auto', overflow: 'linebreak' },
                        2: { cellWidth: 'auto', overflow: 'linebreak' },
                        3: { cellWidth: 'auto', halign: 'center' },
                        4: { cellWidth: 'auto', halign: 'right' },
                        5: { cellWidth: 'auto', halign: 'center' }
                    };
                case 'productos':
                    return {
                        0: { cellWidth: 'auto', overflow: 'linebreak' },
                        1: { cellWidth: 'auto', halign: 'center' },
                        2: { cellWidth: 'auto', halign: 'center' },
                        3: { cellWidth: 'auto', halign: 'right' }
                    };
                case 'descuentos':
                    return {
                        0: { cellWidth: 'auto', overflow: 'linebreak' },
                        1: { cellWidth: 'auto', halign: 'right' },
                        2: { cellWidth: 'auto', halign: 'center' }
                    };
                case 'ventas-cliente':
                    return {
                        0: { cellWidth: 'auto', halign: 'center' },
                        1: { cellWidth: 'auto', overflow: 'linebreak' },
                        2: { cellWidth: 'auto', overflow: 'linebreak' },
                        3: { cellWidth: 'auto', halign: 'right' },
                        4: { cellWidth: 'auto', overflow: 'linebreak' },
                        5: { cellWidth: 'auto', overflow: 'linebreak' }
                    };
                default:
                    return {
                        0: { cellWidth: 'auto', overflow: 'linebreak' }
                    };
            }
        }
    },
    template: `
        <div class="glass-container">
            <h1 class="page-title">Reportes y Estadísticas</h1>
            <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
            <main style="padding: 20px;">
            
            <div class="reportes-nav" style="display: flex; gap: 8px; margin: 20px 0; flex-wrap: nowrap; overflow-x: auto; white-space: nowrap;">
                <button @click="reporteActivo = 'servicios'" :class="{'active': reporteActivo === 'servicios'}" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-cut"></i> Servicios
                </button>
                <button @click="reporteActivo = 'clientes'" :class="{'active': reporteActivo === 'clientes'}" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-user"></i> Clientes
                </button>
                <button @click="reporteActivo = 'productos'" :class="{'active': reporteActivo === 'productos'}" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-box"></i> Productos
                </button>

                <button @click="reporteActivo = 'descuentos'" :class="{'active': reporteActivo === 'descuentos'}" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-percent"></i> Descuentos
                </button>
                <button @click="reporteActivo = 'ventas-cliente'" :class="{'active': reporteActivo === 'ventas-cliente'}" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-shopping-cart"></i> Ventas Cliente
                </button>
                <button @click="window.location.href = '/web/empleado-principal'" class="btn btn-small" style="min-width: fit-content; padding: 8px 12px; font-size: 0.85rem;">
                    <i class="fas fa-users"></i> Empleados
                </button>
            </div>

            <div class="filters-container" style="display: flex; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; gap: 15px; width: fit-content;">
                <div class="filter-group">
                    <label>Buscar:</label>
                    <input v-model="filtros.busqueda" placeholder="Nombre o monto..." class="search-bar" style="width: 200px;"/>
                </div>
                <div class="filter-group">
                    <label>Fecha:</label>
                    <input v-model="filtros.fecha" type="date" class="search-bar" style="width: 140px;"/>
                </div>

                <button @click="exportarPDF()" class="btn btn-small">
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



                <!-- Historial de Descuentos -->
                <div v-if="reporteActivo === 'descuentos'">
                    <h3>Historial de Descuentos Realizados</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Descuento</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="descuento in datosReporteFiltrados" :key="descuento.id">
                                <td>{{ descuento.cliente }}</td>
                                <td>{{ formatearNumero(descuento.descuento || 0) }}</td>
                                <td>{{ formatearFecha(descuento.fecha) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Ventas por Cliente -->
                <div v-if="reporteActivo === 'ventas-cliente'">
                    <h3>Ventas de Clientes</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Empleado</th>
                                <th>Total</th>
                                <th>Productos</th>
                                <th>Servicios</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="venta in datosReporteFiltrados" :key="venta.id">
                                <td>{{ formatearFecha(venta.fecha) }}</td>
                                <td>{{ venta.cliente }}</td>
                                <td>{{ venta.empleado }}</td>
                                <td><strong>{{ formatearNumero(venta.total) }}</strong></td>
                                <td>{{ venta.productos }}</td>
                                <td>{{ venta.servicios }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            </main>
        </div>
    `
});

