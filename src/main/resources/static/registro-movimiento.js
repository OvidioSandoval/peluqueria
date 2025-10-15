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
            movimiento: {
                monto: null,
                cajaId: null,
                idAsociado: null,
                tipo: ''
            },
            cajas: [],
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null
        };
    },
    mounted() {
        this.fetchCajas();
    },
    computed: {
        cajasAbiertas() {
            return this.cajas.filter(caja => caja.estado && caja.estado.toLowerCase() === 'abierto');
        }
    },
    methods: {
        async fetchCajas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/cajas`);
                this.cajas = await response.json();
            } catch (error) {
                console.error('Error al cargar cajas:', error);
                this.mostrarMensajeError('Error al cargar cajas');
            }
        },
        async registrarMovimiento() {
            if (!this.validarFormulario()) return;
            
            try {
                const movimientoData = {
                    monto: parseInt(this.movimiento.monto),
                    caja: { id: this.movimiento.cajaId },
                    idAsociado: this.movimiento.idAsociado || 0,
                    tipo: this.movimiento.tipo
                };
                
                const response = await fetch(`${config.apiBaseUrl}/movimientos/agregar_movimiento`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(movimientoData)
                });
                
                if (response.ok) {
                    this.mostrarMensajeExito('Movimiento registrado exitosamente');
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar movimiento:', error);
                this.mostrarMensajeError(`Error al registrar movimiento: ${error.message}`);
            }
        },
        validarFormulario() {
            if (!this.movimiento.monto || this.movimiento.monto <= 0) {
                this.mostrarMensajeError('El monto debe ser mayor a 0');
                return false;
            }
            if (!this.movimiento.cajaId) {
                this.mostrarMensajeError('Debe seleccionar una caja');
                return false;
            }
            if (!this.movimiento.tipo) {
                this.mostrarMensajeError('Debe seleccionar un tipo de movimiento');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.movimiento = {
                monto: null,
                cajaId: null,
                idAsociado: null,
                tipo: ''
            };
        },
        cancelar() {
            window.location.href = '/web/pagina-principal';
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
                <h1 class="page-title">Registro de Movimiento</h1>
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
                    <div class="form-container">
                        <div class="form-row">
                            <div class="form-col">
                                <label>Monto: *</label>
                                <input 
                                    type="number" 
                                    v-model="movimiento.monto" 
                                    placeholder="Ingrese el monto" 
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div class="form-col">
                                <label>Caja: *</label>
                                <select v-model="movimiento.cajaId" required>
                                    <option value="" disabled>Seleccionar Caja</option>
                                    <option v-for="caja in cajasAbiertas" :key="caja.id" :value="caja.id">
                                        Caja {{ caja.id }} - {{ caja.nombre }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>ID Asociado:</label>
                                <input 
                                    type="number" 
                                    v-model="movimiento.idAsociado" 
                                    placeholder="ID Asociado (opcional)"
                                    min="0"
                                />
                            </div>
                            <div class="form-col">
                                <label>Tipo: *</label>
                                <select v-model="movimiento.tipo" required>
                                    <option value="" disabled>Seleccionar Tipo</option>
                                    <option value="INGRESO">Ingreso</option>
                                    <option value="EGRESO">Egreso</option>
                                    <option value="VENTA">Venta</option>
                                    <option value="COMPRA">Compra</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="registrarMovimiento" class="btn">
                                Registrar Movimiento
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
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 120px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);