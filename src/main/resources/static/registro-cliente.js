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
            nuevoCliente: {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },
            modoEdicion: false,
            clienteExistente: null
        };
    },
    mounted() {
        this.fetchClientes();
    },
    methods: {
        async fetchClientes() {
            try {
                if (window.ConsoleLogger) ConsoleLogger.network.request('GET', `${config.apiBaseUrl}/clientes`);
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes`);
                if (!response.ok) throw new Error('Error al cargar clientes');
                this.clientes = await response.json();
                if (window.ConsoleLogger) ConsoleLogger.crud.read('Clientes para registro', { cantidad: this.clientes.length });
            } catch (error) {
                console.error('Error:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al cargar clientes para registro', error);
                NotificationSystem.error('Error al cargar clientes');
            }
        },
        verificarClienteExistente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) return;
            
            const nombreBuscar = this.nuevoCliente.nombreCompleto.trim().toLowerCase();
            if (window.ConsoleLogger) ConsoleLogger.info('Verificando cliente existente', { nombre: nombreBuscar });
            this.clienteExistente = this.clientes.find(c => 
                c.nombreCompleto.toLowerCase() === nombreBuscar
            );
            
            if (this.clienteExistente && !this.modoEdicion) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Cliente ya existe', { cliente: this.clienteExistente.nombreCompleto });
                NotificationSystem.confirm(
                    `El cliente "${this.clienteExistente.nombreCompleto}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarClienteParaEdicion(this.clienteExistente);
                    }
                );
            } else if (!this.clienteExistente) {
                if (window.ConsoleLogger) ConsoleLogger.success('Cliente no existe, puede proceder con el registro');
            }
        },
        verificarRucExistente() {
            if (!this.nuevoCliente.ruc.trim()) return;
            
            const rucBuscar = this.nuevoCliente.ruc.trim().toLowerCase();
            const clienteConRuc = this.clientes.find(c => 
                c.ruc && c.ruc.toLowerCase() === rucBuscar && c.id !== this.nuevoCliente.id
            );
            
            if (clienteConRuc) {
                NotificationSystem.confirm(
                    `Ya existe un cliente con el RUC "${this.nuevoCliente.ruc}": ${clienteConRuc.nombreCompleto}. ¿Desea modificarlo?`,
                    () => {
                        this.cargarClienteParaEdicion(clienteConRuc);
                    },
                    () => {
                        this.nuevoCliente.ruc = '';
                    }
                );
            }
        },
        cargarClienteParaEdicion(cliente) {
            let fechaFormateada = null;
            if (cliente.fechaNacimiento && Array.isArray(cliente.fechaNacimiento)) {
                const [year, month, day] = cliente.fechaNacimiento;
                fechaFormateada = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else if (cliente.fechaNacimiento) {
                fechaFormateada = cliente.fechaNacimiento;
            }
            
            this.nuevoCliente = {
                id: cliente.id,
                nombreCompleto: cliente.nombreCompleto || '',
                telefono: cliente.telefono || '',
                ruc: cliente.ruc || '',
                correo: cliente.correo || '',
                redesSociales: cliente.redesSociales || '',
                fechaNacimiento: fechaFormateada
            };
            this.modoEdicion = true;
            this.clienteExistente = cliente;
        },
        async agregarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida en registro: nombre completo requerido');
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida en registro: email inválido', { email: this.nuevoCliente.correo });
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                if (window.ConsoleLogger) ConsoleLogger.network.request('POST', `${config.apiBaseUrl}/clientes/agregar_cliente`, clienteData);
                const response = await fetch(`${config.apiBaseUrl}/clientes/agregar_cliente`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes/agregar_cliente`);
                if (response.ok) {
                    if (window.ConsoleLogger) ConsoleLogger.crud.create('Cliente desde registro', clienteData);
                    NotificationSystem.success('Cliente agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchClientes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al agregar cliente desde registro', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        async modificarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida en modificación: nombre completo requerido');
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida en modificación: email inválido', { email: this.nuevoCliente.correo });
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                if (window.ConsoleLogger) ConsoleLogger.network.request('PUT', `${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, clienteData);
                const response = await fetch(`${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`);
                if (response.ok) {
                    if (window.ConsoleLogger) ConsoleLogger.crud.update('Cliente desde registro', clienteData);
                    NotificationSystem.success('Cliente actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchClientes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar cliente:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al modificar cliente desde registro', error);
                NotificationSystem.error(`Error al modificar cliente: ${error.message}`);
            }
        },
        limpiarFormulario() {
            if (window.ConsoleLogger) ConsoleLogger.info('Limpiando formulario de cliente');
            this.nuevoCliente = {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            };
            this.modoEdicion = false;
            this.clienteExistente = null;
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
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Cliente</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Cliente - ' + nuevoCliente.nombreCompleto : 'Nuevo Cliente' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre Completo: *</label>
                                <input type="text" v-model="nuevoCliente.nombreCompleto" @blur="verificarClienteExistente" placeholder="Ingrese el nombre completo" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoCliente.telefono" placeholder="Ej: 0981234567" maxlength="10" style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>RUC:</label>
                                <input type="text" v-model="nuevoCliente.ruc" @blur="verificarRucExistente" placeholder="Ingrese el RUC" maxlength="20" style="border: 2px solid #87CEEB;"/>
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
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarCliente() : agregarCliente()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Cliente
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : goBack()" class="btn btn-secondary">
                                {{ modoEdicion ? 'Cancelar Edición' : 'Cancelar' }}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } textarea { height: auto !important; min-height: 60px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; }';
document.head.appendChild(style);