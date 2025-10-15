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
            cargando: false,
            // Nuevos datos para formularios modales
            mostrarFormProveedor: false,
            mostrarFormProducto: false,
            nuevoProveedor: {
                descripcion: ''
            },
            nuevoProducto: {
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
            mensaje: '',
            tipoMensaje: ''
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
        
        // Métodos para agregar proveedor
        verificarProveedorDuplicado() {
            if (!this.nuevoProveedor.descripcion.trim()) return;
            
            const descripcionBuscar = this.nuevoProveedor.descripcion.trim().toLowerCase();
            const proveedorExistente = this.proveedores.find(p => 
                p.descripcion.toLowerCase() === descripcionBuscar
            );
            
            if (proveedorExistente) {
                this.mostrarMensaje(`El proveedor "${proveedorExistente.descripcion}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async agregarProveedor() {
            if (!this.nuevoProveedor.descripcion.trim()) {
                this.mostrarMensaje('La descripción es obligatoria', 'error');
                return;
            }
            if (this.verificarProveedorDuplicado()) return;
            
            try {
                const response = await fetch(config.apiBaseUrl + '/proveedores/agregar_proveedor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevoProveedor)
                });
                if (response.ok) {
                    this.mostrarMensaje('Proveedor agregado exitosamente', 'exito');
                    this.limpiarFormProveedor();
                    await this.fetchProveedores();
                    this.mostrarFormProveedor = false;
                } else {
                    throw new Error('Error al agregar proveedor');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar proveedor', 'error');
            }
        },
        
        limpiarFormProveedor() {
            this.nuevoProveedor = { descripcion: '' };
        },
        
        // Métodos para agregar producto
        verificarProductoExistente() {
            if (!this.nuevoProducto.nombre.trim()) return false;
            
            const nombreBuscar = this.nuevoProducto.nombre.trim().toLowerCase();
            const productoExistente = this.productos.find(p => 
                p.nombre.toLowerCase() === nombreBuscar
            );
            
            if (productoExistente) {
                this.mostrarMensaje(`El producto "${productoExistente.nombre}" ya existe`, 'error');
                return true;
            }
            return false;
        },
        
        async agregarProducto() {
            if (!this.validarProducto()) return;
            if (this.verificarProductoExistente()) return;
            
            try {
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
                
                const response = await fetch(config.apiBaseUrl + '/productos/agregar_producto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
                
                if (response.ok) {
                    this.mostrarMensaje('Producto agregado exitosamente', 'exito');
                    this.limpiarFormProducto();
                    await this.fetchProductos();
                    this.mostrarFormProducto = false;
                } else {
                    throw new Error('Error al agregar producto');
                }
            } catch (error) {
                console.error('Error:', error);
                this.mostrarMensaje('Error al agregar producto', 'error');
            }
        },
        
        validarProducto() {
            if (!this.nuevoProducto.nombre.trim()) {
                this.mostrarMensaje('El nombre es requerido', 'error');
                return false;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                this.mostrarMensaje('El precio de compra debe ser mayor a 0', 'error');
                return false;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                this.mostrarMensaje('El precio de venta debe ser mayor a 0', 'error');
                return false;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial === undefined || this.nuevoProducto.cantidadStockInicial < 0) {
                this.mostrarMensaje('El stock inicial es requerido y debe ser mayor o igual a 0', 'error');
                return false;
            }
            if (!this.nuevoProducto.cantidadOptimaStock || this.nuevoProducto.cantidadOptimaStock <= 0) {
                this.mostrarMensaje('El stock óptimo es requerido y debe ser mayor a 0', 'error');
                return false;
            }
            if (!this.nuevoProducto.minimoStock || this.nuevoProducto.minimoStock <= 0) {
                this.mostrarMensaje('El stock mínimo es requerido y debe ser mayor a 0', 'error');
                return false;
            }
            return true;
        },
        
        limpiarFormProducto() {
            this.nuevoProducto = {
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
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        
        mostrarMensaje(mensaje, tipo) {
            this.mensaje = mensaje;
            this.tipoMensaje = tipo;
            setTimeout(() => {
                this.mensaje = '';
                this.tipoMensaje = '';
            }, 3000);
        },
        
        cerrarMensaje() {
            this.mensaje = '';
            this.tipoMensaje = '';
        },
        
        getNombreProveedor(proveedorId) {
            const proveedor = this.proveedores.find(p => p.id === proveedorId);
            return proveedor ? proveedor.nombre : '';
        },
        
        exportarPDF() {
            if (!this.compra.proveedorId) {
                NotificationSystem.error('Complete la información del proveedor');
                return;
            }
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Header profesional
                doc.setLineWidth(2);
                doc.line(20, 25, 190, 25);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('PELUQUERÍA LUNA', 105, 20, { align: 'center' });
                
                doc.setLineWidth(0.5);
                doc.line(20, 28, 190, 28);
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'normal');
                doc.text('REGISTRO DE COMPRA', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de productos: ${this.cantidadTotal}`, 20, 62);
                
                // Información del proveedor
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                const proveedor = this.proveedores.find(p => p.id === this.compra.proveedorId);
                doc.text(`Proveedor: ${proveedor ? proveedor.descripcion : ''}`, 20, 75);
                doc.text(`Fecha de Compra: ${this.compra.fechaCompra}`, 120, 75);
                
                if (this.compra.observaciones) {
                    doc.text(`Observaciones: ${this.compra.observaciones}`, 20, 85);
                }
                
                // Tabla de productos
                if (this.detalles.length > 0) {
                    const headers = [['PRODUCTO', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL']];
                    const data = this.detalles.map((detalle) => [
                        detalle.producto.nombre || '',
                        detalle.cantidad.toString(),
                        this.formatearNumero(detalle.precioUnitario),
                        this.formatearNumero(detalle.precioTotal)
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 95,
                        styles: { 
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 4,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1
                        },
                        headStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 5
                        },
                        bodyStyles: {
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto', halign: 'center' },
                            2: { cellWidth: 'auto', halign: 'right' },
                            3: { cellWidth: 'auto', halign: 'right' }
                        },
                        margin: { bottom: 40 },
                        foot: [['', '', 'TOTAL FINAL:', this.formatearNumero(this.totalCompra)]],
                        footStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        }
                    };
                    
                    doc.autoTable(tableConfig);
                }
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`registro-compra-${fecha}.pdf`);
                NotificationSystem.success('Registro de compra exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: '<div class="page-container">' +
        '<div><h1 class="page-title">Registro de Compra</h1>' +
        '<button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>' +
        
        // Modal para agregar proveedor
        '<div v-if="mostrarFormProveedor" class="modal-overlay" @click="mostrarFormProveedor = false">' +
        '<div class="modal-content" @click.stop>' +
        '<h3><i class="fas fa-truck"></i> Agregar Proveedor</h3>' +
        '<div class="form-row">' +
        '<label>Descripción: *</label>' +
        '<input type="text" v-model="nuevoProveedor.descripcion" @blur="verificarProveedorDuplicado" placeholder="Ingrese la descripción del proveedor" required/>' +
        '</div>' +
        '<div class="modal-buttons">' +
        '<button @click="agregarProveedor" class="btn">Agregar</button>' +
        '<button @click="mostrarFormProveedor = false" class="btn btn-secondary">Cancelar</button>' +
        '</div>' +
        '</div></div>' +
        
        // Modal para agregar producto
        '<div v-if="mostrarFormProducto" class="modal-overlay" @click="mostrarFormProducto = false">' +
        '<div class="modal-content modal-large" @click.stop>' +
        '<h3><i class="fas fa-box"></i> Agregar Producto</h3>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: end;">' +
        '<div style="flex: 1; min-width: 200px;">' +
        '<label>Nombre: *</label>' +
        '<input type="text" v-model="nuevoProducto.nombre" @blur="verificarProductoExistente" placeholder="Nombre del producto" required/>' +
        '</div>' +
        '<div style="flex: 1; min-width: 150px;">' +
        '<label>Precio Compra: *</label>' +
        '<input type="number" v-model="nuevoProducto.precioCompra" placeholder="Precio compra" required/>' +
        '</div>' +
        '<div style="flex: 1; min-width: 150px;">' +
        '<label>Precio Venta: *</label>' +
        '<input type="number" v-model="nuevoProducto.precioVenta" placeholder="Precio venta" required/>' +
        '</div>' +
        '<div style="flex: 1; min-width: 120px;">' +
        '<label>Stock Inicial: *</label>' +
        '<input type="number" v-model="nuevoProducto.cantidadStockInicial" placeholder="Stock inicial" required/>' +
        '</div>' +
        '<div style="flex: 1; min-width: 120px;">' +
        '<label>Stock Óptimo: *</label>' +
        '<input type="number" v-model="nuevoProducto.cantidadOptimaStock" placeholder="Stock óptimo" required/>' +
        '</div>' +
        '<div style="flex: 1; min-width: 120px;">' +
        '<label>Stock Mínimo: *</label>' +
        '<input type="number" v-model="nuevoProducto.minimoStock" placeholder="Stock mínimo" required/>' +
        '</div>' +
        '<div v-if="nuevoProducto.enPromocion" style="flex: 1; min-width: 150px;">' +
        '<label>Precio Promoción:</label>' +
        '<input type="number" v-model="nuevoProducto.precioPromocion" placeholder="Precio promoción"/>' +
        '</div>' +
        '</div>' +
        '<div style="margin-top: 15px; display: flex; gap: 20px; align-items: flex-start;">' +
        '<div>' +
        '<label>Descripción:</label>' +
        '<textarea v-model="nuevoProducto.descripcion" placeholder="Descripción del producto" rows="2" style="resize: vertical; width: 200px; height: 80px;"></textarea>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 25px;">' +
        '<label style="display: flex; align-items: center; gap: 5px; margin: 0;">' +
        '<input type="checkbox" v-model="nuevoProducto.activo" style="margin: 0;"/>' +
        'Activo' +
        '</label>' +
        '<label style="display: flex; align-items: center; gap: 5px; margin: 0;">' +
        '<input type="checkbox" v-model="nuevoProducto.enPromocion" style="margin: 0;"/>' +
        'Promoción' +
        '</label>' +
        '</div>' +
        '</div>' +
        '<div class="modal-buttons">' +
        '<button @click="agregarProducto" class="btn">Agregar</button>' +
        '<button @click="mostrarFormProducto = false" class="btn btn-secondary">Cancelar</button>' +
        '</div>' +
        '</div></div>' +
        
        // Mensaje de notificación
        '<div v-if="mensaje" class="mensaje-overlay" @click="cerrarMensaje">' +
        '<div class="mensaje-modal" @click.stop>' +
        '<div class="mensaje-contenido" :class="tipoMensaje">' +
        '<p>{{ mensaje }}</p>' +
        '<button @click="cerrarMensaje" class="btn btn-cerrar">Cerrar</button>' +
        '</div>' +
        '</div></div>' +
        
        '<main class="main-content">' +
        '<div class="form-container">' +
        '<h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-truck"></i> Información de la Compra</h3>' +
        '<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: end; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;">' +
        '<label>Proveedor *</label><select v-model="compra.proveedorId" required class="search-bar">' +
        '<option value="" disabled>Seleccionar Proveedor</option>' +
        '<option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.id">{{ proveedor.descripcion }}</option></select>' +
        '<button @click="mostrarFormProveedor = true" class="btn-add-inline"><i class="fas fa-plus"></i></button>' +
        '</div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 150px;"><label>Fecha de Compra *</label><input type="date" v-model="compra.fechaCompra" required class="search-bar"></div>' +
        '<button @click="exportarPDF" class="btn btn-secondary" style="flex: 0 0 auto;"><i class="fas fa-file-pdf"></i> PDF</button></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 300px; margin-top: 10px;"><label>Observaciones</label><textarea v-model="compra.observaciones" placeholder="Observaciones adicionales..." class="search-bar" style="resize: vertical; min-height: 40px; height: 40px;"></textarea></div></div>' +
        '<div class="form-container">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h3 style="color: #5d4037; margin: 0;">' +
        '<i class="fas fa-boxes"></i> Productos a Comprar</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn btn-secondary"><i class="fas fa-plus"></i> Agregar Producto</button></div>' +
        '<div v-if="mostrarFormDetalle" class="form-container" style="background: #fcccce2; margin-top: 10px; padding: 15px;">' +
        '<div style="display: flex; gap: 6px; align-items: end; flex-wrap: wrap; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Producto</label><select v-model="nuevoDetalle.productoId" @change="onProductoChange" class="search-bar">' +
        '<option value="" disabled>Seleccionar Producto</option><option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select>' +
        '<button @click="mostrarFormProducto = true" class="btn-add-inline"><i class="fas fa-plus"></i></button>' +
        '</div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 60px;"><label>Cant.</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" class="filter-select"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Precio Unit.</label><input type="number" v-model="nuevoDetalle.precioUnitario" min="0" class="search-bar"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Total</label><input type="text" :value="formatearNumero(nuevoDetalle.cantidad * nuevoDetalle.precioUnitario)" readonly class="search-bar"></div>' +
        '<div style="flex: 0 0 auto;"><button @click="agregarDetalle" class="btn btn-secondary">Agregar</button></div></div></div>' +
        '<div v-if="detalles.length > 0" style="margin-top: 10px;"><table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th><th>Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td>{{ detalle.producto.nombre }}</td><td style="text-align: center;">{{ detalle.cantidad }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precioUnitario) }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precioTotal) }}</td><td style="text-align: center;"><button @click="eliminarDetalle(index)" class="btn btn-danger btn-small">×</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 30px; color: #666;"><i class="fas fa-boxes" style="font-size: 36px; margin-bottom: 8px;"></i><p>No hay productos agregados</p></div></div>' +
        '<div class="form-container"><h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-calculator"></i> Resumen de la Compra</h3><div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;"><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #007bff;">{{ cantidadTotal }}</div><div class="summary-label">Productos</div></div><div class="summary-card" style="flex: 1; min-width: 120px;"><div class="summary-value" style="color: #66bb6a; font-size: 22px;">{{ formatearNumero(totalCompra) }}</div><div class="summary-label" style="font-size: 13px;">TOTAL</div></div></div></div>' +
        '<div style="text-align: center; margin-top: 15px; display: flex; gap: 10px; justify-content: center;"><button @click="guardarCompra" :disabled="cargando || detalles.length === 0" class="btn"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Compra" }}</button><button @click="window.history.back()" class="btn btn-secondary">' +
        '<i class="fas fa-times"></i> Cancelar</button></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 4px 8px; font-size: 11px; min-width: 30px; } .btn-danger { background: #add8e6 !important; color: #dc3545 !important; border: 1px solid #87ceeb; } label { display: block; margin-bottom: 2px; font-weight: bold; color: #333; font-size: 12px; } .summary-card { background: #fcccce2; padding: 8px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .summary-value { font-size: 16px; font-weight: bold; margin-bottom: 2px; } .summary-label { font-size: 10px; color: #666; } .form-container { margin-bottom: 10px; padding: 10px; background: #fcccce2 !important; border-radius: 8px; } input, textarea, select { background: #fcccce2 !important; padding: 8px 12px; font-size: 12px; } .page-title { font-size: 2rem; margin-bottom: 15px; } .fas { font-size: 14px; } h3 { font-size: 14px; margin-bottom: 8px; } .data-table th, .data-table td { padding: 6px 8px; font-size: 12px; } .btn-add-inline { background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 5px; font-size: 12px; } .btn-add-inline:hover { background: #218838; } .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); } .modal-content { background: rgba(248, 187, 208, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); } .modal-large { max-width: 800px; } .modal-content h3 { color: #66bb6a; text-align: center; margin-bottom: 20px; font-weight: 600; } .modal-content label { color: #66bb6a; font-weight: 600; margin-bottom: 8px; display: block; font-size: 14px; } .modal-content input, .modal-content textarea, .modal-content select { width: 100%; padding: 12px 15px; border: 2px solid #b3e5fc; border-radius: 12px; margin: 8px 0; background: rgba(252, 204, 206, 0.8); color: #66bb6a; font-size: 14px; transition: all 0.3s ease; } .modal-content input:focus, .modal-content textarea:focus, .modal-content select:focus { outline: none; border-color: #81d4fa; box-shadow: 0 0 15px rgba(129, 212, 250, 0.3); transform: translateY(-1px); } .modal-buttons { margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; } .form-row { margin: 15px 0; display: flex; gap: 20px; align-items: end; flex-wrap: wrap; } .mensaje-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; backdrop-filter: blur(5px); } .mensaje-modal { background: rgba(252, 228, 236, 0.95); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3); max-width: 400px; width: 90%; } .mensaje-contenido { padding: 25px; text-align: center; } .mensaje-contenido p { color: #66bb6a; font-weight: 500; margin-bottom: 15px; } .mensaje-contenido.error { border-left: 4px solid #ef5350; } .mensaje-contenido.exito { border-left: 4px solid #66bb6a; } .btn-cerrar { background: linear-gradient(135deg, #b3e5fc, #81d4fa); color: #0277bd; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(129, 212, 250, 0.3); } .btn-cerrar:hover { background: linear-gradient(135deg, #81d4fa, #4fc3f7); color: white; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4); }';
document.head.appendChild(style);