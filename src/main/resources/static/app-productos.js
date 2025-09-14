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
            filtroBusqueda: '',
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
                    window.location.href = '/login';
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
        filtrarProductos() {
            if (this.filtroBusqueda.trim() === '') {
                this.productosFiltrados = this.productos;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.productosFiltrados = this.productos.filter(producto =>
                    producto.nombre.toLowerCase().includes(busqueda) ||
                    (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda))
                );
            }
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
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Productos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Producto:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarProductos" placeholder="Buscar producto..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Producto</button>
                    
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
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio Compra</th>
                                <th>Precio Venta</th>
                                <th>Stock Inicial</th>
                                <th>Stock Óptimo</th>
                                <th>Stock Mínimo</th>
                                <th>Activo</th>
                                <th>En Promoción</th>
                                <th>Precio Promoción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="producto in productosPaginados" :key="producto.id">
                                <td>{{ producto.id }}</td>
                                <td>{{ producto.nombre }}</td>
                                <td>{{ producto.descripcion || '-' }}</td>
                                <td>{{ formatearNumero(producto.precioCompra) }}</td>
                                <td>{{ formatearNumero(producto.precioVenta) }}</td>
                                <td>{{ formatearNumero(producto.cantidadStockInicial) }}</td>
                                <td>{{ producto.cantidadOptimaStock ? formatearNumero(producto.cantidadOptimaStock) : '-' }}</td>
                                <td>{{ producto.minimoStock ? formatearNumero(producto.minimoStock) : '-' }}</td>
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
