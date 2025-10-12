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
            categoria: {
                descripcion: ''
            },
            categoriaExistente: null,
            modoEdicion: false,
            categoriaOriginalId: null
        };
    },
    methods: {
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                return await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                return [];
            }
        },
        async verificarCategoriaExistente() {
            if (!this.categoria.descripcion.trim()) return;
            
            const categorias = await this.fetchCategorias();
            const categoriaExistente = categorias.find(c => 
                c.descripcion.toLowerCase() === this.categoria.descripcion.toLowerCase().trim()
            );
            
            if (categoriaExistente && (!this.modoEdicion || categoriaExistente.id !== this.categoriaOriginalId)) {
                this.categoriaExistente = categoriaExistente;
                NotificationSystem.confirm(
                    `Ya existe una categoría "${categoriaExistente.descripcion}". ¿Desea modificarla?`,
                    () => this.cargarCategoriaParaEdicion(categoriaExistente),
                    () => {
                        this.categoriaExistente = null;
                        this.categoria.descripcion = '';
                    }
                );
            } else {
                this.categoriaExistente = null;
            }
        },
        cargarCategoriaParaEdicion(categoriaExistente) {
            this.modoEdicion = true;
            this.categoriaOriginalId = categoriaExistente.id;
            this.categoria = {
                descripcion: categoriaExistente.descripcion
            };
            this.categoriaExistente = null;
        },
        async registrarCategoria() {
            if (!this.validarFormulario()) return;
            
            try {
                const categoriaData = {
                    ...this.categoria,
                    descripcion: this.capitalizarTexto(this.categoria.descripcion)
                };
                
                const url = this.modoEdicion 
                    ? `${config.apiBaseUrl}/categoria-servicios/actualizar_categoria/${this.categoriaOriginalId}`
                    : `${config.apiBaseUrl}/categoria-servicios/agregar_categoria`;
                const method = this.modoEdicion ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
                
                if (response.ok) {
                    NotificationSystem.success(
                        this.modoEdicion ? 'Categoría modificada exitosamente' : 'Categoría registrada exitosamente'
                    );
                    this.limpiarFormulario();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al registrar categoría:', error);
                NotificationSystem.error(`Error al registrar categoría: ${error.message}`);
            }
        },
        async modificarCategoria() {
            await this.registrarCategoria();
        },
        validarFormulario() {
            if (!this.categoria.descripcion.trim()) {
                NotificationSystem.error('La descripción de la categoría es requerida');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.categoria = {
                descripcion: ''
            };
            this.modoEdicion = false;
            this.categoriaOriginalId = null;
            this.categoriaExistente = null;
        },
        cancelar() {
            window.location.href = '/web/panel-control';
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
                <h1 class="page-title">{{ modoEdicion ? 'Modificar Categoría' : 'Registro de Servicio de Categoría' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container" style="width: fit-content; max-width: 500px;">
                        <div class="form-row">
                            <div class="form-col">
                                <label>Descripción: *</label>
                                <textarea 
                                    v-model="categoria.descripcion" 
                                    @input="verificarCategoriaExistente"
                                    placeholder="Ingrese la descripción de la categoría" 
                                    required 
                                    rows="3" 
                                    style="resize: vertical; width: 100%; padding: 10px; border: 2px solid #87CEEB; border-radius: 5px;"
                                ></textarea>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="registrarCategoria" class="btn">
                                {{ modoEdicion ? 'Modificar' : 'Registrar' }}
                            </button>
                            <button @click="cancelar" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});