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
            proveedores: [],
            nuevoProveedor: { 
                id: null,
                descripcion: ''
            },
            proveedorExistente: null,
            modoModificar: false,
        };
    },
    mounted() {
        this.fetchProveedores();
    },
    methods: {
        async fetchProveedores() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.proveedores = await response.json();
            } catch (error) {
                console.error('Error al cargar proveedores:', error);
                NotificationSystem.error(`Error al cargar los proveedores: ${error.message}`);
            }
        },
        verificarDuplicado() {
            if (!this.nuevoProveedor.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoProveedor.descripcion.trim().toLowerCase();
            this.proveedorExistente = this.proveedores.find(p => 
                p.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (this.proveedorExistente && !this.modoModificar) {
                NotificationSystem.confirm(
                    `El proveedor "${this.proveedorExistente.descripcion}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarProveedorParaEdicion(this.proveedorExistente);
                    }
                );
            }
        },
        cargarProveedorParaEdicion(proveedor) {
            this.nuevoProveedor = {
                id: proveedor.id,
                descripcion: proveedor.descripcion || ''
            };
            this.modoModificar = true;
            this.proveedorExistente = proveedor;
        },
        async agregarProveedor() {
            if (!this.nuevoProveedor.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores/agregar_proveedor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoProveedor)
                });
                if (response.ok) {
                    NotificationSystem.success('Proveedor agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProveedores();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar proveedor:', error);
                NotificationSystem.error(`Error al agregar proveedor: ${error.message}`);
            }
        },
        async modificarProveedor() {
            if (!this.nuevoProveedor.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores/actualizar_proveedor/${this.nuevoProveedor.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoProveedor)
                });
                if (response.ok) {
                    NotificationSystem.success('Proveedor actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProveedores();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar proveedor:', error);
                NotificationSystem.error(`Error al modificar proveedor: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevoProveedor = { 
                id: null,
                descripcion: ''
            };
            this.proveedorExistente = null;
            this.modoModificar = false;
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Proveedor</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoModificar ? 'Modificar Proveedor - ' + nuevoProveedor.descripcion : 'Nuevo Proveedor' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <input type="text" v-model="nuevoProveedor.descripcion" @blur="verificarDuplicado" placeholder="Ingrese la descripción del proveedor" required/>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoModificar ? modificarProveedor() : agregarProveedor()" class="btn">
                                {{ modoModificar ? 'Modificar' : 'Agregar' }} Proveedor
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
style.textContent = 'input, textarea, select { border: 2px solid #87ceeb !important; }';
document.head.appendChild(style);