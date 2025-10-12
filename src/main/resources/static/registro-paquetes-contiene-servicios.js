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
            relaciones: [],
            paquetes: [],
            servicios: [],
            nuevaRelacion: { 
                id: null,
                paqueteId: null,
                servicioId: null
            },
            relacionExistente: null,
            modoModificar: false,
        };
    },
    mounted() {
        this.fetchRelaciones();
        this.fetchPaquetes();
        this.fetchServicios();
    },
    methods: {
        async fetchRelaciones() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.relaciones = await response.json();
            } catch (error) {
                console.error('Error al cargar relaciones:', error);
                NotificationSystem.error(`Error al cargar las relaciones: ${error.message}`);
            }
        },
        async fetchPaquetes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/paquetes`);
                this.paquetes = await response.json();
            } catch (error) {
                console.error('Error al cargar paquetes:', error);
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
        verificarDuplicado() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) return;
            
            this.relacionExistente = this.relaciones.find(r => 
                r.paqueteId === this.nuevaRelacion.paqueteId && 
                r.servicioId === this.nuevaRelacion.servicioId
            );
            
            if (this.relacionExistente && !this.modoModificar) {
                const paqueteNombre = this.getPaqueteNombre(this.relacionExistente.paqueteId);
                const servicioNombre = this.getServicioNombre(this.relacionExistente.servicioId);
                NotificationSystem.confirm(
                    `La relación "${paqueteNombre} - ${servicioNombre}" ya existe. ¿Desea modificarla?`,
                    () => {
                        this.cargarRelacionParaEdicion(this.relacionExistente);
                    }
                );
            }
        },
        cargarRelacionParaEdicion(relacion) {
            this.nuevaRelacion = {
                id: relacion.id,
                paqueteId: relacion.paqueteId,
                servicioId: relacion.servicioId
            };
            this.modoModificar = true;
            this.relacionExistente = relacion;
        },
        async agregarRelacion() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) {
                NotificationSystem.error('Debe seleccionar paquete y servicio');
                return;
            }
            try {
                const relacionData = {
                    paquete: { id: parseInt(this.nuevaRelacion.paqueteId) },
                    servicio: { id: parseInt(this.nuevaRelacion.servicioId) }
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/agregar_paquete_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    NotificationSystem.success('Relación agregada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRelaciones();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar relación:', error);
                NotificationSystem.error(`Error al agregar relación: ${error.message}`);
            }
        },
        async modificarRelacion() {
            if (!this.nuevaRelacion.paqueteId || !this.nuevaRelacion.servicioId) {
                NotificationSystem.error('Debe seleccionar paquete y servicio');
                return;
            }
            try {
                const relacionData = {
                    paquete: { id: parseInt(this.nuevaRelacion.paqueteId) },
                    servicio: { id: parseInt(this.nuevaRelacion.servicioId) }
                };
                const response = await fetch(`${config.apiBaseUrl}/paquetes-servicios/actualizar_paquete_servicio/${this.nuevaRelacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relacionData)
                });
                if (response.ok) {
                    NotificationSystem.success('Relación actualizada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchRelaciones();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar relación:', error);
                NotificationSystem.error(`Error al modificar relación: ${error.message}`);
            }
        },
        limpiarFormulario() {
            this.nuevaRelacion = { 
                id: null,
                paqueteId: null,
                servicioId: null
            };
            this.relacionExistente = null;
            this.modoModificar = false;
        },
        getPaqueteNombre(paqueteId) {
            const paquete = this.paquetes.find(p => p.id === paqueteId);
            return paquete ? paquete.descripcion : 'Paquete no encontrado';
        },
        getServicioNombre(servicioId) {
            const servicio = this.servicios.find(s => s.id === servicioId);
            return servicio ? servicio.nombre : 'Servicio no encontrado';
        },
        crearPaquete() {
            window.open('/web/registro-paquetes-servicio', '_blank');
        },
        crearServicio() {
            window.open('/web/registro-servicio', '_blank');
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nueva Relación Paquete-Servicio</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoModificar ? 'Modificar Relación - ' + getPaqueteNombre(nuevaRelacion.paqueteId) + ' - ' + getServicioNombre(nuevaRelacion.servicioId) : 'Nueva Relación Paquete-Servicio' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Paquete: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevaRelacion.paqueteId" @change="verificarDuplicado" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Paquete</option>
                                        <option v-for="paquete in paquetes" :key="paquete.id" :value="paquete.id">
                                            {{ paquete.descripcion }}
                                        </option>
                                    </select>
                                    <button type="button" @click="crearPaquete()" class="btn btn-small">+</button>
                                </div>
                            </div>
                            <div class="form-col">
                                <label>Servicio: *</label>
                                <div style="display: flex; gap: 10px; align-items: end;">
                                    <select v-model="nuevaRelacion.servicioId" @change="verificarDuplicado" required style="flex: 1;">
                                        <option value="" disabled>Seleccionar Servicio</option>
                                        <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                                            {{ servicio.nombre }}
                                        </option>
                                    </select>
                                    <button type="button" @click="crearServicio()" class="btn btn-small">+</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoModificar ? modificarRelacion() : agregarRelacion()" class="btn">
                                {{ modoModificar ? 'Modificar' : 'Agregar' }} Relación
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