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
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            filtroHora: new Date().toTimeString().substring(0, 5),

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
        this.filtrarTurnos();
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
            let turnosFiltrados = [...this.turnos];
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                turnosFiltrados = turnosFiltrados.filter(turno =>
                    (turno.cliente && turno.cliente.nombreCompleto && turno.cliente.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (turno.servicio && turno.servicio.nombre && turno.servicio.nombre.toLowerCase().includes(busqueda)) ||
                    (turno.empleado && turno.empleado.nombreCompleto && turno.empleado.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (turno.estado && turno.estado.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroFecha) {
                turnosFiltrados = turnosFiltrados.filter(turno => {
                    const fechaTurno = this.formatearFechaParaInput(turno.fecha);
                    return fechaTurno === this.filtroFecha;
                });
            }
            
            if (this.filtroHora) {
                turnosFiltrados = turnosFiltrados.filter(turno => {
                    const horaTurno = this.formatearHoraParaInput(turno.hora);
                    return horaTurno === this.filtroHora;
                });
            }
            
            this.turnosFiltrados = turnosFiltrados;
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
        
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtroHora = '';
            this.filtrarTurnos();
        },
        
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text('Registro de Turnos', 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total: ${this.turnosFiltrados.length} turnos`, 150, 25);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                const headers = [['Cliente', 'Servicio', 'Empleado', 'Fecha', 'Hora', 'Estado', 'Motivo Cancelación', 'Recordatorio']];
                const data = this.turnosFiltrados.map(turno => [
                    this.getClienteName(turno),
                    this.getServicioName(turno),
                    this.getEmpleadoName(turno),
                    this.formatearFechaParaInput(turno.fecha),
                    this.formatearHoraParaInput(turno.hora),
                    turno.estado,
                    turno.motivoCancelacion || '-',
                    turno.recordatorioEnviado ? 'Enviado' : 'No enviado'
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 50,
                    styles: { 
                        fontSize: 8,
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255]
                    },
                    headStyles: { 
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0],
                        fillColor: [255, 255, 255]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 255, 255]
                    }
                });
                
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(20, 280, 190, 280);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(8);
                    doc.text('Peluquería LUNA - Sistema de Gestión', 20, 290);
                    doc.text(`Página ${i} de ${pageCount}`, 170, 290);
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`turnos-${fecha}.pdf`);
                NotificationSystem.success('Registro de turnos exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Turnos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="margin-right: 20px;">
                            <label>Buscar:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarTurnos" placeholder="Cliente, servicio, empleado, estado..." class="search-bar" style="width: 240px;"/>
                        </div>
                        <div class="filter-group" style="margin-right: 15px;">
                            <label>Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarTurnos" class="search-bar" style="width: 140px;"/>
                        </div>
                        <div class="filter-group" style="margin-right: 5px;">
                            <label>Hora:</label>
                            <input type="time" v-model="filtroHora" @change="filtrarTurnos" class="search-bar" style="width: 120px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nuevo Turno</button>
                        <button @click="toggleFormularioCliente()" class="btn btn-small" v-if="!formularioVisible">
                            <i class="fas fa-user-plus"></i> Nuevo Cliente
                        </button>
                        <button @click="exportarPDF" class="btn btn-small" v-if="!formularioVisible">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container" style="background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); width: fit-content; max-width: 1000px;">
                        <h3>{{ nuevoTurno.id ? 'Modificar Turno - ' + turnoSeleccionado : 'Agregar Turno' }}</h3>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Cliente:</label>
                                <select v-model="nuevoTurno.clienteId" required>
                                    <option value="" disabled>Seleccionar Cliente</option>
                                    <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                                        {{ cliente.nombreCompleto || cliente.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label>Servicio:</label>
                                <select v-model="nuevoTurno.servicioId" required>
                                    <option value="" disabled>Seleccionar Servicio</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label>Empleado:</label>
                                <select v-model="nuevoTurno.empleadoId" required>
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                        {{ empleado.nombreCompleto }}
                                    </option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Estado:</label>
                                <select v-model="nuevoTurno.estado">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
                            <div style="flex: 1; min-width: 150px;">
                                <label>Fecha:</label>
                                <input type="date" v-model="nuevoTurno.fecha" required/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Hora:</label>
                                <input type="time" v-model="nuevoTurno.hora" required/>
                            </div>
                            <div style="flex: 2; min-width: 200px;">
                                <label>Motivo Cancelación:</label>
                                <input type="text" v-model="nuevoTurno.motivoCancelacion" placeholder="Opcional"/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Recordatorio:</label>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                    <input type="checkbox" v-model="nuevoTurno.recordatorioEnviado" style="width: auto; margin: 0;"/>
                                    <span>{{ nuevoTurno.recordatorioEnviado ? 'Enviado' : 'No enviado' }}</span>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="nuevoTurno.id ? modificarTurno() : agregarTurno()" class="btn">
                                {{ nuevoTurno.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="formularioClienteVisible" class="form-container" style="background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); width: fit-content; max-width: 800px;">
                        <h3><i class="fas fa-user-plus"></i> Nuevo Cliente</h3>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Nombre Completo:</label>
                                <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Nombre Completo" required/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoCliente.telefono" placeholder="Teléfono" maxlength="10"/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>RUC:</label>
                                <input type="text" v-model="nuevoCliente.ruc" placeholder="RUC" maxlength="20"/>
                            </div>
                        </div>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
                            <div style="flex: 2; min-width: 200px;">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoCliente.correo" placeholder="Correo"/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Fecha de Nacimiento:</label>
                                <input type="date" v-model="nuevoCliente.fechaNacimiento"/>
                            </div>
                        </div>
                        <div style="margin-top: 15px;">
                            <label>Redes Sociales:</label>
                            <textarea v-model="nuevoCliente.redesSociales" placeholder="Redes Sociales" style="width: 100%;"></textarea>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="agregarCliente()" class="btn">
                                <i class="fas fa-user-plus"></i> Agregar
                            </button>
                            <button @click="toggleFormularioCliente()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Servicio</th>
                                <th>Empleado</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                                <th>Motivo Cancelación</th>
                                <th>Recordatorio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="turno in turnosPaginados" :key="turno.id">
                                <td>{{ getClienteName(turno) }}</td>
                                <td>{{ getServicioName(turno) }}</td>
                                <td>{{ getEmpleadoName(turno) }}</td>
                                <td>{{ formatearFechaHora(turno.fecha, turno.hora) }}</td>
                                <td>{{ turno.estado }}</td>
                                <td>{{ turno.motivoCancelacion || '-' }}</td>
                                <td>{{ turno.recordatorioEnviado ? 'Enviado' : 'No enviado' }}</td>
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






