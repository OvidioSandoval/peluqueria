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
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                if (!response.ok) throw new Error('Error al cargar clientes');
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar clientes');
            }
        },
        verificarClienteExistente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) return;
            
            const nombreBuscar = this.nuevoCliente.nombreCompleto.trim().toLowerCase();
            this.clienteExistente = this.clientes.find(c => 
                c.nombreCompleto.toLowerCase() === nombreBuscar
            );
            
            if (this.clienteExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `El cliente "${this.clienteExistente.nombreCompleto}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarClienteParaEdicion(this.clienteExistente);
                    }
                );
            }
        },
        cargarClienteParaEdicion(cliente) {
            this.nuevoCliente = { ...cliente };
            this.modoEdicion = true;
            this.clienteExistente = cliente;
        },
        async agregarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
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
                    NotificationSystem.success('Cliente agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchClientes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        async modificarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
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
                    NotificationSystem.success('Cliente actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchClientes();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar cliente:', error);
                NotificationSystem.error(`Error al modificar cliente: ${error.message}`);
            }
        },
        limpiarFormulario() {
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
                                <input type="text" v-model="nuevoCliente.nombreCompleto" @blur="verificarClienteExistente" placeholder="Ingrese el nombre completo" required/>
                            </div>
                            <div class="form-col">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoCliente.telefono" placeholder="Ej: 0981234567" maxlength="10"/>
                            </div>
                            <div class="form-col">
                                <label>RUC:</label>
                                <input type="text" v-model="nuevoCliente.ruc" placeholder="Ingrese el RUC" maxlength="20"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoCliente.correo" placeholder="ejemplo@correo.com"/>
                            </div>
                            <div class="form-col">
                                <label>Fecha de Nacimiento:</label>
                                <input type="date" v-model="nuevoCliente.fechaNacimiento"/>
                            </div>
                            <div class="form-col">
                                <label>Redes Sociales:</label>
                                <textarea v-model="nuevoCliente.redesSociales" placeholder="Facebook, Instagram, etc." rows="2" style="resize: vertical;"></textarea>
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