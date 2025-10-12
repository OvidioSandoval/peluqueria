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
            gasto: {
                descripcion: '',
                monto: null,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            },
            empleados: []
        };
    },
    mounted() {
        this.fetchEmpleados();
    },
    methods: {
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error('Error al cargar empleados');
            }
        },
        async registrarGasto() {
            if (!this.validarFormulario()) return;
            
            try {
                const gastoData = {
                    ...this.gasto,
                    descripcion: this.capitalizarTexto(this.gasto.descripcion),
                    categoriaGasto: this.capitalizarTexto(this.gasto.categoriaGasto)
                };
                
                const response = await fetch(`${config.apiBaseUrl}/gastos/agregar_gasto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gastoData)
                });
                
                if (response.ok) {
                    NotificationSystem.success('Gasto registrado exitosamente');
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar gasto:', error);
                NotificationSystem.error(`Error al registrar gasto: ${error.message}`);
            }
        },
        validarFormulario() {
            if (!this.gasto.descripcion.trim()) {
                NotificationSystem.error('La descripción del gasto es requerida');
                return false;
            }
            if (!this.gasto.monto || this.gasto.monto <= 0) {
                NotificationSystem.error('El monto debe ser mayor a 0');
                return false;
            }
            if (!this.gasto.fechaGasto) {
                NotificationSystem.error('La fecha del gasto es requerida');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.gasto = {
                descripcion: '',
                monto: null,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            };
        },
        cancelar() {
            window.location.href = '/web/pagina-principal';
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
                <h1 class="page-title">Registro de Gasto</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <input 
                                    type="text" 
                                    v-model="gasto.descripcion" 
                                    placeholder="Descripción del gasto" 
                                    required
                                />
                            </div>
                            <div class="form-col">
                                <label>Monto: *</label>
                                <input 
                                    type="number" 
                                    v-model="gasto.monto" 
                                    placeholder="0" 
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Fecha del Gasto: *</label>
                                <input 
                                    type="date" 
                                    v-model="gasto.fechaGasto" 
                                    required
                                />
                            </div>
                            <div class="form-col">
                                <label>Categoría:</label>
                                <input 
                                    type="text" 
                                    v-model="gasto.categoriaGasto" 
                                    placeholder="Categoría del gasto"
                                />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Empleado:</label>
                                <select v-model="gasto.empleado">
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado">
                                        {{ empleado.nombreCompleto }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="registrarGasto" class="btn">
                                Registrar Gasto
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
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; }';
document.head.appendChild(style);