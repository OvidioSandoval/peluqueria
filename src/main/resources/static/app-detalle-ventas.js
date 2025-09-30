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
            filtroBusqueda: '',
            filtroVenta: '',
            filtroProducto: '',
            filtroServicio: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchDetalles();

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
                    window.location.href = '/web/panel-control';
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

        filtrarDetalles() {
            let filtrados = this.detalles;
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    (detalle.venta && detalle.venta.id.toString().includes(busqueda)) ||
                    (detalle.servicio && detalle.servicio.nombre.toLowerCase().includes(busqueda)) ||
                    (detalle.producto && detalle.producto.nombre.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroVenta.trim() !== '') {
                filtrados = filtrados.filter(detalle =>
                    detalle.venta && detalle.venta.id.toString().includes(this.filtroVenta)
                );
            }
            
            if (this.filtroProducto.trim() !== '') {
                const producto = this.filtroProducto.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    detalle.producto && detalle.producto.nombre.toLowerCase().includes(producto)
                );
            }
            
            if (this.filtroServicio.trim() !== '') {
                const servicio = this.filtroServicio.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    detalle.servicio && detalle.servicio.nombre.toLowerCase().includes(servicio)
                );
            }
            
            if (this.filtroFecha) {
                filtrados = filtrados.filter(detalle => {
                    if (!detalle.venta || !detalle.venta.fechaVenta) return false;
                    const fechaVenta = this.formatearFechaParaFiltro(detalle.venta.fechaVenta);
                    return fechaVenta === this.filtroFecha;
                });
            }
            
            this.detallesFiltrados = filtrados;
        },

        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        formatearFecha(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            }
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        },
        formatearFechaParaFiltro(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroVenta = '';
            this.filtroProducto = '';
            this.filtroServicio = '';
            this.filtroFecha = '';
            this.filtrarDetalles();
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
                <h1 class="page-title">Gestión de Detalle de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-field">
                            <label>Buscar General:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarDetalles" placeholder="Buscar..." class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <label>ID Venta:</label>
                            <input type="text" v-model="filtroVenta" @input="filtrarDetalles" placeholder="ID Venta" class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <label>Producto:</label>
                            <input type="text" v-model="filtroProducto" @input="filtrarDetalles" placeholder="Nombre producto" class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <label>Servicio:</label>
                            <input type="text" v-model="filtroServicio" @input="filtrarDetalles" placeholder="Nombre servicio" class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <label>Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarDetalles" class="search-bar"/>
                        </div>
                        <div class="filter-field">
                            <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
                        </div>
                    </div>

                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Venta</th>
                                <th>Fecha Venta</th>
                                <th>Servicio</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio sin Desc.</th>
                                <th>Descuento (%)</th>
                                <th>Precio Total</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detalle in detallesPaginados" :key="detalle.id">
                                <td>{{ detalle.id }}</td>
                                <td>{{ detalle.venta ? 'Venta #' + detalle.venta.id : 'N/A' }}</td>
                                <td>{{ detalle.venta ? formatearFecha(detalle.venta.fechaVenta) : 'N/A' }}</td>
                                <td>{{ detalle.servicio ? detalle.servicio.nombre : 'N/A' }}</td>
                                <td>{{ detalle.producto ? detalle.producto.nombre : 'N/A' }}</td>
                                <td>{{ formatearNumero(detalle.cantidad) }}</td>
                                <td>{{ formatearNumero(detalle.precioUnitarioBruto) }}</td>
                                <td>{{ detalle.descuento }}%</td>
                                <td>{{ formatearNumero(detalle.precioTotal) }}</td>

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




