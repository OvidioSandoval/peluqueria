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
            empleados: [],
            clientes: [],
            servicios: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            filtroHora: new Date().toTimeString().substring(0, 5),

            fechaActual: new Date(),
            diasSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            turnoSeleccionado: null,
            mostrarDetalle: false,
            cargando: false
        };
    },
    mounted() {
        this.fetchEmpleados();
        this.fetchTurnos();
        this.fetchClientes();
        this.fetchServicios();
    },
    computed: {
        mesActual() {
            return this.fechaActual.getMonth();
        },
        añoActual() {
            return this.fechaActual.getFullYear();
        },
        diasDelMes() {
            const primerDia = new Date(this.añoActual, this.mesActual, 1);
            const ultimoDia = new Date(this.añoActual, this.mesActual + 1, 0);
            const diasEnMes = ultimoDia.getDate();
            const primerDiaSemana = primerDia.getDay();
            
            const dias = [];
            
            // Días vacíos al inicio
            for (let i = 0; i < primerDiaSemana; i++) {
                dias.push(null);
            }
            
            // Días del mes
            for (let dia = 1; dia <= diasEnMes; dia++) {
                const fecha = new Date(this.añoActual, this.mesActual, dia);
                const turnosDelDia = this.turnosFiltrados.filter(turno => {
                    const fechaTurno = new Date(turno.fecha);
                    return fechaTurno.toDateString() === fecha.toDateString();
                });
                
                dias.push({
                    numero: dia,
                    fecha: fecha,
                    turnos: turnosDelDia,
                    esHoy: fecha.toDateString() === new Date().toDateString()
                });
            }
            
            return dias;
        },
        turnosFiltrados() {
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
            
            return turnosFiltrados;
        }
    },
    methods: {
        async fetchTurnos() {
            try {
                this.cargando = true;
                const response = await fetch(config.apiBaseUrl + '/turnos');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.turnos = await response.json();
            } catch (error) {
                console.error('Error al cargar turnos:', error);
                NotificationSystem.error('Error al cargar los turnos: ' + error.message);
            } finally {
                this.cargando = false;
            }
        },
        
        async fetchEmpleados() {
            try {
                const response = await fetch(config.apiBaseUrl + '/empleados');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error('Error al cargar los empleados: ' + error.message);
            }
        },
        
        async fetchClientes() {
            try {
                const response = await fetch(config.apiBaseUrl + '/clientes');
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
            }
        },
        
        async fetchServicios() {
            try {
                const response = await fetch(config.apiBaseUrl + '/servicios');
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        
        filtrarTurnos() {
            // Los filtros se aplican automáticamente a través del computed turnosFiltrados
        },
        
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtroHora = '';
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
                doc.text('Calendario de Turnos', 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total: ${this.turnosFiltrados.length} turnos`, 150, 25);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                const headers = [['Cliente', 'Servicio', 'Empleado', 'Fecha', 'Hora', 'Estado']];
                const data = this.turnosFiltrados.map(turno => [
                    turno.cliente ? turno.cliente.nombreCompleto : 'Sin cliente',
                    turno.servicio ? turno.servicio.nombre : 'Sin servicio',
                    turno.empleado ? turno.empleado.nombreCompleto : 'Sin empleado',
                    this.formatearFecha(turno.fecha),
                    this.formatearHora(turno.hora),
                    turno.estado
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 50,
                    styles: { 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255]
                    },
                    headStyles: { 
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    }
                });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`calendario-turnos-${fecha}.pdf`);
                NotificationSystem.success('Calendario exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        formatearFechaParaInput(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        
        formatearHoraParaInput(hora) {
            if (!hora) return '';
            if (Array.isArray(hora)) {
                const [hour, minute] = hora;
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            }
            return typeof hora === 'string' ? hora : hora.toString();
        },
        
        mesAnterior() {
            this.fechaActual = new Date(this.añoActual, this.mesActual - 1, 1);
        },
        
        mesSiguiente() {
            this.fechaActual = new Date(this.añoActual, this.mesActual + 1, 1);
        },
        

        
        verDetalleTurno(turno) {
            this.turnoSeleccionado = turno;
            this.mostrarDetalle = true;
        },
        
        cerrarDetalle() {
            this.mostrarDetalle = false;
            this.turnoSeleccionado = null;
        },
        
        formatearHora(hora) {
            if (!hora) return '';
            if (typeof hora === 'string') {
                return hora.substring(0, 5);
            }
            if (Array.isArray(hora) && hora.length >= 2) {
                return String(hora[0]).padStart(2, '0') + ':' + String(hora[1]).padStart(2, '0');
            }
            return String(hora);
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        },
        
        getColorEstado(estado) {
            switch (estado) {
                case 'confirmado': return '#28a745';
                case 'pendiente': return '#ffc107';
                case 'cancelado': return '#dc3545';
                case 'completado': return '#17a2b8';
                default: return '#6c757d';
            }
        },
        
        getIconoEstado(estado) {
            switch (estado) {
                case 'confirmado': return 'fas fa-check-circle';
                case 'pendiente': return 'fas fa-clock';
                case 'cancelado': return 'fas fa-times-circle';
                case 'completado': return 'fas fa-check-double';
                default: return 'fas fa-question-circle';
            }
        }
    },
    template: `
        <div class="glass-container">
            <div>
                <h1 class="page-title">Calendario de Turnos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    
                    <div class="filters-container" style="display: flex; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; gap: 25px; width: fit-content;">
                        <div class="filter-group" style="margin-right: 10px;">
                            <label>Buscar:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarTurnos" placeholder="Cliente, servicio, empleado, estado..." class="search-bar" style="width: 240px;"/>
                        </div>
                        <div class="filter-group">
                            <label>Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarTurnos" class="search-bar" style="width: 140px;"/>
                        </div>
                        <div class="filter-group">
                            <label>Hora:</label>
                            <input type="time" v-model="filtroHora" @change="filtrarTurnos" class="search-bar" style="width: 120px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Limpiar</button>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <div class="calendar-controls" style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
                        <div class="month-navigation" style="display: flex; align-items: center; gap: 15px;">
                            <button @click="mesAnterior()" class="btn"><i class="fas fa-chevron-left"></i></button>
                            <h3 style="margin: 0; color: #66bb6a;">{{ meses[mesActual] }} {{ añoActual }}</h3>
                            <button @click="mesSiguiente()" class="btn"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    
                    <div v-if="cargando" class="loading" style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin"></i> Cargando calendario...
                    </div>
                    
                    <div v-else class="calendar-grid">
                        <div v-for="dia in diasSemana" :key="dia" class="calendar-header">{{ dia }}</div>
                        <div v-for="(dia, index) in diasDelMes" :key="index" class="calendar-day" :class="{ today: dia && dia.esHoy, empty: !dia }">
                            <div v-if="dia" class="day-content">
                                <div class="day-number">{{ dia.numero }}</div>
                                <div class="turnos-container" style="max-height: 90px; overflow-y: auto;">
                                    <div v-for="turno in dia.turnos" :key="turno.id" class="turno-item" @click="verDetalleTurno(turno)" :style="{ borderLeftColor: getColorEstado(turno.estado) }">
                                        <div style="font-weight: bold; color: #333;">{{ formatearHora(turno.hora) }}</div>
                                        <div style="color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ turno.cliente ? turno.cliente.nombreCompleto : "Sin cliente" }}</div>
                                        <div style="color: #888; font-size: 10px;">{{ turno.servicio ? turno.servicio.nombre : "Sin servicio" }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="mostrarDetalle && turnoSeleccionado" class="turno-detail-modal">
                        <div class="modal-content">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; color: #66bb6a;"><i class="fas fa-calendar-check"></i> Detalle del Turno</h3>
                                <button @click="cerrarDetalle()" class="btn"><i class="fas fa-times"></i></button>
                            </div>
                            <div class="turno-details" style="display: grid; gap: 15px;">
                                <div class="detail-row">
                                    <i class="fas fa-user" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Cliente:</strong> {{ turnoSeleccionado.cliente ? turnoSeleccionado.cliente.nombreCompleto : "Sin cliente" }}</div>
                                </div>
                                <div class="detail-row">
                                    <i class="fas fa-cut" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Servicio:</strong> {{ turnoSeleccionado.servicio ? turnoSeleccionado.servicio.nombre : "Sin servicio" }}</div>
                                </div>
                                <div class="detail-row">
                                    <i class="fas fa-user-tie" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Colaborador:</strong> {{ turnoSeleccionado.empleado ? turnoSeleccionado.empleado.nombreCompleto : "Sin empleado" }}</div>
                                </div>
                                <div class="detail-row">
                                    <i class="fas fa-calendar" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Fecha:</strong> {{ formatearFecha(turnoSeleccionado.fecha) }}</div>
                                </div>
                                <div class="detail-row">
                                    <i class="fas fa-clock" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Hora:</strong> {{ formatearHora(turnoSeleccionado.hora) }}</div>
                                </div>
                                <div class="detail-row">
                                    <i :class="getIconoEstado(turnoSeleccionado.estado)" :style="{ color: getColorEstado(turnoSeleccionado.estado), width: '20px', marginRight: '10px' }"></i>
                                    <div><strong>Estado:</strong> <span :style="{ color: getColorEstado(turnoSeleccionado.estado), fontWeight: 'bold', textTransform: 'capitalize' }">{{ turnoSeleccionado.estado }}</span></div>
                                </div>
                                <div v-if="turnoSeleccionado.motivoCancelacion" class="detail-row">
                                    <i class="fas fa-comment" style="color: #66bb6a; width: 20px; margin-right: 10px;"></i>
                                    <div><strong>Motivo Cancelación:</strong> {{ turnoSeleccionado.motivoCancelacion }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = `
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 6px 25px rgba(233, 30, 99, 0.1);
    border: 1px solid rgba(179, 229, 252, 0.2);
}
.calendar-header {
    background: linear-gradient(135deg, #ad1457, #c2185b);
    color: white;
    padding: 15px 12px;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
}
.calendar-day {
    background: rgba(255, 255, 255, 0.95);
    min-height: 120px;
    padding: 8px;
    border-bottom: 1px solid rgba(248, 187, 208, 0.3);
    position: relative;
}
.calendar-day.empty {
    background: rgba(245, 245, 245, 0.5);
}
.calendar-day.today {
    background: rgba(252, 228, 236, 0.8);
    border: 2px solid #81d4fa;
}
.day-number {
    font-weight: bold;
    color: #66bb6a;
    margin-bottom: 5px;
}
.turno-item {
    background: rgba(179, 229, 252, 0.1);
    border-left: 3px solid #81d4fa;
    padding: 4px 6px;
    margin: 2px 0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
}
.turno-item:hover {
    background: rgba(179, 229, 252, 0.3);
    transform: scale(1.02);
}
.turno-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-content {
    background: rgba(252, 228, 236, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 25px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2);
    border: 1px solid rgba(179, 229, 252, 0.3);
}
.detail-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    color: #66bb6a;
}
@media (max-width: 768px) {
    .calendar-controls { flex-direction: column; align-items: stretch; }
    .month-navigation { justify-content: center; }
    .calendar-grid { font-size: 12px; }
    .calendar-day { min-height: 100px; }
    .filters-container { flex-wrap: wrap; }
    .filter-group { margin-right: 10px !important; }
}
`;
document.head.appendChild(style);


