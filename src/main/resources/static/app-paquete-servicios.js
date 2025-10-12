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
            paquetes: [],
            paquetesFiltrados: [],
            filtroDescripcion: '',

            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchPaquetes();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.paquetesFiltrados.length / this.itemsPorPagina);
        },
        paquetesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.paquetesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    watch: {
        filtroDescripcion(newVal) {
            if (newVal === '') {
                this.filtrarPaquetes();
            }
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
                window.location.href = '/web/paquete-servicios';
            }
        },
        async fetchPaquetes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.paquetes = await response.json();
                this.filtrarPaquetes();
            } catch (error) {
                console.error('Error al cargar paquetes:', error);
                NotificationSystem.error(`Error al cargar los paquetes: ${error.message}`);
            }
        },
        filtrarPaquetes() {
            this.paquetesFiltrados = this.paquetes.filter(paquete => 
                paquete.descripcion.toLowerCase().includes(this.filtroDescripcion.toLowerCase())
            );
            this.paginaActual = 1;
        },

        async eliminarPaquete(paquete) {
            NotificationSystem.confirm(`¿Eliminar paquete "${paquete.descripcion}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/paquetes/eliminar_paquete/${paquete.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchPaquetes();
                    NotificationSystem.success('Paquete eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar paquete:', error);
                    NotificationSystem.error('Error al eliminar paquete');
                }
            });
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
                this.fetchPaquetes();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirPaqueteServicios() {
            window.location.href = '/web/paquete-servicios';
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
                <h1 class="page-title">Lista de Paquetes de Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div>
                            <label>Buscar por descripción:</label>
                            <input type="text" v-model="filtroDescripcion" @input="filtrarPaquetes" placeholder="Buscar descripción..." style="width: 200px;"/>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Precio Total</th>
                                <th>Descuento Aplicado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="paquete in paquetesPaginados" :key="paquete.id">
                                <td>{{ paquete.descripcion }}</td>
                                <td>{{ formatearNumero(paquete.precioTotal) }}</td>
                                <td>{{ formatearNumero(paquete.descuentoAplicado) }}</td>
                                <td>
                                    <button @click="eliminarPaquete(paquete)" class="btn-small btn-danger">Eliminar</button>
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





