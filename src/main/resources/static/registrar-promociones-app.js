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
            promociones: [],
            servicios: [],
            filtroBusqueda: '',
            promocionesFiltradas: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaPromocion: {
                id: null,
                titulo: '',
                descripcion: '',
                precio: 0
            },
            promocionSeleccionada: ''
        };
    },
    mounted() {
        this.cargarPromociones();
        this.fetchServicios();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.promocionesFiltradas.length / this.itemsPorPagina);
        },
        promocionesPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.promocionesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        cargarPromociones() {
            const promocionesGuardadas = localStorage.getItem('promociones');
            if (promocionesGuardadas) {
                this.promociones = JSON.parse(promocionesGuardadas);
            } else {
                this.promociones = [];
            }
            this.filtrarPromociones();
        },
        filtrarPromociones() {
            if (this.filtroBusqueda.trim() === '') {
                this.promocionesFiltradas = this.promociones;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.promocionesFiltradas = this.promociones.filter(promo =>
                    (promo.titulo && promo.titulo.toLowerCase().includes(busqueda)) ||
                    (promo.descripcion && promo.descripcion.toLowerCase().includes(busqueda))
                );
            }
            this.paginaActual = 1;
        },
        async agregarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                NotificationSystem.error('El título es obligatorio');
                return;
            }
            
            // Verificar duplicado
            const existe = this.promociones.find(promo => 
                promo.titulo.toLowerCase() === this.nuevaPromocion.titulo.toLowerCase()
            );
            
            if (existe) {
                NotificationSystem.confirm(
                    `La promoción "${this.nuevaPromocion.titulo}" ya existe. ¿Desea ir a la página de administración para modificarla?`,
                    () => {
                        window.location.href = '/web/admin-promociones';
                    }
                );
                return;
            }

            const nuevoId = Math.max(...this.promociones.map(p => p.id), 0) + 1;
            this.promociones.push({
                ...this.nuevaPromocion,
                id: nuevoId,
                titulo: this.capitalizarTexto(this.nuevaPromocion.titulo)
            });
            
            localStorage.setItem('promociones', JSON.stringify(this.promociones));
            this.cargarPromociones();
            this.toggleFormulario();
            NotificationSystem.success('Promoción agregada exitosamente');
        },
        async modificarPromocion() {
            if (!this.nuevaPromocion.titulo.trim()) {
                NotificationSystem.error('El título es obligatorio');
                return;
            }
            
            const index = this.promociones.findIndex(p => p.id === this.nuevaPromocion.id);
            if (index !== -1) {
                this.promociones[index] = {
                    ...this.nuevaPromocion,
                    titulo: this.capitalizarTexto(this.nuevaPromocion.titulo)
                };
                localStorage.setItem('promociones', JSON.stringify(this.promociones));
                this.cargarPromociones();
                this.toggleFormulario();
                NotificationSystem.success('Promoción actualizada exitosamente');
            }
        },
        async eliminarPromocion(promo) {
            NotificationSystem.confirm(`¿Eliminar promoción "${promo.titulo}"?`, () => {
                this.promociones = this.promociones.filter(p => p.id !== promo.id);
                localStorage.setItem('promociones', JSON.stringify(this.promociones));
                this.cargarPromociones();
                NotificationSystem.success('Promoción eliminada exitosamente');
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaPromocion = {
                id: null,
                titulo: '',
                descripcion: '',
                precio: 0
            };
            this.promocionSeleccionada = '';
        },
        cargarPromocion(promo) {
            this.nuevaPromocion = {
                id: promo.id,
                titulo: promo.titulo || '',
                descripcion: promo.descripcion || '',
                precio: promo.precio || 0
            };
            this.formularioVisible = true;
            this.promocionSeleccionada = promo.titulo;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearPrecio(precio) {
            return Number(precio).toLocaleString('es-PY', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    this.servicios = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Promociones</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap; width: fit-content; padding: 15px; margin: 15px 0; background: #fce4ec; backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3);">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Promoción:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarPromociones" placeholder="Buscar por título o descripción..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: end;">
                            <button @click="toggleFormulario" class="btn btn-small">
                                <i class="fas fa-plus"></i> {{ formularioVisible ? 'Ocultar' : 'Agregar' }}
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container" style="background: rgba(252, 228, 236, 0.9); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 20px;">{{ nuevaPromocion.id ? 'Editar Promoción' : 'Agregar Nueva Promoción' }}</h3>
                        <div v-if="promocionSeleccionada" style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                            <strong>Editando:</strong> {{ promocionSeleccionada }}
                        </div>
                        <form @submit.prevent="nuevaPromocion.id ? modificarPromocion() : agregarPromocion()">
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Título:</label>
                                <input type="text" v-model="nuevaPromocion.titulo" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Servicio:</label>
                                <select v-model="nuevaPromocion.descripcion" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                                    <option value="">Seleccionar servicio...</option>
                                    <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.nombre">
                                        {{ servicio.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Precio:</label>
                                <input type="number" v-model="nuevaPromocion.precio" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                            </div>
                            <div class="form-buttons" style="display: flex; gap: 10px; justify-content: center;">
                                <button type="submit" class="btn btn-primary">
                                    {{ nuevaPromocion.id ? 'Actualizar' : 'Agregar' }}
                                </button>
                                <button type="button" @click="toggleFormulario" class="btn btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="promo in promocionesPaginadas" :key="promo.id">
                                <td>{{ promo.id }}</td>
                                <td>{{ promo.titulo }}</td>
                                <td>{{ promo.descripcion }}</td>
                                <td>₲{{ formatearPrecio(promo.precio) }}</td>
                                <td>
                                    <button @click="cargarPromocion(promo)" class="btn-small">Editar</button>
                                    <button @click="eliminarPromocion(promo)" class="btn-small btn-danger">Eliminar</button>
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

// Estilos
const style = document.createElement('style');
style.textContent = `
    .filter-group {
        display: flex;
        flex-direction: column;
        min-width: fit-content;
    }
    .filter-group label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #5d4037;
    }
    .search-bar {
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        transition: border-color 0.3s;
        width: 300px;
    }
    .search-bar:focus {
        border-color: #5d4037;
        outline: none;
    }
`;
document.head.appendChild(style);