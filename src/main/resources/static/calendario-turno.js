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
                const turnosDelDia = this.turnos.filter(turno => {
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
            return this.turnos;
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
    template: '<div class="glass-container"><div><h1 style="text-align: center; margin-top: 90px; margin-bottom: 20px; color: #5d4037; font-weight: 800;">Calendario de Turnos</h1><button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button><main style="padding: 20px;"><div class="calendar-controls" style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;"><div class="month-navigation" style="display: flex; align-items: center; gap: 15px;"><button @click="mesAnterior()" class="btn"><i class="fas fa-chevron-left"></i></button><h3 style="margin: 0; color: #5d4037;">{{ meses[mesActual] }} {{ añoActual }}</h3><button @click="mesSiguiente()" class="btn"><i class="fas fa-chevron-right"></i></button></div></div><div v-if="cargando" class="loading" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Cargando calendario...</div><div v-else class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; background: #ddd; border-radius: 10px; overflow: hidden;"><div v-for="dia in diasSemana" :key="dia" class="calendar-header" style="background: #5d4037; color: white; padding: 10px; text-align: center; font-weight: bold;">{{ dia }}</div><div v-for="(dia, index) in diasDelMes" :key="index" class="calendar-day" :class="{ today: dia && dia.esHoy, empty: !dia }" style="background: white; min-height: 120px; padding: 5px; position: relative;"><div v-if="dia" class="day-content"><div class="day-number" :style="{ color: dia.esHoy ? \'#fff\' : \'#333\', background: dia.esHoy ? \'#5d4037\' : \'transparent\', borderRadius: dia.esHoy ? \'50%\' : \'0\', width: dia.esHoy ? \'25px\' : \'auto\', height: dia.esHoy ? \'25px\' : \'auto\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', fontSize: \'14px\', fontWeight: \'bold\', marginBottom: \'5px\' }">{{ dia.numero }}</div><div class="turnos-container" style="max-height: 90px; overflow-y: auto;"><div v-for="turno in dia.turnos" :key="turno.id" class="turno-item" @click="verDetalleTurno(turno)" style="background: #f8f9fa; border-left: 3px solid; margin-bottom: 2px; padding: 3px 5px; cursor: pointer; font-size: 11px; border-radius: 3px;" :style="{ borderLeftColor: getColorEstado(turno.estado) }"><div style="font-weight: bold; color: #333;">{{ formatearHora(turno.hora) }}</div><div style="color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ turno.cliente ? turno.cliente.nombreCompleto : "Sin cliente" }}</div><div style="color: #888; font-size: 10px;">{{ turno.servicio ? turno.servicio.nombre : "Sin servicio" }}</div></div></div></div></div></div><div v-if="mostrarDetalle && turnoSeleccionado" class="turno-detail-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"><div class="modal-content" style="background: white; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;"><h3 style="margin: 0; color: #5d4037;"><i class="fas fa-calendar-check"></i> Detalle del Turno</h3><button @click="cerrarDetalle()" class="btn" style="background: #6c757d; padding: 5px 10px;"><i class="fas fa-times"></i></button></div><div class="turno-details" style="display: grid; gap: 15px;"><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-user" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Cliente:</strong> {{ turnoSeleccionado.cliente ? turnoSeleccionado.cliente.nombreCompleto : "Sin cliente" }}</div></div><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-cut" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Servicio:</strong> {{ turnoSeleccionado.servicio ? turnoSeleccionado.servicio.nombre : "Sin servicio" }}</div></div><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-user-tie" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Colaborador:</strong> {{ turnoSeleccionado.empleado ? turnoSeleccionado.empleado.nombreCompleto : "Sin empleado" }}</div></div><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-calendar" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Fecha:</strong> {{ formatearFecha(turnoSeleccionado.fecha) }}</div></div><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-clock" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Hora:</strong> {{ formatearHora(turnoSeleccionado.hora) }}</div></div><div class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i :class="getIconoEstado(turnoSeleccionado.estado)" :style="{ color: getColorEstado(turnoSeleccionado.estado), width: \'20px\', marginRight: \'10px\' }"></i><div><strong>Estado:</strong> <span :style="{ color: getColorEstado(turnoSeleccionado.estado), fontWeight: \'bold\', textTransform: \'capitalize\' }">{{ turnoSeleccionado.estado }}</span></div></div><div v-if="turnoSeleccionado.motivoCancelacion" class="detail-row" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;"><i class="fas fa-comment" style="color: #5d4037; width: 20px; margin-right: 10px;"></i><div><strong>Motivo Cancelación:</strong> {{ turnoSeleccionado.motivoCancelacion }}</div></div></div></div></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn.active { background: #5d4037 !important; color: white !important; } .calendar-day.empty { background: #f5f5f5 !important; } .calendar-day.today { background: #fff3cd !important; } .turno-item:hover { background: #e9ecef !important; transform: scale(1.02); transition: all 0.2s; } .calendar-grid { box-shadow: 0 4px 15px rgba(0,0,0,0.1); } .calendar-header { font-size: 14px; } .employee-filter .btn { margin: 2px; } @media (max-width: 768px) { .calendar-controls { flex-direction: column; align-items: stretch; } .employee-filter { justify-content: center; } .month-navigation { justify-content: center; } .calendar-grid { font-size: 12px; } .calendar-day { min-height: 100px; } }';
document.head.appendChild(style);
