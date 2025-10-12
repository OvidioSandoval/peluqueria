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
        },
        
        exportarPDF() {
            if (!this.venta.clienteId || !this.venta.empleadoId) {
                NotificationSystem.error('Complete la información de cliente y empleado');
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
                doc.text('REGISTRO DE VENTA', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de artículos: ${this.cantidadArticulos}`, 20, 62);
                
                // Información del cliente y empleado
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Cliente: ${this.getNombreCliente(this.venta.clienteId)}`, 20, 75);
                doc.text(`Empleado: ${this.getNombreEmpleado(this.venta.empleadoId)}`, 20, 85);
                doc.text(`Método de Pago: ${this.venta.metodoPago}`, 120, 75);
                
                if (this.venta.descuentoAplicado > 0) {
                    doc.text(`Descuento General: ${this.formatearNumero(this.venta.descuentoAplicado)}`, 120, 85);
                }
                
                // Tabla de detalles
                if (this.detalles.length > 0) {
                    const headers = [['TIPO', 'ITEM', 'CANT.', 'PRECIO UNIT.', 'DESCUENTO', 'SUBTOTAL']];
                    const data = this.detalles.map((detalle) => [
                        detalle.tipo.toUpperCase(),
                        detalle.item.nombre || '',
                        detalle.cantidad.toString(),
                        this.formatearNumero(detalle.precio),
                        this.formatearNumero(detalle.descuento || 0),
                        this.formatearNumero(detalle.cantidad * detalle.precio)
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
                            0: { cellWidth: 'auto', halign: 'center' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 'auto', halign: 'center' },
                            3: { cellWidth: 'auto', halign: 'right' },
                            4: { cellWidth: 'auto', halign: 'right' },
                            5: { cellWidth: 'auto', halign: 'right' }
                        },
                        margin: { bottom: 40 },
                        foot: [['', '', '', 'SUBTOTAL:', this.formatearNumero(this.totalDescuentos), this.formatearNumero(this.subtotal)],
                               ['', '', '', 'DESCUENTOS:', '', this.formatearNumero(this.totalDescuentos)],
                               ['', '', '', 'TOTAL FINAL:', '', this.formatearNumero(this.total)]],
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
                doc.save(`registro-venta-${fecha}.pdf`);
                NotificationSystem.success('Registro de venta exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: '<div class="page-container">' +
        '<div><h1 class="page-title">Registro de Venta</h1>' +
        '<button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>' +
        '<main class="main-content">' +
        '<div class="form-container">' +
        '<h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-user"></i> Información de la Venta</h3>' +
        '<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: end; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;">' +
        '<label>Cliente *</label><select v-model="venta.clienteId" required class="search-bar">' +
        '<option value="" disabled>Seleccionar Cliente</option>' +
        '<option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombreCompleto }}</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Empleado *</label>' +
        '<select v-model="venta.empleadoId" required class="search-bar">' +
        '<option value="" disabled>Seleccionar Empleado</option>' +
        '<option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">{{ empleado.nombreCompleto }}</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 120px;"><label>Método de Pago</label><select v-model="venta.metodoPago" class="filter-select">' +
        '<option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 100px;"><label>Descuento General</label><input type="number" v-model="venta.descuentoAplicado" min="0" class="search-bar"></div>' +
        '<button @click="exportarPDF" class="btn btn-secondary" style="flex: 0 0 auto;"><i class="fas fa-file-pdf"></i> PDF</button></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 300px; margin-top: 10px;"><label>Observaciones</label><textarea v-model="venta.observaciones" placeholder="Observaciones adicionales..." class="search-bar" style="resize: vertical; min-height: 40px; height: 40px;"></textarea></div></div>' +
        '<div class="form-container">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h3 style="color: #5d4037; margin: 0;">' +
        '<i class="fas fa-list"></i> Servicios y Productos</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn btn-secondary"><i class="fas fa-plus"></i> Agregar Item</button></div>' +
        '<div v-if="mostrarFormDetalle" class="form-container" style="background: #f8f9fa; margin-top: 10px; padding: 15px;">' +
        '<div style="display: flex; gap: 6px; align-items: end; flex-wrap: wrap; width: 100%;"><div class="filter-group" style="flex: 0 0 auto; width: 80px;">' +
        '<label>Tipo</label><select v-model="nuevoDetalle.tipo" @change="onTipoChange" class="filter-select">' +
        '<option value="servicio">Servicio</option><option value="producto">Producto</option></select></div>' +
        '<div v-if="nuevoDetalle.tipo === \'servicio\'" class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Servicio</label><select v-model="nuevoDetalle.servicioId" @change="onItemChange" class="search-bar">' +
        '<option value="" disabled>Seleccionar Servicio</option><option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">{{ servicio.nombre }}</option></select></div>' +
        '<div v-if="nuevoDetalle.tipo === \'producto\'" class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Producto</label><select v-model="nuevoDetalle.productoId" @change="onItemChange" class="search-bar">' +
        '<option value="" disabled>Seleccionar Producto</option>' +
        '<option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 60px;"><label>Cant.</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" class="filter-select"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Precio</label><input type="number" v-model="nuevoDetalle.precio" min="0" class="search-bar"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Descuento</label><input type="number" v-model="nuevoDetalle.descuento" min="0" class="search-bar"></div>' +
        '<div style="flex: 0 0 auto;"><button @click="agregarDetalle" class="btn btn-secondary">Agregar</button></div></div></div>' +
        '<div v-if="detalles.length > 0" style="margin-top: 10px;"><table class="data-table"><thead><tr><th>Tipo</th><th>Item</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td style="text-transform: capitalize;">{{ detalle.tipo }}</td><td>{{ detalle.item.nombre }}</td><td style="text-align: center;">{{ detalle.cantidad }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precio) }}</td><td style="text-align: right;">${{ formatearNumero(detalle.descuento) }}</td><td style="text-align: right;">{{ formatearNumero(detalle.cantidad * detalle.precio) }}</td><td style="text-align: center;"><button @click="eliminarDetalle(index)" class="btn btn-danger btn-small">×</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 30px; color: #666;"><i class="fas fa-shopping-cart" style="font-size: 36px; margin-bottom: 8px;"></i><p>No hay items agregados</p></div></div>' +
        '<div class="form-container"><h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-calculator"></i> Resumen de la Venta</h3><div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;"><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #007bff;">{{ cantidadArticulos }}</div><div class="summary-label">Artículos</div></div><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #28a745;">{{ formatearNumero(subtotal) }}</div><div class="summary-label">Subtotal</div></div><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #dc3545;">{{ formatearNumero(totalDescuentos) }}</div><div class="summary-label">Descuentos</div></div><div class="summary-card" style="flex: 1; min-width: 120px;"><div class="summary-value" style="color: #66bb6a; font-size: 22px;">{{ formatearNumero(total) }}</div><div class="summary-label" style="font-size: 13px;">TOTAL</div></div></div></div>' +
        '<div style="text-align: center; margin-top: 15px; display: flex; gap: 10px; justify-content: center;"><button @click="guardarVenta" :disabled="cargando || detalles.length === 0" class="btn"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Venta" }}</button><button @click="window.history.back()" class="btn btn-secondary">' +
        '<i class="fas fa-times"></i> Cancelar</button></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 4px 8px; font-size: 11px; min-width: 30px; } .btn-danger { background: #add8e6 !important; color: #dc3545 !important; border: 1px solid #87ceeb; } label { display: block; margin-bottom: 3px; font-weight: bold; color: #333; font-size: 13px; } .summary-card { background: white; padding: 12px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .summary-value { font-size: 18px; font-weight: bold; margin-bottom: 3px; } .summary-label { font-size: 11px; color: #666; } .form-container { margin-bottom: 15px; }';
document.head.appendChild(style);