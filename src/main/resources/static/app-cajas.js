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
            let filtradas = [...this.cajas];
            if (this.filtroBusqueda) {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtradas = filtradas.filter(caja =>
                    (caja.nombre && caja.nombre.toLowerCase().includes(busqueda)) ||
                    this.getEmpleadoName(caja).toLowerCase().includes(busqueda) ||
                    this.formatearHora(caja.horaApertura).includes(busqueda) ||
                    this.formatearHora(caja.horaCierre).includes(busqueda) ||
                    (caja.montoInicial && caja.montoInicial.toString().includes(busqueda)) ||
                    (caja.montoFinal && caja.montoFinal.toString().includes(busqueda)) ||
                    caja.estado.toLowerCase().includes(busqueda)
                );
            }
            this.cajasFiltradas = filtradas;
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
                const response = await fetch(`${config.apiBaseUrl}/ventas`);
                const todasLasVentas = await response.json();
                
                const fechaCaja = caja.fecha;
                this.historialVentas = todasLasVentas.filter(venta => {
                    if (!venta.fechaVenta) return false;
                    const fechaVenta = typeof venta.fechaVenta === 'string' ? venta.fechaVenta : new Date(venta.fechaVenta).toISOString().split('T')[0];
                    return fechaVenta === fechaCaja;
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
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text(`Historial de Caja: ${this.historialCaja.nombre}`, 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Fecha: ${this.formatearFecha(this.historialCaja.fecha)}`, 150, 15);
                doc.text(`Total ventas: ${this.historialVentas.length}`, 150, 25);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('INFORMACIÓN DE LA CAJA', 20, y);
                y += 15;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text(`Empleado: ${this.getEmpleadoName(this.historialCaja)}`, 25, y);
                y += 6;
                doc.text(`Apertura: ${this.formatearHora(this.historialCaja.horaApertura)}`, 25, y);
                y += 6;
                doc.text(`Cierre: ${this.formatearHora(this.historialCaja.horaCierre)}`, 25, y);
                y += 6;
                doc.text(`Monto Inicial: ${this.formatearNumero(this.historialCaja.montoInicial || 0)}`, 25, y);
                y += 6;
                doc.text(`Monto Final: ${this.formatearNumero(this.historialCaja.montoFinal || 0)}`, 25, y);
                y += 15;
                
                if (this.historialVentas.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('VENTAS DEL DÍA', 20, y);
                    y += 15;
                    
                    this.historialVentas.forEach((venta, index) => {
                        if (y > 250) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10);
                        doc.text(`${index + 1}. Venta ID: ${venta.id}`, 25, y);
                        y += 6;
                        
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.text(`   Cliente: ${venta.cliente ? venta.cliente.nombreCompleto : 'N/A'}`, 30, y);
                        y += 5;
                        doc.text(`   Monto: ${this.formatearNumero(venta.montoTotal)}`, 30, y);
                        y += 5;
                        doc.text(`   Método: ${venta.metodoPago || 'N/A'}`, 30, y);
                        y += 8;
                    });
                }
                
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
                const [detalleVentaRes, ventasRes, movimientosRes] = await Promise.all([
                    fetch(`${config.apiBaseUrl}/detalle-venta`),
                    fetch(`${config.apiBaseUrl}/ventas`),
                    fetch(`${config.apiBaseUrl}/movimientos-caja`)
                ]);
                const detalleVentas = await detalleVentaRes.json();
                const ventas = await ventasRes.json();
                const movimientos = await movimientosRes.json();
                
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
                    .reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario || 0), 0);
                    
                this.nuevaCaja.totalProductos = detallesDelDia
                    .filter(detalle => detalle.producto)
                    .reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario || 0), 0);
                    
                this.nuevaCaja.totalDescuentos = ventasDelDia.reduce((sum, venta) => sum + (venta.descuentoAplicado || 0), 0);
                
                // Calcular monto final
                const montoTotal = this.nuevaCaja.totalServicios + this.nuevaCaja.totalProductos;
                const movimientosDelDia = movimientos.filter(mov => 
                    mov.fecha && mov.fecha.startsWith(fechaCaja) && mov.cajaId === this.nuevaCaja.id
                );
                const totalMovimientos = movimientosDelDia.reduce((sum, mov) => {
                    return mov.tipo === 'ingreso' ? sum + mov.monto : sum - mov.monto;
                }, 0);
                
                this.nuevaCaja.montoFinal = this.nuevaCaja.montoInicial + montoTotal + totalMovimientos;
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
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text('Reporte de Cajas', 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total de cajas: ${this.cajasFiltradas.length}`, 150, 25);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                this.cajasFiltradas.forEach((caja, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text(`${index + 1}. ${caja.nombre || 'Sin nombre'}`, 20, y);
                    y += 8;
                    
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    
                    doc.text(`   Fecha: ${this.formatearFecha(caja.fecha)}`, 25, y);
                    y += 6;
                    doc.text(`   Empleado: ${this.getEmpleadoName(caja)}`, 25, y);
                    y += 6;
                    doc.text(`   Apertura: ${this.formatearHora(caja.horaApertura)}`, 25, y);
                    y += 6;
                    doc.text(`   Cierre: ${this.formatearHora(caja.horaCierre)}`, 25, y);
                    y += 6;
                    doc.text(`   Monto Inicial: ${this.formatearNumero(caja.montoInicial || 0)}`, 25, y);
                    y += 6;
                    doc.text(`   Monto Final: ${this.formatearNumero(caja.montoFinal || 0)}`, 25, y);
                    y += 6;
                    doc.text(`   Estado: ${caja.estado.toUpperCase()}`, 25, y);
                    y += 10;
                });
                
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
                <style>
                    .filters-container { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
                    .filter-field { display: flex; flex-direction: column; min-width: 200px; }
                    .filter-field label { margin-bottom: 5px; font-weight: bold; }
                    .badge-abierto { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .badge-cerrado { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .btn-secondary { background: #6c757d !important; color: white !important; }
                    .btn-secondary:hover { background: #5a6268 !important; }
                </style>
                <h1 class="page-title">Gestión de Cajas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 25px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="min-width: 400px;">
                            <label>Buscar Caja:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarCajas" placeholder="Buscar por nombre, empleado, apertura, cierre, monto o estado..." class="search-bar" style="width: 400px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nueva Caja</button>
                        <button @click="exportarPDF()" class="btn btn-small"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container" style="width: fit-content; max-width: 1000px;">
                        <h3>{{ nuevaCaja.id ? 'Modificar Caja - ' + cajaSeleccionada : 'Nueva Caja' }}</h3>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
                            <div><label>Nombre: *</label><input type="text" v-model="nuevaCaja.nombre" placeholder="Nombre de la caja" required/></div>
                            <div><label>Fecha: *</label><input type="date" v-model="nuevaCaja.fecha" :readonly="nuevaCaja.id" required/></div>
                            <div><label>Hora Apertura:</label><input type="time" v-model="nuevaCaja.horaApertura" step="1"/></div>
                            <div><label>Hora Cierre:</label><input type="time" v-model="nuevaCaja.horaCierre" step="1"/></div>
                            <div><label>Monto Inicial: *</label><input type="number" v-model="nuevaCaja.montoInicial" placeholder="0" :readonly="nuevaCaja.id" required/></div>
                            <div><label>Monto Final:</label><input type="number" v-model="nuevaCaja.montoFinal" placeholder="0" readonly/></div>
                            <div><label>Empleado:</label><select v-model="nuevaCaja.empleadoId" :disabled="nuevaCaja.id"><option value="" disabled>Seleccionar Empleado</option><option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">{{ empleado.nombreCompleto }}</option></select></div>
                            <div><label>Estado:</label><select v-model="nuevaCaja.estado" @change="onEstadoChange" required><option value="abierto">Abierto</option><option value="cerrado">Cerrado</option></select></div>
                            <div><label>Total Servicios:</label><input type="number" v-model="nuevaCaja.totalServicios" placeholder="0" readonly/></div>
                            <div><label>Total Productos:</label><input type="number" v-model="nuevaCaja.totalProductos" placeholder="0" readonly/></div>
                            <div><label>Total Descuentos:</label><input type="number" v-model="nuevaCaja.totalDescuentos" placeholder="0" readonly/></div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
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
                                <th>M. Inicial</th>
                                <th>M. Final</th>
                                <th>T. Servicios</th>
                                <th>T. Productos</th>
                                <th>T. Descuentos</th>
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
                        <strong>Total Servicios: {{ formatearNumero(totalServicios) }} | Total Productos: {{ formatearNumero(totalProductos) }}</strong>
                    </div>
                    
                    <div v-if="historialVisible" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                        <div class="modal-content" style="background: white; padding: 20px; border-radius: 10px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3>Historial de {{ historialCaja.nombre }}</h3>
                                <div>
                                    <button @click="exportarHistorialPDF()" class="btn btn-small"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                                    <button @click="cerrarHistorial()" class="btn btn-secondary btn-small">Cerrar</button>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="venta in historialVentas" :key="venta.id">
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.id }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.cliente ? venta.cliente.nombreCompleto : 'N/A' }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ formatearNumero(venta.montoTotal) }}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">{{ venta.metodoPago || 'N/A' }}</td>
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




