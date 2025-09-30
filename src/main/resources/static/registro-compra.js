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
        '<main class="main-content">' +
        '<div class="form-container">' +
        '<h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-truck"></i> Información de la Compra</h3>' +
        '<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: end; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;">' +
        '<label>Proveedor *</label><select v-model="compra.proveedorId" required class="search-bar">' +
        '<option value="" disabled>Seleccionar Proveedor</option>' +
        '<option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.id">{{ proveedor.descripcion }}</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 150px;"><label>Fecha de Compra *</label><input type="date" v-model="compra.fechaCompra" required class="search-bar"></div>' +
        '<button @click="exportarPDF" class="btn btn-secondary" style="flex: 0 0 auto;"><i class="fas fa-file-pdf"></i> PDF</button></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 300px; margin-top: 10px;"><label>Observaciones</label><textarea v-model="compra.observaciones" placeholder="Observaciones adicionales..." class="search-bar" style="resize: vertical; min-height: 40px; height: 40px;"></textarea></div></div>' +
        '<div class="form-container">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h3 style="color: #5d4037; margin: 0;">' +
        '<i class="fas fa-boxes"></i> Productos a Comprar</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn btn-secondary"><i class="fas fa-plus"></i> Agregar Producto</button></div>' +
        '<div v-if="mostrarFormDetalle" class="form-container" style="background: #f8f9fa; margin-top: 10px; padding: 15px;">' +
        '<div style="display: flex; gap: 6px; align-items: end; flex-wrap: wrap; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Producto</label><select v-model="nuevoDetalle.productoId" @change="onProductoChange" class="search-bar">' +
        '<option value="" disabled>Seleccionar Producto</option><option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 60px;"><label>Cant.</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" class="filter-select"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Precio Unit.</label><input type="number" v-model="nuevoDetalle.precioUnitario" min="0" class="search-bar"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Total</label><input type="text" :value="formatearNumero(nuevoDetalle.cantidad * nuevoDetalle.precioUnitario)" readonly class="search-bar"></div>' +
        '<div style="flex: 0 0 auto;"><button @click="agregarDetalle" class="btn btn-secondary">Agregar</button></div></div></div>' +
        '<div v-if="detalles.length > 0" style="margin-top: 10px;"><table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th><th>Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td>{{ detalle.producto.nombre }}</td><td style="text-align: center;">{{ detalle.cantidad }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precioUnitario) }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precioTotal) }}</td><td style="text-align: center;"><button @click="eliminarDetalle(index)" class="btn btn-danger btn-small">×</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 30px; color: #666;"><i class="fas fa-boxes" style="font-size: 36px; margin-bottom: 8px;"></i><p>No hay productos agregados</p></div></div>' +
        '<div class="form-container"><h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-calculator"></i> Resumen de la Compra</h3><div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;"><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #007bff;">{{ cantidadTotal }}</div><div class="summary-label">Productos</div></div><div class="summary-card" style="flex: 1; min-width: 120px;"><div class="summary-value" style="color: #66bb6a; font-size: 22px;">{{ formatearNumero(totalCompra) }}</div><div class="summary-label" style="font-size: 13px;">TOTAL</div></div></div></div>' +
        '<div style="text-align: center; margin-top: 15px; display: flex; gap: 10px; justify-content: center;"><button @click="guardarCompra" :disabled="cargando || detalles.length === 0" class="btn"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Compra" }}</button><button @click="limpiarFormulario" class="btn btn-secondary">' +
        '<i class="fas fa-broom"></i> Limpiar</button></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 4px 8px; font-size: 11px; min-width: 30px; } .btn-danger { background: #add8e6 !important; color: #dc3545 !important; border: 1px solid #87ceeb; } label { display: block; margin-bottom: 3px; font-weight: bold; color: #333; font-size: 13px; } .summary-card { background: white; padding: 12px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .summary-value { font-size: 18px; font-weight: bold; margin-bottom: 3px; } .summary-label { font-size: 11px; color: #666; } .form-container { margin-bottom: 15px; }';
document.head.appendChild(style);