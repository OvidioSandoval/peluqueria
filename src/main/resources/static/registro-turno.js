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
            mostrarFormServicio: false,
            mostrarFormEmpleado: false,
            nuevoCliente: {
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },
            nuevoServicio: {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            nuevoEmpleado: {
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                totalPagado: 0,
                activo: true,
                fechaIngreso: new Date().toISOString().split('T')[0]
            },
            categorias: [],
            areas: [],
            mensaje: '',
            tipoMensaje: ''
        };
    },
    mounted() {
        this.fetchTurnos();
        this.fetchClientes();
        this.fetchServicios();
        this.fetchEmpleados();
        this.fetchCategorias();
        this.fetchAreas();
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
        
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                this.categorias = await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
            }
        },
        
        async fetchAreas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/areas`);
                this.areas = await response.json();
            } catch (error) {
                console.error('Error al cargar áreas:', error);
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
        
        // Métodos para servicio
        verificarServicioDuplicado() {
            if (!this.nuevoServicio.nombre.trim()) return false;
            
            const nombreBuscar = this.nuevoServicio.nombre.trim().toLowerCase();
            const servicioExistente = this.servicios.find(s => 
                s.nombre.toLowerCase() === nombreBuscar
            );
            
            if (servicioExistente) {
                this.mostrarMensaje(`El servicio "${servicioExistente.nombre}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async crearServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                this.mostrarMensaje('El nombre es requerido', 'error');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                this.mostrarMensaje('El precio base debe ser mayor a 0', 'error');
                return;
            }
            if (this.verificarServicioDuplicado()) return;
            try {
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: this.nuevoServicio.categoriaId }
                };
                const response = await fetch(`${config.apiBaseUrl}/servicios/agregar_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servicioData)
                });
                if (response.ok) {
                    const servicioCreado = await response.json();
                    await this.fetchServicios();
                    this.nuevoTurno.servicioId = servicioCreado.id;
                    this.mostrarFormServicio = false;
                    this.limpiarFormServicio();
                    this.mostrarMensaje('Servicio agregado exitosamente', 'exito');
                } else {
                    throw new Error('Error al agregar servicio');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar servicio', 'error');
            }
        },
        
        limpiarFormServicio() {
            this.nuevoServicio = {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            };
        },
        
        // Métodos para empleado
        verificarEmpleadoDuplicado() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) return false;
            
            const nombreBuscar = this.nuevoEmpleado.nombreCompleto.trim().toLowerCase();
            const empleadoExistente = this.empleados.find(e => 
                e.nombreCompleto.toLowerCase() === nombreBuscar
            );
            
            if (empleadoExistente) {
                this.mostrarMensaje(`El empleado "${empleadoExistente.nombreCompleto}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async crearEmpleado() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) {
                this.mostrarMensaje('El nombre completo es obligatorio', 'error');
                return;
            }
            if (!this.nuevoEmpleado.area) {
                this.mostrarMensaje('El área es obligatoria', 'error');
                return;
            }
            if (this.verificarEmpleadoDuplicado()) return;
            try {
                const empleadoData = {
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    correo: this.nuevoEmpleado.correo,
                    telefono: this.nuevoEmpleado.telefono,
                    area: this.nuevoEmpleado.area,
                    sueldoBase: parseInt(this.nuevoEmpleado.sueldoBase) || 0,
                    comisionPorcentaje: parseInt(this.nuevoEmpleado.comisionPorcentaje) || 0,
                    totalPagado: parseInt(this.nuevoEmpleado.totalPagado) || 0,
                    activo: this.nuevoEmpleado.activo,
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso
                };
                const response = await fetch(`${config.apiBaseUrl}/empleados/agregar_empleado`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    const empleadoCreado = await response.json();
                    await this.fetchEmpleados();
                    this.nuevoTurno.empleadoId = empleadoCreado.id;
                    this.mostrarFormEmpleado = false;
                    this.limpiarFormEmpleado();
                    this.mostrarMensaje('Empleado agregado exitosamente', 'exito');
                } else {
                    throw new Error('Error al agregar empleado');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar empleado', 'error');
            }
        },
        
        limpiarFormEmpleado() {
            this.nuevoEmpleado = {
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                totalPagado: 0,
                activo: true,
                fechaIngreso: new Date().toISOString().split('T')[0]
            };
        },
        
        mostrarMensaje(mensaje, tipo) {
            this.mensaje = mensaje;
            this.tipoMensaje = tipo;
            setTimeout(() => {
                this.mensaje = '';
                this.tipoMensaje = '';
            }, 3000);
        },
        
        cerrarMensaje() {
            this.mensaje = '';
            this.tipoMensaje = '';
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
                
                <!-- Modal para agregar servicio -->
                <div v-if="mostrarFormServicio" class="modal-overlay" @click="mostrarFormServicio = false">
                    <div class="modal-content" @click.stop>
                        <h3><i class="fas fa-concierge-bell"></i> Agregar Servicio</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoServicio.nombre" @blur="verificarServicioDuplicado" placeholder="Ingrese el nombre del servicio" required/>
                            </div>
                            <div class="form-col">
                                <label>Precio Base: *</label>
                                <input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Categoría:</label>
                                <select v-model="nuevoServicio.categoriaId">
                                    <option value="" disabled>Selecciona una categoría</option>
                                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                        {{ categoria.descripcion }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label style="display: flex; align-items: center; gap: 8px; margin-top: 25px;">
                                    <input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0;"/>
                                    Servicio Activo
                                </label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción:</label>
                                <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2" style="resize: vertical; width: 300px;"></textarea>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button @click="crearServicio" class="btn">Agregar</button>
                            <button @click="mostrarFormServicio = false" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </div>
                
                <!-- Modal para agregar empleado -->
                <div v-if="mostrarFormEmpleado" class="modal-overlay" @click="mostrarFormEmpleado = false">
                    <div class="modal-content modal-large" @click.stop>
                        <h3><i class="fas fa-user-tie"></i> Agregar Empleado</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre Completo: *</label>
                                <input type="text" v-model="nuevoEmpleado.nombreCompleto" @blur="verificarEmpleadoDuplicado" placeholder="Ingrese el nombre completo" required/>
                            </div>
                            <div class="form-col">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoEmpleado.correo" placeholder="ejemplo@correo.com"/>
                            </div>
                            <div class="form-col">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoEmpleado.telefono" placeholder="Ej: 0981234567" maxlength="10"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Área: *</label>
                                <select v-model="nuevoEmpleado.area" required>
                                    <option value="" disabled>Seleccionar Área</option>
                                    <option v-for="area in areas" :key="area.id" :value="area">{{ area.nombre }}</option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Sueldo Base:</label>
                                <input type="number" v-model="nuevoEmpleado.sueldoBase" placeholder="Sueldo base" min="0"/>
                            </div>
                            <div class="form-col">
                                <label>Comisión %:</label>
                                <input type="number" v-model="nuevoEmpleado.comisionPorcentaje" placeholder="Comisión %" min="0" max="100"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Fecha de Ingreso:</label>
                                <input type="date" v-model="nuevoEmpleado.fechaIngreso"/>
                            </div>
                            <div class="form-col">
                                <label style="display: flex; align-items: center; gap: 5px; margin-top: 25px;">
                                    <input type="checkbox" v-model="nuevoEmpleado.activo"/>
                                    Empleado Activo
                                </label>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button @click="crearEmpleado" class="btn">Agregar</button>
                            <button @click="mostrarFormEmpleado = false" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </div>
                
                <!-- Mensaje de notificación -->
                <div v-if="mensaje" class="mensaje-overlay" @click="cerrarMensaje">
                    <div class="mensaje-modal" @click.stop>
                        <div class="mensaje-contenido" :class="tipoMensaje">
                            <p>{{ mensaje }}</p>
                            <button @click="cerrarMensaje" class="btn btn-cerrar">Cerrar</button>
                        </div>
                    </div>
                </div>
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
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoTurno.servicioId" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Servicio</option>
                                        <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                            {{ servicio.nombre }}
                                        </option>
                                    </select>
                                    <button type="button" @click="mostrarFormServicio = true" class="btn btn-small">+</button>
                                </div>
                            </div>
                            <div class="form-col">
                                <label>Empleado: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoTurno.empleadoId" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Empleado</option>
                                        <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                            {{ empleado.nombreCompleto }}
                                        </option>
                                    </select>
                                    <button type="button" @click="mostrarFormEmpleado = true" class="btn btn-small">+</button>
                                </div>
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
style.textContent = 'input, textarea, select { background: #fcccce2 !important; border: 2px solid #87ceeb !important; padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { background: #fcccce2 !important; padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; border-radius: 8px; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; } .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); } .modal-content { background: rgba(248, 187, 208, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); } .modal-large { max-width: 700px; } .modal-content h3 { color: #66bb6a; text-align: center; margin-bottom: 20px; font-weight: 600; } .modal-content label { color: #66bb6a; font-weight: 600; margin-bottom: 8px; display: block; font-size: 14px; } .modal-content input, .modal-content textarea, .modal-content select { width: 100%; padding: 12px 15px; border: 2px solid #b3e5fc; border-radius: 12px; margin: 8px 0; background: rgba(252, 204, 206, 0.8); color: #66bb6a; font-size: 14px; transition: all 0.3s ease; } .modal-content input:focus, .modal-content textarea:focus, .modal-content select:focus { outline: none; border-color: #81d4fa; box-shadow: 0 0 15px rgba(129, 212, 250, 0.3); transform: translateY(-1px); } .modal-buttons { margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; backdrop-filter: blur(5px); } .mensaje-modal { background: rgba(252, 228, 236, 0.95); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); max-width: 400px; width: 90%; } .mensaje-contenido { padding: 25px; text-align: center; } .mensaje-contenido p { color: #66bb6a; font-weight: 500; margin-bottom: 15px; } .mensaje-contenido.error { border-left: 4px solid #ef5350; } .mensaje-contenido.exito { border-left: 4px solid #66bb6a; } .btn-cerrar { background: linear-gradient(135deg, #b3e5fc, #81d4fa); color: #0277bd; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(129, 212, 250, 0.3); } .btn-cerrar:hover { background: linear-gradient(135deg, #81d4fa, #4fc3f7); color: white; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4); }';
document.head.appendChild(style);