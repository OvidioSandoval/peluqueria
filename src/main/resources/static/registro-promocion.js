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
            servicios: [],
            nuevaPromocion: {
                id: null,
                titulo: '',
                descripcion: [],
                precio: 0
            },
            modoEdicion: false,
            promocionExistente: null
        };
    },
    mounted() {
        this.fetchServicios();
    },
    methods: {
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    this.servicios = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        verificarPromocionExistente() {
            if (!this.nuevaPromocion.titulo.trim()) return;
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const tituloBuscar = this.nuevaPromocion.titulo.trim().toLowerCase();
            this.promocionExistente = promociones.find(p => 
                p.titulo.toLowerCase() === tituloBuscar
            );
            
            if (this.promocionExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `La promoción "${this.promocionExistente.titulo}" ya existe. ¿Desea modificarla?`,
                    () => {
                        this.cargarPromocionParaEdicion(this.promocionExistente);
                    }
                );
            }
        },
        cargarPromocionParaEdicion(promo) {
            this.nuevaPromocion = {
                id: promo.id,
                titulo: promo.titulo,
                descripcion: promo.descripcion ? promo.descripcion.split(' + ') : [],
                precio: promo.precio
            };
            this.modoEdicion = true;
            this.promocionExistente = promo;
        },
        async agregarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                NotificationSystem.error('El título es obligatorio');
                return;
            }
            if (!this.nuevaPromocion.descripcion.length) {
                NotificationSystem.error('Debe seleccionar al menos un servicio');
                return;
            }
            if (!this.nuevaPromocion.precio || this.nuevaPromocion.precio <= 0) {
                NotificationSystem.error('El precio debe ser mayor a 0');
                return;
            }
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const nuevoId = Math.max(...promociones.map(p => p.id), 0) + 1;
            promociones.push({
                ...this.nuevaPromocion,
                id: nuevoId,
                titulo: this.capitalizarTexto(this.nuevaPromocion.titulo),
                descripcion: this.nuevaPromocion.descripcion.join(' + ')
            });
            
            localStorage.setItem('promociones', JSON.stringify(promociones));
            NotificationSystem.success('Promoción registrada exitosamente');
            this.limpiarFormulario();
        },
        async modificarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                NotificationSystem.error('El título es obligatorio');
                return;
            }
            if (!this.nuevaPromocion.descripcion.length) {
                NotificationSystem.error('Debe seleccionar al menos un servicio');
                return;
            }
            if (!this.nuevaPromocion.precio || this.nuevaPromocion.precio <= 0) {
                NotificationSystem.error('El precio debe ser mayor a 0');
                return;
            }
            
            const promocionesGuardadas = localStorage.getItem('promociones');
            const promociones = promocionesGuardadas ? JSON.parse(promocionesGuardadas) : [];
            
            const index = promociones.findIndex(p => p.id === this.nuevaPromocion.id);
            if (index !== -1) {
                promociones[index] = {
                    ...this.nuevaPromocion,
                    titulo: this.capitalizarTexto(this.nuevaPromocion.titulo),
                    descripcion: this.nuevaPromocion.descripcion.join(' + ')
                };
                localStorage.setItem('promociones', JSON.stringify(promociones));
                NotificationSystem.success('Promoción actualizada exitosamente');
                this.limpiarFormulario();
            }
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },

        limpiarFormulario() {
            this.nuevaPromocion = {
                id: null,
                titulo: '',
                descripcion: [],
                precio: 0
            };
            this.modoEdicion = false;
            this.promocionExistente = null;
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Registrar Nueva Promoción</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Promoción - ' + nuevaPromocion.titulo : 'Nueva Promoción' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Título: *</label>
                                <input type="text" v-model="nuevaPromocion.titulo" @blur="verificarPromocionExistente" placeholder="Título" required style="border: 2px solid #87CEEB; width: 150px; padding: 4px; font-size: 11px;"/>
                            </div>
                            <div class="form-col">
                                <label>Precio: *</label>
                                <input type="number" v-model="nuevaPromocion.precio" placeholder="Precio" required style="border: 2px solid #87CEEB; width: 100px; padding: 4px; font-size: 11px;"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col" style="min-width: 200px;">
                                <label>Servicios: *</label>
                                <select v-model="nuevaPromocion.descripcion" multiple required style="border: 2px solid #87CEEB; min-height: 80px; width: 200px; padding: 4px; font-size: 11px;">
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.nombre">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                                <small style="color: #666; font-size: 9px;">Ctrl + clic para múltiples</small>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="modoEdicion ? modificarPromocion() : agregarPromocion()" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Agregar' }} Promoción
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