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
            cajas: [],
            cajasFiltradas: [],
            filtroBusqueda: '',
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            horaAperturaFiltro: '',
            horaCierreFiltro: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaCaja: { 
                id: null, 
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                horaCierre: null,
                montoInicial: null,
                montoFinal: null,
                totalServicios: 0,
                totalProductos: 0,
                totalDescuentos: 0,
                estado: 'abierto',
                empleadoId: null
            },
            empleados: [],
            cajaSeleccionada: '',
            intervalId: null,
            mostrarSalir: false,
            historialVisible: false,
            historialCaja: null,
            historialVentas: [],
        };
    },
    mounted() {
        this.fetchCajas();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.cajasFiltradas.length / this.itemsPorPagina);
        },
        cajasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.cajasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalServicios() {
            return this.cajasFiltradas.reduce((sum, caja) => sum + (caja.totalServicios || 0), 0);
        },
        totalProductos() {
            return this.cajasFiltradas.reduce((sum, caja) => sum + (caja.totalProductos || 0), 0);
        },
        totalDescuentos() {
            return this.cajasFiltradas.reduce((sum, caja) => sum + (caja.totalDescuentos || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/cajas';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/panel-control';
            }
        },
        async fetchCajas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/cajas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                const cajas = await response.json();
                // Ensure employee data is properly loaded
                this.cajas = cajas.map(caja => ({
                    ...caja,
                    empleado: caja.empleado || null
                }));
                this.filtrarCajas();
            } catch (error) {
                console.error('Error al cargar cajas:', error);
                NotificationSystem.error(`Error al cargar las cajas: ${error.message}`);
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
            }
        },
        filtrarCajas() {
            let cajasFiltradas = this.cajas;
            
            // Filtro por texto
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                cajasFiltradas = cajasFiltradas.filter(caja =>
                    (caja.nombre && caja.nombre.toLowerCase().includes(busqueda)) ||
                    this.getEmpleadoName(caja).toLowerCase().includes(busqueda) ||
                    this.formatearHora(caja.horaApertura).includes(busqueda) ||
                    this.formatearHora(caja.horaCierre).includes(busqueda) ||
                    (caja.montoInicial && caja.montoInicial.toString().includes(busqueda)) ||
                    (caja.montoFinal && caja.montoFinal.toString().includes(busqueda)) ||
                    caja.estado.toLowerCase().includes(busqueda)
                );
            }
            
            // Filtro por rango de fechas
            if (this.fechaInicio) {
                cajasFiltradas = cajasFiltradas.filter(caja => caja.fecha >= this.fechaInicio);
            }
            if (this.fechaFin) {
                cajasFiltradas = cajasFiltradas.filter(caja => caja.fecha <= this.fechaFin);
            }
            
            // Filtro por hora de apertura
            if (this.horaAperturaFiltro) {
                cajasFiltradas = cajasFiltradas.filter(caja => {
                    const horaApertura = this.formatearHora(caja.horaApertura);
                    return horaApertura.includes(this.horaAperturaFiltro);
                });
            }
            
            // Filtro por hora de cierre
            if (this.horaCierreFiltro) {
                cajasFiltradas = cajasFiltradas.filter(caja => {
                    const horaCierre = this.formatearHora(caja.horaCierre);
                    return horaCierre.includes(this.horaCierreFiltro);
                });
            }
            
            this.cajasFiltradas = cajasFiltradas;
            this.paginaActual = 1;
        },
        async agregarCaja() {
            if (!this.nuevaCaja.nombre || !this.nuevaCaja.montoInicial) {
                NotificationSystem.error('Nombre de caja y monto inicial son requeridos');
                return;
            }
            try {
                const cajaData = {
                    ...this.nuevaCaja,
                    nombre: this.capitalizarTexto(this.nuevaCaja.nombre),
                    estado: this.capitalizarTexto(this.nuevaCaja.estado),
                    empleado: this.nuevaCaja.empleadoId ? { id: this.nuevaCaja.empleadoId } : null
                };
                delete cajaData.empleadoId;
                const response = await fetch(`${config.apiBaseUrl}/cajas/agregar_caja`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cajaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCajas();
                    NotificationSystem.success('Caja agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar caja:', error);
                NotificationSystem.error(`Error al agregar caja: ${error.message}`);
            }
        },
        async modificarCaja() {
            if (!this.nuevaCaja.nombre || !this.nuevaCaja.montoInicial) {
                NotificationSystem.error('Nombre de caja y monto inicial son requeridos');
                return;
            }
            try {
                await this.calcularTotales();
                const cajaData = {
                    ...this.nuevaCaja,
                    nombre: this.capitalizarTexto(this.nuevaCaja.nombre),
                    estado: this.capitalizarTexto(this.nuevaCaja.estado),
                    empleado: this.nuevaCaja.empleadoId ? { id: this.nuevaCaja.empleadoId } : null
                };
                delete cajaData.empleadoId;
                const response = await fetch(`${config.apiBaseUrl}/cajas/actualizar_caja/${this.nuevaCaja.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cajaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCajas();
                    NotificationSystem.success('Caja actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar caja:', error);
                NotificationSystem.error(`Error al modificar caja: ${error.message}`);
            }
        },
        async eliminarCaja(caja) {
            NotificationSystem.confirm(`¿Eliminar caja "${caja.nombre}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/cajas/eliminar_caja/${caja.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchCajas();
                        NotificationSystem.success('Caja eliminada exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar caja:', error);
                    NotificationSystem.error(`Error al eliminar caja: ${error.message}`);
                }
            });
        },
        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaCaja = { 
                id: null, 
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                horaCierre: null,
                montoInicial: null,
                montoFinal: null,
                totalServicios: 0,
                totalProductos: 0,
                totalDescuentos: 0,
                estado: 'abierto',
                empleadoId: null
            };
            this.cajaSeleccionada = '';
            if (!this.formularioVisible) {
                await this.fetchCajas();
            }
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.fechaInicio = '';
            this.fechaFin = '';
            this.horaAperturaFiltro = '';
            this.horaCierreFiltro = '';
            this.filtrarCajas();
        },
        async cerrarCaja(caja) {
            if (caja.estado === 'cerrado') {
                NotificationSystem.error('La caja ya está cerrada');
                return;
            }
            NotificationSystem.confirm(`¿Cerrar caja "${caja.nombre}"?`, async () => {
                try {
                    const cajaData = {
                        ...caja,
                        estado: 'cerrado',
                        horaCierre: new Date().toTimeString().substring(0, 8)
                    };
                    const response = await fetch(`${config.apiBaseUrl}/cajas/actualizar_caja/${caja.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cajaData)
                    });
                    if (response.ok) {
                        await this.fetchCajas();
                        NotificationSystem.success('Caja cerrada exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al cerrar caja:', error);
                    NotificationSystem.error(`Error al cerrar caja: ${error.message}`);
                }
            });
        },
        async verHistorial(caja) {
            try {
                const [ventasResponse, detalleVentasResponse] = await Promise.all([
                    fetch(`${config.apiBaseUrl}/ventas`),
                    fetch(`${config.apiBaseUrl}/detalle-ventas`)
                ]);
                
                const todasLasVentas = await ventasResponse.json();
                const detalleVentas = await detalleVentasResponse.json();
                
                const fechaCaja = caja.fecha;
                const ventasDelDia = todasLasVentas.filter(venta => {
                    if (!venta.fechaVenta) return false;
                    const fechaVenta = typeof venta.fechaVenta === 'string' ? venta.fechaVenta : new Date(venta.fechaVenta).toISOString().split('T')[0];
                    return fechaVenta === fechaCaja;
                });
                
                // Calcular totales por venta
                this.historialVentas = ventasDelDia.map(venta => {
                    const detallesVenta = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    
                    const totalServicios = detallesVenta
                        .filter(detalle => detalle.servicio)
                        .reduce((sum, detalle) => sum + (detalle.precioTotal || 0), 0);
                        
                    const totalProductos = detallesVenta
                        .filter(detalle => detalle.producto)
                        .reduce((sum, detalle) => sum + (detalle.precioTotal || 0), 0);
                    
                    return {
                        ...venta,
                        totalServicios,
                        totalProductos
                    };
                });
                
                this.historialCaja = caja;
                this.historialVisible = true;
            } catch (error) {
                console.error('Error al cargar historial:', error);
                NotificationSystem.error('Error al cargar el historial');
            }
        },
        cerrarHistorial() {
            this.historialVisible = false;
            this.historialCaja = null;
            this.historialVentas = [];
        },
        exportarHistorialPDF() {
            if (!this.historialCaja) return;
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
                doc.text('DETALLE DE CAJA', 105, 40, { align: 'center' });
                
                // Información de la caja
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(this.historialCaja.nombre.toUpperCase(), 20, 55);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha: ${this.formatearFecha(this.historialCaja.fecha)}`, 20, 65);
                doc.text(`Empleado: ${this.getEmpleadoName(this.historialCaja)}`, 20, 72);
                doc.text(`Apertura: ${this.formatearHora(this.historialCaja.horaApertura)}`, 20, 79);
                doc.text(`Cierre: ${this.formatearHora(this.historialCaja.horaCierre)}`, 20, 86);
                
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 120, 55);
                doc.text(`Monto inicial: ${this.formatearNumero(this.historialCaja.montoInicial || 0)}`, 120, 62);
                doc.text(`Monto final: ${this.formatearNumero(this.historialCaja.montoFinal || 0)}`, 120, 69);
                doc.text(`Total servicios: ${this.formatearNumero(this.historialCaja.totalServicios || 0)}`, 120, 76);
                doc.text(`Total productos: ${this.formatearNumero(this.historialCaja.totalProductos || 0)}`, 120, 83);
                doc.text(`Total descuentos: ${this.formatearNumero(this.historialCaja.totalDescuentos || 0)}`, 120, 90);
                doc.text(`Estado: ${this.historialCaja.estado.toUpperCase()}`, 120, 97);
                
                // Tabla de ventas
                if (this.historialVentas.length > 0) {
                    const headers = [['ID', 'CLIENTE', 'MONTO', 'MÉTODO\nPAGO', 'SERVICIOS', 'PRODUCTOS', 'DESCUENTOS']];
                    const data = this.historialVentas.map((venta) => [
                        venta.id.toString(),
                        venta.cliente ? venta.cliente.nombreCompleto : 'N/A',
                        this.formatearNumero(venta.montoTotal),
                        venta.metodoPago || 'N/A',
                        this.formatearNumero(venta.totalServicios || 0),
                        this.formatearNumero(venta.totalProductos || 0),
                        this.formatearNumero(venta.descuentoAplicado || 0)
                    ]);
                    
                    const totalVentas = this.historialVentas.reduce((sum, venta) => sum + (venta.montoTotal || 0), 0);
                    const totalServicios = this.historialVentas.reduce((sum, venta) => sum + (venta.totalServicios || 0), 0);
                    const totalProductos = this.historialVentas.reduce((sum, venta) => sum + (venta.totalProductos || 0), 0);
                    const totalDescuentos = this.historialVentas.reduce((sum, venta) => sum + (venta.descuentoAplicado || 0), 0);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 105,
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
                            0: { cellWidth: 'auto', halign: 'center' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 'auto', halign: 'right' },
                            3: { cellWidth: 'auto', halign: 'center' },
                            4: { cellWidth: 'auto', halign: 'right' },
                            5: { cellWidth: 'auto', halign: 'right' },
                            6: { cellWidth: 'auto', halign: 'right' }
                        },
                        margin: { left: 10, right: 10, bottom: 40 },
                        foot: [['', 'TOTALES:', this.formatearNumero(totalVentas), '', this.formatearNumero(totalServicios), this.formatearNumero(totalProductos), this.formatearNumero(totalDescuentos)]],
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
                } else {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.text('No hay ventas registradas para esta caja', 105, 115, { align: 'center' });
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
                doc.save(`historial-caja-${this.historialCaja.nombre}-${fecha}.pdf`);
                NotificationSystem.success('Historial exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        async cargarCaja(caja) {
            this.nuevaCaja = {
                id: caja.id,
                nombre: caja.nombre || '',
                fecha: caja.fecha || new Date().toISOString().split('T')[0],
                horaApertura: caja.horaApertura || new Date().toTimeString().substring(0, 8),
                horaCierre: caja.horaCierre || null,
                montoInicial: caja.montoInicial || null,
                montoFinal: caja.montoFinal || null,
                totalServicios: caja.totalServicios || 0,
                totalProductos: caja.totalProductos || 0,
                totalDescuentos: caja.totalDescuentos || 0,
                estado: caja.estado || 'abierto',
                empleadoId: caja.empleado ? caja.empleado.id : null
            };
            await this.calcularTotales();
            this.formularioVisible = true;
            this.cajaSeleccionada = caja.nombre || `Caja ${caja.id}`;
            this.$nextTick(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },
        getEmpleadoName(caja) {
            return caja.empleado ? caja.empleado.nombreCompleto : '-';
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
        onEstadoChange() {
            if (this.nuevaCaja.estado === 'cerrado' && !this.nuevaCaja.horaCierre) {
                this.nuevaCaja.horaCierre = new Date().toTimeString().substring(0, 8);
            }
        },
        async calcularTotales() {
            if (!this.nuevaCaja.id) return;
            try {
                const [detalleVentaRes, ventasRes] = await Promise.all([
                    fetch(`${config.apiBaseUrl}/detalle-ventas`),
                    fetch(`${config.apiBaseUrl}/ventas`)
                ]);
                const detalleVentas = await detalleVentaRes.json();
                const ventas = await ventasRes.json();
                
                const fechaCaja = this.nuevaCaja.fecha;
                const ventasDelDia = ventas.filter(venta => 
                    venta.fechaVenta && venta.fechaVenta.startsWith(fechaCaja)
                );
                const ventasIds = ventasDelDia.map(venta => venta.id);
                
                const detallesDelDia = detalleVentas.filter(detalle => 
                    ventasIds.includes(detalle.venta?.id)
                );
                
                this.nuevaCaja.totalServicios = detallesDelDia
                    .filter(detalle => detalle.servicio)
                    .reduce((sum, detalle) => sum + (detalle.precioTotal || 0), 0);
                    
                this.nuevaCaja.totalProductos = detallesDelDia
                    .filter(detalle => detalle.producto)
                    .reduce((sum, detalle) => sum + (detalle.precioTotal || 0), 0);
                    
                const totalDescuentosDetalles = detallesDelDia.reduce((sum, detalle) => sum + (detalle.descuento || 0), 0);
                const totalDescuentosGenerales = ventasDelDia.reduce((sum, venta) => sum + (venta.descuentoAplicado || 0), 0);
                this.nuevaCaja.totalDescuentos = totalDescuentosDetalles + totalDescuentosGenerales;
                
                this.nuevaCaja.montoFinal = this.nuevaCaja.montoInicial + this.nuevaCaja.totalServicios + this.nuevaCaja.totalProductos - this.nuevaCaja.totalDescuentos;
            } catch (error) {
                console.error('Error al calcular totales:', error);
            }
        },
        formatearHora(hora) {
            if (!hora) return '-';
            if (Array.isArray(hora)) {
                const [h, m, s] = hora;
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`;
            }
            const horaStr = hora.toString().trim();
            if (horaStr.includes(':')) {
                const parts = horaStr.split(':');
                const hh = parts[0].padStart(2, '0');
                const mm = (parts[1] || '00').padStart(2, '0');
                const ss = (parts[2] || '00').padStart(2, '0');
                return `${hh}:${mm}:${ss}`;
            }
            return horaStr;
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchCajas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirCajas() {
            window.location.href = '/web/cajas';
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
                doc.text('REPORTE DE CAJAS', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de cajas: ${this.cajasFiltradas.length}`, 20, 62);
                
                // Tabla de cajas
                if (this.cajasFiltradas.length > 0) {
                    const headers = [['NOMBRE', 'FECHA', 'EMPLEADO', 'APERTURA', 'CIERRE', 'M.\nINICIAL', 'M.\nFINAL', 'T.\nSERVICIOS', 'T.\nPRODUCTOS', 'T.\nDESCUENTOS', 'ESTADO']];
                    const data = this.cajasFiltradas.map((caja) => [
                        caja.nombre || 'Sin nombre',
                        this.formatearFecha(caja.fecha),
                        this.getEmpleadoName(caja),
                        this.formatearHora(caja.horaApertura),
                        this.formatearHora(caja.horaCierre),
                        this.formatearNumero(caja.montoInicial || 0),
                        this.formatearNumero(caja.montoFinal || 0),
                        this.formatearNumero(caja.totalServicios || 0),
                        this.formatearNumero(caja.totalProductos || 0),
                        this.formatearNumero(caja.totalDescuentos || 0),
                        caja.estado.toUpperCase()
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 75,
                        tableWidth: 'wrap',
                        styles: { 
                            fontSize: 6,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 2,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            overflow: 'linebreak'
                        },
                        headStyles: { 
                            fontSize: 7,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 3
                        },
                        bodyStyles: {
                            fontSize: 6,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto', halign: 'center' },
                            2: { cellWidth: 'auto' },
                            3: { cellWidth: 'auto', halign: 'center' },
                            4: { cellWidth: 'auto', halign: 'center' },
                            5: { cellWidth: 'auto', halign: 'right' },
                            6: { cellWidth: 'auto', halign: 'right' },
                            7: { cellWidth: 'auto', halign: 'right' },
                            8: { cellWidth: 'auto', halign: 'right' },
                            9: { cellWidth: 'auto', halign: 'right' },
                            10: { cellWidth: 'auto', halign: 'center' }
                        },
                        margin: { left: 10, right: 10, bottom: 40 }
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
                doc.save(`reporte-cajas-${fecha}.pdf`);
                NotificationSystem.success('Reporte de cajas exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Cajas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap; width: fit-content; padding: 15px; margin: 15px 0;">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Caja:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarCajas" placeholder="Buscar por nombre, empleado, monto, estado..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Fecha Inicio:</label>
                            <input type="date" v-model="fechaInicio" @change="filtrarCajas" style="padding: 8px; border: 2px solid #ddd; border-radius: 5px;"/>
                        </div>
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Fecha Fin:</label>
                            <input type="date" v-model="fechaFin" @change="filtrarCajas" style="padding: 8px; border: 2px solid #ddd; border-radius: 5px;"/>
                        </div>
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Hora Apertura:</label>
                            <input type="time" v-model="horaAperturaFiltro" @change="filtrarCajas" style="padding: 8px; border: 2px solid #ddd; border-radius: 5px;"/>
                        </div>
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Hora Cierre:</label>
                            <input type="time" v-model="horaCierreFiltro" @change="filtrarCajas" style="padding: 8px; border: 2px solid #ddd; border-radius: 5px;"/>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: end;">
                            <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                            <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nueva Caja</button>
                            <button @click="exportarPDF()" class="btn btn-small">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevaCaja.id ? 'Modificar Caja - ' + cajaSeleccionada : 'Nueva Caja' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevaCaja.nombre" placeholder="Nombre de la caja" required/>
                            </div>
                            <div class="form-col">
                                <label>Fecha: *</label>
                                <input type="date" v-model="nuevaCaja.fecha" :readonly="nuevaCaja.id" required/>
                            </div>
                            <div class="form-col">
                                <label>Hora Apertura:</label>
                                <input type="time" v-model="nuevaCaja.horaApertura" step="1"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Hora Cierre:</label>
                                <input type="time" v-model="nuevaCaja.horaCierre" step="1"/>
                            </div>
                            <div class="form-col">
                                <label>Monto Inicial: *</label>
                                <input type="number" v-model="nuevaCaja.montoInicial" placeholder="0" :readonly="nuevaCaja.id" required/>
                            </div>
                            <div class="form-col">
                                <label>Monto Final:</label>
                                <input type="number" v-model="nuevaCaja.montoFinal" placeholder="0" readonly/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Empleado:</label>
                                <select v-model="nuevaCaja.empleadoId" :disabled="nuevaCaja.id">
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">{{ empleado.nombreCompleto }}</option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Estado:</label>
                                <select v-model="nuevaCaja.estado" @change="onEstadoChange" required>
                                    <option value="abierto">Abierto</option>
                                    <option value="cerrado">Cerrado</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Total Servicios:</label>
                                <input type="number" v-model="nuevaCaja.totalServicios" placeholder="0" readonly/>
                            </div>
                            <div class="form-col">
                                <label>Total Productos:</label>
                                <input type="number" v-model="nuevaCaja.totalProductos" placeholder="0" readonly/>
                            </div>
                            <div class="form-col">
                                <label>Total Descuentos:</label>
                                <input type="number" v-model="nuevaCaja.totalDescuentos" placeholder="0" readonly/>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="nuevaCaja.id ? modificarCaja() : agregarCaja()" class="btn">
                                {{ nuevaCaja.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Fecha</th>
                                <th>Empleado</th>
                                <th>Apertura</th>
                                <th>Cierre</th>
                                <th>M.<br>Inicial</th>
                                <th>M.<br>Final</th>
                                <th>T.<br>Servicios</th>
                                <th>T.<br>Productos</th>
                                <th>T.<br>Descuentos</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="caja in cajasPaginadas" :key="caja.id">
                                <td><strong>{{ caja.nombre || 'Sin nombre' }}</strong></td>
                                <td>{{ formatearFecha(caja.fecha) }}</td>
                                <td>{{ getEmpleadoName(caja) }}</td>
                                <td>{{ formatearHora(caja.horaApertura) }}</td>
                                <td>{{ formatearHora(caja.horaCierre) }}</td>
                                <td>{{ formatearNumero(caja.montoInicial) }}</td>
                                <td>{{ formatearNumero(caja.montoFinal || 0) }}</td>
                                <td>{{ formatearNumero(caja.totalServicios || 0) }}</td>
                                <td>{{ formatearNumero(caja.totalProductos || 0) }}</td>
                                <td>{{ formatearNumero(caja.totalDescuentos || 0) }}</td>
                                <td><span :class="{'badge-abierto': caja.estado === 'abierto', 'badge-cerrado': caja.estado === 'cerrado'}">{{ caja.estado.toUpperCase() }}</span></td>
                                <td>
                                    <button v-if="caja.estado === 'abierto'" @click="cerrarCaja(caja)" class="btn-small">Cerrar Caja</button>
                                    <button @click="verHistorial(caja)" class="btn-small btn-secondary">Ver Historial</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total Servicios: {{ formatearNumero(totalServicios) }} | Total Productos: {{ formatearNumero(totalProductos) }} | Total Descuentos: {{ formatearNumero(totalDescuentos) }}</strong>
                    </div>
                    
                    <div v-if="historialVisible" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                        <div class="modal-content" style="background: white; padding: 20px; border-radius: 10px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3>Historial de {{ historialCaja ? historialCaja.nombre : '' }}</h3>
                                <div>
                                    <button @click="exportarHistorialPDF()" class="btn btn-small"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                                    <button @click="cerrarHistorial()" class="btn btn-secondary btn-small">Cerrar</button>
                                </div>
                            </div>
                            
                            <div v-if="historialCaja" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                                <h4>Información de la Caja</h4>
                                <p><strong>Fecha:</strong> {{ formatearFecha(historialCaja.fecha) }}</p>
                                <p><strong>Empleado:</strong> {{ getEmpleadoName(historialCaja) }}</p>
                                <p><strong>Apertura:</strong> {{ formatearHora(historialCaja.horaApertura) }}</p>
                                <p><strong>Cierre:</strong> {{ formatearHora(historialCaja.horaCierre) }}</p>
                                <p><strong>Monto Inicial:</strong> {{ formatearNumero(historialCaja.montoInicial || 0) }}</p>
                                <p><strong>Monto Final:</strong> {{ formatearNumero(historialCaja.montoFinal || 0) }}</p>
                            </div>
                            
                            <h4>Ventas del Día ({{ historialVentas.length }})</h4>
                            <div v-if="historialVentas.length > 0">
                                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                    <thead>
                                        <tr style="background: #f8f9fa;">
                                            <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Cliente</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Monto</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Método</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Servicios</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Productos</th>
                                            <th style="border: 1px solid #ddd; padding: 8px;">Descuentos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="venta in historialVentas" :key="venta.id">
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.id }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.cliente ? venta.cliente.nombreCompleto : 'N/A' }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ formatearNumero(venta.montoTotal) }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.metodoPago || 'N/A' }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ formatearNumero(venta.totalServicios || 0) }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ formatearNumero(venta.totalProductos || 0) }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ formatearNumero(venta.descuentoAplicado || 0) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else style="text-align: center; padding: 20px; color: #666;">
                                <p>No hay ventas registradas para esta fecha</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

// CSS styling to match clientes page
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
    .badge-abierto {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }
    .badge-cerrado {
        background: #dc3545;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    table th {
        background: linear-gradient(135deg, #ad1457, #c2185b);
        color: white;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        font-size: 14px;
        padding: 15px 12px;
        text-align: left;
        border-bottom: 1px solid rgba(248, 187, 208, 0.3);
    }
    table td {
        padding: 10px 8px;
        border-bottom: 1px solid #e0e0e0;
        font-size: 13px;
    }
    table tbody tr:hover {
        background-color: #f5f5f5;
    }
    table tbody tr:nth-child(even) {
        background-color: #fafafa;
    }
`;
document.head.appendChild(style);
