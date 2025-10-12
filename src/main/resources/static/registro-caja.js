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
            caja: {
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                montoInicial: null,
                empleadoId: null,
                estado: 'Abierto'
            },
            empleados: [],
            cajaExistente: null,
            modoEdicion: false,
            cajaOriginalId: null
        };
    },
    mounted() {
        this.fetchEmpleados();
    },
    methods: {
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error('Error al cargar empleados');
            }
        },
        async fetchCajas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/cajas`);
                return await response.json();
            } catch (error) {
                console.error('Error al cargar cajas:', error);
                return [];
            }
        },
        async verificarCajaExistente() {
            if (!this.caja.nombre.trim()) return;
            
            const cajas = await this.fetchCajas();
            const cajaExistente = cajas.find(c => 
                c.nombre.toLowerCase() === this.caja.nombre.toLowerCase().trim() &&
                c.fecha === this.caja.fecha
            );
            
            if (cajaExistente && (!this.modoEdicion || cajaExistente.id !== this.cajaOriginalId)) {
                this.cajaExistente = cajaExistente;
                NotificationSystem.confirm(
                    `Ya existe una caja "${cajaExistente.nombre}" para la fecha ${this.formatearFecha(cajaExistente.fecha)}. ¿Desea modificarla?`,
                    () => this.cargarCajaParaEdicion(cajaExistente),
                    () => {
                        this.cajaExistente = null;
                        this.caja.nombre = '';
                    }
                );
            } else {
                this.cajaExistente = null;
            }
        },
        cargarCajaParaEdicion(cajaExistente) {
            this.modoEdicion = true;
            this.cajaOriginalId = cajaExistente.id;
            this.caja = {
                nombre: cajaExistente.nombre,
                fecha: cajaExistente.fecha,
                horaApertura: cajaExistente.horaApertura,
                montoInicial: cajaExistente.montoInicial,
                empleadoId: cajaExistente.empleado ? cajaExistente.empleado.id : null,
                estado: cajaExistente.estado
            };
            this.cajaExistente = null;
        },
        async registrarCaja() {
            if (!this.validarFormulario()) return;
            
            try {
                const cajaData = {
                    ...this.caja,
                    nombre: this.capitalizarTexto(this.caja.nombre),
                    estado: this.capitalizarTexto(this.caja.estado),
                    empleado: this.caja.empleadoId ? { id: this.caja.empleadoId } : null
                };
                delete cajaData.empleadoId;
                
                const url = this.modoEdicion 
                    ? `${config.apiBaseUrl}/cajas/actualizar_caja/${this.cajaOriginalId}`
                    : `${config.apiBaseUrl}/cajas/agregar_caja`;
                const method = this.modoEdicion ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cajaData)
                });
                
                if (response.ok) {
                    NotificationSystem.success(
                        this.modoEdicion ? 'Caja modificada exitosamente' : 'Caja registrada exitosamente'
                    );
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar caja:', error);
                NotificationSystem.error(`Error al registrar caja: ${error.message}`);
            }
        },
        async modificarCaja() {
            await this.registrarCaja();
        },
        validarFormulario() {
            if (!this.caja.nombre.trim()) {
                NotificationSystem.error('El nombre de la caja es requerido');
                return false;
            }
            if (!this.caja.montoInicial || this.caja.montoInicial <= 0) {
                NotificationSystem.error('El monto inicial debe ser mayor a 0');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.caja = {
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                montoInicial: null,
                empleadoId: null,
                estado: 'Abierto'
            };
            this.modoEdicion = false;
            this.cajaOriginalId = null;
            this.cajaExistente = null;
        },
        cancelar() {
            window.location.href = '/web/panel-control';
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Modificar Caja' : 'Registro de Caja' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container" style="max-width: 600px; margin: 0 auto; padding: 15px;">
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                            <div class="form-col">
                                <label>Nombre de la Caja: *</label>
                                <input 
                                    type="text" 
                                    v-model="caja.nombre" 
                                    @input="verificarCajaExistente"
                                    placeholder="Ingrese el nombre de la caja" 
                                    required
                                    style="border: 2px solid #87CEEB; background: #fcccce2;"
                                />
                            </div>
                            <div class="form-col">
                                <label>Fecha: *</label>
                                <input 
                                    type="date" 
                                    v-model="caja.fecha" 
                                    @change="verificarCajaExistente"
                                    required
                                    style="border: 2px solid #87CEEB; background: #fcccce2;"
                                />
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                            <div class="form-col">
                                <label>Hora de Apertura:</label>
                                <input 
                                    type="time" 
                                    v-model="caja.horaApertura" 
                                    step="1"
                                    style="border: 2px solid #87CEEB; background: #fcccce2;"
                                />
                            </div>
                            <div class="form-col">
                                <label>Monto Inicial: *</label>
                                <input 
                                    type="number" 
                                    v-model="caja.montoInicial" 
                                    placeholder="0" 
                                    min="0"
                                    step="0.01"
                                    required
                                    style="border: 2px solid #87CEEB; background: #fcccce2;"
                                />
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div class="form-col">
                                <label>Empleado:</label>
                                <select v-model="caja.empleadoId" style="border: 2px solid #87CEEB; background: #fcccce2;">
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                        {{ empleado.nombreCompleto }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Estado:</label>
                                <select v-model="caja.estado" style="border: 2px solid #87CEEB; background: #fcccce2;">
                                    <option value="Abierto">Abierto</option>
                                    <option value="Cerrado">Cerrado</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-buttons" style="text-align: center; margin-top: 15px;">
                            <button @click="registrarCaja" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Registrar' }}
                            </button>
                            <button @click="cancelar" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});