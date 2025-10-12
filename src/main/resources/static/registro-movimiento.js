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
            movimiento: {
                monto: null,
                cajaId: null,
                idAsociado: null,
                tipo: ''
            },
            cajas: []
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
                NotificationSystem.error('Error al cargar cajas');
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
                    NotificationSystem.success('Movimiento registrado exitosamente');
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar movimiento:', error);
                NotificationSystem.error(`Error al registrar movimiento: ${error.message}`);
            }
        },
        validarFormulario() {
            if (!this.movimiento.monto || this.movimiento.monto <= 0) {
                NotificationSystem.error('El monto debe ser mayor a 0');
                return false;
            }
            if (!this.movimiento.cajaId) {
                NotificationSystem.error('Debe seleccionar una caja');
                return false;
            }
            if (!this.movimiento.tipo) {
                NotificationSystem.error('Debe seleccionar un tipo de movimiento');
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
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registro de Movimiento</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
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