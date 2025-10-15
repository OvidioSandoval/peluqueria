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
            relaciones: [],
            paquetes: [],
            servicios: [],
            categorias: [],
            nuevaRelacion: { 
                id: null,
                paqueteId: null,
                servicioId: null
            },
            relacionExistente: null,
            modoModificar: false,
            // Formularios modales
            mostrarFormPaquete: false,
            mostrarFormServicio: false,
            nuevoPaquete: {
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            },
            nuevoServicio: {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            mensaje: '',
            tipoMensaje: ''
        };
    },
    mounted() {
        this.fetchRelaciones();
        this.fetchPaquetes();
        this.fetchServicios();
        this.fetchCategorias();
    },
    methods: {
        async fetchRelaciones() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.relaciones = await response.json();
            } catch (error) {
                console.error('Error al cargar relaciones:', error);
                NotificationSystem.error(`Error al cargar las relaciones: ${error.message}`);
            }
        },
        async fetchPaquetes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes`);
                this.paquetes = await response.json();
            } catch (error) {
                console.error('Error al cargar paquetes:', error);
            }
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                this.categorias = await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
            }
        },
        verificarDuplicado() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) return;
            
            this.relacionExistente = this.relaciones.find(r => 
                r.paqueteId === this.nuevaRelacion.paqueteId && 
                r.servicioId === this.nuevaRelacion.servicioId
            );
            
            if (this.relacionExistente && !this.modoModificar) {
                const paqueteNombre = this.getPaqueteNombre(this.relacionExistente.paqueteId);
                const servicioNombre = this.getServicioNombre(this.relacionExistente.servicioId);
                NotificationSystem.confirm(
                    `La relación "${paqueteNombre} - ${servicioNombre}" ya existe. ¿Desea modificarla?`,
                    () => {
                        this.cargarRelacionParaEdicion(this.relacionExistente);
                    }
                );
            }
        },
        cargarRelacionParaEdicion(relacion) {
            this.nuevaRelacion = {
                id: relacion.id,
                paqueteId: relacion.paqueteId,
                servicioId: relacion.servicioId
            };
            this.modoModificar = true;
            this.relacionExistente = relacion;
        },
        async agregarRelacion() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) {
                NotificationSystem.error('Debe seleccionar paquete y servicio');
                return;
            }
            try {
                const relacionData = {
                    paquete: { id: parseInt(this.nuevaRelacion.paqueteId) },
                    servicio: { id: parseInt(this.nuevaRelacion.servicioId) }
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/agregar_paquete_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    NotificationSystem.success('Relación agregada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRelaciones();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar relación:', error);
                NotificationSystem.error(`Error al agregar relación: ${error.message}`);
            }
        },
        async modificarRelacion() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) {
                NotificationSystem.error('Debe seleccionar paquete y servicio');
                return;
            }
            try {
                const relacionData = {
                    paquete: { id: parseInt(this.nuevaRelacion.paqueteId) },
                    servicio: { id: parseInt(this.nuevaRelacion.servicioId) }
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/actualizar_paquete_servicio/${this.nuevaRelacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    NotificationSystem.success('Relación actualizada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRelaciones();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar relación:', error);
                NotificationSystem.error(`Error al modificar relación: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevaRelacion = { 
                id: null,
                paqueteId: null,
                servicioId: null
            };
            this.relacionExistente = null;
            this.modoModificar = false;
        },
        getPaqueteNombre(paqueteId) {
            const paquete = this.paquetes.find(p => p.id === paqueteId);
            return paquete ? paquete.descripcion : 'Paquete no encontrado';
        },
        getServicioNombre(servicioId) {
            const servicio = this.servicios.find(s => s.id === servicioId);
            return servicio ? servicio.nombre : 'Servicio no encontrado';
        },
        // Métodos para paquetes
        verificarPaqueteDuplicado() {
            if (!this.nuevoPaquete.descripcion.trim()) return false;
            
            const descripcionBuscar = this.nuevoPaquete.descripcion.trim().toLowerCase();
            const paqueteExistente = this.paquetes.find(p => 
                p.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (paqueteExistente) {
                this.mostrarMensaje(`El paquete "${paqueteExistente.descripcion}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async agregarPaquete() {
            if (!this.nuevoPaquete.descripcion.trim()) {
                this.mostrarMensaje('La descripción es obligatoria', 'error');
                return;
            }
            if (!this.nuevoPaquete.precioTotal) {
                this.mostrarMensaje('El precio total es obligatorio', 'error');
                return;
            }
            if (this.verificarPaqueteDuplicado()) return;
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/agregar_paquete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    this.mostrarMensaje('Paquete agregado exitosamente', 'exito');
                    this.limpiarFormPaquete();
                    await this.fetchPaquetes();
                    this.mostrarFormPaquete = false;
                } else {
                    throw new Error('Error al agregar paquete');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar paquete', 'error');
            }
        },
        
        limpiarFormPaquete() {
            this.nuevoPaquete = {
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            };
        },
        
        // Métodos para servicios
        verificarServicioDuplicado() {
            if (!this.nuevoServicio.nombre.trim()) return false;
            
            const nombreBuscar = this.nuevoServicio.nombre.trim().toLowerCase();
            const servicioExistente = this.servicios.find(s => 
                s.nombre.toLowerCase() === nombreBuscar
            );
            
            if (servicioExistente) {
                this.mostrarMensaje(`El servicio "${servicioExistente.nombre}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async agregarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                this.mostrarMensaje('El nombre es requerido', 'error');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                this.mostrarMensaje('El precio base debe ser mayor a 0', 'error');
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
                    this.mostrarMensaje('Servicio agregado exitosamente', 'exito');
                    this.limpiarFormServicio();
                    await this.fetchServicios();
                    this.mostrarFormServicio = false;
                } else {
                    throw new Error('Error al agregar servicio');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar servicio', 'error');
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
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        
        mostrarMensaje(mensaje, tipo) {
            this.mensaje = mensaje;
            this.tipoMensaje = tipo;
            setTimeout(() => {
                this.mensaje = '';
                this.tipoMensaje = '';
            }, 3000);
        },
        
        cerrarMensaje() {
            this.mensaje = '';
            this.tipoMensaje = '';
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nueva Relación Paquete-Servicio</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <!-- Modal para agregar paquete -->
                <div v-if="mostrarFormPaquete" class="modal-overlay" @click="mostrarFormPaquete = false">
                    <div class="modal-content" @click.stop>
                        <h3><i class="fas fa-box"></i> Agregar Paquete</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <textarea v-model="nuevoPaquete.descripcion" @blur="verificarPaqueteDuplicado" placeholder="Ingrese la descripción del paquete" required rows="2" style="resize: vertical; width: 300px;"></textarea>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Precio Total: *</label>
                                <input type="number" v-model="nuevoPaquete.precioTotal" placeholder="Precio total" required/>
                            </div>
                            <div class="form-col">
                                <label>Descuento Aplicado:</label>
                                <input type="number" v-model="nuevoPaquete.descuentoAplicado" placeholder="Descuento"/>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button @click="agregarPaquete" class="btn">Agregar</button>
                            <button @click="mostrarFormPaquete = false" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </div>
                
                <!-- Modal para agregar servicio -->
                <div v-if="mostrarFormServicio" class="modal-overlay" @click="mostrarFormServicio = false">
                    <div class="modal-content modal-large" @click.stop>
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
                            <div class="form-col">
                                <label>Categoría:</label>
                                <select v-model="nuevoServicio.categoriaId">
                                    <option value="" disabled>Selecciona una categoría</option>
                                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                        {{ categoria.descripcion }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción:</label>
                                <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2" style="resize: vertical; width: 200px;"></textarea>
                            </div>
                            <div class="form-col" style="display: flex; align-items: flex-end; padding-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; margin: 0;">
                                    <input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0;"/>
                                    Servicio Activo
                                </label>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button @click="agregarServicio" class="btn">Agregar</button>
                            <button @click="mostrarFormServicio = false" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </div>
                
                <!-- Mensaje de notificación -->
                <div v-if="mensaje" class="mensaje-overlay" @click="cerrarMensaje">
                    <div class="mensaje-modal" @click.stop>
                        <div class="mensaje-contenido" :class="tipoMensaje">
                            <p>{{ mensaje }}</p>
                            <button @click="cerrarMensaje" class="btn btn-cerrar">Cerrar</button>
                        </div>
                    </div>
                </div>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoModificar ? 'Modificar Relación - ' + getPaqueteNombre(nuevaRelacion.paqueteId) + ' - ' + getServicioNombre(nuevaRelacion.servicioId) : 'Nueva Relación Paquete-Servicio' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Paquete: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevaRelacion.paqueteId" @change="verificarDuplicado" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Paquete</option>
                                        <option v-for="paquete in paquetes" :key="paquete.id" :value="paquete.id">
                                            {{ paquete.descripcion }}
                                        </option>
                                    </select>
                                    <button type="button" @click="mostrarFormPaquete = true" class="btn btn-small">+</button>
                                </div>
                            </div>
                            <div class="form-col">
                                <label>Servicio: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevaRelacion.servicioId" @change="verificarDuplicado" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Servicio</option>
                                        <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                            {{ servicio.nombre }}
                                        </option>
                                    </select>
                                    <button type="button" @click="mostrarFormServicio = true" class="btn btn-small">+</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoModificar ? modificarRelacion() : agregarRelacion()" class="btn">
                                {{ modoModificar ? 'Modificar' : 'Agregar' }} Relación
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
style.textContent = 'input, textarea, select { background: #fcccce2 !important; border: 2px solid #87ceeb !important; padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { background: #fcccce2 !important; padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; border-radius: 8px; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; } .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); } .modal-content { background: rgba(248, 187, 208, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); } .modal-large { max-width: 700px; } .modal-content h3 { color: #66bb6a; text-align: center; margin-bottom: 20px; font-weight: 600; } .modal-content label { color: #66bb6a; font-weight: 600; margin-bottom: 8px; display: block; font-size: 14px; } .modal-content input, .modal-content textarea, .modal-content select { width: 100%; padding: 12px 15px; border: 2px solid #b3e5fc; border-radius: 12px; margin: 8px 0; background: rgba(252, 204, 206, 0.8); color: #66bb6a; font-size: 14px; transition: all 0.3s ease; } .modal-content input:focus, .modal-content textarea:focus, .modal-content select:focus { outline: none; border-color: #81d4fa; box-shadow: 0 0 15px rgba(129, 212, 250, 0.3); transform: translateY(-1px); } .modal-buttons { margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; backdrop-filter: blur(5px); } .mensaje-modal { background: rgba(252, 228, 236, 0.95); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); max-width: 400px; width: 90%; } .mensaje-contenido { padding: 25px; text-align: center; } .mensaje-contenido p { color: #66bb6a; font-weight: 500; margin-bottom: 15px; } .mensaje-contenido.error { border-left: 4px solid #ef5350; } .mensaje-contenido.exito { border-left: 4px solid #66bb6a; } .btn-cerrar { background: linear-gradient(135deg, #b3e5fc, #81d4fa); color: #0277bd; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(129, 212, 250, 0.3); } .btn-cerrar:hover { background: linear-gradient(135deg, #81d4fa, #4fc3f7); color: white; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4); }';
document.head.appendChild(style);