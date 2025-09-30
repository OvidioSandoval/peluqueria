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
            proveedores: [],
            productos: [],
            compra: {
                proveedorId: null,
                fechaCompra: new Date().toISOString().split('T')[0],
                observaciones: ''
            },
            detalles: [],
            nuevoDetalle: {
                productoId: null,
                cantidad: 1,
                precioUnitario: 0
            },
            mostrarFormDetalle: false,
            cargando: false
        };
    },
    mounted() {
        this.fetchProveedores();
        this.fetchProductos();
    },
    computed: {
        totalCompra() {
            return this.detalles.reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario), 0);
        },
        cantidadTotal() {
            return this.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
        }
    },
    methods: {
        async fetchProveedores() {
            try {
                const response = await fetch(config.apiBaseUrl + '/proveedores');
                if (!response.ok) throw new Error('Error al cargar proveedores');
                this.proveedores = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar proveedores');
            }
        },
        
        async fetchProductos() {
            try {
                const response = await fetch(config.apiBaseUrl + '/productos');
                if (!response.ok) throw new Error('Error al cargar productos');
                this.productos = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar productos');
            }
        },
        
        agregarDetalle() {
            if (!this.nuevoDetalle.productoId) {
                NotificationSystem.error('Seleccione un producto');
                return;
            }
            if (this.nuevoDetalle.cantidad <= 0) {
                NotificationSystem.error('La cantidad debe ser mayor a 0');
                return;
            }
            if (this.nuevoDetalle.precioUnitario <= 0) {
                NotificationSystem.error('El precio debe ser mayor a 0');
                return;
            }
            
            const producto = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
            const existe = this.detalles.find(d => d.producto.id === this.nuevoDetalle.productoId);
            
            if (existe) {
                NotificationSystem.error('El producto ya está agregado');
                return;
            }
            
            const detalle = {
                producto: producto,
                cantidad: this.nuevoDetalle.cantidad,
                precioUnitario: this.nuevoDetalle.precioUnitario,
                precioTotal: this.nuevoDetalle.cantidad * this.nuevoDetalle.precioUnitario
            };
            
            this.detalles.push(detalle);
            this.limpiarFormDetalle();
            this.mostrarFormDetalle = false;
        },
        
        eliminarDetalle(index) {
            this.detalles.splice(index, 1);
        },
        
        limpiarFormDetalle() {
            this.nuevoDetalle = {
                productoId: null,
                cantidad: 1,
                precioUnitario: 0
            };
        },
        
        onProductoChange() {
            if (this.nuevoDetalle.productoId) {
                const producto = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
                this.nuevoDetalle.precioUnitario = producto ? producto.precio || 0 : 0;
            }
        },
        
        async guardarCompra() {
            if (!this.compra.proveedorId) {
                NotificationSystem.error('Seleccione un proveedor');
                return;
            }
            if (this.detalles.length === 0) {
                NotificationSystem.error('Agregue al menos un producto');
                return;
            }
            
            try {
                this.cargando = true;
                
                for (const detalle of this.detalles) {
                    const compraData = {
                        producto: { id: detalle.producto.id },
                        cantidad: detalle.cantidad,
                        total: detalle.precioTotal,
                        fechaCompra: this.compra.fechaCompra,
                        proveedor: { id: this.compra.proveedorId }
                    };
                    
                    const compraResponse = await fetch(config.apiBaseUrl + '/compras/agregar_compra', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(compraData)
                    });
                    
                    if (!compraResponse.ok) throw new Error('Error al crear la compra');
                    const compraCreada = await compraResponse.json();
                    
                    const detalleData = {
                        compra: { id: compraCreada.id },
                        cantidadComprada: detalle.cantidad,
                        precioUnitario: detalle.precioUnitario,
                        precioTotal: detalle.precioTotal,
                        producto: { id: detalle.producto.id }
                    };
                    
                    const detalleResponse = await fetch(config.apiBaseUrl + '/detalle-compras/agregar_detalle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(detalleData)
                    });
                    
                    if (!detalleResponse.ok) throw new Error('Error al crear detalle de compra');
                }
                
                NotificationSystem.success('Compra registrada exitosamente');
                this.limpiarFormulario();
                
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al guardar la compra: ' + error.message);
            } finally {
                this.cargando = false;
            }
        },
        
        limpiarFormulario() {
            this.compra = {
                proveedorId: null,
                fechaCompra: new Date().toISOString().split('T')[0],
                observaciones: ''
            };
            this.detalles = [];
            this.limpiarFormDetalle();
            this.mostrarFormDetalle = false;
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        
        getNombreProveedor(proveedorId) {
            const proveedor = this.proveedores.find(p => p.id === proveedorId);
            return proveedor ? proveedor.nombre : '';
        }
    },
    template: '<div class="glass-container">' +
        '<div><h1 class="page-title">Registro de Compra</h1>' +
        '<button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>' +
        '<main style="padding: 20px;"><div class="compra-form" class="btn">' +
        '<h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-truck"></i> Información de la Compra</h3>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;"><div><label>Proveedor *</label><select v-model="compra.proveedorId" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"><option value="" disabled>Seleccionar Proveedor</option><option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.id">{{ proveedor.descripcion }}</option></select></div>' +
        '<div><label>Fecha de Compra *</label><input type="date" v-model="compra.fechaCompra" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></div></div><div style="margin-top: 200px;"><label>Observaciones</label><textarea v-model="compra.observaciones" placeholder="Observaciones adicionales..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical; min-height: 60px;"></textarea></div></div><div class="detalles-section" class="btn"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><h3 style="color: #5d4037; margin: 0;"><i class="fas fa-boxes"></i> Productos a Comprar</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn" class="btn"><i class="fas fa-plus"></i> Agregar Producto</button></div><div v-if="mostrarFormDetalle" class="form-detalle" class="btn"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; align-items: end;"><div><label>Producto</label><select v-model="nuevoDetalle.productoId" @change="onProductoChange" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"><option value="" disabled>Seleccionar Producto</option><option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select></div><div><label>Cantidad</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"></div><div><label>Precio Unitario</label><input type="number" v-model="nuevoDetalle.precioUnitario" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"></div><div><label>Total</label><input type="text" :value="formatearNumero(nuevoDetalle.cantidad * nuevoDetalle.precioUnitario)" readonly class="btn"></div><div><button @click="agregarDetalle" class="btn" class="btn">Agregar</button></div></div></div><div v-if="detalles.length > 0"><table style="width: 100%; border-collapse: collapse; margin-top: 200px;"><thead><tr class="btn"><th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Producto</th><th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Cantidad</th><th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Precio Unit.</th><th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th><th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td style="padding: 10px; border: 1px solid #ddd;">{{ detalle.producto.nombre }}</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{{ detalle.cantidad }}</td><td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${{ formatearNumero(detalle.precioUnitario) }}</td><td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${{ formatearNumero(detalle.precioTotal) }}</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd;"><button @click="eliminarDetalle(index)" class="btn-small btn-danger">Eliminar</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-boxes"></i><p>No hay productos agregados</p></div></div><div class="resumen-section" class="btn"><h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-calculator"></i> Resumen de la Compra</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;"><div class="btn"><div style="font-size: 24px; font-weight: bold; color: #007bff;">{{ cantidadTotal }}</div><div style="color: #666;">Productos</div></div><div class="btn"><div style="font-size: 28px; font-weight: bold;">${{ formatearNumero(totalCompra) }}</div><div>TOTAL</div></div></div></div><div class="acciones-section" style="text-align: center; margin-top: 200px;"><button @click="guardarCompra" :disabled="cargando || detalles.length === 0" class="btn" class="btn"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Compra" }}</button><button @click="limpiarFormulario" class="btn" class="btn"><i class="fas fa-trash"></i> Limpiar</button></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 5px 10px; font-size: 12px; } .btn-danger { background: #dc3545 !important; } label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }';
document.head.appendChild(style);


