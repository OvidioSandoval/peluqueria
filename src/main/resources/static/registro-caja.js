import config from './config.js';

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
            cajaOriginalId: null,
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null
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
                this.mostrarMensajeError('Error al cargar empleados');
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
                this.mostrarMensajeConfirmacion(
                    `Ya existe una caja "${cajaExistente.nombre}" para la fecha ${this.formatearFecha(cajaExistente.fecha)}. ¿Desea modificarla?`,
                    () => this.cargarCajaParaEdicion(cajaExistente)
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
                    this.mostrarMensajeExito(
                        this.modoEdicion ? 'Caja modificada exitosamente' : 'Caja registrada exitosamente'
                    );
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar caja:', error);
                this.mostrarMensajeError(`Error al registrar caja: ${error.message}`);
            }
        },
        async modificarCaja() {
            await this.registrarCaja();
        },
        validarFormulario() {
            if (!this.caja.nombre.trim()) {
                this.mostrarMensajeError('El nombre de la caja es requerido');
                return false;
            }
            if (!this.caja.montoInicial || this.caja.montoInicial <= 0) {
                this.mostrarMensajeError('El monto inicial debe ser mayor a 0');
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
        },
        mostrarMensajeError(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'error';
        },
        mostrarMensajeExito(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'exito';
        },
        mostrarMensajeConfirmacion(mensaje, accion) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'confirmacion';
            this.accionConfirmar = accion;
        },
        confirmarAccion() {
            if (this.accionConfirmar) {
                this.accionConfirmar();
                this.accionConfirmar = null;
            }
            this.cerrarMensaje();
        },
        cerrarMensaje() {
            this.mensaje = '';
            this.tipoMensaje = '';
            this.accionConfirmar = null;
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Modificar Caja' : 'Registro de Caja' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <div v-if="mensaje" class="mensaje-overlay" @click="cerrarMensaje">
                    <div class="mensaje-modal" @click.stop>
                        <div class="mensaje-contenido" :class="tipoMensaje">
                            <p>{{ mensaje }}</p>
                            <div class="mensaje-botones">
                                <button v-if="tipoMensaje === 'confirmacion'" @click="confirmarAccion" class="btn btn-confirmar">Sí</button>
                                <button @click="cerrarMensaje" class="btn" :class="tipoMensaje === 'confirmacion' ? 'btn-cancelar' : 'btn-cerrar'">{{ tipoMensaje === 'confirmacion' ? 'No' : 'Cerrar' }}</button>
                            </div>
                        </div>
                    </div>
                </div>
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

const style = document.createElement('style');
style.textContent = 'input, textarea, select { background: #fcccce2 !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);