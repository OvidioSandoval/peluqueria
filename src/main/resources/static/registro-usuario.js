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
            usuarioExistente: null,
            mostrarNuevoRol: false,
            nuevoRol: '',
            mensaje: null,
            tipoMensaje: null,
            accionConfirmar: null
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
                this.mostrarMensajeError('Error al cargar roles');
            }
        },
        async fetchUsuarios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios`);
                if (!response.ok) throw new Error('Error al cargar usuarios');
                this.usuarios = await response.json();
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensajeError('Error al cargar usuarios');
            }
        },
        verificarUsuarioExistente() {
            if (!this.nuevoUsuario.username.trim()) return;
            
            const usernameBuscar = this.nuevoUsuario.username.trim().toLowerCase();
            this.usuarioExistente = this.usuarios.find(u => 
                u.username.toLowerCase() === usernameBuscar
            );
            
            if (this.usuarioExistente && !this.modoEdicion) {
                this.mostrarMensajeConfirmacion(
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
                this.mostrarMensajeError(`El correo "${this.nuevoUsuario.correo}" ya está registrado`);
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
                this.mostrarMensajeError('El nombre de usuario es obligatorio');
                return;
            }
            if (!this.nuevoUsuario.password.trim()) {
                this.mostrarMensajeError('La contraseña es obligatoria');
                return;
            }
            if (!this.nuevoUsuario.rol) {
                this.mostrarMensajeError('El rol es obligatorio');
                return;
            }
            if (this.nuevoUsuario.correo && !this.validarEmail(this.nuevoUsuario.correo)) {
                this.mostrarMensajeError('Por favor ingrese un email válido');
                return;
            }
            
            // Verificar si ya existe el usuario
            const usernameBuscar = this.nuevoUsuario.username.trim().toLowerCase();
            const usuarioExiste = this.usuarios.find(u => 
                u.username.toLowerCase() === usernameBuscar
            );
            
            if (usuarioExiste) {
                this.mostrarMensajeError('El usuario ya existe. Use el modo edición para modificarlo.');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Usuario agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchUsuarios();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al agregar usuario:', error);
                this.mostrarMensajeError(`Error al agregar usuario: ${error.message}`);
            }
        },
        async modificarUsuario() {
            if (!this.nuevoUsuario.username.trim()) {
                this.mostrarMensajeError('El nombre de usuario es obligatorio');
                return;
            }
            if (!this.nuevoUsuario.rol) {
                this.mostrarMensajeError('El rol es obligatorio');
                return;
            }
            if (this.nuevoUsuario.correo && !this.validarEmail(this.nuevoUsuario.correo)) {
                this.mostrarMensajeError('Por favor ingrese un email válido');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/${this.nuevoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Usuario actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchUsuarios();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al modificar usuario:', error);
                this.mostrarMensajeError(`Error al modificar usuario: ${error.message}`);
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
        async agregarRol() {
            if (!this.nuevoRol.trim()) {
                this.mostrarMensajeError('La descripción del rol es obligatoria');
                return;
            }
            
            // Verificar si el rol ya existe
            const rolExistente = this.roles.find(r => 
                r.descripcion.toLowerCase() === this.nuevoRol.trim().toLowerCase()
            );
            
            if (rolExistente) {
                this.mostrarMensajeError(`El rol "${this.nuevoRol}" ya existe`);
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descripcion: this.nuevoRol.trim() })
                });
                if (response.ok) {
                    await this.fetchRoles();
                    this.nuevoRol = '';
                    this.mostrarNuevoRol = false;
                    this.mostrarMensajeExito('Rol agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar rol:', error);
                this.mostrarMensajeError(`Error al agregar rol: ${error.message}`);
            }
        },
        mostrarMensajeError(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'error';
        },
        mostrarMensajeExito(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'exito';
            setTimeout(() => this.cerrarMensaje(), 3000);
        },
        mostrarMensajeConfirmacion(mensaje, accion) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'confirmacion';
            this.accionConfirmar = accion;
        },
        confirmarAccion() {
            if (this.accionConfirmar) this.accionConfirmar();
            this.cerrarMensaje();
        },
        cerrarMensaje() {
            this.mensaje = null;
            this.tipoMensaje = null;
            this.accionConfirmar = null;
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
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoUsuario.rol" required style="flex: 1; border: 2px solid #87CEEB;">
                                        <option value="">Seleccionar rol</option>
                                        <option v-for="rol in roles" :key="rol.id" :value="rol">{{ rol.descripcion }}</option>
                                    </select>
                                    <button type="button" @click="mostrarNuevoRol = !mostrarNuevoRol" class="btn btn-small">+</button>
                                </div>
                                <div v-if="mostrarNuevoRol" style="margin-top: 10px; display: flex; gap: 10px;">
                                    <input type="text" v-model="nuevoRol" placeholder="Descripción del rol" style="flex: 1; border: 2px solid #87CEEB;"/>
                                    <button type="button" @click="agregarRol()" class="btn btn-small">Agregar</button>
                                    <button type="button" @click="mostrarNuevoRol = false; nuevoRol = ''" class="btn btn-small btn-secondary">Cancelar</button>
                                </div>
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
                    <div v-if="mensaje" class="mensaje-overlay">
                        <div class="mensaje-content" :class="tipoMensaje">
                            <div class="mensaje-header" :class="tipoMensaje">
                                <h3 v-if="tipoMensaje === 'error'"><i class="fas fa-exclamation-triangle"></i> Error</h3>
                                <h3 v-if="tipoMensaje === 'exito'"><i class="fas fa-check-circle"></i> Éxito</h3>
                                <h3 v-if="tipoMensaje === 'confirmacion'"><i class="fas fa-question-circle"></i> Confirmación</h3>
                            </div>
                            <div class="mensaje-body">
                                <p>{{ mensaje }}</p>
                            </div>
                            <div class="mensaje-footer">
                                <button v-if="tipoMensaje === 'confirmacion'" @click="confirmarAccion" class="btn btn-primary">Sí</button>
                                <button @click="cerrarMensaje" class="btn btn-secondary">{{ tipoMensaje === 'confirmacion' ? 'No' : 'Cerrar' }}</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; } .btn-small.btn-secondary { background: #d39bdb !important; color: #872fab !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; } .mensaje-content { background: white; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); } .mensaje-content.error { border: 3px solid #dc3545; } .mensaje-content.exito { border: 3px solid #28a745; } .mensaje-content.confirmacion { border: 3px solid #ffc107; } .mensaje-header { padding: 20px; text-align: center; } .mensaje-header.error { background: #f8d7da; } .mensaje-header.exito { background: #d4edda; } .mensaje-header.confirmacion { background: #fff3cd; } .mensaje-header h3 { margin: 0; font-size: 18px; } .mensaje-body { padding: 25px; text-align: center; } .mensaje-body p { margin: 0; font-size: 16px; line-height: 1.5; } .mensaje-footer { padding: 20px; display: flex; gap: 15px; justify-content: center; border-top: 1px solid #ddd; } .btn-primary { background: #28a745 !important; color: white !important; }';
document.head.appendChild(style);