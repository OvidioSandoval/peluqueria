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
            proveedores: [],
            proveedoresFiltrados: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoProveedor: { 
                id: null, 
                descripcion: ''
            },
            proveedorSeleccionado: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchProveedores();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.proveedoresFiltrados.length / this.itemsPorPagina);
        },
        proveedoresPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.proveedoresFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/proveedores';
            }
        },
        async fetchProveedores() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.proveedores = await response.json();
                this.filtrarProveedores();
            } catch (error) {
                console.error('Error al cargar proveedores:', error);
                NotificationSystem.error(`Error al cargar los proveedores: ${error.message}`);
            }
        },
        filtrarProveedores() {
            if (this.filtroBusqueda) {
                this.proveedoresFiltrados = this.proveedores.filter(proveedor =>
                    proveedor.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            } else {
                this.proveedoresFiltrados = this.proveedores;
            }
        },
        async agregarProveedor() {
            if (!this.nuevoProveedor.descripcion.trim()) {
                NotificationSystem.error('La descripción es requerida');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores/agregar_proveedor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoProveedor)
                });
                if (response.ok) {
                    await this.fetchProveedores();
                    this.toggleFormulario();
                    NotificationSystem.success('Proveedor agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar proveedor:', error);
                NotificationSystem.error(`Error al agregar proveedor: ${error.message}`);
            }
        },
        async modificarProveedor() {
            if (!this.nuevoProveedor.descripcion.trim()) {
                NotificationSystem.error('La descripción es requerida');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores/actualizar_proveedor/${this.nuevoProveedor.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoProveedor)
                });
                if (response.ok) {
                    await this.fetchProveedores();
                    this.toggleFormulario();
                    NotificationSystem.success('Proveedor actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar proveedor:', error);
                NotificationSystem.error(`Error al modificar proveedor: ${error.message}`);
            }
        },
        async eliminarProveedor(proveedor) {
            NotificationSystem.confirm(`¿Eliminar proveedor "${proveedor.descripcion}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/proveedores/eliminar_proveedor/${proveedor.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchProveedores();
                        NotificationSystem.success('Proveedor eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar proveedor:', error);
                    NotificationSystem.error(`Error al eliminar proveedor: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoProveedor = { 
                id: null, 
                descripcion: ''
            };
            this.proveedorSeleccionado = '';
        },
        cargarProveedor(proveedor) {
            this.nuevoProveedor = { ...proveedor };
            this.formularioVisible = true;
            this.proveedorSeleccionado = proveedor.descripcion;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchProveedores();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirProveedores() {
            window.location.href = '/web/proveedores';
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
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Proveedores</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Proveedor:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarProveedores" placeholder="Buscar proveedor..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Proveedor</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoProveedor.id ? 'Modificar Proveedor - ' + nuevoProveedor.descripcion : 'Agregar Proveedor' }}</h3>
                        <label>Descripción:</label>
                        <input type="text" v-model="nuevoProveedor.descripcion" placeholder="Descripción del proveedor" required/>
                        <div class="form-buttons">
                            <button @click="nuevoProveedor.id ? modificarProveedor() : agregarProveedor()" class="btn">
                                {{ nuevoProveedor.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="proveedor in proveedoresPaginados" :key="proveedor.id">
                                <td>{{ proveedor.id }}</td>
                                <td>{{ proveedor.descripcion }}</td>
                                <td>
                                    <button @click="cargarProveedor(proveedor)" class="btn-small">Editar</button>
                                    <button @click="eliminarProveedor(proveedor)" class="btn-small btn-danger">Eliminar</button>
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
