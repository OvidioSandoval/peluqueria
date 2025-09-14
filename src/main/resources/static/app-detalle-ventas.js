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
            detalles: [],
            detallesFiltrados: [],
            ventas: [],
            servicios: [],
            productos: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoDetalle: { 
                id: null, 
                venta: null,
                servicio: null,
                producto: null,
                cantidad: 1,
                precioUnitarioBruto: 0,
                precioTotal: 0,
                descuento: 0,
                precioUnitarioNeto: 0
            },
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchDetalles();
        this.fetchVentas();
        this.fetchServicios();
        this.fetchProductos();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.detallesFiltrados.length / this.itemsPorPagina);
        },
        detallesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.detallesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/detalle-ventas';
            }
        },
        async fetchDetalles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.detalles = await response.json();
                this.filtrarDetalles();
            } catch (error) {
                console.error('Error al cargar detalles:', error);
                NotificationSystem.error(`Error al cargar detalles de ventas: ${error.message}`);
            }
        },
        async fetchVentas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.ventas = await response.json();
            } catch (error) {
                console.error('Error al cargar ventas:', error);
                NotificationSystem.error(`Error al cargar ventas: ${error.message}`);
            }
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
                NotificationSystem.error(`Error al cargar servicios: ${error.message}`);
            }
        },
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.productos = await response.json();
            } catch (error) {
                console.error('Error al cargar productos:', error);
                NotificationSystem.error(`Error al cargar productos: ${error.message}`);
            }
        },
        filtrarDetalles() {
            if (this.filtroBusqueda.trim() === '') {
                this.detallesFiltrados = this.detalles;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.detallesFiltrados = this.detalles.filter(detalle =>
                    (detalle.venta && detalle.venta.id.toString().includes(busqueda)) ||
                    (detalle.servicio && detalle.servicio.nombre.toLowerCase().includes(busqueda)) ||
                    (detalle.producto && detalle.producto.nombre.toLowerCase().includes(busqueda))
                );
            }
        },
        calcularPrecios() {
            if (this.nuevoDetalle.cantidad && this.nuevoDetalle.precioUnitarioBruto) {
                const descuentoPorcentaje = this.nuevoDetalle.descuento || 0;
                const montoDescuento = this.nuevoDetalle.precioUnitarioBruto * (descuentoPorcentaje / 100);
                this.nuevoDetalle.precioUnitarioNeto = this.nuevoDetalle.precioUnitarioBruto - montoDescuento;
                this.nuevoDetalle.precioTotal = this.nuevoDetalle.cantidad * this.nuevoDetalle.precioUnitarioNeto;
            }
        },
        async agregarDetalle() {
            this.calcularPrecios();
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-ventas/agregar_detalle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoDetalle)
                });
                if (response.ok) {
                    const detalle = await response.json();
                    this.detalles.push(detalle);
                    this.filtrarDetalles();
                    this.toggleFormulario();
                    NotificationSystem.success('Detalle agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar detalle:', error);
                NotificationSystem.error(`Error al agregar detalle: ${error.message}`);
            }
        },
        async modificarDetalle() {
            this.calcularPrecios();
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-ventas/actualizar_detalle/${this.nuevoDetalle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoDetalle)
                });
                if (response.ok) {
                    const detalle = await response.json();
                    const index = this.detalles.findIndex(d => d.id === detalle.id);
                    if (index !== -1) this.detalles[index] = detalle;
                    this.filtrarDetalles();
                    this.toggleFormulario();
                    NotificationSystem.success('Detalle actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar detalle:', error);
                NotificationSystem.error(`Error al modificar detalle: ${error.message}`);
            }
        },
        async eliminarDetalle(detalle) {
            NotificationSystem.confirm(`¿Eliminar detalle de venta #${detalle.id}?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/detalle-ventas/eliminar_detalle/${detalle.id}`, {
                        method: 'DELETE'
                    });
                    this.detalles = this.detalles.filter(d => d.id !== detalle.id);
                    this.filtrarDetalles();
                    NotificationSystem.success('Detalle eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar detalle:', error);
                    NotificationSystem.error('Error al eliminar detalle');
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoDetalle = { 
                id: null, 
                venta: null,
                servicio: null,
                producto: null,
                cantidad: 1,
                precioUnitarioBruto: 0,
                precioTotal: 0,
                descuento: 0,
                precioUnitarioNeto: 0
            };
        },
        cargarDetalle(detalle) {
            this.nuevoDetalle = { ...detalle };
            this.formularioVisible = true;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchDetalles();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirDetalleVentas() {
            window.location.href = '/web/detalle-ventas';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Detalle de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-field">
                            <label>Buscar Detalle:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarDetalles" placeholder="Buscar detalle..." class="search-bar"/>
                        </div>
                    </div>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Detalle</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoDetalle.id ? 'Modificar' : 'Agregar' }} Detalle de Venta</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Venta *</label>
                                <select v-model="nuevoDetalle.venta" required>
                                    <option value="" disabled>Seleccionar Venta</option>
                                    <option v-for="venta in ventas" :key="venta.id" :value="venta">
                                        Venta #{{ venta.id }} - {{ formatearNumero(venta.total) }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Servicio</label>
                                <select v-model="nuevoDetalle.servicio">
                                    <option value="" disabled>Seleccionar Servicio</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Producto</label>
                                <select v-model="nuevoDetalle.producto">
                                    <option value="" disabled>Seleccionar Producto</option>
                                    <option v-for="producto in productos" :key="producto.id" :value="producto">
                                        {{ producto.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Cantidad *</label>
                                <input type="number" v-model="nuevoDetalle.cantidad" @input="calcularPrecios" min="1" required/>
                            </div>
                            <div class="form-field">
                                <label>Precio Unitario sin Descuento *</label>
                                <input type="number" v-model="nuevoDetalle.precioUnitarioBruto" @input="calcularPrecios" min="0" required/>
                            </div>
                            <div class="form-field">
                                <label>Descuento (%)</label>
                                <input type="number" v-model="nuevoDetalle.descuento" @input="calcularPrecios" min="0" max="100" step="0.01"/>
                            </div>
                            <div class="form-field">
                                <label>Precio Unitario con Descuento</label>
                                <input type="number" v-model="nuevoDetalle.precioUnitarioNeto" readonly style="background-color: #f5f5f5;"/>
                            </div>
                            <div class="form-field">
                                <label>Precio Total</label>
                                <input type="number" v-model="nuevoDetalle.precioTotal" readonly style="background-color: #f5f5f5;"/>
                            </div>
                        </div>
                        <div class="form-buttons" style="margin-top: 15px;">
                            <button @click="nuevoDetalle.id ? modificarDetalle() : agregarDetalle()" class="btn">
                                {{ nuevoDetalle.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Venta</th>
                                <th>Servicio</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio sin Desc.</th>
                                <th>Descuento (%)</th>
                                <th>Precio Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detalle in detallesPaginados" :key="detalle.id">
                                <td>{{ detalle.id }}</td>
                                <td>{{ detalle.venta ? 'Venta #' + detalle.venta.id : 'N/A' }}</td>
                                <td>{{ detalle.servicio ? detalle.servicio.nombre : 'N/A' }}</td>
                                <td>{{ detalle.producto ? detalle.producto.nombre : 'N/A' }}</td>
                                <td>{{ formatearNumero(detalle.cantidad) }}</td>
                                <td>{{ formatearNumero(detalle.precioUnitarioBruto) }}</td>
                                <td>{{ detalle.descuento }}%</td>
                                <td>{{ formatearNumero(detalle.precioTotal) }}</td>
                                <td>
                                    <button @click="cargarDetalle(detalle)" class="btn-small">Editar</button>
                                    <button @click="eliminarDetalle(detalle)" class="btn-small btn-danger">Eliminar</button>
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

// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
    }
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .form-field label {
        font-weight: bold;
        color: #333;
        font-size: 14px;
    }
    .form-field input, .form-field select {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    .filters-container {
        display: flex !important;
        gap: 20px;
        margin-bottom: 15px;
        align-items: end;
    }
    .filter-field {
        display: flex !important;
        flex-direction: column !important;
        gap: 5px;
    }
    .filter-field label {
        font-weight: bold !important;
        color: #333 !important;
        font-size: 14px !important;
        margin-bottom: 5px !important;
    }
`;
document.head.appendChild(style);