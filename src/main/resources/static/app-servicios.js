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
            servicios: [],
            serviciosFiltrados: [],
            categorias: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoServicio: { 
                id: null, 
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            servicioSeleccionado: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchServicios();
        this.fetchCategorias();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.serviciosFiltrados.length / this.itemsPorPagina);
        },
        serviciosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.serviciosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/servicios';
            }
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.servicios = await response.json();
                this.filtrarServicios();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
                NotificationSystem.error(`Error al cargar los servicios: ${error.message}`);
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
        filtrarServicios() {
            if (this.filtroBusqueda.trim() === '') {
                this.serviciosFiltrados = this.servicios;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.serviciosFiltrados = this.servicios.filter(servicio =>
                    servicio.nombre.toLowerCase().includes(busqueda) ||
                    (servicio.descripcion && servicio.descripcion.toLowerCase().includes(busqueda))
                );
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
            if (!this.nuevoServicio.categoriaId) {
                NotificationSystem.error('Debe seleccionar una categoría');
                return;
            }
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
                    NotificationSystem.success('Servicio agregado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar servicio:', error);
                NotificationSystem.error(`Error al agregar servicio: ${error.message}`);
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
            if (!this.nuevoServicio.categoriaId) {
                NotificationSystem.error('Debe seleccionar una categoría');
                return;
            }
            try {
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
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar servicio:', error);
                NotificationSystem.error(`Error al modificar servicio: ${error.message}`);
            }
        },
        async eliminarServicio(servicio) {
            NotificationSystem.confirm(`¿Eliminar servicio "${servicio.nombre}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/servicios/eliminar_servicio/${servicio.id}`, {
                        method: 'DELETE'
                    });
                    NotificationSystem.success('Servicio eliminado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } catch (error) {
                    console.error('Error al eliminar servicio:', error);
                    NotificationSystem.error('Error al eliminar servicio');
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoServicio = { 
                id: null, 
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            };
            this.servicioSeleccionado = '';
        },
        cargarServicio(servicio) {
            this.nuevoServicio = { 
                id: servicio.id,
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                precioBase: servicio.precioBase || 0,
                activo: servicio.activo !== undefined ? servicio.activo : true,
                categoriaId: servicio.categoria ? servicio.categoria.id : (servicio.categoriaId || null)
            };
            this.formularioVisible = true;
            this.servicioSeleccionado = servicio.nombre;
        },
        getCategoriaDescripcion(servicio) {
            return servicio.categoriaDescripcion || 'Sin categoría';
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        startAutoRefresh() {
            // Autorefresh deshabilitado - solo refresh manual en acciones
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirServicios() {
            window.location.href = '/web/servicios';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        getCategoriaSeleccionada() {
            if (!this.nuevoServicio.categoriaId) return '';
            const categoria = this.categorias.find(c => c.id == this.nuevoServicio.categoriaId);
            return categoria ? categoria.descripcion : '';
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Servicio:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarServicios" placeholder="Buscar servicio..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Servicio</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoServicio.id ? 'Modificar Servicio: ' + servicioSeleccionado : 'Agregar Servicio' }}</h3>
                        <label>Nombre:</label>
                        <input type="text" v-model="nuevoServicio.nombre" placeholder="Nombre" required/>
                        <label>Descripción:</label>
                        <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción"></textarea>
                        <br>
                        <label>Precio Base:</label>
                        <input type="number" v-model="nuevoServicio.precioBase" placeholder="Precio Base" required/>
                        <label>Categoría:</label>
                        <select v-model="nuevoServicio.categoriaId" required>
                            <option value="" disabled>Seleccionar Categoría</option>
                            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                {{ categoria.descripcion }}
                            </option>
                        </select>
                        <label style="display: inline-flex; align-items: center; margin: 0; padding: 0; white-space: nowrap;">
                            Activo:<input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0; padding: 0; margin-left: 1px;"/>
                        </label>
                        <div class="form-buttons">
                            <button @click="nuevoServicio.id ? modificarServicio() : agregarServicio()" class="btn">
                                {{ nuevoServicio.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio Base</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="servicio in serviciosPaginados" :key="servicio.id">
                                <td>{{ servicio.id }}</td>
                                <td>{{ servicio.nombre }}</td>
                                <td>{{ servicio.descripcion }}</td>
                                <td>{{ formatearNumero(servicio.precioBase) }}</td>
                                <td>{{ getCategoriaDescripcion(servicio) }}</td>
                                <td>{{ servicio.activo ? 'Activo' : 'Inactivo' }}</td>
                                <td>
                                    <button @click="cargarServicio(servicio)" class="btn-small">Editar</button>
                                    <button @click="eliminarServicio(servicio)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                </main>
            </div>
        </div>
    `
});
