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
            roles: [],
            filtroBusqueda: '',
            rolesFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoRol: {
                id: null,
                descripcion: ''
            },
            rolSeleccionado: ''
        };
    },
    mounted() {
        this.fetchRoles();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.rolesFiltrados.length / this.itemsPorPagina);
        },
        rolesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.rolesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchRoles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/roles`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.roles = await response.json();
                this.filtrarRoles();
            } catch (error) {
                console.error('Error al cargar roles:', error);
                NotificationSystem.error(`Error al cargar los roles: ${error.message}`);
            }
        },
        filtrarRoles() {
            if (this.filtroBusqueda.trim() === '') {
                this.rolesFiltrados = this.roles;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.rolesFiltrados = this.roles.filter(rol =>
                    rol.descripcion && rol.descripcion.toLowerCase().includes(busqueda)
                );
            }
            this.paginaActual = 1;
        },
        async agregarRol() {
            if (!this.nuevoRol.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    await this.fetchRoles();
                    this.toggleFormulario();
                    NotificationSystem.success('Rol agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar rol:', error);
                NotificationSystem.error(`Error al agregar rol: ${error.message}`);
            }
        },
        async modificarRol() {
            if (!this.nuevoRol.descripcion.trim()) {
                NotificationSystem.error('La descripción es obligatoria');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/roles/${this.nuevoRol.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoRol)
                });
                if (response.ok) {
                    await this.fetchRoles();
                    this.toggleFormulario();
                    NotificationSystem.success('Rol actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar rol:', error);
                NotificationSystem.error(`Error al modificar rol: ${error.message}`);
            }
        },
        async eliminarRol(rol) {
            NotificationSystem.confirm(`¿Eliminar rol "${rol.descripcion}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/api/roles/${rol.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchRoles();
                        NotificationSystem.success('Rol eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar rol:', error);
                    NotificationSystem.error(`Error al eliminar rol: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoRol = { id: null, descripcion: '' };
            this.rolSeleccionado = '';
        },
        cargarRol(rol) {
            this.nuevoRol = { id: rol.id, descripcion: rol.descripcion };
            this.formularioVisible = true;
            this.rolSeleccionado = rol.descripcion;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Roles</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <div v-if="formularioVisible" class="form-container">
                    <h2>{{ nuevoRol.id ? 'Modificar' : 'Agregar' }} Rol</h2>
                    <form @submit.prevent="nuevoRol.id ? modificarRol() : agregarRol()">
                        <div class="form-group">
                            <label>Descripción:</label>
                            <input type="text" v-model="nuevoRol.descripcion" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">{{ nuevoRol.id ? 'Modificar' : 'Agregar' }}</button>
                            <button type="button" @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </form>
                </div>
                
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Rol:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarRoles" placeholder="Buscar por descripción..." class="search-bar"/>
                        </div>
                        <button @click="toggleFormulario()" class="btn">
                            <i class="fas fa-plus"></i> Nuevo Rol
                        </button>
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
                            <tr v-for="rol in rolesPaginados" :key="rol.id">
                                <td>{{ rol.id }}</td>
                                <td>{{ rol.descripcion }}</td>
                                <td>
                                    <button @click="cargarRol(rol)" class="btn-small">Modificar</button>
                                    <button @click="eliminarRol(rol)" class="btn-small btn-danger">Eliminar</button>
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