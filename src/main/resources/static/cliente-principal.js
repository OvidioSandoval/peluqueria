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
            clientes: [],
            clientesFiltrados: [],
            clienteSeleccionado: null,
            historialServicios: [],
            clientesFrecuentes: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            mostrarHistorial: false,
            mostrarFrecuentes: false,
            cargandoHistorial: false,
            cargandoFrecuentes: false,
            generandoPDF: false,
            busqueda: '',
            paginaHistorial: 1
        };
    },
    mounted() {
        this.fetchClientes();
        this.fetchClientesFrecuentes();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
        },
        clientesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.clientesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchClientes() {
            try {
                const response = await fetch(config.apiBaseUrl + '/clientes');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.clientes = await response.json();
                this.filtrarClientes();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
                NotificationSystem.error('Error al cargar los clientes: ' + error.message);
            }
        },
        
        async fetchClientesFrecuentes() {
            try {
                this.cargandoFrecuentes = true;
                const response = await fetch(config.apiBaseUrl + '/ventas');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                const ventas = await response.json();
                
                const frecuenciaClientes = {};
                ventas.forEach(venta => {
                    if (venta.cliente && venta.cliente.id) {
                        const clienteId = venta.cliente.id;
                        if (!frecuenciaClientes[clienteId]) {
                            frecuenciaClientes[clienteId] = {
                                cliente: venta.cliente,
                                cantidadVisitas: 0,
                                montoTotal: 0
                            };
                        }
                        frecuenciaClientes[clienteId].cantidadVisitas++;
                        frecuenciaClientes[clienteId].montoTotal += venta.montoTotal || 0;
                    }
                });
                
                this.clientesFrecuentes = Object.values(frecuenciaClientes)
                    .sort((a, b) => b.cantidadVisitas - a.cantidadVisitas)
                    .slice(0, 10);
                    
            } catch (error) {
                console.error('Error al cargar clientes frecuentes:', error);
                NotificationSystem.error('Error al cargar clientes frecuentes: ' + error.message);
            } finally {
                this.cargandoFrecuentes = false;
            }
        },
        
        async fetchHistorialCliente(clienteId) {
            try {
                this.cargandoHistorial = true;
                const ventasResponse = await fetch(config.apiBaseUrl + '/ventas');
                const detalleVentasResponse = await fetch(config.apiBaseUrl + '/detalle-ventas');
                
                if (!ventasResponse.ok || !detalleVentasResponse.ok) {
                    throw new Error('Error al cargar datos del historial');
                }
                
                const ventas = await ventasResponse.json();
                const detalleVentas = await detalleVentasResponse.json();
                
                const ventasCliente = ventas.filter(venta => 
                    venta.cliente && venta.cliente.id === clienteId
                );
                
                this.historialServicios = [];
                for (const venta of ventasCliente) {
                    const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    
                    for (const detalle of detalles) {
                        this.historialServicios.push({
                            fecha: venta.fechaVenta,
                            tipoServicio: detalle.servicio ? detalle.servicio.nombre : 'Producto',
                            descripcion: detalle.servicio ? detalle.servicio.descripcion : (detalle.producto && detalle.producto.nombre) || 'N/A',
                            precioCobrado: detalle.precioUnitario || 0,
                            colaborador: venta.empleado ? venta.empleado.nombreCompleto : 'N/A',
                            metodoPago: venta.metodoPago || 'N/A',
                            observaciones: venta.observaciones || ''
                        });
                    }
                }
                
                this.historialServicios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                
            } catch (error) {
                console.error('Error al cargar historial:', error);
                NotificationSystem.error('Error al cargar el historial: ' + error.message);
            } finally {
                this.cargandoHistorial = false;
            }
        },
        
        filtrarClientes() {
            if (this.busqueda.trim() === '') {
                this.clientesFiltrados = this.clientes;
            } else {
                const busqueda = this.busqueda.toLowerCase();
                this.clientesFiltrados = this.clientes.filter(cliente =>
                    (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (cliente.ruc && cliente.ruc.toLowerCase().includes(busqueda)) ||
                    (cliente.telefono && cliente.telefono.toLowerCase().includes(busqueda)) ||
                    (cliente.correo && cliente.correo.toLowerCase().includes(busqueda))
                );
            }
            this.paginaActual = 1;
        },
        
        limpiarFiltros() {
            this.busqueda = '';
            this.filtrarClientes();
        },
        
        seleccionarCliente(cliente) {
            this.clienteSeleccionado = cliente;
            this.mostrarHistorial = true;
            this.fetchHistorialCliente(cliente.id);
        },
        
        cerrarHistorial() {
            this.mostrarHistorial = false;
            this.clienteSeleccionado = null;
            this.historialServicios = [];
            this.paginaHistorial = 1;
        },
        
        toggleFrecuentes() {
            this.mostrarFrecuentes = !this.mostrarFrecuentes;
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        
        cambiarPaginaHistorial(pagina) {
            const totalPaginasHistorial = Math.ceil(this.historialServicios.length / 5);
            if (pagina >= 1 && pagina <= totalPaginasHistorial) {
                this.paginaHistorial = pagina;
            }
        },
        
        calcularEdad(fechaNacimiento) {
            if (!fechaNacimiento) return 'N/A';
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
            return edad + ' años';
        },
        
        getColorMetodoPago(metodoPago) {
            const colores = {
                'Efectivo': 'green',
                'Tarjeta': 'blue',
                'Transferencia': 'purple',
                'N/A': 'grey'
            };
            return colores[metodoPago] || 'grey';
        },
        
        exportarClientesFrecuentes() {
            try {
                this.generandoPDF = true;
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
                doc.text('REPORTE DE CLIENTES FRECUENTES', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de clientes frecuentes: ${this.clientesFrecuentes.length}`, 20, 62);
                
                const headers = [['CLIENTE', 'VISITAS', 'TOTAL GASTADO', 'TELÉFONO', 'EMAIL']];
                const data = this.clientesFrecuentes.map(item => [
                    item.cliente.nombreCompleto || '',
                    item.cantidadVisitas.toString(),
                    this.formatearNumero(item.montoTotal),
                    item.cliente.telefono || 'No registrado',
                    item.cliente.correo || 'No registrado'
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
                        0: { cellWidth: 50 },
                        1: { cellWidth: 20, halign: 'center' },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 35 },
                        4: { cellWidth: 45 }
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
                doc.save(`clientes-frecuentes-${fecha}.pdf`);
                NotificationSystem.success('Reporte de clientes frecuentes exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            } finally {
                this.generandoPDF = false;
            }
        },
        
        exportarListaClientes() {
            try {
                this.generandoPDF = true;
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const clientesParaExportar = this.clientesFiltrados;
                const itemsPorPagina = 20;
                const totalPaginas = Math.ceil(clientesParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE CLIENTES', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${clientesParaExportar.length}`, 20, 62);
                    if (this.busqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.busqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, clientesParaExportar.length);
                    const clientesPagina = clientesParaExportar.slice(inicio, fin);
                    
                    const headers = [['NOMBRE COMPLETO', 'TELÉFONO', 'RUC', 'EMAIL', 'EDAD']];
                    const data = clientesPagina.map((cliente) => [
                        cliente.nombreCompleto || '',
                        cliente.telefono || 'No registrado',
                        cliente.ruc || 'No registrado',
                        cliente.correo || 'No registrado',
                        this.calcularEdad(cliente.fechaNacimiento)
                    ]);
                    
                    doc.autoTable({
                        head: headers,
                        body: data,
                        startY: this.busqueda.trim() ? 75 : 68,
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
                            0: { cellWidth: 50 },
                            1: { cellWidth: 30 },
                            2: { cellWidth: 30 },
                            3: { cellWidth: 50 },
                            4: { cellWidth: 20, halign: 'center' }
                        },
                        margin: { bottom: 40 }
                    });
                    
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
                const filtroTexto = this.busqueda.trim() ? '-filtrado' : '';
                doc.save(`lista-clientes${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Lista de clientes exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            } finally {
                this.generandoPDF = false;
            }
        },
        
        exportarHistorialCliente() {
            if (!this.clienteSeleccionado || this.historialServicios.length === 0) {
                NotificationSystem.warning('No hay historial para exportar');
                return;
            }
            
            try {
                this.generandoPDF = true;
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const serviciosPorPagina = 15;
                const totalPaginas = Math.ceil(this.historialServicios.length / serviciosPorPagina);
                const totalGastado = this.historialServicios.reduce((sum, servicio) => sum + servicio.precioCobrado, 0);
                
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
                    doc.text('HISTORIAL DEL CLIENTE', 105, 40, { align: 'center' });
                    
                    // Información del cliente
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text(this.clienteSeleccionado.nombreCompleto.toUpperCase(), 20, 55);
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Teléfono: ${this.clienteSeleccionado.telefono || 'No registrado'}`, 20, 65);
                    doc.text(`Email: ${this.clienteSeleccionado.correo || 'No registrado'}`, 20, 72);
                    
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 120, 55);
                    doc.text(`Total de servicios: ${this.historialServicios.length}`, 120, 62);
                    doc.text(`Monto total gastado: ${this.formatearNumero(totalGastado)}`, 120, 69);
                    
                    const inicio = pagina * serviciosPorPagina;
                    const fin = Math.min(inicio + serviciosPorPagina, this.historialServicios.length);
                    const serviciosPagina = this.historialServicios.slice(inicio, fin);
                    
                    const headers = [['FECHA', 'SERVICIO', 'PRECIO', 'MÉTODO PAGO', 'COLABORADOR']];
                    const data = serviciosPagina.map(servicio => [
                        this.formatearFecha(servicio.fecha),
                        servicio.tipoServicio || '',
                        this.formatearNumero(servicio.precioCobrado),
                        servicio.metodoPago || 'No especificado',
                        servicio.colaborador || 'No especificado'
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 80,
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
                            0: { cellWidth: 25, halign: 'center' },
                            1: { cellWidth: 45 },
                            2: { cellWidth: 25, halign: 'right' },
                            3: { cellWidth: 30, halign: 'center' },
                            4: { cellWidth: 45 }
                        },
                        margin: { bottom: 40 }
                    };
                    
                    if (pagina === totalPaginas - 1) {
                        tableConfig.foot = [['', '', '', 'TOTAL GENERAL:', this.formatearNumero(totalGastado)]];
                        tableConfig.footStyles = { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        };
                    }
                    
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
                const nombreArchivo = `historial-${this.clienteSeleccionado.nombreCompleto.replace(/\s+/g, '-')}-${fecha}.pdf`;
                doc.save(nombreArchivo);
                NotificationSystem.success('Historial del cliente exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            } finally {
                this.generandoPDF = false;
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Clientes</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap; width: fit-content; padding: 15px; margin: 15px 0;">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Cliente:</label>
                            <input type="text" v-model="busqueda" @input="filtrarClientes" placeholder="Buscar por nombre, RUC, teléfono o email..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: end;">
                            <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                            <button @click="toggleFrecuentes" class="btn btn-small">
                                {{ mostrarFrecuentes ? 'Ocultar' : 'Ver' }} Frecuentes
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="mostrarFrecuentes" class="form-container" style="margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>Clientes Frecuentes</h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button @click="exportarClientesFrecuentes" class="btn btn-small">
                                    <i class="fas fa-file-pdf"></i> Exportar
                                </button>
                                <button @click="mostrarFrecuentes = false" class="btn btn-small btn-danger">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div v-if="cargandoFrecuentes" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                            <p>Cargando...</p>
                        </div>
                        <table v-else>
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Visitas</th>
                                    <th>Total Gastado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in clientesFrecuentes" :key="item.cliente.id">
                                    <td>{{ item.cliente.nombreCompleto }}</td>
                                    <td>{{ item.cantidadVisitas }}</td>
                                    <td>{{ formatearNumero(item.montoTotal) }}</td>
                                    <td>
                                        <button @click="seleccionarCliente(item.cliente)" class="btn-small">Ver Historial</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="form-container" style="margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>Lista de Clientes</h3>
                            <button @click="exportarListaClientes" class="btn btn-small" :disabled="generandoPDF">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>RUC</th>
                                    <th>Email</th>
                                    <th>Edad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="cliente in clientesPaginados" :key="cliente.id">
                                    <td>{{ cliente.nombreCompleto }}</td>
                                    <td>{{ cliente.telefono || 'N/A' }}</td>
                                    <td>{{ cliente.ruc || 'N/A' }}</td>
                                    <td>{{ cliente.correo || 'N/A' }}</td>
                                    <td>{{ calcularEdad(cliente.fechaNacimiento) }}</td>
                                    <td>
                                        <button @click="seleccionarCliente(cliente)" class="btn-small">Ver Historial</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="pagination">
                            <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                            <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                            <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                        </div>
                    </div>
                    
                    <div v-if="mostrarHistorial" class="turno-detail-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; overflow-y: auto;">
                        <div class="modal-content" style="background: rgba(252, 228, 236, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 1200px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; color: #66bb6a;"><i class="fas fa-user"></i> Información del Cliente</h3>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <button @click="exportarHistorialCliente" class="btn btn-small">
                                        <i class="fas fa-file-pdf"></i> Exportar Historial
                                    </button>
                                    <button @click="cerrarHistorial" style="background: none; border: none; color: #f44336; font-size: 1.5rem; cursor: pointer; padding: 5px;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div v-if="clienteSeleccionado" style="padding: 20px;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;">
                                    <div class="form-container" style="padding: 15px;">
                                        <h4>Datos Personales</h4>
                                        <div><strong>Nombre Completo:</strong> {{ clienteSeleccionado.nombreCompleto }}</div>
                                        <div><strong>Teléfono:</strong> {{ clienteSeleccionado.telefono || 'No registrado' }}</div>
                                        <div><strong>RUC:</strong> {{ clienteSeleccionado.ruc || 'No registrado' }}</div>
                                        <div><strong>Email:</strong> {{ clienteSeleccionado.correo || 'No registrado' }}</div>
                                        <div><strong>Redes Sociales:</strong> {{ clienteSeleccionado.redesSociales || 'No registrado' }}</div>
                                        <div><strong>Fecha de Nacimiento:</strong> {{ formatearFecha(clienteSeleccionado.fechaNacimiento) || 'No registrado' }}</div>
                                        <div><strong>Edad:</strong> {{ calcularEdad(clienteSeleccionado.fechaNacimiento) }}</div>
                                        <div><strong>Cliente desde:</strong> {{ formatearFecha(clienteSeleccionado.fechaCreacion) }}</div>
                                    </div>
                                    
                                    <div class="form-container" style="padding: 15px;">
                                        <h4>Historial de Servicios</h4>
                                        <div v-if="cargandoHistorial" style="text-align: center; padding: 40px;">
                                            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #66bb6a;"></i>
                                            <div style="margin-top: 20px; color: #66bb6a;">Cargando historial...</div>
                                        </div>
                                        <div v-else-if="historialServicios.length === 0" style="text-align: center; padding: 40px; color: #66bb6a;">
                                            <i class="fas fa-info-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                                            <div>No hay servicios registrados para este cliente</div>
                                        </div>
                                        <div v-else>
                                            <table style="margin-top: 15px;">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Servicio</th>
                                                        <th>Precio</th>
                                                        <th>Método Pago</th>
                                                        <th>Colaborador</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="servicio in historialServicios.slice((paginaHistorial - 1) * 5, paginaHistorial * 5)" :key="servicio.fecha + servicio.tipoServicio">
                                                        <td>{{ formatearFecha(servicio.fecha) }}</td>
                                                        <td>{{ servicio.tipoServicio }}</td>
                                                        <td>{{ formatearNumero(servicio.precioCobrado) }}</td>
                                                        <td>
                                                            <span :style="{color: getColorMetodoPago(servicio.metodoPago), fontWeight: 'bold'}">{{ servicio.metodoPago }}</span>
                                                        </td>
                                                        <td>{{ servicio.colaborador }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="pagination" style="margin-top: 15px;">
                                                <button @click="cambiarPaginaHistorial(paginaHistorial - 1)" :disabled="paginaHistorial === 1">Anterior</button>
                                                <span>Página {{ paginaHistorial }} de {{ Math.ceil(historialServicios.length / 5) }}</span>
                                                <button @click="cambiarPaginaHistorial(paginaHistorial + 1)" :disabled="paginaHistorial === Math.ceil(historialServicios.length / 5)">Siguiente</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

// Adding CSS styling to match app-clientes page
const style = document.createElement('style');
style.textContent = `
    .filters-container {
        display: flex;
        gap: 15px;
        align-items: end;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(252, 228, 236, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1);
        border: 1px solid rgba(179, 229, 252, 0.3);
        flex-wrap: wrap;
        width: fit-content;
    }
    .filter-group {
        display: flex;
        flex-direction: column;
        min-width: fit-content;
    }
    .filter-group label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #5d4037;
    }
    .search-bar {
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        transition: border-color 0.3s;
        width: 300px;
    }
    .search-bar:focus {
        border-color: #5d4037;
        outline: none;
    }
`;
document.head.appendChild(style);

// Confirmation dialog styling
const confirmStyle = document.createElement('style');
confirmStyle.textContent = `
    .swal2-popup {
        background: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #333 !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        z-index: 99999 !important;
        width: auto !important;
        max-width: 500px !important;
        padding: 20px !important;
    }
    .swal2-title {
        color: #000000 !important;
        font-weight: bold !important;
        font-size: 18px !important;
        text-shadow: none !important;
    }
    .swal2-html-container {
        color: #000000 !important;
        font-weight: bold !important;
    }
    .swal2-content {
        color: #000000 !important;
        font-size: 16px !important;
        font-weight: 500 !important;
    }
    .swal2-confirm {
        background: #dc3545 !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-cancel {
        background: #6c757d !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-container {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(confirmStyle);
