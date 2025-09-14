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
            clientes: [],
            filtroBusqueda: '',
            clientesFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoCliente: {
                id: null,
                nombreCompleto: '',
                telefono: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },
            clienteSeleccionado: '',

            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchClientes();
    },

    computed: {
        totalPaginas() {
            return Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
        },
        clientesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.clientesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {

        async fetchClientes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.clientes = await response.json();
                this.filtrarClientes();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
                NotificationSystem.error(`Error al cargar los clientes: ${error.message}`);
            }
        },
        filtrarClientes() {
            if (this.filtroBusqueda.trim() === '') {
                this.clientesFiltrados = this.clientes;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.clientesFiltrados = this.clientes.filter(cliente =>
                    (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (cliente.telefono && cliente.telefono.toLowerCase().includes(busqueda)) ||
                    (cliente.correo && cliente.correo.toLowerCase().includes(busqueda))
                );
            }
        },
        async agregarCliente() {
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                const response = await fetch(`${config.apiBaseUrl}/clientes/agregar_cliente`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (response.ok) {
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        async modificarCliente() {
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                const response = await fetch(`${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (response.ok) {
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar cliente:', error);
                NotificationSystem.error(`Error al modificar cliente: ${error.message}`);
            }
        },
        async eliminarCliente(cliente) {
            NotificationSystem.confirm(`¿Eliminar cliente "${cliente.nombreCompleto}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/clientes/eliminar_cliente/${cliente.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchClientes();
                        NotificationSystem.success('Cliente eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar cliente:', error);
                    NotificationSystem.error(`Error al eliminar cliente: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoCliente = {
                id: null,
                nombreCompleto: '',
                telefono: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            };
            this.clienteSeleccionado = '';
        },
        cargarCliente(cliente) {
            this.nuevoCliente = {
                id: cliente.id,
                nombreCompleto: this.capitalizarTexto(cliente.nombreCompleto || ''),
                telefono: cliente.telefono || '',
                correo: cliente.correo || '',
                redesSociales: cliente.redesSociales || '',
                fechaNacimiento: cliente.fechaNacimiento || null
            };
            this.formularioVisible = true;
            this.clienteSeleccionado = cliente.nombreCompleto;
        },
        
        validarEmail(email) {
            if (!email) return true; // Email is optional
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },

        redirigirClientes() {
            window.location.href = '/web/clientes';
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
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Clientes</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Cliente:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarClientes" placeholder="Buscar por nombre, teléfono o email..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Cliente</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoCliente.id ? 'Modificar Cliente: ' + clienteSeleccionado : 'Agregar Cliente' }}</h3>
                        <label>Nombre Completo:</label>
                        <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Nombre Completo" required/>
                        <label>Teléfono:</label>
                        <input type="tel" v-model="nuevoCliente.telefono" placeholder="Teléfono" maxlength="10"/>
                        <label>Correo Electrónico:</label>
                        <input type="email" v-model="nuevoCliente.correo" placeholder="Correo Electrónico"/>
                        <label>Fecha de Nacimiento:</label>
                        <input type="date" v-model="nuevoCliente.fechaNacimiento" placeholder="Fecha de Nacimiento"/>
                        <label>Redes Sociales:</label>
                        <textarea v-model="nuevoCliente.redesSociales" placeholder="Redes Sociales"></textarea>
                        <div class="form-buttons">
                            <button @click="nuevoCliente.id ? modificarCliente() : agregarCliente()" class="btn">
                                {{ nuevoCliente.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Fecha Nacimiento</th>
                                <th>Redes Sociales</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="cliente in clientesPaginados" :key="cliente.id">
                                <td>{{ cliente.id }}</td>
                                <td>{{ cliente.nombreCompleto }}</td>
                                <td>{{ cliente.telefono }}</td>
                                <td>{{ cliente.correo }}</td>
                                <td>{{ formatearFecha(cliente.fechaNacimiento) }}</td>
                                <td>{{ cliente.redesSociales }}</td>
                                <td>
                                    <button @click="cargarCliente(cliente)" class="btn-small">Editar</button>
                                    <button @click="eliminarCliente(cliente)" class="btn-small btn-danger">Eliminar</button>
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
// Estilos para mejorar visibilidad del mensaje de confirmación
const style = document.createElement('style');
style.textContent = `
    .swal2-popup {
        color: #000 !important;
    }
    .swal2-title {
        color: #000 !important;
    }
    .swal2-content {
        color: #000 !important;
    }
`;
document.head.appendChild(style);

// Estilos para mejorar visibilidad del mensaje de confirmación
const confirmStyle = document.createElement('style');
confirmStyle.textContent = `
    .swal2-popup {
        background: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #333 !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        z-index: 99999 !important;
    }
    .swal2-title {
        color: #000000 !important;
        font-weight: bold !important;
        font-size: 18px !important;
        text-shadow: none !important;
    }
    .swal2-html-container {
        color: #000000 !important;
        font-weight: bold !important;
    }
    .swal2-content {
        color: #000000 !important;
        font-size: 16px !important;
        font-weight: 500 !important;
    }
    .swal2-confirm {
        background: #dc3545 !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-cancel {
        background: #6c757d !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-container {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(confirmStyle);