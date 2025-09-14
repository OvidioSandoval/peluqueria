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
            detalles: [],
            detallesFiltrados: [],
            compras: [],
            productos: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoDetalle: { 
                id: null, 
                compra: null,
                producto: null,
                cantidadComprada: '',
                precioUnitario: '',
                precioTotal: ''
            },
            detalleSeleccionado: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchDetalles();
        this.fetchCompras();
        this.fetchProductos();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.detallesFiltrados.length / this.itemsPorPagina);
        },
        detallesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.detallesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchDetalles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-compras`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.detalles = await response.json();
                this.filtrarDetalles();
            } catch (error) {
                console.error('Error al cargar detalles:', error);
                NotificationSystem.error(`Error al cargar el detalle de compras: ${error.message}`);
            }
        },
        async fetchCompras() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/compras`);
                this.compras = await response.json();
            } catch (error) {
                console.error('Error al cargar compras:', error);
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
        filtrarDetalles() {
            let filtrados = [...this.detalles];
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(detalle =>
                    (detalle.producto && detalle.producto.nombre.toLowerCase().includes(busqueda)) ||
                    (detalle.compra && detalle.compra.id.toString().includes(busqueda))
                );
            }
            
            this.detallesFiltrados = filtrados;
        },
        async agregarDetalle() {
            if (!this.nuevoDetalle.compra || !this.nuevoDetalle.producto || !this.nuevoDetalle.cantidadComprada || !this.nuevoDetalle.precioUnitario || !this.nuevoDetalle.precioTotal) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-compras/agregar_detalle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        compra: this.nuevoDetalle.compra,
                        producto: this.nuevoDetalle.producto,
                        cantidadComprada: parseInt(this.nuevoDetalle.cantidadComprada),
                        precioUnitario: parseInt(this.nuevoDetalle.precioUnitario),
                        precioTotal: parseInt(this.nuevoDetalle.precioTotal)
                    })
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchDetalles();
                    NotificationSystem.success('Detalle agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar detalle:', error);
                NotificationSystem.error(`Error al agregar detalle: ${error.message}`);
            }
        },
        async modificarDetalle() {
            if (!this.nuevoDetalle.compra || !this.nuevoDetalle.producto || !this.nuevoDetalle.cantidadComprada || !this.nuevoDetalle.precioUnitario || !this.nuevoDetalle.precioTotal) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const response = await fetch(`${config.apiBaseUrl}/detalle-compras/actualizar_detalle/${this.nuevoDetalle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        compra: this.nuevoDetalle.compra,
                        producto: this.nuevoDetalle.producto,
                        cantidadComprada: parseInt(this.nuevoDetalle.cantidadComprada),
                        precioUnitario: parseInt(this.nuevoDetalle.precioUnitario),
                        precioTotal: parseInt(this.nuevoDetalle.precioTotal)
                    })
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchDetalles();
                    NotificationSystem.success('Detalle actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar detalle:', error);
                NotificationSystem.error(`Error al modificar detalle: ${error.message}`);
            }
        },
        async eliminarDetalle(detalle) {
            NotificationSystem.confirm(`¿Eliminar detalle de "${detalle.producto ? detalle.producto.nombre : 'producto'}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/detalle-compras/eliminar_detalle/${detalle.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchDetalles();
                        NotificationSystem.success('Detalle eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar detalle:', error);
                    NotificationSystem.error('Error al eliminar detalle');
                }
            });
        },
        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoDetalle = { 
                id: null, 
                compra: null,
                producto: null,
                cantidadComprada: '',
                precioUnitario: '',
                precioTotal: ''
            };
            this.detalleSeleccionado = '';
            if (!this.formularioVisible) {
                await this.fetchDetalles();
            }
        },
        cargarDetalle(detalle) {
            this.nuevoDetalle = { ...detalle };
            this.formularioVisible = true;
            this.detalleSeleccionado = detalle.producto ? detalle.producto.nombre : 'Producto';
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchDetalles();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        getCompraInfo(compra) {
            return compra ? `Compra #${compra.id}` : '-';
        },
        getProductoNombre(producto) {
            return producto ? producto.nombre : '-';
        },
        calcularPrecioTotal() {
            if (this.nuevoDetalle.cantidadComprada && this.nuevoDetalle.precioUnitario) {
                this.nuevoDetalle.precioTotal = parseInt(this.nuevoDetalle.cantidadComprada) * parseInt(this.nuevoDetalle.precioUnitario);
            } else {
                this.nuevoDetalle.precioTotal = '';
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Detalle de Compras</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Detalle:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarDetalles" placeholder="Buscar por producto o compra..." class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Detalle</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoDetalle.id ? 'Modificar Detalle: ' + detalleSeleccionado : 'Agregar Detalle' }}</h3>
                        <div style="display: flex; flex-direction: column; margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; color: #5d4037;">Compra:</label>
                            <select v-model="nuevoDetalle.compra" required>
                                <option value="">Seleccionar Compra</option>
                                <option v-for="compra in compras" :key="compra.id" :value="compra">
                                    Compra #{{ compra.id }} - {{ compra.producto ? compra.producto.nombre : 'Sin producto' }}
                                </option>
                            </select>
                        </div>
                        <div style="display: flex; flex-direction: column; margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; color: #5d4037;">Producto:</label>
                            <select v-model="nuevoDetalle.producto" required>
                                <option value="">Seleccionar Producto</option>
                                <option v-for="producto in productos" :key="producto.id" :value="producto">{{ producto.nombre }}</option>
                            </select>
                        </div>
                        <label>Cantidad Comprada:</label>
                        <input type="number" v-model="nuevoDetalle.cantidadComprada" @input="calcularPrecioTotal" placeholder="Cantidad Comprada" required/>
                        <label>Precio Unitario:</label>
                        <input type="number" v-model="nuevoDetalle.precioUnitario" @input="calcularPrecioTotal" placeholder="Precio Unitario" required/>
                        <label>Precio Total:</label>
                        <input type="number" v-model="nuevoDetalle.precioTotal" placeholder="Precio Total" readonly style="background-color: #f5f5f5;"/>
                        <div class="form-buttons">
                            <button @click="nuevoDetalle.id ? modificarDetalle() : agregarDetalle()" class="btn">
                                {{ nuevoDetalle.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Compra</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Precio Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detalle in detallesPaginados" :key="detalle.id">
                                <td>{{ detalle.id }}</td>
                                <td>{{ getCompraInfo(detalle.compra) }}</td>
                                <td>{{ getProductoNombre(detalle.producto) }}</td>
                                <td>{{ detalle.cantidadComprada }}</td>
                                <td>{{ formatearNumero(detalle.precioUnitario) }}</td>
                                <td>{{ formatearNumero(detalle.precioTotal) }}</td>
                                <td>
                                    <button @click="cargarDetalle(detalle)" class="btn-small">Editar</button>
                                    <button @click="eliminarDetalle(detalle)" class="btn-small btn-danger">Eliminar</button>
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

const confirmStyle = document.createElement('style');
confirmStyle.textContent = `
    .swal2-popup {
        background: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #333 !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        z-index: 99999 !important;
    }
    .swal2-title {
        color: #000000 !important;
        font-weight: bold !important;
        font-size: 18px !important;
        text-shadow: none !important;
    }
    .swal2-html-container {
        color: #000000 !important;
        font-weight: bold !important;
    }
    .swal2-content {
        color: #000000 !important;
        font-size: 16px !important;
        font-weight: 500 !important;
    }
    .swal2-confirm {
        background: #dc3545 !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-cancel {
        background: #6c757d !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-container {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(confirmStyle);