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
            roles: [],
            nuevoRol: {
                id: null,
                descripcion: ''
            },
            modoEdicion: false,
            rolExistente: null
        };
    },
    mounted() {
        this.fetchRoles();
    },
    methods: {
        async fetchRoles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles`);
                if (!response.ok) throw new Error('Error al cargar roles');
                this.roles = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar roles');
            }
        },
        verificarRolExistente() {
            if (!this.nuevoRol.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoRol.descripcion.trim().toLowerCase();
            this.rolExistente = this.roles.find(r => 
                r.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (this.rolExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `El rol "${this.rolExistente.descripcion}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarRolParaEdicion(this.rolExistente);
                    }
                );
            }
        },
        cargarRolParaEdicion(rol) {
            this.nuevoRol = {
                id: rol.id,
                descripcion: rol.descripcion || ''
            };
            this.modoEdicion = true;
            this.rolExistente = rol;
        },
        async agregarRol() {
            if (!this.nuevoRol.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    NotificationSystem.success('Rol agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRoles();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar rol:', error);
                NotificationSystem.error(`Error al agregar rol: ${error.message}`);
            }
        },
        async modificarRol() {
            if (!this.nuevoRol.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles/${this.nuevoRol.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    NotificationSystem.success('Rol actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRoles();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar rol:', error);
                NotificationSystem.error(`Error al modificar rol: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevoRol = {
                id: null,
                descripcion: ''
            };
            this.modoEdicion = false;
            this.rolExistente = null;
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Rol</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Rol - ' + nuevoRol.descripcion : 'Nuevo Rol' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <input type="text" v-model="nuevoRol.descripcion" @blur="verificarRolExistente" placeholder="Ingrese la descripción del rol" required style="border: 2px solid #87CEEB;"/>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarRol() : agregarRol()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Rol
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : goBack()" class="btn btn-secondary">
                                {{ modoEdicion ? 'Cancelar Edición' : 'Cancelar' }}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; }';
document.head.appendChild(style);