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
            paquetes: [],
            nuevoPaquete: { 
                id: null,
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            },
            paqueteExistente: null,
            modoModificar: false,
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null
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
                this.mostrarMensajeError(`Error al cargar los paquetes: ${error.message}`);
            }
        },
        verificarDuplicado() {
            if (!this.nuevoPaquete.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoPaquete.descripcion.trim().toLowerCase();
            this.paqueteExistente = this.paquetes.find(p => 
                p.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (this.paqueteExistente && !this.modoModificar) {
                this.mostrarMensajeConfirmacion(
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
                this.mostrarMensajeError('La descripción es obligatoria');
                return;
            }
            if (!this.nuevoPaquete.precioTotal) {
                this.mostrarMensajeError('El precio total es obligatorio');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/agregar_paquete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Paquete agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchPaquetes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar paquete:', error);
                this.mostrarMensajeError(`Error al agregar paquete: ${error.message}`);
            }
        },
        async modificarPaquete() {
            if (!this.nuevoPaquete.descripcion.trim()) {
                this.mostrarMensajeError('La descripción es obligatoria');
                return;
            }
            if (!this.nuevoPaquete.precioTotal) {
                this.mostrarMensajeError('El precio total es obligatorio');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/actualizar_paquete/${this.nuevoPaquete.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Paquete actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchPaquetes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar paquete:', error);
                this.mostrarMensajeError(`Error al modificar paquete: ${error.message}`);
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
                <h1 class="page-title">Registrar Nuevo Paquete de Servicios</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
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
style.textContent = 'input, textarea, select { background: #fcccce2 !important; border: 2px solid #87ceeb !important; padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);