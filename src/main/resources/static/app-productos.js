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
            if (stockActual <= producto.minimoStock * 1.2) return 'advertencia';
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
                
                // Título
                doc.setTextColor(218, 165, 32);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setTextColor(139, 69, 19);
                doc.setFontSize(16);
                doc.text('Inventario de Productos', 20, 35);
                
                // Fecha y estadísticas
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total productos: ${this.productosFiltrados.length}`, 150, 25);
                
                const stockBajo = this.productosFiltrados.filter(p => this.getStockStatus(p) === 'bajo').length;
                if (stockBajo > 0) {
                    doc.setTextColor(220, 53, 69);
                    doc.text(`Productos con stock bajo: ${stockBajo}`, 150, 35);
                }
                
                // Línea decorativa
                doc.setDrawColor(218, 165, 32);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                // Alertas de stock si existen
                if (this.alertasStock.length > 0) {
                    doc.setTextColor(139, 69, 19);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('ALERTAS DE STOCK BAJO', 20, y);
                    y += 15;
                    
                    this.alertasStock.forEach((producto, index) => {
                        if (y > 250) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        doc.setTextColor(220, 53, 69);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`⚠ ${producto.nombre}`, 25, y);
                        y += 8;
                        
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`   Stock actual: ${producto.cantidadStockInicial} - Mínimo: ${producto.minimoStock}`, 30, y);
                        y += 10;
                    });
                    y += 10;
                }
                
                // Inventario completo
                doc.setTextColor(139, 69, 19);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('INVENTARIO COMPLETO', 20, y);
                y += 15;
                
                this.productosFiltrados.forEach((producto, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    // Color según estado de stock
                    const status = this.getStockStatus(producto);
                    if (status === 'bajo') {
                        doc.setTextColor(220, 53, 69);
                    } else if (status === 'advertencia') {
                        doc.setTextColor(255, 193, 7);
                    } else {
                        doc.setTextColor(218, 165, 32);
                    }
                    
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${index + 1}. ${producto.nombre}`, 20, y);
                    y += 8;
                    
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    
                    if (producto.descripcion) {
                        const desc = producto.descripcion.length > 60 ? 
                            producto.descripcion.substring(0, 60) + '...' : producto.descripcion;
                        doc.text(`   Descripción: ${desc}`, 25, y);
                        y += 6;
                    }
                    
                    doc.text(`   Precio Compra: $${this.formatearNumero(producto.precioCompra)}`, 25, y);
                    y += 6;
                    doc.text(`   Precio Venta: $${this.formatearNumero(producto.precioVenta)}`, 25, y);
                    y += 6;
                    
                    const stockText = `Stock: ${this.formatearNumero(producto.cantidadStockInicial)}`;
                    const minimoText = producto.minimoStock ? ` (Mín: ${producto.minimoStock})` : '';
                    const optimoText = producto.cantidadOptimaStock ? ` (Ópt: ${producto.cantidadOptimaStock})` : '';
                    doc.text(`   ${stockText}${minimoText}${optimoText}`, 25, y);
                    y += 6;
                    
                    if (producto.enPromocion && producto.precioPromocion) {
                        doc.setTextColor(40, 167, 69);
                        doc.text(`   EN PROMOCIÓN: $${this.formatearNumero(producto.precioPromocion)}`, 25, y);
                        doc.setTextColor(0, 0, 0);
                        y += 6;
                    }
                    
                    doc.text(`   Estado: ${producto.activo ? 'Activo' : 'Inactivo'}`, 25, y);
                    y += 12;
                });
                
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(218, 165, 32);
                    doc.line(20, 280, 190, 280);
                    doc.setTextColor(139, 69, 19);
                    doc.setFontSize(8);
                    doc.text('Peluquería LUNA - Sistema de Gestión', 20, 290);
                    doc.text(`Página ${i} de ${pageCount}`, 170, 290);
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`inventario-productos-${fecha}.pdf`);
                NotificationSystem.success('Inventario exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 120px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Productos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Producto:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarProductos" placeholder="Buscar producto..." class="search-bar"/>
                        </div>
                        <div class="filter-group">
                            <label>Estado de Stock:</label>
                            <select v-model="filtroStock" @change="filtrarProductos" class="filter-select">
                                <option value="todos">Todos</option>
                                <option value="bajo">Stock Bajo</option>
                                <option value="advertencia">Advertencia</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
                    </div>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Producto</button>
                    <button @click="exportarPDF" class="btn" style="background: #28a745; margin-left: 10px;" v-if="!formularioVisible">
                        <i class="fas fa-file-pdf"></i> Exportar PDF
                    </button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoProducto.id ? 'Modificar Producto: ' + productoSeleccionado : 'Agregar Producto' }}</h3>
                        <label>Nombre:</label>
                        <input type="text" v-model="nuevoProducto.nombre" placeholder="Nombre" required/>
                        <label>Descripción:</label>
                        <textarea v-model="nuevoProducto.descripcion" placeholder="Descripción"></textarea>
                        <div style="display: flex; flex-direction: column;">
                            <label>Precio Compra:</label>
                            <input type="number" v-model="nuevoProducto.precioCompra" placeholder="Precio Compra" required/>
                        </div>
                        <label>Precio Venta:</label>
                        <input type="number" v-model="nuevoProducto.precioVenta" placeholder="Precio Venta" required/>
                        <label>Stock Inicial:</label>
                        <input type="number" v-model="nuevoProducto.cantidadStockInicial" placeholder="Stock Inicial" required/>
                        <label>Stock Óptimo:</label>
                        <input type="number" v-model="nuevoProducto.cantidadOptimaStock" placeholder="Stock Óptimo"/>
                        <label>Stock Mínimo:</label>
                        <input type="number" v-model="nuevoProducto.minimoStock" placeholder="Stock Mínimo"/>
                        <label style="display: inline-flex; align-items: center; margin: 0; padding: 0; white-space: nowrap;">
                            Activo:<input type="checkbox" v-model="nuevoProducto.activo" style="margin: 0; padding: 0; margin-left: 1px;"/>
                        </label>
                        <label style="display: inline-flex; align-items: center; margin: 0; padding: 0; white-space: nowrap;">
                            En Promoción:<input type="checkbox" v-model="nuevoProducto.enPromocion" style="margin: 0; padding: 0; margin-left: 1px;"/>
                        </label>
                        <div v-if="nuevoProducto.enPromocion">
                            <label>Precio Promoción:</label>
                            <input type="number" v-model="nuevoProducto.precioPromocion" placeholder="Precio Promoción"/>
                        </div>
                        <div class="form-buttons">
                            <button @click="nuevoProducto.id ? modificarProducto() : agregarProducto()" class="btn">
                                {{ nuevoProducto.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    <div v-if="alertasStock.length > 0" class="alert-summary">
                        <h3 style="margin: 0 0 10px 0; color: #856404;"><i class="fas fa-exclamation-triangle"></i> Alertas de Stock</h3>
                        <p style="margin: 0; font-size: 16px;"><strong>{{ alertasStock.length }}</strong> producto(s) con stock por debajo del mínimo requerido</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
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
                                <td>{{ producto.id }}</td>
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
    .filters-container {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        align-items: end;
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
    .btn-secondary {
        background: #6c757d !important;
        color: white !important;
    }
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);
