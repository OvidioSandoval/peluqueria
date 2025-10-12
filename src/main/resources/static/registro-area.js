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
            nuevaArea: { 
                id: null, 
                nombre: '' 
            },
            cargando: false,
            modoEdicion: false,
            areaExistente: null
        };
    },
    mounted() {
        this.fetchAreas();
    },
    methods: {
        async fetchAreas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/areas`);
                if (!response.ok) throw new Error('Error al cargar áreas');
                this.areas = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar áreas');
            }
        },
        verificarAreaExistente() {
            if (!this.nuevaArea.nombre.trim()) return;
            
            const nombreBuscar = this.nuevaArea.nombre.trim().toLowerCase();
            this.areaExistente = this.areas.find(a => 
                a.nombre.toLowerCase() === nombreBuscar
            );
            
            if (this.areaExistente && !this.modoEdicion) {
                NotificationSystem.error(`El área "${this.areaExistente.nombre}" ya existe.`);
                NotificationSystem.confirm(
                    `¿Desea modificar el área "${this.areaExistente.nombre}"?`,
                    () => {
                        this.cargarAreaParaEdicion(this.areaExistente);
                    }
                );
            }
        },
        cargarAreaParaEdicion(area) {
            this.nuevaArea = { ...area };
            this.modoEdicion = true;
            this.areaExistente = area;
        },
        async agregarArea() {
            if (!this.nuevaArea.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            try {
                this.cargando = true;
                const areaData = {
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre.trim())
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/agregar_area`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    NotificationSystem.success('Área agregada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchAreas();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar área:', error);
                NotificationSystem.error(`Error al agregar área: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        async modificarArea() {
            if (!this.nuevaArea.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            try {
                this.cargando = true;
                const areaData = {
                    nombre: this.capitalizarTexto(this.nuevaArea.nombre.trim())
                };
                const response = await fetch(`${config.apiBaseUrl}/areas/actualizar_area/${this.nuevaArea.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(areaData)
                });
                if (response.ok) {
                    NotificationSystem.success('Área actualizada exitosamente');
                    this.limpiarFormulario();
                    await this.fetchAreas();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar área:', error);
                NotificationSystem.error(`Error al modificar área: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        limpiarFormulario() {
            this.nuevaArea = { 
                id: null, 
                nombre: '' 
            };
            this.modoEdicion = false;
            this.areaExistente = null;
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Editar Área' : 'Registro de Área' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container" style="width: fit-content; max-width: 500px;">
                        <h3>{{ modoEdicion ? 'Modificar Área - ' + nuevaArea.nombre : 'Nueva Área' }}</h3>
                        <label>Nombre: *</label>
                        <input type="text" v-model="nuevaArea.nombre" @input="verificarAreaExistente" placeholder="Ingrese el nombre del área" required style="border: 2px solid #87CEEB;"/>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="modoEdicion ? modificarArea() : agregarArea()" class="btn" :disabled="cargando">
                                {{ cargando ? 'Guardando...' : (modoEdicion ? 'Modificar' : 'Agregar') }}
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : window.history.back()" class="btn btn-secondary">
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
style.textContent = '.form-container { margin: 0 auto !important; }';
document.head.appendChild(style);