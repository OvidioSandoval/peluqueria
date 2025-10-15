import config from './config.js';

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
            productoExistente: null,
            mensaje: '',
            tipoMensaje: '',
            accionConfirmar: null
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
                this.mostrarMensajeError('Error al cargar productos');
            }
        },
        verificarProductoExistente() {
            if (!this.nuevoProducto.nombre.trim()) return;
            
            const nombreBuscar = this.nuevoProducto.nombre.trim().toLowerCase();
            this.productoExistente = this.productos.find(p => 
                p.nombre.toLowerCase() === nombreBuscar
            );
            
            if (this.productoExistente && !this.modoEdicion) {
                this.mostrarMensajeConfirmacion(
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
                    this.mostrarMensajeExito('Producto agregado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProductos();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar producto:', error);
                this.mostrarMensajeError(`Error al agregar producto: ${error.message}`);
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
                    this.mostrarMensajeExito('Producto actualizado exitosamente');
                    this.limpiarFormulario();
                    await this.fetchProductos();
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar producto:', error);
                this.mostrarMensajeError(`Error al modificar producto: ${error.message}`);
            } finally {
                this.cargando = false;
            }
        },
        validarFormulario() {
            if (!this.nuevoProducto.nombre.trim()) {
                this.mostrarMensajeError('El nombre es requerido');
                return false;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                this.mostrarMensajeError('El precio de compra debe ser mayor a 0');
                return false;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                this.mostrarMensajeError('El precio de venta debe ser mayor a 0');
                return false;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial === undefined || this.nuevoProducto.cantidadStockInicial < 0) {
                this.mostrarMensajeError('El stock inicial es requerido y debe ser mayor o igual a 0');
                return false;
            }
            if (!this.nuevoProducto.cantidadOptimaStock || this.nuevoProducto.cantidadOptimaStock <= 0) {
                this.mostrarMensajeError('El stock óptimo es requerido y debe ser mayor a 0');
                return false;
            }
            if (!this.nuevoProducto.minimoStock || this.nuevoProducto.minimoStock <= 0) {
                this.mostrarMensajeError('El stock mínimo es requerido y debe ser mayor a 0');
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
        },
        mostrarMensajeError(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'error';
        },
        mostrarMensajeExito(mensaje) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'exito';
        },
        mostrarMensajeConfirmacion(mensaje, accion) {
            this.mensaje = mensaje;
            this.tipoMensaje = 'confirmacion';
            this.accionConfirmar = accion;
        },
        confirmarAccion() {
            if (this.accionConfirmar) {
                this.accionConfirmar();
                this.accionConfirmar = null;
            }
            this.cerrarMensaje();
        },
        cerrarMensaje() {
            this.mensaje = '';
            this.tipoMensaje = '';
            this.accionConfirmar = null;
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">{{ modoEdicion ? 'Editar Producto' : 'Registro de Producto' }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <div v-if="mensaje" class="mensaje-overlay" @click="cerrarMensaje">
                    <div class="mensaje-modal" @click.stop>
                        <div class="mensaje-contenido" :class="tipoMensaje">
                            <p>{{ mensaje }}</p>
                            <div class="mensaje-botones">
                                <button v-if="tipoMensaje === 'confirmacion'" @click="confirmarAccion" class="btn btn-confirmar">Sí</button>
                                <button @click="cerrarMensaje" class="btn" :class="tipoMensaje === 'confirmacion' ? 'btn-cancelar' : 'btn-cerrar'">{{ tipoMensaje === 'confirmacion' ? 'No' : 'Cerrar' }}</button>
                            </div>
                        </div>
                    </div>
                </div>
                <main style="padding: 20px;">
                    <div class="form-container">
                        <h3>{{ modoEdicion ? 'Modificar Producto - ' + nuevoProducto.nombre : 'Nuevo Producto' }}</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: end;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoProducto.nombre" @blur="verificarProductoExistente" placeholder="Nombre del producto" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Precio Compra: *</label>
                                <input type="number" v-model="nuevoProducto.precioCompra" placeholder="Precio compra" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label>Precio Venta: *</label>
                                <input type="number" v-model="nuevoProducto.precioVenta" placeholder="Precio venta" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Inicial: *</label>
                                <input type="number" v-model="nuevoProducto.cantidadStockInicial" placeholder="Stock inicial" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Óptimo: *</label>
                                <input type="number" v-model="nuevoProducto.cantidadOptimaStock" placeholder="Stock óptimo" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label>Stock Mínimo: *</label>
                                <input type="number" v-model="nuevoProducto.minimoStock" placeholder="Stock mínimo" required style="border: 2px solid #87CEEB;"/>
                            </div>
                            <div v-if="nuevoProducto.enPromocion" style="flex: 1; min-width: 150px;">
                                <label>Precio Promoción:</label>
                                <input type="number" v-model="nuevoProducto.precioPromocion" placeholder="Precio promoción" style="border: 2px solid #87CEEB;"/>
                            </div>
                        </div>
                        <div style="margin-top: 15px; display: flex; gap: 20px; align-items: flex-start;">
                            <div>
                                <label>Descripción:</label>
                                <textarea v-model="nuevoProducto.descripcion" placeholder="Descripción del producto" rows="2" style="resize: vertical; width: 150px; height: 150px; border: 2px solid #87CEEB;"></textarea>
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

const style = document.createElement('style');
style.textContent = 'input, textarea, select { padding: 8px 12px !important; font-size: 12px !important; height: 32px !important; width: auto !important; min-width: 120px !important; } textarea { height: auto !important; min-height: 60px !important; } input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; } label { font-size: 12px !important; margin-bottom: 4px !important; } .form-container { padding: 15px !important; margin: 10px auto !important; width: fit-content !important; max-width: 100% !important; } .page-title { font-size: 1.8rem !important; margin-bottom: 15px !important; } h1, h2, h3 { margin-bottom: 10px !important; } .btn { padding: 8px 16px !important; font-size: 12px !important; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; } .mensaje-modal { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; } .mensaje-contenido { padding: 20px; text-align: center; } .mensaje-contenido.error { border-left: 4px solid #e74c3c; } .mensaje-contenido.exito { border-left: 4px solid #27ae60; } .mensaje-contenido.confirmacion { border-left: 4px solid #f39c12; } .mensaje-botones { margin-top: 15px; display: flex; gap: 10px; justify-content: center; } .btn-confirmar { background-color: #27ae60; color: white; } .btn-cancelar { background-color: #95a5a6; color: white; } .btn-cerrar { background-color: #3498db; color: white; }';
document.head.appendChild(style);