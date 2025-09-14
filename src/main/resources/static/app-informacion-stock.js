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
            stocks: [],
            stocksFiltrados: [],
            productos: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoStock: { 
                id: null, 
                productoId: null,
                stockActual: 0,
                stockAnterior: 0,
                nombreProductoActualizado: '',
                proveedorId: null
            },
            proveedores: [],
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchStocks();
        this.fetchProductos();
        this.fetchProveedores();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.stocksFiltrados.length / this.itemsPorPagina);
        },
        stocksPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.stocksFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/informacion-stock';
            }
        },
        async fetchStocks() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/informacion-stock`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.stocks = await response.json();
                this.filtrarStocks();
            } catch (error) {
                console.error('Error al cargar stocks:', error);
                NotificationSystem.error(`Error al cargar la información de stock: ${error.message}`);
            }
        },
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                this.productos = await response.json();
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        },
        async fetchProveedores() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores`);
                this.proveedores = await response.json();
            } catch (error) {
                console.error('Error al cargar proveedores:', error);
            }
        },
        filtrarStocks() {
            if (this.filtroBusqueda) {
                this.stocksFiltrados = this.stocks.filter(stock =>
                    this.getProductoName(stock).toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            } else {
                this.stocksFiltrados = this.stocks;
            }
        },
        async agregarStock() {
            if (!this.nuevoStock.productoId) {
                NotificationSystem.error('Debe seleccionar un producto');
                return;
            }
            try {
                const stockData = {
                    stockActual: parseInt(this.nuevoStock.stockActual),
                    stockAnterior: parseInt(this.nuevoStock.stockAnterior),
                    nombreProductoActualizado: this.nuevoStock.nombreProductoActualizado,
                    producto: { id: this.nuevoStock.productoId },
                    proveedor: this.nuevoStock.proveedorId ? { id: this.nuevoStock.proveedorId } : null
                };
                const response = await fetch(`${config.apiBaseUrl}/informacion-stock/agregar_informacion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stockData)
                });
                if (response.ok) {
                    await this.fetchStocks();
                    this.toggleFormulario();
                    NotificationSystem.success('Stock agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar stock:', error);
                NotificationSystem.error(`Error al agregar stock: ${error.message}`);
            }
        },
        async modificarStock() {
            if (!this.nuevoStock.productoId) {
                NotificationSystem.error('Debe seleccionar un producto');
                return;
            }
            try {
                const stockData = {
                    stockActual: parseInt(this.nuevoStock.stockActual),
                    stockAnterior: parseInt(this.nuevoStock.stockAnterior),
                    nombreProductoActualizado: this.nuevoStock.nombreProductoActualizado,
                    producto: { id: this.nuevoStock.productoId },
                    proveedor: this.nuevoStock.proveedorId ? { id: this.nuevoStock.proveedorId } : null
                };
                const response = await fetch(`${config.apiBaseUrl}/informacion-stock/actualizar_informacion/${this.nuevoStock.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stockData)
                });
                if (response.ok) {
                    await this.fetchStocks();
                    this.toggleFormulario();
                    NotificationSystem.success('Stock actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar stock:', error);
                NotificationSystem.error(`Error al modificar stock: ${error.message}`);
            }
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoStock = { 
                id: null, 
                productoId: null,
                stockActual: 0,
                stockAnterior: 0,
                nombreProductoActualizado: '',
                proveedorId: null
            };
        },
        onProductoChange() {
            if (this.nuevoStock.productoId) {
                const producto = this.productos.find(p => p.id == this.nuevoStock.productoId);
                if (producto) {
                    this.nuevoStock.nombreProductoActualizado = producto.nombre;
                    this.nuevoStock.stockAnterior = producto.cantidadStockInicial || 0;
                }
            }
        },
        cargarStock(stock) {
            this.nuevoStock = {
                id: stock.id,
                productoId: stock.productoId,
                stockActual: stock.stockActual,
                stockAnterior: stock.stockAnterior,
                nombreProductoActualizado: stock.nombreProductoActualizado,
                proveedorId: stock.proveedorId
            };
            this.formularioVisible = true;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        getProductoName(stock) {
            return stock.productoNombre || 'Producto no encontrado';
        },
        getProveedorName(stock) {
            return stock.proveedorNombre || '-';
        },
        async eliminarStock(stock) {
            NotificationSystem.confirm(`¿Eliminar información de stock del producto "${this.getProductoName(stock)}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/informacion-stock/eliminar_informacion/${stock.id}`, {
                        method: 'DELETE'
                    });
                    await this.fetchStocks();
                    NotificationSystem.success('Stock eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar stock:', error);
                    NotificationSystem.error('Error al eliminar stock');
                }
            });
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        formatearFecha(fecha) {
            if (!fecha) return '-';
            try {
                // Manejar diferentes formatos de fecha
                let date;
                if (Array.isArray(fecha)) {
                    // Formato [año, mes, día, hora, minuto, segundo]
                    date = new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3] || 0, fecha[4] || 0, fecha[5] || 0);
                } else {
                    date = new Date(fecha);
                }
                
                if (isNaN(date.getTime())) return '-';
                return date.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                console.error('Error formateando fecha:', error, fecha);
                return '-';
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchStocks();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirInformacionStock() {
            window.location.href = '/web/informacion-stock';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Información de Stock</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Stock:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarStocks" placeholder="Buscar producto..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn">{{ formularioVisible ? 'Cancelar' : 'Nuevo Stock' }}</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoStock.id ? 'Modificar Stock - ' + (nuevoStock.nombreProductoActualizado || 'Producto') : 'Agregar Stock' }}</h3>
                        <label>Producto:</label>
                        <select v-model="nuevoStock.productoId" @change="onProductoChange" required>
                            <option value="" disabled>Seleccionar Producto</option>
                            <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                                {{ producto.nombre }}
                            </option>
                        </select>
                        <br>
                        <label>Nombre Producto Actualizado:</label>
                        <input type="text" v-model="nuevoStock.nombreProductoActualizado" placeholder="Nombre Producto" required/>
                        <label>Stock Actual:</label>
                        <input type="number" v-model="nuevoStock.stockActual" placeholder="Stock Actual" required/>
                        <label>Stock Anterior:</label>
                        <input type="number" v-model="nuevoStock.stockAnterior" placeholder="Stock Anterior" required/>
                        <label>Proveedor:</label>
                        <select v-model="nuevoStock.proveedorId">
                            <option value="" disabled>Seleccionar Proveedor (Opcional)</option>
                            <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.id">
                                {{ proveedor.descripcion }}
                            </option>
                        </select>
                        <div class="form-buttons">
                            <button @click="nuevoStock.id ? modificarStock() : agregarStock()" class="btn">
                                {{ nuevoStock.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Nombre Actualizado</th>
                                <th>Stock Actual</th>
                                <th>Stock Anterior</th>
                                <th>Proveedor</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="stock in stocksPaginados" :key="stock.id">
                                <td>{{ stock.id }}</td>
                                <td>{{ getProductoName(stock) }}</td>
                                <td>{{ stock.nombreProductoActualizado }}</td>
                                <td>{{ formatearNumero(stock.stockActual) }}</td>
                                <td>{{ formatearNumero(stock.stockAnterior) }}</td>
                                <td>{{ getProveedorName(stock) }}</td>
                                <td>{{ formatearFecha(stock.fechaRegistroInformacionStock) }}</td>
                                <td>
                                    <button @click="cargarStock(stock)" class="btn-small">Editar</button>
                                    <button @click="eliminarStock(stock)" class="btn-small btn-danger">Eliminar</button>
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
