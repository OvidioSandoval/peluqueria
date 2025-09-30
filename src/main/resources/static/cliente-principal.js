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
        <v-app>
            <v-main>
                <v-container fluid class="pa-2">
                    <v-row class="mb-2">
                        <v-col cols="12" class="pb-2">
                            <h1 class="page-title">Gestión de Clientes</h1>
                        </v-col>
                    </v-row>
                    
                    <v-row class="mb-2">
                        <v-col cols="12" class="py-2">
                            <v-btn @click="window.history.back()" color="secondary">
                                <i class="fas fa-arrow-left"></i> Volver
                            </v-btn>
                        </v-col>
                    </v-row>
                    
                    <!-- Búsqueda Unificada -->
                    <v-row class="mb-2">
                        <v-col cols="12" class="py-2">
                            <v-card>
                                <v-card-title class="pb-2">
                                    <v-icon left>mdi-magnify</v-icon>
                                    Buscar Cliente
                                </v-card-title>
                                <v-card-text class="pa-3">
                                    <div class="d-flex align-center" style="width: fit-content;">
                                        <v-text-field
                                            v-model="busqueda"
                                            @input="filtrarClientes"
                                            label="Buscar por nombre, RUC, teléfono o email"
                                            prepend-icon="mdi-magnify"
                                            clearable
                                            outlined
                                            dense
                                            hide-details
                                            placeholder="Ingrese cualquier dato del cliente..."
                                            class="mr-3"
                                            style="width: 300px;"
                                        ></v-text-field>
                                        <v-btn @click="limpiarFiltros" color="btn btn-secondary btn-small" outlined small class="mr-2">
                                            Limpiar
                                        </v-btn>
                                        <v-btn @click="toggleFrecuentes" color="primary" small>
                                            {{ mostrarFrecuentes ? 'Ocultar' : 'Ver' }} Frecuentes
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-row v-if="mostrarFrecuentes" class="mb-2">
                        <v-col cols="12" class="py-2">
                            <v-card>
                                <v-card-title>
                                    Clientes Frecuentes
                                    <v-spacer></v-spacer>
                                    <v-btn @click="exportarClientesFrecuentes" color="success" small class="mr-2">
                                        <v-icon left small>mdi-file-pdf</v-icon>
                                        Exportar
                                    </v-btn>
                                    <v-btn @click="mostrarFrecuentes = false" small icon style="background-color: transparent !important;">
                                        <i class="fas fa-times" style="color: red !important; font-size: 16px;"></i>
                                    </v-btn>
                                </v-card-title>
                                <v-card-text>
                                    <v-progress-circular v-if="cargandoFrecuentes" indeterminate></v-progress-circular>
                                    <v-list v-else>
                                        <v-list-item v-for="item in clientesFrecuentes" :key="item.cliente.id">
                                            <v-list-item-content>
                                                <v-list-item-title>{{ item.cliente.nombreCompleto }}</v-list-item-title>
                                                <v-list-item-subtitle>{{ item.cantidadVisitas }} visitas - {{ formatearNumero(item.montoTotal) }}</v-list-item-subtitle>
                                            </v-list-item-content>
                                            <v-list-item-action>
                                                <v-btn small @click="seleccionarCliente(item.cliente)">Ver Historial</v-btn>
                                            </v-list-item-action>
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-row class="mb-2">
                        <v-col cols="12" class="py-2">
                            <v-card>
                                <v-card-title>
                                    Lista de Clientes
                                    <v-spacer></v-spacer>
                                    <v-btn @click="exportarListaClientes" color="success" small :loading="generandoPDF">
                                        <v-icon left small>mdi-file-pdf</v-icon>
                                        Exportar PDF
                                    </v-btn>
                                </v-card-title>
                                <v-card-text>
                                    <v-data-table
                                        :headers="[
                                            { text: 'Nombre', value: 'nombreCompleto' },
                                            { text: 'Teléfono', value: 'telefono' },
                                            { text: 'RUC', value: 'ruc' },
                                            { text: 'Email', value: 'correo' },
                                            { text: 'Edad', value: 'edad' },
                                            { text: 'Acciones', value: 'acciones', sortable: false }
                                        ]"
                                        :items="clientesPaginados"
                                        :items-per-page="itemsPorPagina"
                                        hide-default-footer
                                    >
                                        <template v-slot:item.telefono="{ item }">
                                            {{ item.telefono || 'N/A' }}
                                        </template>
                                        <template v-slot:item.ruc="{ item }">
                                            {{ item.ruc || 'N/A' }}
                                        </template>
                                        <template v-slot:item.correo="{ item }">
                                            {{ item.correo || 'N/A' }}
                                        </template>
                                        <template v-slot:item.edad="{ item }">
                                            {{ calcularEdad(item.fechaNacimiento) }}
                                        </template>
                                        <template v-slot:item.acciones="{ item }">
                                            <v-btn small color="primary" @click="seleccionarCliente(item)">Ver Historial</v-btn>
                                        </template>
                                    </v-data-table>
                                    
                                    <div class="pagination">
                                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-dialog v-model="mostrarHistorial" max-width="1200px">
                        <v-card>
                            <v-card-title>
                                <span class="headline">Información del Cliente</span>
                                <v-spacer></v-spacer>
                                <v-btn @click="exportarHistorialCliente" color="success" class="mr-2" small>
                                    <v-icon left small>mdi-file-pdf</v-icon>
                                    Exportar Historial
                                </v-btn>
                                <v-btn icon @click="cerrarHistorial" style="color: red !important;">
                                    <i class="fas fa-times" style="color: red;"></i>
                                </v-btn>
                            </v-card-title>
                            
                            <v-card-text v-if="clienteSeleccionado">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-card outlined>
                                            <v-card-title class="subtitle-1">Datos Personales</v-card-title>
                                            <v-card-text>
                                                <v-list dense>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Nombre Completo</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.nombreCompleto }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Teléfono</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.telefono || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>RUC</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.ruc || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Email</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.correo || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Redes Sociales</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.redesSociales || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Fecha de Nacimiento</v-list-item-title>
                                                            <v-list-item-subtitle>{{ formatearFecha(clienteSeleccionado.fechaNacimiento) || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Edad</v-list-item-title>
                                                            <v-list-item-subtitle>{{ calcularEdad(clienteSeleccionado.fechaNacimiento) }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Cliente desde</v-list-item-title>
                                                            <v-list-item-subtitle>{{ formatearFecha(clienteSeleccionado.fechaCreacion) }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                </v-list>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    
                                    <v-col cols="12" md="6">
                                        <v-card outlined>
                                            <v-card-title class="subtitle-1">Historial de Servicios</v-card-title>
                                            <v-card-text>
                                                <v-progress-circular v-if="cargandoHistorial" indeterminate></v-progress-circular>
                                                <div v-else-if="historialServicios.length === 0" class="text-center">
                                                    <p>No hay servicios registrados para este cliente</p>
                                                </div>
                                                <div v-else>
                                                    <table>
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

                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-dialog>
                </v-container>
            </v-main>
        </v-app>
    `
});
