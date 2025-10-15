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
            rolExistente: null,
            mensaje: null,
            tipoMensaje: null,
            accionConfirmar: null
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
                this.mostrarMensajeError('Error al cargar roles');
            }
        },
        verificarRolExistente() {
            if (!this.nuevoRol.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoRol.descripcion.trim().toLowerCase();
            this.rolExistente = this.roles.find(r => 
                r.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (this.rolExistente && !this.modoEdicion) {
                this.mostrarMensajeConfirmacion(
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
                this.mostrarMensajeError('La descripción es obligatoria');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Rol agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRoles();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar rol:', error);
                this.mostrarMensajeError(`Error al agregar rol: ${error.message}`);
            }
        },
        async modificarRol() {
            if (!this.nuevoRol.descripcion.trim()) {
                this.mostrarMensajeError('La descripción es obligatoria');
                return;
            }
            
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles/${this.nuevoRol.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Rol actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRoles();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar rol:', error);
                this.mostrarMensajeError(`Error al modificar rol: ${error.message}`);
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
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; } .mensaje-content { background: white; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); } .mensaje-content.error { border: 3px solid #dc3545; } .mensaje-content.exito { border: 3px solid #28a745; } .mensaje-content.confirmacion { border: 3px solid #ffc107; } .mensaje-header { padding: 20px; text-align: center; } .mensaje-header.error { background: #f8d7da; } .mensaje-header.exito { background: #d4edda; } .mensaje-header.confirmacion { background: #fff3cd; } .mensaje-header h3 { margin: 0; font-size: 18px; } .mensaje-body { padding: 25px; text-align: center; } .mensaje-body p { margin: 0; font-size: 16px; line-height: 1.5; } .mensaje-footer { padding: 20px; display: flex; gap: 15px; justify-content: center; border-top: 1px solid #ddd; } .btn-primary { background: #28a745 !important; color: white !important; }';
document.head.appendChild(style);