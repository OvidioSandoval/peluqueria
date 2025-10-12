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
            usuarios: [],
            roles: [],
            filtroBusqueda: '',
            usuariosFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoUsuario: {
                id: null,
                username: '',
                password: '',
                correo: '',
                activo: true,
                rol: null
            },
            usuarioSeleccionado: ''
        };
    },
    mounted() {
        this.fetchUsuarios();
        this.fetchRoles();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
        },
        usuariosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.usuariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchUsuarios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/usuarios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.usuarios = await response.json();
                this.filtrarUsuarios();
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
                NotificationSystem.error(`Error al cargar los usuarios: ${error.message}`);
            }
        },
        async fetchRoles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/roles`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.roles = await response.json();
            } catch (error) {
                console.error('Error al cargar roles:', error);
                NotificationSystem.error(`Error al cargar los roles: ${error.message}`);
            }
        },
        filtrarUsuarios() {
            if (this.filtroBusqueda.trim() === '') {
                this.usuariosFiltrados = this.usuarios;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.usuariosFiltrados = this.usuarios.filter(usuario =>
                    (usuario.username && usuario.username.toLowerCase().includes(busqueda)) ||
                    (usuario.correo && usuario.correo.toLowerCase().includes(busqueda)) ||
                    (usuario.rol && usuario.rol.descripcion && usuario.rol.descripcion.toLowerCase().includes(busqueda))
                );
            }
            this.paginaActual = 1;
        },
        async agregarUsuario() {
            if (!this.nuevoUsuario.username.trim()) {
                NotificationSystem.error('El username es obligatorio');
                return;
            }
            if (!this.nuevoUsuario.password.trim()) {
                NotificationSystem.error('La contraseña es obligatoria');
                return;
            }
            if (!this.validarEmail(this.nuevoUsuario.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    await this.fetchUsuarios();
                    this.toggleFormulario();
                    NotificationSystem.success('Usuario agregado exitosamente');
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al agregar usuario:', error);
                NotificationSystem.error(`Error al agregar usuario: ${error.message}`);
            }
        },
        async modificarUsuario() {
            if (!this.nuevoUsuario.username.trim()) {
                NotificationSystem.error('El username es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoUsuario.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/usuarios/${this.nuevoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoUsuario)
                });
                if (response.ok) {
                    await this.fetchUsuarios();
                    this.toggleFormulario();
                    NotificationSystem.success('Usuario actualizado exitosamente');
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `Error ${response.status}`);
                }
            } catch (error) {
                console.error('Error al modificar usuario:', error);
                NotificationSystem.error(`Error al modificar usuario: ${error.message}`);
            }
        },
        async eliminarUsuario(usuario) {
            NotificationSystem.confirm(`¿Eliminar usuario "${usuario.username}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/api/usuarios/${usuario.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchUsuarios();
                        NotificationSystem.success('Usuario eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar usuario:', error);
                    NotificationSystem.error(`Error al eliminar usuario: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoUsuario = {
                id: null,
                username: '',
                password: '',
                correo: '',
                activo: true,
                rol: null
            };
            this.usuarioSeleccionado = '';
        },
        cargarUsuario(usuario) {
            this.nuevoUsuario = {
                id: usuario.id,
                username: usuario.username,
                password: '',
                correo: usuario.correo || '',
                activo: usuario.activo,
                rol: usuario.rol
            };
            this.formularioVisible = true;
            this.usuarioSeleccionado = usuario.username;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        validarEmail(email) {
            if (!email) return true;
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
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
                <h1 class="page-title">Gestión de Usuarios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <div v-if="formularioVisible" class="form-container">
                    <h2>{{ nuevoUsuario.id ? 'Modificar' : 'Agregar' }} Usuario</h2>
                    <form @submit.prevent="nuevoUsuario.id ? modificarUsuario() : agregarUsuario()">
                        <div class="form-group">
                            <label>Username:</label>
                            <input type="text" v-model="nuevoUsuario.username" required>
                        </div>
                        <div class="form-group">
                            <label>Contraseña:</label>
                            <input type="password" v-model="nuevoUsuario.password" :required="!nuevoUsuario.id">
                            <small v-if="nuevoUsuario.id">Dejar vacío para mantener la contraseña actual</small>
                        </div>
                        <div class="form-group">
                            <label>Correo:</label>
                            <input type="email" v-model="nuevoUsuario.correo">
                        </div>
                        <div class="form-group">
                            <label>Rol:</label>
                            <select v-model="nuevoUsuario.rol" required>
                                <option value="">Seleccionar rol</option>
                                <option v-for="rol in roles" :key="rol.id" :value="rol">{{ rol.descripcion }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" v-model="nuevoUsuario.activo"> Activo
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">{{ nuevoUsuario.id ? 'Modificar' : 'Agregar' }}</button>
                            <button type="button" @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </form>
                </div>
                
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Usuario:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarUsuarios" placeholder="Buscar por username, correo o rol..." class="search-bar"/>
                        </div>
                        <button @click="toggleFormulario()" class="btn">
                            <i class="fas fa-plus"></i> Nuevo Usuario
                        </button>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="usuario in usuariosPaginados" :key="usuario.id">
                                <td>{{ usuario.id }}</td>
                                <td>{{ usuario.username }}</td>
                                <td>{{ usuario.correo || 'No registrado' }}</td>
                                <td>{{ usuario.rol ? usuario.rol.descripcion : 'Sin rol' }}</td>
                                <td>
                                    <span :class="usuario.activo ? 'status-active' : 'status-inactive'">
                                        {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </td>
                                <td>
                                    <button @click="cargarUsuario(usuario)" class="btn-small">Modificar</button>
                                    <button @click="eliminarUsuario(usuario)" class="btn-small btn-danger">Eliminar</button>
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