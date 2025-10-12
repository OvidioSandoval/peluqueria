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
            clientes: [],
            servicios: [],
            empleados: [],
            nuevoTurno: { 
                id: null,
                clienteId: null,
                servicioId: null,
                empleadoId: null,
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().substring(0, 5),
                estado: 'pendiente',
                motivoCancelacion: null
            },
            turnoExistente: null,
            modoModificar: false,
            mostrarFormCliente: false,
            nuevoCliente: {
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            }
        };
    },
    mounted() {
        this.fetchTurnos();
        this.fetchClientes();
        this.fetchServicios();
        this.fetchEmpleados();
    },
    methods: {
        async fetchTurnos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/turnos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.turnos = await response.json();
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
        verificarDuplicado() {
            if (!this.nuevoTurno.clienteId || !this.nuevoTurno.fecha || !this.nuevoTurno.hora) return;
            
            this.turnoExistente = this.turnos.find(t => 
                t.cliente && t.cliente.id === parseInt(this.nuevoTurno.clienteId) &&
                this.formatearFechaParaInput(t.fecha) === this.nuevoTurno.fecha &&
                this.formatearHoraParaInput(t.hora) === this.nuevoTurno.hora
            );
            
            if (this.turnoExistente && !this.modoModificar) {
                const clienteNombre = this.getClienteNombre(this.turnoExistente.cliente.id);
                NotificationSystem.confirm(
                    `Ya existe un turno para "${clienteNombre}" el ${this.nuevoTurno.fecha} a las ${this.nuevoTurno.hora}. ¿Desea modificarlo?`,
                    () => {
                        this.cargarTurnoParaEdicion(this.turnoExistente);
                    }
                );
            }
        },
        cargarTurnoParaEdicion(turno) {
            this.nuevoTurno = {
                id: turno.id,
                clienteId: turno.cliente ? turno.cliente.id : null,
                servicioId: turno.servicio ? turno.servicio.id : null,
                empleadoId: turno.empleado ? turno.empleado.id : null,
                fecha: this.formatearFechaParaInput(turno.fecha),
                hora: this.formatearHoraParaInput(turno.hora),
                estado: turno.estado || 'pendiente',
                motivoCancelacion: turno.motivoCancelacion || ''
            };
            this.modoModificar = true;
            this.turnoExistente = turno;
        },
        async agregarTurno() {
            if (!this.nuevoTurno.clienteId || !this.nuevoTurno.servicioId || !this.nuevoTurno.empleadoId || !this.nuevoTurno.fecha || !this.nuevoTurno.hora) {
                NotificationSystem.error('Todos los campos son obligatorios');
                return;
            }
            try {
                const turnoData = {
                    cliente: { id: parseInt(this.nuevoTurno.clienteId) },
                    servicio: { id: parseInt(this.nuevoTurno.servicioId) },
                    empleado: { id: parseInt(this.nuevoTurno.empleadoId) },
                    fecha: this.nuevoTurno.fecha,
                    hora: this.nuevoTurno.hora,
                    estado: this.nuevoTurno.estado,
                    motivoCancelacion: this.nuevoTurno.motivoCancelacion,
                    recordatorioEnviado: false
                };
                const response = await fetch(`${config.apiBaseUrl}/turnos/agregar_turno`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(turnoData)
                });
                if (response.ok) {
                    NotificationSystem.success('Turno agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchTurnos();
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
                NotificationSystem.error('Todos los campos son obligatorios');
                return;
            }
            try {
                const turnoData = {
                    cliente: { id: parseInt(this.nuevoTurno.clienteId) },
                    servicio: { id: parseInt(this.nuevoTurno.servicioId) },
                    empleado: { id: parseInt(this.nuevoTurno.empleadoId) },
                    fecha: this.nuevoTurno.fecha,
                    hora: this.nuevoTurno.hora,
                    estado: this.nuevoTurno.estado,
                    motivoCancelacion: this.nuevoTurno.motivoCancelacion,
                    recordatorioEnviado: false
                };
                const response = await fetch(`${config.apiBaseUrl}/turnos/actualizar_turno/${this.nuevoTurno.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(turnoData)
                });
                if (response.ok) {
                    NotificationSystem.success('Turno actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchTurnos();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar turno:', error);
                NotificationSystem.error(`Error al modificar turno: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevoTurno = { 
                id: null,
                clienteId: null,
                servicioId: null,
                empleadoId: null,
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().substring(0, 5),
                estado: 'pendiente',
                motivoCancelacion: null
            };
            this.turnoExistente = null;
            this.modoModificar = false;
        },
        getClienteNombre(clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            return cliente ? cliente.nombreCompleto || cliente.nombre : 'Cliente no encontrado';
        },
        getServicioNombre(servicioId) {
            const servicio = this.servicios.find(s => s.id === servicioId);
            return servicio ? servicio.nombre : 'Servicio no encontrado';
        },
        getEmpleadoNombre(empleadoId) {
            const empleado = this.empleados.find(e => e.id === empleadoId);
            return empleado ? empleado.nombreCompleto : 'Empleado no encontrado';
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

        async crearCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            try {
                const clienteData = {
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto),
                    telefono: this.nuevoCliente.telefono,
                    ruc: this.nuevoCliente.ruc,
                    correo: this.nuevoCliente.correo,
                    redesSociales: this.nuevoCliente.redesSociales,
                    fechaNacimiento: this.nuevoCliente.fechaNacimiento
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
                    this.mostrarFormCliente = false;
                    this.nuevoCliente = { nombreCompleto: '', telefono: '', ruc: '', correo: '', redesSociales: '', fechaNacimiento: null };
                    NotificationSystem.success('Cliente agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        toggleFormCliente() {
            this.mostrarFormCliente = !this.mostrarFormCliente;
            this.nuevoCliente = { nombreCompleto: '', telefono: '', ruc: '', correo: '', redesSociales: '', fechaNacimiento: null };
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Turno</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoModificar ? 'Modificar Turno - ' + getClienteNombre(nuevoTurno.clienteId) : 'Nuevo Turno' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Cliente: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoTurno.clienteId" @change="verificarDuplicado" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Cliente</option>
                                        <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                                            {{ cliente.nombreCompleto || cliente.nombre }}
                                        </option>
                                    </select>
                                    <button type="button" @click="toggleFormCliente()" class="btn btn-small">+</button>
                                </div>
                            </div>
                            <div class="form-col">
                                <label>Servicio: *</label>
                                <select v-model="nuevoTurno.servicioId" required>
                                    <option value="" disabled>Seleccionar Servicio</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Empleado: *</label>
                                <select v-model="nuevoTurno.empleadoId" required>
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                        {{ empleado.nombreCompleto }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Fecha: *</label>
                                <input type="date" v-model="nuevoTurno.fecha" @change="verificarDuplicado" required/>
                            </div>
                            <div class="form-col">
                                <label>Hora: *</label>
                                <input type="time" v-model="nuevoTurno.hora" @change="verificarDuplicado" required/>
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
                        <div class="form-row">
                            <div class="form-col">
                                <label>Motivo Cancelación:</label>
                                <input type="text" v-model="nuevoTurno.motivoCancelacion" placeholder="Opcional"/>
                            </div>
                        </div>
                        
                        <div v-if="mostrarFormCliente" class="form-container" style="margin-top: 20px; padding: 15px; border: 2px dashed #ccc;">
                            <h4>Nuevo Cliente</h4>
                            <div class="form-row">
                                <div class="form-col">
                                    <label>Nombre Completo: *</label>
                                    <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Ingrese el nombre completo" required style="border: 2px solid #87CEEB;"/>
                                </div>
                                <div class="form-col">
                                    <label>Teléfono:</label>
                                    <input type="tel" v-model="nuevoCliente.telefono" placeholder="Ej: 0981234567" maxlength="10" style="border: 2px solid #87CEEB;"/>
                                </div>
                                <div class="form-col">
                                    <label>RUC:</label>
                                    <input type="text" v-model="nuevoCliente.ruc" placeholder="Ingrese el RUC" maxlength="20" style="border: 2px solid #87CEEB;"/>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-col">
                                    <label>Correo Electrónico:</label>
                                    <input type="email" v-model="nuevoCliente.correo" placeholder="ejemplo@correo.com" style="border: 2px solid #87CEEB;"/>
                                </div>
                                <div class="form-col">
                                    <label>Fecha de Nacimiento:</label>
                                    <input type="date" v-model="nuevoCliente.fechaNacimiento" style="border: 2px solid #87CEEB;"/>
                                </div>
                                <div class="form-col">
                                    <label>Redes Sociales:</label>
                                    <textarea v-model="nuevoCliente.redesSociales" placeholder="Facebook, Instagram, etc." rows="2" style="resize: vertical; border: 2px solid #87CEEB;"></textarea>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button @click="crearCliente()" class="btn btn-small">Agregar Cliente</button>
                                <button @click="toggleFormCliente()" class="btn btn-secondary btn-small">Cancelar</button>
                            </div>
                        </div>
                        
                        <div class="form-buttons">
                            <button @click="modoModificar ? modificarTurno() : agregarTurno()" class="btn">
                                {{ modoModificar ? 'Modificar' : 'Agregar' }} Turno
                            </button>
                            <button @click="modoModificar ? limpiarFormulario() : goBack()" class="btn btn-secondary">
                                {{ modoModificar ? 'Cancelar Edición' : 'Cancelar' }}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = 'input, textarea, select { border: 2px solid #87ceeb !important; padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; }';
document.head.appendChild(style);