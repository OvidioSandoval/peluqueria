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
            empleados: [],
            empleadosFiltrados: [],
            areas: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoEmpleado: {
                id: null,
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                activo: true
            },
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchEmpleados();
        this.fetchAreas();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.empleadosFiltrados.length / this.itemsPorPagina);
        },
        empleadosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.empleadosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/empleados';
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.empleados = await response.json();
                this.filtrarEmpleados();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error(`Error al cargar los empleados: ${error.message}`);
            }
        },
        async fetchAreas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/areas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.areas = await response.json();
            } catch (error) {
                console.error('Error al cargar áreas:', error);
                NotificationSystem.error(`Error al cargar las áreas: ${error.message}`);
            }
        },
        filtrarEmpleados() {
            if (this.filtroBusqueda.trim() === '') {
                this.empleadosFiltrados = this.empleados;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.empleadosFiltrados = this.empleados.filter(empleado =>
                    empleado.nombreCompleto.toLowerCase().includes(busqueda) ||
                    empleado.correo.toLowerCase().includes(busqueda) ||
                    empleado.telefono.includes(busqueda)
                );
            }
        },
        validarEmail(email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        },
        async agregarEmpleado() {
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electrónico no es válido');
                return;
            }
            try {
                const empleadoData = {
                    ...this.nuevoEmpleado,
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    telefono: this.capitalizarTexto(this.nuevoEmpleado.telefono)
                };
                const response = await fetch(`${config.apiBaseUrl}/empleados/agregar_empleado`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    await this.fetchEmpleados();
                    this.toggleFormulario();
                    NotificationSystem.success('Empleado agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar empleado:', error);
                NotificationSystem.error(`Error al agregar empleado: ${error.message}`);
            }
        },
        async modificarEmpleado() {
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electrónico no es válido');
                return;
            }
            try {
                const empleadoData = {
                    ...this.nuevoEmpleado,
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    telefono: this.capitalizarTexto(this.nuevoEmpleado.telefono)
                };
                const response = await fetch(`${config.apiBaseUrl}/empleados/actualizar_empleado/${this.nuevoEmpleado.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    await this.fetchEmpleados();
                    this.toggleFormulario();
                    NotificationSystem.success('Empleado actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar empleado:', error);
                NotificationSystem.error(`Error al modificar empleado: ${error.message}`);
            }
        },
        async eliminarEmpleado(empleado) {
            NotificationSystem.confirm(`¿Eliminar empleado "${empleado.nombreCompleto}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/empleados/eliminar_empleado/${empleado.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchEmpleados();
                    NotificationSystem.success('Empleado eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar empleado:', error);
                    NotificationSystem.error('Error al eliminar empleado');
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            if (!this.formularioVisible) {
                this.nuevoEmpleado = {
                    id: null,
                    nombreCompleto: '',
                    correo: '',
                    telefono: '',
                    area: null,
                    sueldoBase: 0,
                    comisionPorcentaje: 0,
                    activo: true
                };
            }
        },
        cargarEmpleado(empleado) {
            this.nuevoEmpleado = { ...empleado };
            this.formularioVisible = true;
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchEmpleados();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirEmpleados() {
            window.location.href = '/web/empleados';
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
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Empleados</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Empleado:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarEmpleados" placeholder="Buscar empleado..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Empleado</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoEmpleado.id ? 'Modificar Empleado: ' + nuevoEmpleado.nombreCompleto : 'Agregar Empleado' }}</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Nombre Completo *</label>
                                <input type="text" v-model="nuevoEmpleado.nombreCompleto" required/>
                            </div>
                            <div class="form-field">
                                <label>Correo Electrónico</label>
                                <input type="email" v-model="nuevoEmpleado.correo" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"/>
                            </div>
                            <div class="form-field">
                                <label>Teléfono</label>
                                <input type="tel" v-model="nuevoEmpleado.telefono"/>
                            </div>
                            <div class="form-field">
                                <label>Área *</label>
                                <select v-model="nuevoEmpleado.area" required>
                                    <option value="" disabled>Seleccionar Área</option>
                                    <option v-for="area in areas" :key="area.id" :value="area">{{ area.nombre }}</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Sueldo Base</label>
                                <input type="number" v-model="nuevoEmpleado.sueldoBase" min="0"/>
                            </div>
                            <div class="form-field">
                                <label>Comisión %</label>
                                <input type="number" v-model="nuevoEmpleado.comisionPorcentaje" min="0" max="100"/>
                            </div>
                            <div class="form-field">
                                <label style="display: flex; align-items: center; margin: 0; padding: 0; white-space: nowrap;">
                                    Activo:<input type="checkbox" v-model="nuevoEmpleado.activo" style="margin: 0; padding: 0; margin-left: 1px;"/>
                                </label>
                            </div>
                        </div>
                        <div class="form-buttons" style="margin-top: 15px;">
                            <button @click="nuevoEmpleado.id ? modificarEmpleado() : agregarEmpleado()" class="btn">
                                {{ nuevoEmpleado.id ? 'Confirmar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Teléfono</th>
                                <th>Área</th>
                                <th>Sueldo</th>
                                <th>Comisión %</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="empleado in empleadosPaginados" :key="empleado.id">
                                <td>{{ empleado.id }}</td>
                                <td>{{ empleado.nombreCompleto }}</td>
                                <td>{{ empleado.correo }}</td>
                                <td>{{ empleado.telefono }}</td>
                                <td>{{ empleado.area ? empleado.area.nombre : 'N/A' }}</td>
                                <td>{{ formatearNumero(empleado.sueldoBase) }}</td>
                                <td>{{ empleado.comisionPorcentaje }}%</td>
                                <td>
                                    <span :class="empleado.activo ? 'status-active' : 'status-inactive'">
                                        {{ empleado.activo ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </td>
                                <td>
                                    <button @click="cargarEmpleado(empleado)" class="btn-small">Editar</button>
                                    <button @click="eliminarEmpleado(empleado)" class="btn-small btn-danger">Eliminar</button>
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

// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
    }
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .form-field label {
        font-weight: bold;
        color: #333;
        font-size: 14px;
    }
    .form-field input, .form-field select {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    .form-field input:invalid {
        border-color: #dc3545;
    }
    .status-active {
        color: #28a745;
        font-weight: bold;
    }
    .status-inactive {
        color: #dc3545;
        font-weight: bold;
    }
`;
document.head.appendChild(style);
