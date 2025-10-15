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
            areas: [],
            nuevaArea: { 
                id: null, 
                nombre: '' 
            },
            cargando: false,
            modoEdicion: false,
            areaExistente: null,
            mensaje: null,
            tipoMensaje: null,
            accionConfirmar: null
        };
    },
    mounted() {
        this.fetchAreas();
    },
    methods: {
        async fetchAreas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/areas`);
                if (!response.ok) throw new Error('Error al cargar áreas');
                this.areas = await response.json();
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensajeError('Error al cargar áreas');
            }
        },
        verificarAreaExistente() {
            if (!this.nuevaArea.nombre.trim()) return;
            
            const nombreBuscar = this.nuevaArea.nombre.trim().toLowerCase();
            this.areaExistente = this.areas.find(a => 
                a.nombre.toLowerCase() === nombreBuscar
            );
            
            if (this.areaExistente && !this.modoEdicion) {
                this.mostrarMensajeConfirmacion(
                    `El área "${this.areaExistente.nombre}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarAreaParaEdicion(this.areaExistente);
                    }
                );
            }
        },
        cargarAreaParaEdicion(area) {
            this.nuevaArea = { ...area };
            this.modoEdicion = true;
            this.areaExistente = area;
        },
        async agregarArea() {
            if (!this.nuevaArea.nombre.trim()) {
                this.mostrarMensajeError('El nombre es requerido');
                return;
            }
            try {
                this.cargando = true;
                const areaData = {
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre.trim())
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/agregar_area`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Área agregada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchAreas();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar área:', error);
                this.mostrarMensajeError(`Error al agregar área: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        async modificarArea() {
            if (!this.nuevaArea.nombre.trim()) {
                this.mostrarMensajeError('El nombre es requerido');
                return;
            }
            try {
                this.cargando = true;
                const areaData = {
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre.trim())
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/actualizar_area/${this.nuevaArea.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Área actualizada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchAreas();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar área:', error);
                this.mostrarMensajeError(`Error al modificar área: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        limpiarFormulario() {
            this.nuevaArea = { 
                id: null, 
                nombre: '' 
            };
            this.modoEdicion = false;
            this.areaExistente = null;
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
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Editar Área' : 'Registro de Área' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container" style="width: fit-content; max-width: 500px;">
                        <h3>{{ modoEdicion ? 'Modificar Área - ' + nuevaArea.nombre : 'Nueva Área' }}</h3>
                        <label>Nombre: *</label>
                        <input type="text" v-model="nuevaArea.nombre" @input="verificarAreaExistente" placeholder="Ingrese el nombre del área" required style="border: 2px solid #87CEEB;"/>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="modoEdicion ? modificarArea() : agregarArea()" class="btn" :disabled="cargando">
                                {{ cargando ? 'Guardando...' : (modoEdicion ? 'Modificar' : 'Agregar') }}
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : window.history.back()" class="btn btn-secondary">
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
style.textContent = '.form-container { margin: 0 auto !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; } .mensaje-content { background: white; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); } .mensaje-content.error { border: 3px solid #dc3545; } .mensaje-content.exito { border: 3px solid #28a745; } .mensaje-content.confirmacion { border: 3px solid #ffc107; } .mensaje-header { padding: 20px; text-align: center; } .mensaje-header.error { background: #f8d7da; } .mensaje-header.exito { background: #d4edda; } .mensaje-header.confirmacion { background: #fff3cd; } .mensaje-header h3 { margin: 0; font-size: 18px; } .mensaje-body { padding: 25px; text-align: center; } .mensaje-body p { margin: 0; font-size: 16px; line-height: 1.5; } .mensaje-footer { padding: 20px; display: flex; gap: 15px; justify-content: center; border-top: 1px solid #ddd; } .btn-primary { background: #28a745 !important; color: white !important; }';
document.head.appendChild(style);