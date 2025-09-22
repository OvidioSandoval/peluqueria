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
            turnos: [],
            turnosFiltrados: [],
            clientes: [],
            servicios: [],
            empleados: [],

            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoTurno: { 
                id: null, 
                clienteId: null,
                servicioId: null,
                empleadoId: null,
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().substring(0, 5),
                estado: 'pendiente',
                motivoCancelacion: null,
                recordatorioEnviado: false
            },
            turnoSeleccionado: '',
            formularioClienteVisible: false,
            nuevoCliente: {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchTurnos();
        this.fetchClientes();
        this.fetchServicios();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.turnosFiltrados.length / this.itemsPorPagina);
        },
        turnosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.turnosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/turnos';
            }
        },
        async fetchTurnos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/turnos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.turnos = await response.json();
                this.filtrarTurnos();
            } catch (error) {
                console.error('Error al cargar turnos:', error);
                NotificationSystem.error(`Error al cargar los turnos: ${error.message}`);
            }
        },
        async fetchClientes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
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
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
            }
        },
        filtrarTurnos() {
            this.turnosFiltrados = [...this.turnos];
        },
        async agregarTurno() {
            if (!this.nuevoTurno.clienteId || !this.nuevoTurno.servicioId || !this.nuevoTurno.empleadoId || !this.nuevoTurno.fecha || !this.nuevoTurno.hora) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const turnoData = {
                    cliente: { id: this.nuevoTurno.clienteId },
                    servicio: { id: this.nuevoTurno.servicioId },
                    empleado: { id: this.nuevoTurno.empleadoId },
                    fecha: this.nuevoTurno.fecha,
                    hora: this.nuevoTurno.hora,
                    estado: this.nuevoTurno.estado,
                    motivoCancelacion: this.nuevoTurno.motivoCancelacion,
                    recordatorioEnviado: this.nuevoTurno.recordatorioEnviado
                };
                const response = await fetch(`${config.apiBaseUrl}/turnos/agregar_turno`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(turnoData)
                });
                if (response.ok) {
                    await this.fetchTurnos();
                    this.toggleFormulario();
                    NotificationSystem.success('Turno agregado exitosamente');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar turno:', error);
                NotificationSystem.error(`Error al agregar turno: ${error.message}`);
            }
        },
        async modificarTurno() {
            if (!this.nuevoTurno.clienteId || !this.nuevoTurno.servicioId || !this.nuevoTurno.empleadoId || !this.nuevoTurno.fecha || !this.nuevoTurno.hora) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const turnoData = {
                    cliente: { id: this.nuevoTurno.clienteId },
                    servicio: { id: this.nuevoTurno.servicioId },
                    empleado: { id: this.nuevoTurno.empleadoId },
                    fecha: this.nuevoTurno.fecha,
                    hora: this.nuevoTurno.hora,
                    estado: this.nuevoTurno.estado,
                    motivoCancelacion: this.nuevoTurno.motivoCancelacion,
                    recordatorioEnviado: this.nuevoTurno.recordatorioEnviado
                };
                const response = await fetch(`${config.apiBaseUrl}/turnos/actualizar_turno/${this.nuevoTurno.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(turnoData)
                });
                if (response.ok) {
                    await this.fetchTurnos();
                    this.toggleFormulario();
                    NotificationSystem.success('Turno actualizado exitosamente');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar turno:', error);
                NotificationSystem.error(`Error al modificar turno: ${error.message}`);
            }
        },
        async eliminarTurno(turno) {
            NotificationSystem.confirm(`¿Eliminar turno del ${turno.fecha} ${turno.hora}?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/turnos/eliminar_turno/${turno.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchTurnos();
                        NotificationSystem.success('Turno eliminado exitosamente');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar turno:', error);
                    NotificationSystem.error(`Error al eliminar turno: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoTurno = { 
                id: null, 
                clienteId: null,
                servicioId: null,
                empleadoId: null,
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().substring(0, 5),
                estado: 'pendiente',
                motivoCancelacion: null,
                recordatorioEnviado: false
            };
            this.turnoSeleccionado = '';
            if (!this.formularioVisible) {
                setTimeout(() => window.location.reload(), 500);
            }
        },
        cargarTurno(turno) {
            this.nuevoTurno = {
                id: turno.id,
                clienteId: turno.cliente ? turno.cliente.id : null,
                servicioId: turno.servicio ? turno.servicio.id : null,
                empleadoId: turno.empleado ? turno.empleado.id : null,
                fecha: this.formatearFechaParaInput(turno.fecha),
                hora: this.formatearHoraParaInput(turno.hora),
                estado: turno.estado || 'pendiente',
                motivoCancelacion: turno.motivoCancelacion || '',
                recordatorioEnviado: turno.recordatorioEnviado || false
            };
            this.formularioVisible = true;
            this.turnoSeleccionado = this.getClienteName(turno);
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        getClienteName(turno) {
            return turno.cliente ? turno.cliente.nombreCompleto || turno.cliente.nombre : 'Cliente no encontrado';
        },
        getServicioName(turno) {
            return turno.servicio ? turno.servicio.nombre : 'Servicio no encontrado';
        },
        getEmpleadoName(turno) {
            return turno.empleado ? turno.empleado.nombreCompleto : 'Empleado no encontrado';
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleString('es-ES') : '';
        },
        formatearFechaHora(fecha, hora) {
            if (!fecha || !hora) return '';
            let day, month, year, hour, minute;
            
            if (Array.isArray(fecha)) {
                [year, month, day] = fecha;
            } else {
                [year, month, day] = fecha.split('-');
            }
            
            if (Array.isArray(hora)) {
                [hour, minute] = hora;
            } else {
                [hour, minute] = hora.split(':');
            }
            
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        },
        formatearFechaParaInput(fecha) {
            if (!fecha) return new Date().toISOString().split('T')[0];
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        formatearHoraParaInput(hora) {
            if (!hora) return new Date().toTimeString().substring(0, 5);
            if (Array.isArray(hora)) {
                const [hour, minute] = hora;
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            }
            return typeof hora === 'string' ? hora : hora.toString();
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchTurnos();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirTurnos() {
            window.location.href = '/web/turnos';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
        toggleFormularioCliente() {
            this.formularioClienteVisible = !this.formularioClienteVisible;
            this.nuevoCliente = {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            };
        },
        async agregarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es requerido');
                return;
            }
            if (this.nuevoCliente.correo && !this.validarEmail(this.nuevoCliente.correo)) {
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
                    const clienteCreado = await response.json();
                    await this.fetchClientes();
                    this.nuevoTurno.clienteId = clienteCreado.id;
                    this.toggleFormularioCliente();
                    NotificationSystem.success('Cliente agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        validarEmail(email) {
            if (!email) return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
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
                <h1 style="text-align: center; margin-top: 90px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Turnos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="main-buttons">
                        <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Turno</button>
                        <button @click="toggleFormularioCliente()" class="btn" v-if="!formularioVisible" style="background: #28a745;">
                            <i class="fas fa-user-plus"></i> Nuevo Cliente
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoTurno.id ? 'Modificar Turno - ' + turnoSeleccionado : 'Agregar Turno' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Cliente:</label>
                                <select v-model="nuevoTurno.clienteId" required>
                                    <option value="" disabled>Seleccionar Cliente</option>
                                    <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                                        {{ cliente.nombreCompleto || cliente.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Servicio:</label>
                                <select v-model="nuevoTurno.servicioId" required>
                                    <option value="" disabled>Seleccionar Servicio</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Empleado:</label>
                                <select v-model="nuevoTurno.empleadoId" required>
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                        {{ empleado.nombreCompleto }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Estado:</label>
                                <select v-model="nuevoTurno.estado">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>
                        <div class="datetime-row">
                            <div>
                                <label>Fecha:</label>
                                <input type="date" v-model="nuevoTurno.fecha" required/>
                            </div>
                            <div>
                                <label>Hora:</label>
                                <input type="time" v-model="nuevoTurno.hora" required/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Motivo Cancelación:</label>
                                <input type="text" v-model="nuevoTurno.motivoCancelacion" placeholder="Opcional"/>
                            </div>
                            <div class="form-col-auto">
                                <label>Recordatorio:</label>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                    <input type="checkbox" v-model="nuevoTurno.recordatorioEnviado" style="width: auto; margin: 0;"/>
                                    <span>{{ nuevoTurno.recordatorioEnviado ? 'Enviado' : 'No enviado' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="nuevoTurno.id ? modificarTurno() : agregarTurno()" class="btn">
                                {{ nuevoTurno.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="formularioClienteVisible" class="form-container">
                        <h3><i class="fas fa-user-plus"></i> Nuevo Cliente</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre Completo:</label>
                                <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Nombre Completo" required/>
                            </div>
                            <div class="form-col">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoCliente.telefono" placeholder="Teléfono" maxlength="10"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>RUC:</label>
                                <input type="text" v-model="nuevoCliente.ruc" placeholder="RUC" maxlength="20"/>
                            </div>
                            <div class="form-col">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoCliente.correo" placeholder="Correo"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Fecha de Nacimiento:</label>
                                <input type="date" v-model="nuevoCliente.fechaNacimiento"/>
                            </div>
                        </div>
                        <label>Redes Sociales:</label>
                        <textarea v-model="nuevoCliente.redesSociales" placeholder="Redes Sociales"></textarea>
                        <div class="form-buttons">
                            <button @click="agregarCliente()" class="btn" style="background: #28a745;">
                                <i class="fas fa-user-plus"></i> Agregar
                            </button>
                            <button @click="toggleFormularioCliente()" class="btn" style="background: #6c757d !important;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Servicio</th>
                                <th>Empleado</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="turno in turnosPaginados" :key="turno.id">
                                <td>{{ turno.id }}</td>
                                <td>{{ getClienteName(turno) }}</td>
                                <td>{{ getServicioName(turno) }}</td>
                                <td>{{ getEmpleadoName(turno) }}</td>
                                <td>{{ formatearFechaHora(turno.fecha, turno.hora) }}</td>
                                <td>{{ turno.estado }}</td>
                                <td>
                                    <button @click="cargarTurno(turno)" class="btn-small">Editar</button>
                                    <button @click="eliminarTurno(turno)" class="btn-small btn-danger">Eliminar</button>
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
