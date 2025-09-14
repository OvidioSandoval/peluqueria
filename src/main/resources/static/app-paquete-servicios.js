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
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoPaquete: { 
                id: null, 
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            },
            paqueteSeleccionado: '',
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
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/login';
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
            if (this.filtroBusqueda) {
                this.paquetesFiltrados = this.paquetes.filter(paquete =>
                    paquete.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            } else {
                this.paquetesFiltrados = this.paquetes;
            }
        },
        async agregarPaquete() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/agregar_paquete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    await this.fetchPaquetes();
                    this.toggleFormulario();
                    NotificationSystem.success('Paquete agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar paquete:', error);
                NotificationSystem.error(`Error al agregar paquete: ${error.message}`);
            }
        },
        async modificarPaquete() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes/actualizar_paquete/${this.nuevoPaquete.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoPaquete)
                });
                if (response.ok) {
                    await this.fetchPaquetes();
                    this.toggleFormulario();
                    NotificationSystem.success('Paquete actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar paquete:', error);
                NotificationSystem.error(`Error al modificar paquete: ${error.message}`);
            }
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
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoPaquete = { 
                id: null, 
                descripcion: '',
                precioTotal: null,
                descuentoAplicado: null
            };
            this.paqueteSeleccionado = '';
        },
        cargarPaquete(paquete) {
            this.nuevoPaquete = { ...paquete };
            this.formularioVisible = true;
            this.paqueteSeleccionado = paquete.descripcion;
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
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Paquetes de Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Paquete:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarPaquetes" placeholder="Buscar paquete..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Paquete</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoPaquete.id ? 'Modificar Paquete - ' + nuevoPaquete.descripcion : 'Agregar Paquete' }}</h3>
                        <label>Descripción:</label>
                        <textarea v-model="nuevoPaquete.descripcion" placeholder="Descripción" required></textarea>
                        <br>
                        <label>Precio Total:</label>
                        <input type="number" v-model="nuevoPaquete.precioTotal" placeholder="Precio Total" required/>
                        <label>Descuento Aplicado:</label>
                        <input type="number" v-model="nuevoPaquete.descuentoAplicado" placeholder="Descuento Aplicado"/>
                        <div class="form-buttons">
                            <button @click="nuevoPaquete.id ? modificarPaquete() : agregarPaquete()" class="btn">
                                {{ nuevoPaquete.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción</th>
                                <th>Precio Total</th>
                                <th>Descuento Aplicado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="paquete in paquetesPaginados" :key="paquete.id">
                                <td>{{ paquete.id }}</td>
                                <td>{{ paquete.descripcion }}</td>
                                <td>{{ formatearNumero(paquete.precioTotal) }}</td>
                                <td>{{ formatearNumero(paquete.descuentoAplicado) }}</td>
                                <td>
                                    <button @click="cargarPaquete(paquete)" class="btn-small">Editar</button>
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
