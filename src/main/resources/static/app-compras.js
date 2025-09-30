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


            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchCompras();

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
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarCompras();
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
                <h1 class="page-title">Gestión de Compras</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
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
                        <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
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

                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div style="margin-top: 200px; text-align: center; font-weight: bold; font-size: 18px;">
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




