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

            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaRelacion: { 
                id: null, 
                paqueteId: null,
                servicioId: null,
                cantidad: 1
            },
            relacionSeleccionada: '',
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
            this.relacionesFiltradas = this.relaciones;
        },
        async agregarRelacion() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) {
                NotificationSystem.error('Debe seleccionar paquete y servicio');
                return;
            }
            try {
                const relacionData = {
                    paquete: { id: this.nuevaRelacion.paqueteId },
                    servicio: { id: this.nuevaRelacion.servicioId },
                    cantidad: parseInt(this.nuevaRelacion.cantidad)
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/agregar_paquete_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    const relacion = await response.json();
                    this.relaciones.push(relacion);
                    this.filtrarRelaciones();
                    this.toggleFormulario();
                    NotificationSystem.success('Relación agregada exitosamente');
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
                    paquete: { id: this.nuevaRelacion.paqueteId },
                    servicio: { id: this.nuevaRelacion.servicioId },
                    cantidad: parseInt(this.nuevaRelacion.cantidad)
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/actualizar_paquete_servicio/${this.nuevaRelacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    const relacion = await response.json();
                    const index = this.relaciones.findIndex(r => r.id === relacion.id);
                    if (index !== -1) this.relaciones[index] = relacion;
                    this.filtrarRelaciones();
                    this.toggleFormulario();
                    NotificationSystem.success('Relación actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar relación:', error);
                NotificationSystem.error(`Error al modificar relación: ${error.message}`);
            }
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
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaRelacion = { 
                id: null, 
                paqueteId: null,
                servicioId: null,
                cantidad: 1
            };
            this.relacionSeleccionada = '';
        },
        cargarRelacion(relacion) {
            this.nuevaRelacion = { 
                id: relacion.id,
                paqueteId: relacion.paqueteId,
                servicioId: relacion.servicioId,
                cantidad: relacion.cantidad
            };
            this.formularioVisible = true;
            this.relacionSeleccionada = `${relacion.paqueteDescripcion} - ${relacion.servicioNombre}`;
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
                <h1 class="page-title">Gestión de Paquetes - Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nueva Relación</button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container" style="width: fit-content; max-width: 800px;">
                        <h3>{{ nuevaRelacion.id ? 'Modificar Relación - ' + relacionSeleccionada : 'Nueva Relación' }}</h3>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Paquete: *</label>
                                <select v-model="nuevaRelacion.paqueteId" required>
                                    <option value="" disabled>Seleccionar Paquete</option>
                                    <option v-for="paquete in paquetes" :key="paquete.id" :value="paquete.id">
                                        {{ paquete.descripcion }}
                                    </option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label>Servicio: *</label>
                                <select v-model="nuevaRelacion.servicioId" required>
                                    <option value="" disabled>Seleccionar Servicio</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div style="flex: 0 0 150px;">
                                <label>Cantidad: *</label>
                                <input type="number" v-model="nuevaRelacion.cantidad" placeholder="Cantidad" min="1" required/>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="nuevaRelacion.id ? modificarRelacion() : agregarRelacion()" class="btn">
                                {{ nuevaRelacion.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Paquete</th>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="relacion in relacionesPaginadas" :key="relacion.id">
                                <td>{{ relacion.id }}</td>
                                <td>{{ getPaqueteDescripcion(relacion) }}</td>
                                <td>{{ getServicioName(relacion) }}</td>
                                <td>{{ formatearNumero(relacion.cantidad) }}</td>
                                <td>
                                    <button @click="cargarRelacion(relacion)" class="btn-small">Editar</button>
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





