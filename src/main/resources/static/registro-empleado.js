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
            areas: [],
            empleados: [],
            nuevaArea: '',
            mostrarNuevaArea: false,
            nuevoEmpleado: {
                id: null,
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
            modoEdicion: false,
            empleadoExistente: null
        };
    },
    mounted() {
        this.fetchAreas();
        this.fetchEmpleados();
    },
    methods: {
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                if (!response.ok) throw new Error('Error al cargar empleados');
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar empleados');
            }
        },
        verificarEmpleadoExistente() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) return;
            
            const nombreBuscar = this.nuevoEmpleado.nombreCompleto.trim().toLowerCase();
            this.empleadoExistente = this.empleados.find(e => 
                e.nombreCompleto.toLowerCase() === nombreBuscar
            );
            
            if (this.empleadoExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `El empleado "${this.empleadoExistente.nombreCompleto}" ya existe. ¿Desea modificarlo?`,
                    () => {
                        this.cargarEmpleadoParaEdicion(this.empleadoExistente);
                    }
                );
            }
        },
        cargarEmpleadoParaEdicion(empleado) {
            this.nuevoEmpleado = { ...empleado };
            this.modoEdicion = true;
            this.empleadoExistente = empleado;
        },
        async fetchAreas() {
            try {
                const response = await fetch(config.apiBaseUrl + '/areas');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.areas = await response.json();
            } catch (error) {
                console.error('Error al cargar areas:', error);
                NotificationSystem.error('Error al cargar las areas: ' + error.message);
            }
        },
        
        validarEmail(email) {
            if (!email) return true;
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        },
        
        async agregarEmpleado() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.nuevoEmpleado.area) {
                NotificationSystem.error('El área es obligatoria');
                return;
            }
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electrónico no es válido');
                return;
            }
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
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0]
                };
                
                const response = await fetch(config.apiBaseUrl + '/empleados/agregar_empleado', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    NotificationSystem.success('Empleado agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchEmpleados();
                } else {
                    throw new Error('Error ' + response.status + ': ' + response.statusText);
                }
            } catch (error) {
                console.error('Error al agregar empleado:', error);
                NotificationSystem.error('Error al agregar empleado: ' + error.message);
            }
        },
        
        async modificarEmpleado() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.nuevoEmpleado.area) {
                NotificationSystem.error('El área es obligatoria');
                return;
            }
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electrónico no es válido');
                return;
            }
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
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0]
                };
                
                const response = await fetch(`${config.apiBaseUrl}/empleados/actualizar_empleado/${this.nuevoEmpleado.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    NotificationSystem.success('Empleado actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchEmpleados();
                } else {
                    throw new Error('Error ' + response.status + ': ' + response.statusText);
                }
            } catch (error) {
                console.error('Error al modificar empleado:', error);
                NotificationSystem.error('Error al modificar empleado: ' + error.message);
            }
        },
        limpiarFormulario() {
            this.nuevoEmpleado = {
                id: null,
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
            this.modoEdicion = false;
            this.empleadoExistente = null;
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        
        async agregarArea() {
            if (!this.nuevaArea.trim()) {
                NotificationSystem.error('El nombre del área es obligatorio');
                return;
            }
            try {
                const response = await fetch(config.apiBaseUrl + '/areas/agregar_area', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: this.capitalizarTexto(this.nuevaArea) })
                });
                if (response.ok) {
                    await this.fetchAreas();
                    this.nuevaArea = '';
                    this.mostrarNuevaArea = false;
                    NotificationSystem.success('Área agregada exitosamente');
                } else {
                    throw new Error('Error ' + response.status + ': ' + response.statusText);
                }
            } catch (error) {
                console.error('Error al agregar área:', error);
                NotificationSystem.error('Error al agregar área: ' + error.message);
            }
        },
        
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nuevo Empleado</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Empleado - ' + nuevoEmpleado.nombreCompleto : 'Nuevo Empleado' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre Completo: *</label>
                                <input type="text" v-model="nuevoEmpleado.nombreCompleto" @blur="verificarEmpleadoExistente" placeholder="Ingrese el nombre completo" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Correo Electrónico:</label>
                                <input type="email" v-model="nuevoEmpleado.correo" placeholder="ejemplo@correo.com" style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Teléfono:</label>
                                <input type="tel" v-model="nuevoEmpleado.telefono" placeholder="Ej: 0981234567" maxlength="10" style="border: 2px solid #87CEEB;"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Área: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevoEmpleado.area" required style="flex: 1; border: 2px solid #87CEEB;">
                                        <option value="" disabled>Seleccionar Área</option>
                                        <option v-for="area in areas" :key="area.id" :value="area">{{ area.nombre }}</option>
                                    </select>
                                    <button type="button" @click="mostrarNuevaArea = !mostrarNuevaArea" class="btn btn-small">+</button>
                                </div>
                                <div v-if="mostrarNuevaArea" style="margin-top: 10px; display: flex; gap: 10px;">
                                    <input type="text" v-model="nuevaArea" placeholder="Nombre del área" style="flex: 1; border: 2px solid #87CEEB;"/>
                                    <button type="button" @click="agregarArea()" class="btn btn-small">Agregar</button>
                                    <button type="button" @click="mostrarNuevaArea = false; nuevaArea = ''" class="btn btn-small btn-secondary">Cancelar</button>
                                </div>
                            </div>
                            <div class="form-col">
                                <label>Sueldo Base:</label>
                                <input type="number" v-model="nuevoEmpleado.sueldoBase" placeholder="Sueldo base" min="0" style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Comisión %:</label>
                                <input type="number" v-model="nuevoEmpleado.comisionPorcentaje" placeholder="Comisión %" min="0" max="100" style="border: 2px solid #87CEEB;"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Total Pagado:</label>
                                <input type="number" v-model="nuevoEmpleado.totalPagado" placeholder="Total pagado" min="0" style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label>Fecha de Ingreso:</label>
                                <input type="date" v-model="nuevoEmpleado.fechaIngreso" style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div class="form-col">
                                <label style="display: flex; align-items: center; gap: 5px; margin-top: 25px;">
                                    <input type="checkbox" v-model="nuevoEmpleado.activo"/>
                                    Empleado Activo
                                </label>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarEmpleado() : agregarEmpleado()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Empleado
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
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 150px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; gap: 3px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .form-row { margin: 10px 0 !important; gap: 15px !important; display: flex !important; flex-wrap: wrap !important; align-items: end !important; } .form-col { flex: 0 0 auto !important; min-width: fit-content !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .btn-small { padding: 6px 10px !important; font-size: 11px !important; } .btn-small.btn-secondary { background: #d39bdb !important; color: #872fab !important; }';
document.head.appendChild(style);