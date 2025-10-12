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
            relacionesFiltradas: [],
            paquetes: [],
            servicios: [],
            filtroPaquete: '',

            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchRelaciones();
        this.fetchPaquetes();
        this.fetchServicios();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.relacionesFiltradas.length / this.itemsPorPagina);
        },
        relacionesPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.relacionesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    watch: {
        filtroPaquete(newVal) {
            if (newVal === '') {
                this.filtrarRelaciones();
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
                window.location.href = '/web/paquetes-contiene-servicio';
            }
        },
        async fetchRelaciones() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.relaciones = await response.json();
                this.filtrarRelaciones();
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
        filtrarRelaciones() {
            if (this.filtroPaquete.trim() === '') {
                this.relacionesFiltradas = this.relaciones;
            } else {
                const busqueda = this.filtroPaquete.toLowerCase();
                this.relacionesFiltradas = this.relaciones.filter(relacion =>
                    this.getPaqueteDescripcion(relacion).toLowerCase().includes(busqueda) ||
                    this.getServicioName(relacion).toLowerCase().includes(busqueda)
                );
            }
            this.paginaActual = 1;
        },

        async eliminarRelacion(relacion) {
            NotificationSystem.confirm('¿Eliminar esta relación?', async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/paquetes-servicios/eliminar_paquete/${relacion.id}`, {
                        method: 'DELETE'
                    });
                    this.relaciones = this.relaciones.filter(r => r.id !== relacion.id);
                    this.filtrarRelaciones();
                    NotificationSystem.success('Relación eliminada exitosamente');
                } catch (error) {
                    console.error('Error al eliminar relación:', error);
                    NotificationSystem.error('Error al eliminar relación');
                }
            });
        },

        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        getPaqueteDescripcion(relacion) {
            return relacion.paqueteDescripcion || 'Paquete no encontrado';
        },
        getServicioName(relacion) {
            return relacion.servicioNombre || 'Servicio no encontrado';
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchRelaciones();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        redirigirPaquetesContieneServicio() {
            window.location.href = '/web/paquetes-contiene-servicio';
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
                <h1 class="page-title">Lista de Paquetes - Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div>
                            <label>Buscar por paquete o servicio:</label>
                            <input type="text" v-model="filtroPaquete" @input="filtrarRelaciones" placeholder="Buscar paquete o servicio..." style="width: 250px;"/>
                        </div>
                    </div>
                    

                    <table>
                        <thead>
                            <tr>
                                <th>Paquete</th>
                                <th>Servicio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="relacion in relacionesPaginadas" :key="relacion.id">
                                <td>{{ getPaqueteDescripcion(relacion) }}</td>
                                <td>{{ getServicioName(relacion) }}</td>
                                <td>
                                    <button @click="eliminarRelacion(relacion)" class="btn-small btn-danger">Eliminar</button>
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





