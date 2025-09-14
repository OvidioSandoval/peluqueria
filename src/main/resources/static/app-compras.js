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
            compras: [],
            filtroBusqueda: '',
            comprasFiltradas: [],
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaCompra: {
                id: null,
                producto: null,
                proveedor: null,
                cantidad: '',
                total: '',
                fechaCompra: new Date().toISOString().split('T')[0]
            },
            productos: [],
            proveedores: [],
            compraSeleccionada: '',

            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchCompras();
        this.fetchProductos();
        this.fetchProveedores();
    },

    computed: {
        totalPaginas() {
            return Math.ceil(this.comprasFiltradas.length / this.itemsPorPagina);
        },
        comprasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.comprasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalCompras() {
            return this.comprasFiltradas.reduce((sum, compra) => sum + (compra.total || 0), 0);
        }
    },
    methods: {

        async fetchCompras() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/compras`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.compras = await response.json();
                this.filtrarCompras();
            } catch (error) {
                console.error('Error al cargar compras:', error);
                NotificationSystem.error(`Error al cargar las compras: ${error.message}`);
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
        filtrarCompras() {
            let comprasFiltradas = this.compras;
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                comprasFiltradas = comprasFiltradas.filter(compra =>
                    (compra.producto && compra.producto.nombre.toLowerCase().includes(busqueda)) ||
                    (compra.proveedor && compra.proveedor.descripcion.toLowerCase().includes(busqueda))
                );
            }
            
            if (this.filtroFecha) {
                comprasFiltradas = comprasFiltradas.filter(compra => {
                    const fechaCompra = this.formatearFechaParaFiltro(compra.fechaCompra);
                    return fechaCompra === this.filtroFecha;
                });
            }
            
            this.comprasFiltradas = comprasFiltradas;
        },
        async agregarCompra() {
            if (!this.nuevaCompra.producto || !this.nuevaCompra.proveedor || !this.nuevaCompra.cantidad || !this.nuevaCompra.total) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const compraData = {
                    ...this.nuevaCompra,
                    cantidad: parseInt(this.nuevaCompra.cantidad),
                    total: parseInt(this.nuevaCompra.total)
                };
                const response = await fetch(`${config.apiBaseUrl}/compras/agregar_compra`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(compraData)
                });
                if (response.ok) {
                    await this.fetchCompras();
                    this.toggleFormulario();
                    NotificationSystem.success('Compra agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar compra:', error);
                NotificationSystem.error(`Error al agregar compra: ${error.message}`);
            }
        },
        async modificarCompra() {
            if (!this.nuevaCompra.producto || !this.nuevaCompra.proveedor || !this.nuevaCompra.cantidad || !this.nuevaCompra.total) {
                NotificationSystem.error('Todos los campos son requeridos');
                return;
            }
            try {
                const compraData = {
                    ...this.nuevaCompra,
                    cantidad: parseInt(this.nuevaCompra.cantidad),
                    total: parseInt(this.nuevaCompra.total)
                };
                const response = await fetch(`${config.apiBaseUrl}/compras/actualizar_compra/${this.nuevaCompra.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(compraData)
                });
                if (response.ok) {
                    await this.fetchCompras();
                    this.toggleFormulario();
                    NotificationSystem.success('Compra actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar compra:', error);
                NotificationSystem.error(`Error al modificar compra: ${error.message}`);
            }
        },
        async eliminarCompra(compra) {
            NotificationSystem.confirm(`¿Eliminar compra de "${compra.producto ? this.capitalizarTexto(compra.producto.nombre) : 'producto'}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/compras/eliminar_compra/${compra.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchCompras();
                        NotificationSystem.success('Compra eliminada exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar compra:', error);
                    NotificationSystem.error(`Error al eliminar compra: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaCompra = {
                id: null,
                producto: null,
                proveedor: null,
                cantidad: '',
                total: '',
                fechaCompra: new Date().toISOString().split('T')[0]
            };
            this.compraSeleccionada = '';
        },
        cargarCompra(compra) {
            this.nuevaCompra = {
                id: compra.id,
                producto: compra.producto,
                proveedor: compra.proveedor,
                cantidad: compra.cantidad || '',
                total: compra.total || '',
                fechaCompra: this.formatearFechaParaInput(compra.fechaCompra)
            };
            this.formularioVisible = true;
            this.compraSeleccionada = compra.producto ? this.capitalizarTexto(compra.producto.nombre) : 'Compra';
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            }
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        },
        formatearFechaParaInput(fecha) {
            if (!fecha) return new Date().toISOString().split('T')[0];
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        formatearFechaParaFiltro(fecha) {
            if (!fecha) return '';
            if (Array.isArray(fecha)) {
                const [year, month, day] = fecha;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            return typeof fecha === 'string' ? fecha : new Date(fecha).toISOString().split('T')[0];
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
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
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Compras</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: end;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Buscar Compra:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarCompras" placeholder="Buscar por producto o proveedor..." class="search-bar"/>
                        </div>
                         <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Filtrar por Fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarCompras" class="search-bar"/>
                        </div>
                    </div>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nueva Compra</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevaCompra.id ? 'Modificar Compra: ' + compraSeleccionada : 'Agregar Compra' }}</h3>
                        <label>Producto:</label>
                        <select v-model="nuevaCompra.producto" required>
                            <option value="">Seleccionar Producto</option>
                            <option v-for="producto in productos" :key="producto.id" :value="producto">
                                {{ capitalizarTexto(producto.nombre) }}
                            </option>
                        </select>
                        <label>Proveedor:</label>
                        <select v-model="nuevaCompra.proveedor" required>
                            <option value="">Seleccionar Proveedor</option>
                            <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor">
                                {{ capitalizarTexto(proveedor.descripcion) }}
                            </option>
                        </select>
                        <br>
                        <label>Cantidad:</label>
                        <input type="number" v-model="nuevaCompra.cantidad" placeholder="Cantidad" min="1" required/>
                        <label>Total:</label>
                        <input type="number" v-model="nuevaCompra.total" placeholder="Total" min="0" required/>
                        <label>Fecha de Compra:</label>
                        <input type="date" v-model="nuevaCompra.fechaCompra" required/>
                        <div class="form-buttons">
                            <button @click="nuevaCompra.id ? modificarCompra() : agregarCompra()" class="btn">
                                {{ nuevaCompra.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Proveedor</th>
                                <th>Cantidad</th>
                                <th>Total</th>
                                <th>Fecha Compra</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="compra in comprasPaginadas" :key="compra.id">
                                <td>{{ compra.id }}</td>
                                <td>{{ compra.producto ? capitalizarTexto(compra.producto.nombre) : '' }}</td>
                                <td>{{ compra.proveedor ? capitalizarTexto(compra.proveedor.descripcion) : '' }}</td>
                                <td>{{ formatearNumero(compra.cantidad) }}</td>
                                <td>{{ formatearNumero(compra.total) }}</td>
                                <td>{{ formatearFecha(compra.fechaCompra) }}</td>
                                <td>
                                    <button @click="cargarCompra(compra)" class="btn-small">Editar</button>
                                    <button @click="eliminarCompra(compra)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center; font-weight: bold; font-size: 18px;">
                        Total General: {{ formatearNumero(totalCompras) }}
                    </div>
                </main>
            </div>
        </div>
    `
});

// Estilos para mejorar visibilidad del mensaje de confirmación
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