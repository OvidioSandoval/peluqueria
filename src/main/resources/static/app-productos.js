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
            productosFiltrados: [],
            alertasStock: [],
            filtroBusqueda: '',
            filtroStock: 'todos',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
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
            productoSeleccionado: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchProductos();
        this.fetchAlertasStock();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.productosFiltrados.length / this.itemsPorPagina);
        },
        productosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.productosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/panel-control';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/productos';
            }
        },
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.productos = await response.json();
                this.filtrarProductos();
            } catch (error) {
                console.error('Error al cargar productos:', error);
                NotificationSystem.error(`Error al cargar los productos: ${error.message}`);
            }
        },
        async fetchAlertasStock() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos/bajo-stock`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.alertasStock = await response.json();
            } catch (error) {
                console.error('Error al cargar alertas de stock:', error);
            }
        },
        filtrarProductos() {
            let filtrados = this.productos;
            
            // Filtro por texto
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(producto =>
                    producto.nombre.toLowerCase().includes(busqueda) ||
                    (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda))
                );
            }
            
            // Filtro por estado de stock
            if (this.filtroStock !== 'todos') {
                filtrados = filtrados.filter(producto => {
                    const status = this.getStockStatus(producto);
                    return status === this.filtroStock;
                });
            }
            
            // Ordenar: stock bajo primero
            filtrados.sort((a, b) => {
                const statusA = this.getStockStatus(a);
                const statusB = this.getStockStatus(b);
                const prioridad = { 'bajo': 0, 'advertencia': 1, 'normal': 2 };
                return prioridad[statusA] - prioridad[statusB];
            });
            
            this.productosFiltrados = filtrados;
        },
        async agregarProducto() {
            if (!this.nuevoProducto.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                NotificationSystem.error('El precio de compra debe ser mayor a 0');
                return;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                NotificationSystem.error('El precio de venta debe ser mayor a 0');
                return;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial === undefined || this.nuevoProducto.cantidadStockInicial < 0) {
                NotificationSystem.error('El stock inicial es requerido y debe ser mayor o igual a 0');
                return;
            }
            if (!this.nuevoProducto.cantidadOptimaStock || this.nuevoProducto.cantidadOptimaStock <= 0) {
                NotificationSystem.error('El stock óptimo es requerido y debe ser mayor a 0');
                return;
            }
            if (!this.nuevoProducto.minimoStock || this.nuevoProducto.minimoStock <= 0) {
                NotificationSystem.error('El stock mínimo es requerido y debe ser mayor a 0');
                return;
            }
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
                const response = await fetch(`${config.apiBaseUrl}/productos/agregar_producto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
                if (response.ok) {
                    await this.fetchProductos();
                    this.toggleFormulario();
                    NotificationSystem.success('Producto agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar producto:', error);
                NotificationSystem.error(`Error al agregar producto: ${error.message}`);
            }
        },
        async modificarProducto() {
            if (!this.nuevoProducto.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                NotificationSystem.error('El precio de compra debe ser mayor a 0');
                return;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                NotificationSystem.error('El precio de venta debe ser mayor a 0');
                return;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial === undefined || this.nuevoProducto.cantidadStockInicial < 0) {
                NotificationSystem.error('El stock inicial es requerido y debe ser mayor o igual a 0');
                return;
            }
            if (!this.nuevoProducto.cantidadOptimaStock || this.nuevoProducto.cantidadOptimaStock <= 0) {
                NotificationSystem.error('El stock óptimo es requerido y debe ser mayor a 0');
                return;
            }
            if (!this.nuevoProducto.minimoStock || this.nuevoProducto.minimoStock <= 0) {
                NotificationSystem.error('El stock mínimo es requerido y debe ser mayor a 0');
                return;
            }
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
                const response = await fetch(`${config.apiBaseUrl}/productos/actualizar_producto/${this.nuevoProducto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
                if (response.ok) {
                    await this.fetchProductos();
                    this.toggleFormulario();
                    NotificationSystem.success('Producto actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar producto:', error);
                NotificationSystem.error(`Error al modificar producto: ${error.message}`);
            }
        },
        async eliminarProducto(producto) {
            NotificationSystem.confirm(`¿Eliminar producto "${producto.nombre}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/productos/eliminar_producto/${producto.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchProductos();
                    NotificationSystem.success('Producto eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar producto:', error);
                    NotificationSystem.error('Error al eliminar producto');
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
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
            this.productoSeleccionado = '';
        },
        cargarProducto(producto) {
            this.nuevoProducto = { ...producto };
            this.formularioVisible = true;
            this.productoSeleccionado = producto.nombre;
            this.$nextTick(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchProductos();
                this.fetchAlertasStock();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirProductos() {
            window.location.href = '/web/productos';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        tieneStockBajo(producto) {
            if (!producto.minimoStock) return false;
            const stockActual = producto.cantidadStockInicial || 0;
            return stockActual < producto.minimoStock;
        },
        getStockStatus(producto) {
            if (!producto.minimoStock) return 'normal';
            const stockActual = producto.cantidadStockInicial || 0;
            if (stockActual < producto.minimoStock) return 'bajo';
            if (stockActual <= producto.minimoStock + 2) return 'advertencia';
            return 'normal';
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroStock = 'todos';
            this.filtrarProductos();
        },
        
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const productosParaExportar = this.productosFiltrados;
                const itemsPorPagina = 15;
                const totalPaginas = Math.ceil(productosParaExportar.length / itemsPorPagina);
                
                for (let pagina = 0; pagina < totalPaginas; pagina++) {
                    if (pagina > 0) doc.addPage();
                    
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
                    doc.text('INVENTARIO DE PRODUCTOS', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de productos: ${productosParaExportar.length}`, 20, 62);
                    
                    const stockBajo = productosParaExportar.filter(p => this.getStockStatus(p) === 'bajo').length;
                    if (stockBajo > 0) {
                        doc.text(`Productos con stock bajo: ${stockBajo}`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, productosParaExportar.length);
                    const productosPagina = productosParaExportar.slice(inicio, fin);
                    
                    const headers = [['PRODUCTO', 'DESCRIPCIÓN', 'P. COMPRA', 'P. VENTA', 'STOCK ACT.', 'STOCK MÍN.', 'STOCK ÓPT.', 'ESTADO STOCK', 'PROMOCIÓN', 'P. PROMOCIÓN']];
                    const data = productosPagina.map((producto) => [
                        producto.nombre || '',
                        producto.descripcion || 'Sin descripción',
                        this.formatearNumero(producto.precioCompra),
                        this.formatearNumero(producto.precioVenta),
                        this.formatearNumero(producto.cantidadStockInicial),
                        producto.minimoStock ? this.formatearNumero(producto.minimoStock) : '-',
                        producto.cantidadOptimaStock ? this.formatearNumero(producto.cantidadOptimaStock) : '-',
                        this.getStockStatus(producto) === 'bajo' ? 'BAJO' : this.getStockStatus(producto) === 'advertencia' ? 'ADVERTENCIA' : 'NORMAL',
                        producto.enPromocion ? 'Sí' : 'No',
                        producto.precioPromocion ? this.formatearNumero(producto.precioPromocion) : '-'
                    ]);
                    
                    doc.autoTable({
                        head: headers,
                        body: data,
                        startY: stockBajo > 0 ? 75 : 68,
                        styles: { 
                            fontSize: 7,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 2,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            overflow: 'linebreak'
                        },
                        headStyles: { 
                            fontSize: 7,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 3
                        },
                        bodyStyles: {
                            fontSize: 8,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: {
                            0: { cellWidth: 25, overflow: 'linebreak' },
                            1: { cellWidth: 30, overflow: 'linebreak' },
                            2: { cellWidth: 18, halign: 'right' },
                            3: { cellWidth: 18, halign: 'right' },
                            4: { cellWidth: 15, halign: 'center' },
                            5: { cellWidth: 15, halign: 'center' },
                            6: { cellWidth: 15, halign: 'center' },
                            7: { cellWidth: 20, halign: 'center' },
                            8: { cellWidth: 15, halign: 'center' },
                            9: { cellWidth: 19, halign: 'right' }
                        },
                        margin: { bottom: 40 }
                    });
                    
                    // Footer profesional
                    const pageHeight = doc.internal.pageSize.height;
                    doc.setLineWidth(0.5);
                    doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                    
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Página ${pagina + 1} de ${totalPaginas}`, 20, pageHeight - 15);
                    doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`inventario-productos-${fecha}.pdf`);
                NotificationSystem.success('Inventario exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        exportarStockBajo() {
            try {
                const productosStockBajo = this.productos.filter(p => this.getStockStatus(p) === 'bajo');
                
                if (productosStockBajo.length === 0) {
                    NotificationSystem.warning('No hay productos con stock bajo para exportar');
                    return;
                }
                
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
                doc.text('PRODUCTOS CON STOCK BAJO', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de productos: ${productosStockBajo.length}`, 20, 62);
                
                const headers = [['PRODUCTO', 'STOCK ACTUAL', 'STOCK MÍNIMO', 'PRECIO VENTA', 'DESCRIPCIÓN']];
                const data = productosStockBajo.map((producto) => [
                    producto.nombre || '',
                    this.formatearNumero(producto.cantidadStockInicial),
                    this.formatearNumero(producto.minimoStock),
                    this.formatearNumero(producto.precioVenta),
                    producto.descripcion || 'Sin descripción'
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 68,
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
                        0: { cellWidth: 40 },
                        1: { cellWidth: 25, halign: 'center' },
                        2: { cellWidth: 25, halign: 'center' },
                        3: { cellWidth: 30, halign: 'right' },
                        4: { cellWidth: 60 }
                    },
                    margin: { bottom: 40 }
                });
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`productos-stock-bajo-${fecha}.pdf`);
                NotificationSystem.success('Reporte de stock bajo exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Productos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="gap: 10px; padding: 15px; width: fit-content;">
                        <div class="filter-group" style="min-width: auto; flex: none;">
                            <label>Buscar Producto:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarProductos" placeholder="Buscar producto..." class="search-bar" style="width: 280px;"/>
                        </div>
                        <div class="filter-group" style="min-width: auto; flex: none;">
                            <label>Estado de Stock:</label>
                            <select v-model="filtroStock" @change="filtrarProductos" class="filter-select" style="width: 140px;">
                                <option value="todos">Todos</option>
                                <option value="bajo">Stock Bajo</option>
                                <option value="advertencia">Advertencia</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small" style="margin: 0 2px;">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible" style="margin: 0 2px;">Nuevo Producto</button>
                        <button @click="exportarPDF" class="btn btn-small" v-if="!formularioVisible" style="margin: 0 2px;">
                            <i class="fas fa-file-pdf"></i> Exportar
                        </button>
                        <button @click="exportarStockBajo" class="btn btn-small" v-if="!formularioVisible" style="margin: 0 2px;">
                            <i class="fas fa-file-pdf"></i> Stock Mínimo
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoProducto.id ? 'Modificar Producto - ' + productoSeleccionado : 'Nuevo Producto' }}</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: end;">
                            <div style="flex: 1; min-width: 200px;">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoProducto.nombre" placeholder="Nombre del producto" required/>
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
                            <button @click="nuevoProducto.id ? modificarProducto() : agregarProducto()" class="btn">
                                {{ nuevoProducto.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    <div v-if="alertasStock.length > 0" class="alert-summary">
                        <h3 style="margin: 0 0 10px 0; color: #856404;"><i class="fas fa-exclamation-triangle"></i> Alertas de Stock</h3>
                        <p style="margin: 0; font-size: 16px;"><strong>{{ alertasStock.length }}</strong> producto(s) con stock por debajo del mínimo requerido</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio Compra</th>
                                <th>Precio Venta</th>
                                <th>Stock Actual</th>
                                <th>Stock Óptimo</th>
                                <th>Stock Mínimo</th>
                                <th>Estado Stock</th>
                                <th>Activo</th>
                                <th>En Promoción</th>
                                <th>Precio Promoción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="producto in productosPaginados" :key="producto.id" :class="{
                                'stock-bajo': getStockStatus(producto) === 'bajo',
                                'stock-advertencia': getStockStatus(producto) === 'advertencia'
                            }">
                                <td>
                                    <strong>{{ producto.nombre }}</strong>
                                    <i v-if="tieneStockBajo(producto)" class="fas fa-exclamation-triangle stock-alert-icon" title="Stock bajo"></i>
                                </td>
                                <td>{{ producto.descripcion || '-' }}</td>
                                <td>{{ formatearNumero(producto.precioCompra) }}</td>
                                <td>{{ formatearNumero(producto.precioVenta) }}</td>
                                <td :class="{
                                    'stock-critico': getStockStatus(producto) === 'bajo',
                                    'stock-advertencia-text': getStockStatus(producto) === 'advertencia'
                                }">
                                    {{ formatearNumero(producto.cantidadStockInicial) }}
                                </td>
                                <td>{{ producto.cantidadOptimaStock ? formatearNumero(producto.cantidadOptimaStock) : '-' }}</td>
                                <td>{{ producto.minimoStock ? formatearNumero(producto.minimoStock) : '-' }}</td>
                                <td>
                                    <span v-if="getStockStatus(producto) === 'bajo'" class="badge-critico">STOCK BAJO</span>
                                    <span v-else-if="getStockStatus(producto) === 'advertencia'" class="badge-advertencia">ADVERTENCIA</span>
                                    <span v-else class="badge-normal">NORMAL</span>
                                </td>
                                <td>{{ producto.activo ? 'Sí' : 'No' }}</td>
                                <td>{{ producto.enPromocion ? 'Sí' : 'No' }}</td>
                                <td>{{ producto.precioPromocion ? formatearNumero(producto.precioPromocion) : '-' }}</td>
                                <td>
                                    <button @click="cargarProducto(producto)" class="btn-small">Editar</button>
                                    <button @click="eliminarProducto(producto)" class="btn-small btn-danger">Eliminar</button>
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

// Estilos para alertas de stock
const style = document.createElement('style');
style.textContent = `
    .stock-bajo { 
        background-color: #fff3cd !important; 
        border-left: 4px solid #dc3545 !important; 
    }
    .stock-advertencia { 
        background-color: #fff3cd !important; 
        border-left: 4px solid #ffc107 !important; 
    }
    .stock-critico { 
        font-weight: bold !important; 
        color: #dc3545 !important; 
    }
    .stock-advertencia-text { 
        font-weight: bold !important; 
        color: #856404 !important; 
    }
    .stock-alert-icon { 
        color: #dc3545; 
        margin-left: 8px; 
        animation: pulse 2s infinite; 
    }
    .badge-critico { 
        background: #dc3545; 
        color: white; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-size: 12px; 
        font-weight: bold; 
    }
    .badge-advertencia { 
        background: #ffc107; 
        color: #212529; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-size: 12px; 
        font-weight: bold; 
    }
    .badge-normal { 
        background: #28a745; 
        color: white; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-size: 12px; 
        font-weight: bold; 
    }
    .alert-summary { 
        background: #f8f9fa; 
        padding: 15px; 
        border-radius: 8px; 
        margin-bottom: 20px; 
        border-left: 4px solid #ffc107; 
    }

    .filter-group {
        display: flex;
        flex-direction: column;
    }
    .filter-select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background: white;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);




