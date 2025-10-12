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
            paquetes: [],
            nuevoPaquete: { 
                id: null,
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            },
            paqueteExistente: null,
            modoModificar: false,
        };
    },
    mounted() {
        this.fetchPaquetes();
    },
    methods: {
        async fetchPaquetes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.paquetes = await response.json();
            } catch (error) {
                console.error('Error al cargar paquetes:', error);
                NotificationSystem.error(`Error al cargar los paquetes: ${error.message}`);
            }
        },
        verificarDuplicado() {
            if (!this.nuevoPaquete.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoPaquete.descripcion.trim().toLowerCase();
            this.paqueteExistente = this.paquetes.find(p => 
                p.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (this.paqueteExistente && !this.modoModificar) {
                NotificationSystem.confirm(
                    `El paquete "${this.paqueteExistente.descripcion}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarPaqueteParaEdicion(this.paqueteExistente);
                    }
                );
            }
        },
        cargarPaqueteParaEdicion(paquete) {
            this.nuevoPaquete = {
                id: paquete.id,
                descripcion: paquete.descripcion || '',
                precioTotal: paquete.precioTotal || null,
                descuentoAplicado: paquete.descuentoAplicado || null
            };
            this.modoModificar = true;
            this.paqueteExistente = paquete;
        },
        async agregarPaquete() {
            if (!this.nuevoPaquete.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            if (!this.nuevoPaquete.precioTotal) {
                NotificationSystem.error('El precio total es obligatorio');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/agregar_paquete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    NotificationSystem.success('Paquete agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchPaquetes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar paquete:', error);
                NotificationSystem.error(`Error al agregar paquete: ${error.message}`);
            }
        },
        async modificarPaquete() {
            if (!this.nuevoPaquete.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            if (!this.nuevoPaquete.precioTotal) {
                NotificationSystem.error('El precio total es obligatorio');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/actualizar_paquete/${this.nuevoPaquete.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    NotificationSystem.success('Paquete actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchPaquetes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar paquete:', error);
                NotificationSystem.error(`Error al modificar paquete: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevoPaquete = { 
                id: null,
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            };
            this.paqueteExistente = null;
            this.modoModificar = false;
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Paquete de Servicios</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoModificar ? 'Modificar Paquete - ' + nuevoPaquete.descripcion : 'Nuevo Paquete de Servicios' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <textarea v-model="nuevoPaquete.descripcion" @blur="verificarDuplicado" placeholder="Ingrese la descripción del paquete" required rows="2" style="resize: vertical;"></textarea>
                            </div>
                            <div class="form-col">
                                <label>Precio Total: *</label>
                                <input type="number" v-model="nuevoPaquete.precioTotal" placeholder="Precio total" required/>
                            </div>
                            <div class="form-col">
                                <label>Descuento Aplicado:</label>
                                <input type="number" v-model="nuevoPaquete.descuentoAplicado" placeholder="Descuento"/>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoModificar ? modificarPaquete() : agregarPaquete()" class="btn">
                                {{ modoModificar ? 'Modificar' : 'Agregar' }} Paquete
                            </button>
                            <button @click="modoModificar ? limpiarFormulario() : goBack()" class="btn btn-secondary">
                                {{ modoModificar ? 'Cancelar Edición' : 'Cancelar' }}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = 'input, textarea, select { background: #87ceeb !important; border: 2px solid #87ceeb !important; }';
document.head.appendChild(style);