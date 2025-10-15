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
            servicios: [],
            categorias: [],
            nuevaPromocion: {
                id: null,
                titulo: '',
                descripcion: [],
                precio: 0
            },
            modoEdicion: false,
            promocionExistente: null,
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null,
            mostrarFormServicio: false,
            nuevoServicio: {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            }
        };
    },
    mounted() {
        this.fetchServicios();
        this.fetchCategorias();
    },
    methods: {
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    this.servicios = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                if (response.ok) {
                    this.categorias = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar categorías:', error);
            }
        },
        verificarPromocionExistente() {
            if (!this.nuevaPromocion.titulo.trim()) return;
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const tituloBuscar = this.nuevaPromocion.titulo.trim().toLowerCase();
            this.promocionExistente = promociones.find(p => 
                p.titulo.toLowerCase() === tituloBuscar
            );
            
            if (this.promocionExistente && !this.modoEdicion) {
                this.mostrarMensajeConfirmacion(
                    `La promoción "${this.promocionExistente.titulo}" ya existe. ¿Desea modificarla?`,
                    () => {
                        this.cargarPromocionParaEdicion(this.promocionExistente);
                    }
                );
            }
        },
        cargarPromocionParaEdicion(promo) {
            this.nuevaPromocion = {
                id: promo.id,
                titulo: promo.titulo,
                descripcion: promo.descripcion ? promo.descripcion.split(' + ') : [],
                precio: promo.precio
            };
            this.modoEdicion = true;
            this.promocionExistente = promo;
        },
        async agregarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                this.mostrarMensajeError('El título es obligatorio');
                return;
            }
            if (!this.nuevaPromocion.descripcion.length) {
                this.mostrarMensajeError('Debe seleccionar al menos un servicio');
                return;
            }
            if (!this.nuevaPromocion.precio || this.nuevaPromocion.precio <= 0) {
                this.mostrarMensajeError('El precio debe ser mayor a 0');
                return;
            }
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const nuevoId = Math.max(...promociones.map(p => p.id), 0) + 1;
            promociones.push({
                ...this.nuevaPromocion,
                id: nuevoId,
                titulo: this.capitalizarTexto(this.nuevaPromocion.titulo),
                descripcion: this.nuevaPromocion.descripcion.join(' + ')
            });
            
            localStorage.setItem('promociones', JSON.stringify(promociones));
            this.mostrarMensajeExito('Promoción registrada exitosamente');
            this.limpiarFormulario();
        },
        async modificarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                this.mostrarMensajeError('El título es obligatorio');
                return;
            }
            if (!this.nuevaPromocion.descripcion.length) {
                this.mostrarMensajeError('Debe seleccionar al menos un servicio');
                return;
            }
            if (!this.nuevaPromocion.precio || this.nuevaPromocion.precio <= 0) {
                this.mostrarMensajeError('El precio debe ser mayor a 0');
                return;
            }
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const index = promociones.findIndex(p => p.id === this.nuevaPromocion.id);
            if (index !== -1) {
                promociones[index] = {
                    ...this.nuevaPromocion,
                    titulo: this.capitalizarTexto(this.nuevaPromocion.titulo),
                    descripcion: this.nuevaPromocion.descripcion.join(' + ')
                };
                localStorage.setItem('promociones', JSON.stringify(promociones));
                this.mostrarMensajeExito('Promoción actualizada exitosamente');
                this.limpiarFormulario();
            }
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },

        limpiarFormulario() {
            this.nuevaPromocion = {
                id: null,
                titulo: '',
                descripcion: [],
                precio: 0
            };
            this.modoEdicion = false;
            this.promocionExistente = null;
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
        },
        
        // Métodos para servicio
        verificarServicioDuplicado() {
            if (!this.nuevoServicio.nombre.trim()) return false;
            
            const nombreBuscar = this.nuevoServicio.nombre.trim().toLowerCase();
            const servicioExistente = this.servicios.find(s => 
                s.nombre.toLowerCase() === nombreBuscar
            );
            
            if (servicioExistente) {
                this.mostrarMensajeError(`El servicio "${servicioExistente.nombre}" ya existe`);
                return true;
            }
            return false;
        },
        
        async agregarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                this.mostrarMensajeError('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                this.mostrarMensajeError('El precio base debe ser mayor a 0');
                return;
            }
            if (this.verificarServicioDuplicado()) return;
            
            try {
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: this.nuevoServicio.categoriaId }
                };
                const response = await fetch(`${config.apiBaseUrl}/servicios/agregar_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servicioData)
                });
                if (response.ok) {
                    this.mostrarMensajeExito('Servicio agregado exitosamente');
                    this.limpiarFormServicio();
                    await this.fetchServicios();
                    this.mostrarFormServicio = false;
                } else {
                    throw new Error('Error al agregar servicio');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensajeError('Error al agregar servicio');
            }
        },
        
        limpiarFormServicio() {
            this.nuevoServicio = {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            };
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nueva Promoción</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <!-- Modal para agregar servicio -->
                <div v-if="mostrarFormServicio" class="modal-overlay" @click="mostrarFormServicio = false">
                    <div class="modal-content" @click.stop>
                        <h3><i class="fas fa-concierge-bell"></i> Agregar Servicio</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoServicio.nombre" @blur="verificarServicioDuplicado" placeholder="Ingrese el nombre del servicio" required/>
                            </div>
                            <div class="form-col">
                                <label>Precio Base: *</label>
                                <input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Categoría:</label>
                                <select v-model="nuevoServicio.categoriaId">
                                    <option value="" disabled>Selecciona una categoría</option>
                                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                        {{ categoria.descripcion }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label style="display: flex; align-items: center; gap: 8px; margin-top: 25px;">
                                    <input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0;"/>
                                    Servicio Activo
                                </label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción:</label>
                                <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2" style="resize: vertical; width: 300px;"></textarea>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button @click="agregarServicio" class="btn">Agregar</button>
                            <button @click="mostrarFormServicio = false" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </div>
                
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
                        <h3>{{ modoEdicion ? 'Modificar Promoción - ' + nuevaPromocion.titulo : 'Nueva Promoción' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Título: *</label>
                                <input type="text" v-model="nuevaPromocion.titulo" @blur="verificarPromocionExistente" placeholder="Ingrese el título" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Precio: *</label>
                                <input type="number" v-model="nuevaPromocion.precio" placeholder="Ingrese el precio" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Servicios: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevaPromocion.descripcion" multiple required style="border: 2px solid #87CEEB; min-height: 60px; flex: 1;">
                                        <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.nombre">
                                            {{ servicio.nombre }}
                                        </option>
                                    </select>
                                    <button type="button" @click="mostrarFormServicio = true" class="btn btn-small">+</button>
                                </div>
                                <small style="color: #666; font-size: 10px; display: block;">Ctrl + clic para seleccionar múltiples</small>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarPromocion() : agregarPromocion()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Promoción
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
style.textContent = 'input, textarea, select { background: #fcccce2 !important; padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { background: #fcccce2 !important; padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; border-radius: 8px; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; } select[multiple] { height: 80px !important; min-height: 80px !important; } .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); } .modal-content { background: rgba(248, 187, 208, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); } .modal-content h3 { color: #66bb6a; text-align: center; margin-bottom: 20px; font-weight: 600; } .modal-content label { color: #66bb6a; font-weight: 600; margin-bottom: 8px; display: block; font-size: 14px; } .modal-content input, .modal-content textarea, .modal-content select { width: 100%; padding: 12px 15px; border: 2px solid #b3e5fc; border-radius: 12px; margin: 8px 0; background: rgba(252, 204, 206, 0.8); color: #66bb6a; font-size: 14px; transition: all 0.3s ease; } .modal-content input:focus, .modal-content textarea:focus, .modal-content select:focus { outline: none; border-color: #81d4fa; box-shadow: 0 0 15px rgba(129, 212, 250, 0.3); transform: translateY(-1px); } .modal-buttons { margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);