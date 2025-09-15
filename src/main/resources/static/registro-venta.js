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
            clientes: [],
            empleados: [],
            servicios: [],
            productos: [],
            venta: {
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: '',
                descuentoAplicado: 0
            },
            detalles: [],
            nuevoDetalle: {
                tipo: 'servicio',
                servicioId: null,
                productoId: null,
                cantidad: 1,
                precio: 0,
                descuento: 0
            },
            mostrarFormDetalle: false,
            cargando: false
        };
    },
    mounted() {
        this.fetchClientes();
        this.fetchEmpleados();
        this.fetchServicios();
        this.fetchProductos();
    },
    computed: {
        subtotal() {
            return this.detalles.reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precio), 0);
        },
        totalDescuentos() {
            return this.detalles.reduce((sum, detalle) => sum + (detalle.descuento || 0), 0) + (this.venta.descuentoAplicado || 0);
        },
        total() {
            return this.subtotal - this.totalDescuentos;
        },
        cantidadArticulos() {
            return this.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
        }
    },
    methods: {
        async fetchClientes() {
            try {
                const response = await fetch(config.apiBaseUrl + '/clientes');
                if (!response.ok) throw new Error('Error al cargar clientes');
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar clientes');
            }
        },
        
        async fetchEmpleados() {
            try {
                const response = await fetch(config.apiBaseUrl + '/empleados');
                if (!response.ok) throw new Error('Error al cargar empleados');
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar empleados');
            }
        },
        
        async fetchServicios() {
            try {
                const response = await fetch(config.apiBaseUrl + '/servicios');
                if (!response.ok) throw new Error('Error al cargar servicios');
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar servicios');
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
            if (this.nuevoDetalle.tipo === 'servicio' && !this.nuevoDetalle.servicioId) {
                NotificationSystem.error('Seleccione un servicio');
                return;
            }
            if (this.nuevoDetalle.tipo === 'producto' && !this.nuevoDetalle.productoId) {
                NotificationSystem.error('Seleccione un producto');
                return;
            }
            
            let item = null;
            if (this.nuevoDetalle.tipo === 'servicio') {
                item = this.servicios.find(s => s.id === this.nuevoDetalle.servicioId);
            } else {
                item = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
            }
            
            const detalle = {
                tipo: this.nuevoDetalle.tipo,
                item: item,
                cantidad: this.nuevoDetalle.cantidad,
                precio: this.nuevoDetalle.precio || (item ? (this.nuevoDetalle.tipo === 'servicio' ? item.precioBase : item.precioVenta || item.precio) || 0 : 0),
                descuento: this.nuevoDetalle.descuento || 0
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
                tipo: this.nuevoDetalle.tipo || 'servicio',
                servicioId: null,
                productoId: null,
                cantidad: 1,
                precio: 0,
                descuento: 0
            };
        },
        
        onTipoChange() {
            this.nuevoDetalle.servicioId = null;
            this.nuevoDetalle.productoId = null;
            this.nuevoDetalle.precio = 0;
        },
        
        onItemChange() {
            if (this.nuevoDetalle.tipo === 'servicio' && this.nuevoDetalle.servicioId) {
                const servicio = this.servicios.find(s => s.id === this.nuevoDetalle.servicioId);
                this.nuevoDetalle.precio = servicio ? servicio.precioBase || 0 : 0;
            } else if (this.nuevoDetalle.tipo === 'producto' && this.nuevoDetalle.productoId) {
                const producto = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
                this.nuevoDetalle.precio = producto ? producto.precioVenta || producto.precio || 0 : 0;
            }
        },
        
        async guardarVenta() {
            if (!this.venta.clienteId) {
                NotificationSystem.error('Seleccione un cliente');
                return;
            }
            if (!this.venta.empleadoId) {
                NotificationSystem.error('Seleccione un empleado');
                return;
            }
            if (this.detalles.length === 0) {
                NotificationSystem.error('Agregue al menos un servicio o producto');
                return;
            }
            
            try {
                this.cargando = true;
                
                const ventaData = {
                    fechaVenta: new Date().toISOString(),
                    cantidadArticulos: this.cantidadArticulos,
                    montoTotal: this.total,
                    descuentoAplicado: this.venta.descuentoAplicado || 0,
                    devolucion: false,
                    cliente: { id: this.venta.clienteId },
                    empleado: { id: this.venta.empleadoId },
                    metodoPago: this.venta.metodoPago,
                    observaciones: this.venta.observaciones || ''
                };
                
                const ventaResponse = await fetch(config.apiBaseUrl + '/ventas/agregar_venta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ventaData)
                });
                
                if (!ventaResponse.ok) throw new Error('Error al crear la venta');
                const ventaCreada = await ventaResponse.json();
                
                for (const detalle of this.detalles) {
                    const detalleData = {
                        venta: { id: ventaCreada.id },
                        servicio: detalle.tipo === 'servicio' ? { id: detalle.item.id } : null,
                        producto: detalle.tipo === 'producto' ? { id: detalle.item.id } : null,
                        cantidad: detalle.cantidad,
                        precioUnitarioBruto: detalle.precio,
                        precioTotal: detalle.cantidad * detalle.precio,
                        descuento: detalle.descuento || 0,
                        precioUnitarioNeto: detalle.precio - (detalle.descuento || 0)
                    };
                    
                    const detalleResponse = await fetch(config.apiBaseUrl + '/detalle-ventas/agregar_detalle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(detalleData)
                    });
                    
                    if (!detalleResponse.ok) throw new Error('Error al crear detalle de venta');
                }
                
                NotificationSystem.success('Venta registrada exitosamente');
                this.limpiarFormulario();
                
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al guardar la venta: ' + error.message);
            } finally {
                this.cargando = false;
            }
        },
        
        limpiarFormulario() {
            this.venta = {
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: '',
                descuentoAplicado: 0
            };
            this.detalles = [];
            this.limpiarFormDetalle();
            this.mostrarFormDetalle = false;
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        
        getNombreCliente(clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            return cliente ? cliente.nombreCompleto : '';
        },
        
        getNombreEmpleado(empleadoId) {
            const empleado = this.empleados.find(e => e.id === empleadoId);
            return empleado ? empleado.nombreCompleto : '';
        }
    },
    template: '<div class="glass-container">' +
        '<div><h1 style="text-align: center; margin-top: 60px; margin-bottom: 20px; color: #5d4037; font-weight: 800;">Registro de Venta</h1>' +
        '<button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>' +
        '<main style="padding: 20px;">' +
        '<div class="venta-form" style="background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">' +
        '<h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-user"></i> Información de la Venta</h3>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">' +
        '<div>' +
        '<label>Cliente *</label><select v-model="venta.clienteId" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">' +
        '<option value="" disabled>Seleccionar Cliente</option>' +
        '<option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombreCompleto }}</option></select></div>' +
        '<div><label>Empleado *</label>' +
        '<select v-model="venta.empleadoId" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">' +
        '<option value="" disabled>Seleccionar Empleado</option>' +
        '<option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">{{ empleado.nombreCompleto }}</option></select></div>' +
        '<div><label>Método de Pago</label><select v-model="venta.metodoPago" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">' +
        '<option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option></select></div>' +
        '<div><label>Descuento General</label><input type="number" v-model="venta.descuentoAplicado" min="0" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></div></div>' +
        '<div style="margin-top: 15px;"><label>Observaciones</label><textarea v-model="venta.observaciones" placeholder="Observaciones adicionales..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical; min-height: 60px;"></textarea></div></div>' +
        '<div class="detalles-section" style="background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><h3 style="color: #5d4037; margin: 0;">' +
        '<i class="fas fa-list">' +
        '</i> Servicios y Productos</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn" style="background: #28a745;"><i class="fas fa-plus">' +
        '</i> Agregar Item</button></div><div v-if="mostrarFormDetalle" class="form-detalle" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; align-items: end;"><div>' +
        '<label>Tipo</label><select v-model="nuevoDetalle.tipo" @change="onTipoChange" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">' +
        '<option value="servicio">Servicio</option><option value="producto">Producto</option></select></div>' +
        '<div v-if="nuevoDetalle.tipo === \'servicio\'"><label>Servicio</label><select v-model="nuevoDetalle.servicioId" @change="onItemChange" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">' +
        '<option value="" disabled>Seleccionar Servicio</option><option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">{{ servicio.nombre }}</option></select></div>' +
        '<div v-if="nuevoDetalle.tipo === \'producto\'"><label>Producto</label><select v-model="nuevoDetalle.productoId" @change="onItemChange" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">' +
        '<option value="" disabled>Seleccionar Producto</option>' +
        '<option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select></div>' +
        '<div><label>Cantidad</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"></div>' +
        '<div><label>Precio</label><input type="number" v-model="nuevoDetalle.precio" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"></div>' +
        '<div><label>Descuento</label><input type="number" v-model="nuevoDetalle.descuento" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"></div>' +
        '<div><button @click="agregarDetalle" class="btn" style="background: #007bff; padding: 8px 15px;">Agregar</button></div></div></div>' +
        '<div v-if="detalles.length > 0"><table style="width: 100%; border-collapse: collapse; margin-top: 15px;"><thead><tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tipo</th><th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th><th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Cantidad</th><th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Precio</th><th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Descuento</th><th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th><th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">{{ detalle.tipo }}</td><td style="padding: 10px; border: 1px solid #ddd;">{{ detalle.item.nombre }}</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{{ detalle.cantidad }}</td><td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${{ formatearNumero(detalle.precio) }}</td><td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${{ formatearNumero(detalle.descuento) }}</td><td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${{ formatearNumero(detalle.cantidad * detalle.precio) }}</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd;"><button @click="eliminarDetalle(index)" class="btn-small btn-danger">Eliminar</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-shopping-cart"></i><p>No hay items agregados</p></div></div><div class="resumen-section" style="background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"><h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-calculator"></i> Resumen de la Venta</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;"><div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;"><div style="font-size: 24px; font-weight: bold; color: #007bff;">{{ cantidadArticulos }}</div><div style="color: #666;">Artículos</div></div><div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;"><div style="font-size: 24px; font-weight: bold; color: #28a745;">${{ formatearNumero(subtotal) }}</div><div style="color: #666;">Subtotal</div></div><div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;"><div style="font-size: 24px; font-weight: bold; color: #dc3545;">${{ formatearNumero(totalDescuentos) }}</div><div style="color: #666;">Descuentos</div></div><div style="text-align: center; padding: 15px; background: #5d4037; color: white; border-radius: 5px;"><div style="font-size: 28px; font-weight: bold;">${{ formatearNumero(total) }}</div><div>TOTAL</div></div></div></div><div class="acciones-section" style="text-align: center; margin-top: 30px;"><button @click="guardarVenta" :disabled="cargando || detalles.length === 0" class="btn" style="background: #28a745; font-size: 18px; padding: 15px 30px;"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Venta" }}</button><button @click="limpiarFormulario" class="btn" style="background: #6c757d; font-size: 18px; padding: 15px 30px; margin-left: 15px;">' +
        '<i class="fas fa-trash"></i> Limpiar</button></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 5px 10px; font-size: 12px; } .btn-danger { background: #dc3545 !important; } label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }';
document.head.appendChild(style);
