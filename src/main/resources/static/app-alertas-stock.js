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
            alertas: [],
            alertasFiltradas: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchAlertas();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.alertasFiltradas.length / this.itemsPorPagina);
        },
        alertasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.alertasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/alertas-stock';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/alertas-stock';
            }
        },
        async fetchAlertas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/alertas-stock`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.alertas = await response.json();
                this.filtrarAlertas();
            } catch (error) {
                console.error('Error al cargar alertas:', error);
                NotificationSystem.error(`Error al cargar las alertas: ${error.message}`);
            }
        },
        filtrarAlertas() {
            if (this.filtroBusqueda) {
                this.alertasFiltradas = this.alertas.filter(alerta =>
                    alerta.producto && alerta.producto.nombre && 
                    alerta.producto.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            } else {
                this.alertasFiltradas = this.alertas;
            }
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchAlertas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        redirigirAlertasStock() {
            window.location.href = '/web/alertas-stock';
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

                <h1 class="page-title">Alertas de Stock Bajo</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <div class="alert-summary" v-if="alertas.length > 0">
                        <h3 style="margin: 0 0 10px 0; color: #856404;">Resumen de Alertas</h3>
                        <p style="margin: 0; font-size: 16px;"><strong>{{ alertas.length }}</strong> producto(s) con stock por debajo del mínimo requerido</p>
                    </div>
                    <label>Buscar Producto:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarAlertas" placeholder="Buscar producto..." class="search-bar"/>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Stock Mínimo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="alerta in alertasPaginadas" :key="alerta.id" class="alerta-row">
                                <td><strong>{{ capitalizarTexto(alerta.producto.nombre) }}</strong><br><small style="color: #6c757d;">{{ capitalizarTexto(alerta.producto.descripcion) || 'Sin descripción' }}</small></td>
                                <td class="stock-actual">{{ formatearNumero(alerta.stockActual) }}</td>
                                <td class="stock-minimo">{{ formatearNumero(alerta.producto.minimoStock) }}</td>
                                <td><span class="badge-critico">STOCK BAJO</span></td>
                            </tr>
                            <tr v-if="alertasPaginadas.length === 0">
                                <td colspan="4" style="text-align: center; color: #666; padding: 40px;">{{ alertas.length === 0 ? 'No hay productos con stock bajo' : 'No se encontraron productos que coincidan con la búsqueda' }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="pagination" v-if="totalPaginas > 1">
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
    .alerta-row { 
        background-color: #fff3cd !important; 
        border-left: 4px solid #ffc107; 
    }
    .stock-actual { 
        font-weight: bold; 
        color: #dc3545; 
    }
    .stock-minimo { 
        font-weight: bold; 
        color: #6c757d; 
    }
    .badge-critico { 
        background: #dc3545; 
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
`;
document.head.appendChild(style);



