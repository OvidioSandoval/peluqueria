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
            nuevoCliente: {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            }
        };
    },
    methods: {
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
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
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
                        <h3>Nuevo Cliente</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre Completo: *</label>
                                <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Ingrese el nombre completo" required/>
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
                            <button @click="agregarCliente()" class="btn">Agregar Cliente</button>
                            <button @click="goBack" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});