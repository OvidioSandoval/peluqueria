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
            ventas: [],
            ventasFiltradas: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchVentas();

        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.ventasFiltradas.length / this.itemsPorPagina);
        },
        ventasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.ventasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalVentas() {
            return this.ventasFiltradas.reduce((sum, venta) => sum + (venta.montoTotal || 0), 0);
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
                window.location.href = '/web/ventas';
            }
        },
        async fetchVentas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.ventas = await response.json();
                this.filtrarVentas();
            } catch (error) {
                console.error('Error al cargar ventas:', error);
                NotificationSystem.error(`Error al cargar las ventas: ${error.message}`);
            }
        },


        filtrarVentas() {
            let filtradas = [...this.ventas];
            
            if (this.filtroBusqueda) {
                filtradas = filtradas.filter(venta =>
                    venta.id.toString().includes(this.filtroBusqueda) ||
                    venta.montoTotal.toString().includes(this.filtroBusqueda) ||
                    this.getClienteName(venta).toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            }
            
            if (this.filtroFecha) {
                filtradas = filtradas.filter(venta => {
                    if (!venta.fechaVenta) return false;
                    const fechaVenta = this.formatearFechaParaFiltro(venta.fechaVenta);
                    return fechaVenta === this.filtroFecha;
                });
            }
            
            this.ventasFiltradas = filtradas;
        },

        getClienteName(venta) {
            return venta.cliente ? venta.cliente.nombreCompleto || venta.cliente.nombre : '-';
        },
        getEmpleadoName(venta) {
            return venta.empleado ? venta.empleado.nombreCompleto || venta.empleado.nombre : '-';
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
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchVentas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirVentas() {
            window.location.href = '/web/ventas';
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
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarVentas();
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 90px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Venta:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarVentas" placeholder="Buscar por ID, monto o cliente..." class="search-bar"/>
                        </div>
                        <div class="filter-group">
                            <label>Filtrar por Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarVentas" class="search-bar"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
                    </div>

                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Empleado</th>
                                <th>Fecha</th>
                                <th>Monto Total</th>
                                <th>Método Pago</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="venta in ventasPaginadas" :key="venta.id">
                                <td>{{ venta.id }}</td>
                                <td>{{ getClienteName(venta) }}</td>
                                <td>{{ getEmpleadoName(venta) }}</td>
                                <td>{{ formatearFecha(venta.fechaVenta) }}</td>
                                <td>{{ formatearNumero(venta.montoTotal) }}</td>
                                <td>{{ venta.metodoPago }}</td>

                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total: {{ formatearNumero(totalVentas) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});
// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
    .info-section {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        border-left: 4px solid #007bff;
    }
    .info-section p {
        margin: 5px 0;
        color: #333;
    }
`;
document.head.appendChild(style);
