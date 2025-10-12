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
            categorias: [],
            servicios: [],
            nuevoServicio: { 
                id: null,
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            cargando: false,
            mostrarFormCategoria: false,
            nuevaCategoria: {
                descripcion: ''
            },
            modoEdicion: false,
            servicioExistente: null
        };
    },
    mounted() {
        this.fetchCategorias();
        this.fetchServicios();
    },
    methods: {
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (!response.ok) throw new Error('Error al cargar servicios');
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar servicios');
            }
        },
        verificarServicioExistente() {
            if (!this.nuevoServicio.nombre.trim()) return;
            
            const nombreBuscar = this.nuevoServicio.nombre.trim().toLowerCase();
            this.servicioExistente = this.servicios.find(s => 
                s.nombre.toLowerCase() === nombreBuscar
            );
            
            if (this.servicioExistente && !this.modoEdicion) {
                NotificationSystem.error(`El servicio "${this.servicioExistente.nombre}" ya está guardado.`);
                NotificationSystem.confirm(
                    `¿Desea modificar los datos del servicio "${this.servicioExistente.nombre}"?`,
                    () => {
                        this.cargarServicioParaEdicion(this.servicioExistente);
                    }
                );
            }
        },
        cargarServicioParaEdicion(servicio) {
            this.nuevoServicio = { 
                id: servicio.id,
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                precioBase: servicio.precioBase || 0,
                activo: servicio.activo !== undefined ? servicio.activo : true,
                categoriaId: servicio.categoria ? servicio.categoria.id : (servicio.categoriaId || null)
            };
            this.modoEdicion = true;
            this.servicioExistente = servicio;
        },
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                this.categorias = await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                NotificationSystem.error('Error al cargar categorías');
            }
        },
        async agregarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                NotificationSystem.error('El precio base debe ser mayor a 0');
                return;
            }
            try {
                this.cargando = true;
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
                    NotificationSystem.success('Servicio agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchServicios();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar servicio:', error);
                NotificationSystem.error(`Error al agregar servicio: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        async modificarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                NotificationSystem.error('El precio base debe ser mayor a 0');
                return;
            }
            try {
                this.cargando = true;
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: this.nuevoServicio.categoriaId }
                };
                const response = await fetch(`${config.apiBaseUrl}/servicios/actualizar_servicio/${this.nuevoServicio.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servicioData)
                });
                if (response.ok) {
                    NotificationSystem.success('Servicio actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchServicios();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar servicio:', error);
                NotificationSystem.error(`Error al modificar servicio: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        limpiarFormulario() {
            this.nuevoServicio = { 
                id: null,
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            };
            this.modoEdicion = false;
            this.servicioExistente = null;
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        async agregarCategoria() {
            if (!this.nuevaCategoria.descripcion.trim()) {
                NotificationSystem.error('La descripción es requerida');
                return;
            }
            try {
                const categoriaData = {
                    descripcion: this.capitalizarTexto(this.nuevaCategoria.descripcion.trim())
                };
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios/agregar_categoria`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
                if (response.ok) {
                    const nuevaCat = await response.json();
                    await this.fetchCategorias();
                    this.nuevoServicio.categoriaId = nuevaCat.id;
                    this.mostrarFormCategoria = false;
                    this.nuevaCategoria.descripcion = '';
                    NotificationSystem.success('Categoría agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar categoría:', error);
                NotificationSystem.error(`Error al agregar categoría: ${error.message}`);
            }
        },
        toggleFormCategoria() {
            this.mostrarFormCategoria = !this.mostrarFormCategoria;
            this.nuevaCategoria.descripcion = '';
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Editar Servicio' : 'Registro de Servicio' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Servicio - ' + nuevoServicio.nombre : 'Nuevo Servicio' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoServicio.nombre" @input="verificarServicioExistente" placeholder="Ingrese el nombre del servicio" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Precio Base: *</label>
                                <input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Categoría:</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoServicio.categoriaId" style="flex: 1; border: 2px solid #87CEEB;">
                                        <option value="" disabled selected>Selecciona una categoría</option>
                                        <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                            {{ categoria.descripcion }}
                                        </option>
                                    </select>
                                    <button @click="toggleFormCategoria()" class="btn btn-small" type="button">+</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-row" style="gap: 20px;">
                            <div class="form-col" style="flex: none; width: 150px;">
                                <label>Descripción:</label>
                                <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2" style="resize: vertical; width: 150px; border: 2px solid #87CEEB;"></textarea>
                            </div>
                            <div class="form-col" style="flex: none; width: auto; display: flex; align-items: flex-end; padding-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; margin: 0; white-space: nowrap;">
                                    <input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0;"/>
                                    Servicio Activo
                                </label>
                            </div>
                        </div>
                        
                        <div v-if="mostrarFormCategoria" class="form-container" style="margin-top: 20px; padding: 15px; border: 2px dashed #ccc;">
                            <h4>Nueva Categoría</h4>
                            <label>Descripción: *</label>
                            <textarea v-model="nuevaCategoria.descripcion" placeholder="Ingrese la descripción de la categoría" required rows="2" style="resize: vertical; width: 100%; border: 2px solid #87CEEB;"></textarea>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button @click="agregarCategoria()" class="btn btn-small">Agregar Categoría</button>
                                <button @click="toggleFormCategoria()" class="btn btn-secondary btn-small">Cancelar</button>
                            </div>
                        </div>
                        
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarServicio() : agregarServicio()" class="btn" :disabled="cargando">
                                {{ cargando ? 'Guardando...' : (modoEdicion ? 'Modificar' : 'Agregar') }}
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : window.history.back()" class="btn btn-secondary">
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
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; }';
document.head.appendChild(style);