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
            areas: [],
            areasFiltradas: [],

            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaArea: { id: null, nombre: '' },
            areaSeleccionada: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchAreas();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.areasFiltradas.length / this.itemsPorPagina);
        },
        areasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.areasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/areas';
            }
        },
        async fetchAreas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/areas`);
                this.areas = await response.json();
                this.filtrarAreas();
            } catch (error) {
                console.error('Error al cargar áreas:', error);
                NotificationSystem.error(`Error al cargar las áreas: ${error.message}`);
            }
        },
        filtrarAreas() {
            this.areasFiltradas = this.areas;
        },
        async agregarArea() {
            try {
                const areaData = {
                    ...this.nuevaArea,
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre)
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/agregar_area`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchAreas();
                    NotificationSystem.success('Área agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar área:', error);
                NotificationSystem.error(`Error al agregar área: ${error.message}`);
            }
        },
        async modificarArea() {
            try {
                const areaData = {
                    ...this.nuevaArea,
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre)
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/actualizar_area/${this.nuevaArea.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchAreas();
                    NotificationSystem.success('Área actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar área:', error);
                NotificationSystem.error(`Error al modificar área: ${error.message}`);
            }
        },
        async eliminarArea(area) {
            NotificationSystem.confirm(`¿Eliminar área "${area.nombre}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/areas/eliminar_area/${area.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchAreas();
                    NotificationSystem.success('Área eliminada exitosamente');
                } catch (error) {
                    console.error('Error al eliminar área:', error);
                    NotificationSystem.error('Error al eliminar área');
                }
            });
        },
        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaArea = { id: null, nombre: '' };
            this.areaSeleccionada = '';
            if (!this.formularioVisible) {
                await this.fetchAreas();
            }
        },
        cargarArea(area) {
            this.nuevaArea = { ...area };
            this.formularioVisible = true;
            this.areaSeleccionada = area.nombre;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchAreas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirAreas() {
            window.location.href = '/web/areas';
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
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Áreas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nueva Área</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevaArea.id ? 'Modificar Área: ' + areaSeleccionada : 'Agregar Área' }}</h3>
                        <label>Nombre:</label>
                        <input type="text" v-model="nuevaArea.nombre" placeholder="Nombre" required/>
                        <div class="form-buttons">
                            <button @click="nuevaArea.id ? modificarArea() : agregarArea()" class="btn">
                                {{ nuevaArea.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" class="btn">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="area in areasPaginadas" :key="area.id">
                                <td>{{ area.id }}</td>
                                <td>{{ area.nombre }}</td>
                                <td>
                                    <button @click="cargarArea(area)" class="btn-small">Editar</button>
                                    <button @click="eliminarArea(area)" class="btn-small btn-danger">Eliminar</button>
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




