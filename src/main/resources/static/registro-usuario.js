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
            usuarios: [],
            nuevoUsuario: {
                id: null,
                username: '',
                password: '',
                correo: '',
                activo: true,
                rol: null
            },
            modoEdicion: false,
            usuarioExistente: null
        };
    },
    mounted() {
        this.fetchRoles();
        this.fetchUsuarios();
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
        async fetchUsuarios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios`);
                if (!response.ok) throw new Error('Error al cargar usuarios');
                this.usuarios = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar usuarios');
            }
        },
        verificarUsuarioExistente() {
            if (!this.nuevoUsuario.username.trim()) return;
            
            const usernameBuscar = this.nuevoUsuario.username.trim().toLowerCase();
            this.usuarioExistente = this.usuarios.find(u => 
                u.username.toLowerCase() === usernameBuscar
            );
            
            if (this.usuarioExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `El usuario "${this.usuarioExistente.username}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarUsuarioParaEdicion(this.usuarioExistente);
                    }
                );
            }
        },
        verificarCorreoExistente() {
            if (!this.nuevoUsuario.correo || !this.nuevoUsuario.correo.trim()) return;
            
            const correoBuscar = this.nuevoUsuario.correo.trim().toLowerCase();
            const correoExistente = this.usuarios.find(u => 
                u.correo && u.correo.toLowerCase() === correoBuscar
            );
            
            if (correoExistente && !this.modoEdicion) {
                NotificationSystem.error(`El correo "${this.nuevoUsuario.correo}" ya está registrado`);
                this.nuevoUsuario.correo = '';
            }
        },
        cargarUsuarioParaEdicion(usuario) {
            this.nuevoUsuario = {
                id: usuario.id,
                username: usuario.username || '',
                password: '',
                correo: usuario.correo || '',
                activo: usuario.activo,
                rol: usuario.rol
            };
            this.modoEdicion = true;
            this.usuarioExistente = usuario;
        },
        async agregarUsuario() {
            if (!this.nuevoUsuario.username.trim()) {
                NotificationSystem.error('El nombre de usuario es obligatorio');
                return;
            }
            if (!this.nuevoUsuario.password.trim()) {
                NotificationSystem.error('La contraseña es obligatoria');
                return;
            }
            if (!this.nuevoUsuario.rol) {
                NotificationSystem.error('El rol es obligatorio');
                return;
            }
            if (this.nuevoUsuario.correo && !this.validarEmail(this.nuevoUsuario.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            
            // Verificar si ya existe el usuario
            const usernameBuscar = this.nuevoUsuario.username.trim().toLowerCase();
            const usuarioExiste = this.usuarios.find(u => 
                u.username.toLowerCase() === usernameBuscar
            );
            
            if (usuarioExiste) {
                NotificationSystem.error('El usuario ya existe. Use el modo edición para modificarlo.');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    NotificationSystem.success('Usuario agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchUsuarios();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al agregar usuario:', error);
                NotificationSystem.error(`Error al agregar usuario: ${error.message}`);
            }
        },
        async modificarUsuario() {
            if (!this.nuevoUsuario.username.trim()) {
                NotificationSystem.error('El nombre de usuario es obligatorio');
                return;
            }
            if (!this.nuevoUsuario.rol) {
                NotificationSystem.error('El rol es obligatorio');
                return;
            }
            if (this.nuevoUsuario.correo && !this.validarEmail(this.nuevoUsuario.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/${this.nuevoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    NotificationSystem.success('Usuario actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchUsuarios();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al modificar usuario:', error);
                NotificationSystem.error(`Error al modificar usuario: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevoUsuario = {
                id: null,
                username: '',
                password: '',
                correo: '',
                activo: true,
                rol: null
            };
            this.modoEdicion = false;
            this.usuarioExistente = null;
        },
        validarEmail(email) {
            if (!email) return true;
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Usuario</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Usuario - ' + nuevoUsuario.username : 'Nuevo Usuario' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre de Usuario: *</label>
                                <input type="text" v-model="nuevoUsuario.username" @blur="verificarUsuarioExistente" placeholder="Ingrese el nombre de usuario" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Contraseña: {{ modoEdicion ? '' : '*' }}</label>
                                <input type="password" v-model="nuevoUsuario.password" placeholder="Ingrese la contraseña" :required="!modoEdicion" style="border: 2px solid #87CEEB;"/>
                                <small v-if="modoEdicion" style="color: #666; font-size: 10px;">Dejar vacío para mantener actual</small>
                            </div>
                            <div class="form-col">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoUsuario.correo" @blur="verificarCorreoExistente" placeholder="ejemplo@correo.com" style="border: 2px solid #87CEEB;"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Rol: *</label>
                                <select v-model="nuevoUsuario.rol" required style="border: 2px solid #87CEEB;">
                                    <option value="">Seleccionar rol</option>
                                    <option v-for="rol in roles" :key="rol.id" :value="rol">{{ rol.descripcion }}</option>
                                </select>
                            </div>
                            <div class="form-col" style="margin-left: 10px;">
                                <label>Estado:</label>
                                <div style="display: flex; align-items: center; margin-top: 6px;">
                                    <input type="checkbox" v-model="nuevoUsuario.activo" style="margin-right: 5px; width: auto; transform: scale(0.6);">
                                    <span>Activo</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarUsuario() : agregarUsuario()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Usuario
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