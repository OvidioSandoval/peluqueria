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
            categoria: {
                descripcion: ''
            },
            categoriaExistente: null,
            modoEdicion: false,
            categoriaOriginalId: null,
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null
        };
    },
    methods: {
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                return await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                return [];
            }
        },
        async verificarCategoriaExistente() {
            if (!this.categoria.descripcion.trim()) return;
            
            const categorias = await this.fetchCategorias();
            const categoriaExistente = categorias.find(c => 
                c.descripcion.toLowerCase() === this.categoria.descripcion.toLowerCase().trim()
            );
            
            if (categoriaExistente && (!this.modoEdicion || categoriaExistente.id !== this.categoriaOriginalId)) {
                this.categoriaExistente = categoriaExistente;
                this.mostrarMensajeConfirmacion(
                    `Ya existe una categoría "${categoriaExistente.descripcion}". ¿Desea modificarla?`,
                    () => this.cargarCategoriaParaEdicion(categoriaExistente)
                );
            } else {
                this.categoriaExistente = null;
            }
        },
        cargarCategoriaParaEdicion(categoriaExistente) {
            this.modoEdicion = true;
            this.categoriaOriginalId = categoriaExistente.id;
            this.categoria = {
                descripcion: categoriaExistente.descripcion
            };
            this.categoriaExistente = null;
        },
        async registrarCategoria() {
            if (!this.validarFormulario()) return;
            
            try {
                const categoriaData = {
                    ...this.categoria,
                    descripcion: this.capitalizarTexto(this.categoria.descripcion)
                };
                
                const url = this.modoEdicion 
                    ? `${config.apiBaseUrl}/categoria-servicios/actualizar_categoria/${this.categoriaOriginalId}`
                    : `${config.apiBaseUrl}/categoria-servicios/agregar_categoria`;
                const method = this.modoEdicion ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
                
                if (response.ok) {
                    this.mostrarMensajeExito(
                        this.modoEdicion ? 'Categoría modificada exitosamente' : 'Categoría registrada exitosamente'
                    );
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar categoría:', error);
                this.mostrarMensajeError(`Error al registrar categoría: ${error.message}`);
            }
        },
        async modificarCategoria() {
            await this.registrarCategoria();
        },
        validarFormulario() {
            if (!this.categoria.descripcion.trim()) {
                this.mostrarMensajeError('La descripción de la categoría es requerida');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.categoria = {
                descripcion: ''
            };
            this.modoEdicion = false;
            this.categoriaOriginalId = null;
            this.categoriaExistente = null;
        },
        cancelar() {
            window.location.href = '/web/panel-control';
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
                <h1 class="page-title">{{ modoEdicion ? 'Modificar Categoría' : 'Registro de Servicio de Categoría' }}</h1>
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
                    <div class="form-container" style="width: fit-content; max-width: 500px;">
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <textarea 
                                    v-model="categoria.descripcion" 
                                    @input="verificarCategoriaExistente"
                                    placeholder="Ingrese la descripción de la categoría" 
                                    required 
                                    rows="3" 
                                    style="resize: vertical; width: 100%; padding: 10px; border: 2px solid #87CEEB; border-radius: 5px;"
                                ></textarea>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="registrarCategoria" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Registrar' }}
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
style.textContent = '.form-container { margin: 0 auto !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);