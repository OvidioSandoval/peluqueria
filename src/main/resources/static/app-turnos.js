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
            turnos: [],
            turnosFiltrados: [],
            clientes: [],
            servicios: [],
            empleados: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            filtroHora: new Date().toTimeString().substring(0, 5),

            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchTurnos();
        this.fetchClientes();
        this.fetchServicios();
        this.fetchEmpleados();
        this.startAutoRefresh();
        this.filtrarTurnos();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.turnosFiltrados.length / this.itemsPorPagina);
        },
        turnosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.turnosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/turnos';
            }
        },
        async fetchTurnos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/turnos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.turnos = await response.json();
                this.filtrarTurnos();
            } catch (error) {
                console.error('Error al cargar turnos:', error);
                NotificationSystem.error(`Error al cargar los turnos: ${error.message}`);
            }
        },
        async fetchClientes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
            }
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
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
        filtrarTurnos() {
            let turnosFiltrados = [...this.turnos];
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                turnosFiltrados = turnosFiltrados.filter(turno =>
                    (turno.cliente && turno.cliente.nombreCompleto && turno.cliente.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (turno.servicio && turno.servicio.nombre && turno.servicio.nombre.toLowerCase().includes(busqueda)) ||
                    (turno.empleado && turno.empleado.nombreCompleto && turno.empleado.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (turno.estado && turno.estado.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroFecha) {
                turnosFiltrados = turnosFiltrados.filter(turno => {
                    const fechaTurno = this.formatearFechaParaInput(turno.fecha);
                    return fechaTurno === this.filtroFecha;
                });
            }
            
            if (this.filtroHora) {
                turnosFiltrados = turnosFiltrados.filter(turno => {
                    const horaTurno = this.formatearHoraParaInput(turno.hora);
                    return horaTurno === this.filtroHora;
                });
            }
            
            this.turnosFiltrados = turnosFiltrados;
        },

        async eliminarTurno(turno) {
            NotificationSystem.confirm(`¿Eliminar turno del ${turno.fecha} ${turno.hora}?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/turnos/eliminar_turno/${turno.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchTurnos();
                        NotificationSystem.success('Turno eliminado exitosamente');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar turno:', error);
                    NotificationSystem.error(`Error al eliminar turno: ${error.message}`);
                }
            });
        },

        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        getClienteName(turno) {
            return turno.cliente ? turno.cliente.nombreCompleto || turno.cliente.nombre : 'Cliente no encontrado';
        },
        getServicioName(turno) {
            return turno.servicio ? turno.servicio.nombre : 'Servicio no encontrado';
        },
        getEmpleadoName(turno) {
            return turno.empleado ? turno.empleado.nombreCompleto : 'Empleado no encontrado';
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleString('es-ES') : '';
        },
        formatearFechaHora(fecha, hora) {
            if (!fecha || !hora) return '';
            let day, month, year, hour, minute;
            
            if (Array.isArray(fecha)) {
                [year, month, day] = fecha;
            } else {
                [year, month, day] = fecha.split('-');
            }
            
            if (Array.isArray(hora)) {
                [hour, minute] = hora;
            } else {
                [hour, minute] = hora.split(':');
            }
            
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        },
        formatearFechaParaInput(fecha) {
            if (!fecha) return new Date().toISOString().split('T')[0];
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        formatearHoraParaInput(hora) {
            if (!hora) return new Date().toTimeString().substring(0, 5);
            if (Array.isArray(hora)) {
                const [hour, minute] = hora;
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            }
            return typeof hora === 'string' ? hora : hora.toString();
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchTurnos();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirTurnos() {
            window.location.href = '/web/turnos';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },

        
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtroHora = '';
            this.filtrarTurnos();
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
                doc.text('REGISTRO DE TURNOS', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de turnos: ${this.turnosFiltrados.length}`, 20, 62);
                
                const headers = [['CLIENTE', 'SERVICIO', 'EMPLEADO', 'FECHA', 'HORA', 'ESTADO', 'MOTIVO\nCANCELACIÓN', 'RECORDATORIO']];
                const data = this.turnosFiltrados.map(turno => [
                    this.getClienteName(turno),
                    this.getServicioName(turno),
                    this.getEmpleadoName(turno),
                    this.formatearFechaParaInput(turno.fecha),
                    this.formatearHoraParaInput(turno.hora),
                    turno.estado,
                    turno.motivoCancelacion || '-',
                    turno.recordatorioEnviado ? 'Enviado' : 'No enviado'
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 68,
                    tableWidth: 'auto',
                    styles: { 
                        fontSize: 7,
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
                        fontSize: 7,
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
                        2: { cellWidth: 'auto' },
                        3: { cellWidth: 'auto', halign: 'center' },
                        4: { cellWidth: 'auto', halign: 'center' },
                        5: { cellWidth: 'auto', halign: 'center' },
                        6: { cellWidth: 'auto' },
                        7: { cellWidth: 'auto', halign: 'center' }
                    },
                    margin: { left: 20, right: 20, bottom: 40 }
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
                doc.save(`turnos-${fecha}.pdf`);
                NotificationSystem.success('Registro de turnos exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Turnos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; gap: 10px; min-width: fit-content;">
                        <div class="filter-group" style="min-width: 240px;">
                            <label>Buscar:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarTurnos" placeholder="Cliente, servicio, empleado, estado..." class="search-bar" style="width: 100%;"/>
                        </div>
                        <div class="filter-group" style="min-width: 140px;">
                            <label>Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarTurnos" class="search-bar" style="width: 100%;"/>
                        </div>
                        <div class="filter-group" style="min-width: 120px;">
                            <label>Hora:</label>
                            <input type="time" v-model="filtroHora" @change="filtrarTurnos" class="search-bar" style="width: 100%;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; white-space: nowrap;">Limpiar</button>
                        <button @click="exportarPDF" class="btn btn-small" style="white-space: nowrap;">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    

                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Servicio</th>
                                <th>Empleado</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                                <th>Motivo Cancelación</th>
                                <th>Recordatorio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="turno in turnosPaginados" :key="turno.id">
                                <td>{{ getClienteName(turno) }}</td>
                                <td>{{ getServicioName(turno) }}</td>
                                <td>{{ getEmpleadoName(turno) }}</td>
                                <td>{{ formatearFechaHora(turno.fecha, turno.hora) }}</td>
                                <td>{{ turno.estado }}</td>
                                <td>{{ turno.motivoCancelacion || '-' }}</td>
                                <td>{{ turno.recordatorioEnviado ? 'Enviado' : 'No enviado' }}</td>
                                <td>
                                    <button @click="eliminarTurno(turno)" class="btn-small btn-danger">Eliminar</button>
                                </td>
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






