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
            productos: [],
            nuevoProducto: {
                id: null,
                nombre: '',
                descripcion: '',
                precioCompra: 0,
                precioVenta: 0,
                cantidadStockInicial: 0,
                cantidadOptimaStock: null,
                minimoStock: null,
                activo: true,
                enPromocion: false,
                precioPromocion: null
            },
            cargando: false,
            modoEdicion: false,
            productoExistente: null
        };
    },
    mounted() {
        this.fetchProductos();
    },
    methods: {
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (!response.ok) throw new Error('Error al cargar productos');
                this.productos = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar productos');
            }
        },
        verificarProductoExistente() {
            if (!this.nuevoProducto.nombre.trim()) return;
            
            const nombreBuscar = this.nuevoProducto.nombre.trim().toLowerCase();
            this.productoExistente = this.productos.find(p => 
                p.nombre.toLowerCase() === nombreBuscar
            );
            
            if (this.productoExistente && !this.modoEdicion) {
                NotificationSystem.confirm(
                    `El producto "${this.productoExistente.nombre}" ya existe. ¿Desea actualizarlo?`,
                    () => {
                        this.cargarProductoParaEdicion(this.productoExistente);
                    }
                );
            }
        },
        cargarProductoParaEdicion(producto) {
            this.nuevoProducto = { ...producto };
            this.modoEdicion = true;
            this.productoExistente = producto;
        },
        async agregarProducto() {
            if (!this.validarFormulario()) return;
            
            try {
                this.cargando = true;
                const productoData = {
                    nombre: this.capitalizarTexto(this.nuevoProducto.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoProducto.descripcion ? this.nuevoProducto.descripcion.trim() : ''),
                    precioCompra: parseInt(this.nuevoProducto.precioCompra),
                    precioVenta: parseInt(this.nuevoProducto.precioVenta),
                    cantidadStockInicial: parseInt(this.nuevoProducto.cantidadStockInicial),
                    cantidadOptimaStock: this.nuevoProducto.cantidadOptimaStock ? parseInt(this.nuevoProducto.cantidadOptimaStock) : null,
                    minimoStock: this.nuevoProducto.minimoStock ? parseInt(this.nuevoProducto.minimoStock) : null,
                    activo: this.nuevoProducto.activo,
                    enPromocion: this.nuevoProducto.enPromocion,
                    precioPromocion: this.nuevoProducto.precioPromocion ? parseInt(this.nuevoProducto.precioPromocion) : null
                };
                
                const response = await fetch(`${config.apiBaseUrl}/productos/agregar_producto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
                
                if (response.ok) {
                    NotificationSystem.success('Producto agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProductos();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar producto:', error);
                NotificationSystem.error(`Error al agregar producto: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        async modificarProducto() {
            if (!this.validarFormulario()) return;
            
            try {
                this.cargando = true;
                const productoData = {
                    nombre: this.capitalizarTexto(this.nuevoProducto.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoProducto.descripcion ? this.nuevoProducto.descripcion.trim() : ''),
                    precioCompra: parseInt(this.nuevoProducto.precioCompra),
                    precioVenta: parseInt(this.nuevoProducto.precioVenta),
                    cantidadStockInicial: parseInt(this.nuevoProducto.cantidadStockInicial),
                    cantidadOptimaStock: this.nuevoProducto.cantidadOptimaStock ? parseInt(this.nuevoProducto.cantidadOptimaStock) : null,
                    minimoStock: this.nuevoProducto.minimoStock ? parseInt(this.nuevoProducto.minimoStock) : null,
                    activo: this.nuevoProducto.activo,
                    enPromocion: this.nuevoProducto.enPromocion,
                    precioPromocion: this.nuevoProducto.precioPromocion ? parseInt(this.nuevoProducto.precioPromocion) : null
                };
                
                const response = await fetch(`${config.apiBaseUrl}/productos/actualizar_producto/${this.nuevoProducto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
                
                if (response.ok) {
                    NotificationSystem.success('Producto actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProductos();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar producto:', error);
                NotificationSystem.error(`Error al modificar producto: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        validarFormulario() {
            if (!this.nuevoProducto.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return false;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                NotificationSystem.error('El precio de compra debe ser mayor a 0');
                return false;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                NotificationSystem.error('El precio de venta debe ser mayor a 0');
                return false;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial === undefined || this.nuevoProducto.cantidadStockInicial < 0) {
                NotificationSystem.error('El stock inicial es requerido y debe ser mayor o igual a 0');
                return false;
            }
            if (!this.nuevoProducto.cantidadOptimaStock || this.nuevoProducto.cantidadOptimaStock <= 0) {
                NotificationSystem.error('El stock óptimo es requerido y debe ser mayor a 0');
                return false;
            }
            if (!this.nuevoProducto.minimoStock || this.nuevoProducto.minimoStock <= 0) {
                NotificationSystem.error('El stock mínimo es requerido y debe ser mayor a 0');
                return false;
            }
            return true;
        },
        limpiarFormulario() {
            this.nuevoProducto = {
                id: null,
                nombre: '',
                descripcion: '',
                precioCompra: 0,
                precioVenta: 0,
                cantidadStockInicial: 0,
                cantidadOptimaStock: null,
                minimoStock: null,
                activo: true,
                enPromocion: false,
                precioPromocion: null
            };
            this.modoEdicion = false;
            this.productoExistente = null;
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
                <h1 class="page-title">{{ modoEdicion ? 'Editar Producto' : 'Registro de Producto' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Producto - ' + nuevoProducto.nombre : 'Nuevo Producto' }}</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: end;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoProducto.nombre" @blur="verificarProductoExistente" placeholder="Nombre del producto" required/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Precio Compra: *</label>
                                <input type="number" v-model="nuevoProducto.precioCompra" placeholder="Precio compra" required/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Precio Venta: *</label>
                                <input type="number" v-model="nuevoProducto.precioVenta" placeholder="Precio venta" required/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Inicial: *</label>
                                <input type="number" v-model="nuevoProducto.cantidadStockInicial" placeholder="Stock inicial" required/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Óptimo: *</label>
                                <input type="number" v-model="nuevoProducto.cantidadOptimaStock" placeholder="Stock óptimo" required/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Mínimo: *</label>
                                <input type="number" v-model="nuevoProducto.minimoStock" placeholder="Stock mínimo" required/>
                            </div>
                            <div v-if="nuevoProducto.enPromocion" style="flex: 1; min-width: 150px;">
                                <label>Precio Promoción:</label>
                                <input type="number" v-model="nuevoProducto.precioPromocion" placeholder="Precio promoción"/>
                            </div>
                        </div>
                        <div style="margin-top: 15px; display: flex; gap: 20px; align-items: flex-start;">
                            <div>
                                <label>Descripción:</label>
                                <textarea v-model="nuevoProducto.descripcion" placeholder="Descripción del producto" rows="2" style="resize: vertical; width: 150px; height: 150px;"></textarea>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 25px;">
                                <label style="display: flex; align-items: center; gap: 5px; margin: 0;">
                                    <input type="checkbox" v-model="nuevoProducto.activo" style="margin: 0;"/>
                                    Activo
                                </label>
                                <label style="display: flex; align-items: center; gap: 5px; margin: 0;">
                                    <input type="checkbox" v-model="nuevoProducto.enPromocion" style="margin: 0;"/>
                                    Promoción
                                </label>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="modoEdicion ? modificarProducto() : agregarProducto()" class="btn" :disabled="cargando">
                                {{ cargando ? 'Guardando...' : (modoEdicion ? 'Modificar' : 'Agregar') }}
                            </button>
                            <button @click="modoEdicion ? limpiarFormulario() : window.history.back()" class="btn btn-secondary">{{ modoEdicion ? 'Cancelar Edición' : 'Cancelar' }}</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});