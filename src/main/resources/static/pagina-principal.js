import config from './config.js';

new Vue({
    vuetify: new Vuetify({
        locale: {
            current: 'es',
        },
    }),
    el: '#app',
    data() {
        return {
            paginas: [
                { titulo: 'Clientes', icono: 'fas fa-users', url: '/web/cliente-principal', descripcion: 'Gestión de clientes' },
                { titulo: 'Turnos', icono: 'fas fa-calendar-check', url: '/web/turnos', descripcion: 'Gestión de turnos' },
                { titulo: 'Nueva Compra', icono: 'fas fa-cart-plus', url: '/web/registro-compra', descripcion: 'Registro de compras' },
                { titulo: 'Nueva Venta', icono: 'fas fa-plus-circle', url: '/web/registro-venta', descripcion: 'Registro de ventas' },
                { titulo: 'Calendario', icono: 'fas fa-calendar-alt', url: '/web/calendario-turno', descripcion: 'Calendario de turnos' },
                { titulo: 'Servicios', icono: 'fas fa-cut', url: '/web/servicios', descripcion: 'Gestión de servicios' },
                { titulo: 'Productos', icono: 'fas fa-shopping-bag', url: '/web/productos', descripcion: 'Gestión de productos' },
                { titulo: 'Empleados', icono: 'fas fa-user-tie', url: '/web/empleados', descripcion: 'Gestión de empleados' },
                { titulo: 'Gastos', icono: 'fas fa-receipt', url: '/web/gastos', descripcion: 'Control de gastos' },
                { titulo: 'Reportes', icono: 'fas fa-chart-bar', url: '/web/reportes', descripcion: 'Reportes y estadísticas' },
                { titulo: 'Panel de Control', icono: 'fas fa-tachometer-alt', url: '/web/panel-control', descripcion: 'Panel principal' }
            ]
        };
    },
    methods: {
        navegarA(url) {
            window.location.href = url;
        }
    },
    template: `
        <div class="glass-container">
            <h1>Página Principal - Peluquería LUNA</h1>
            <div class="stats-container">
                <div 
                    v-for="pagina in paginas" 
                    :key="pagina.titulo"
                    class="stat-card hover-lift" 
                    @click="navegarA(pagina.url)"
                >
                    <i :class="pagina.icono"></i>
                    <h3>{{ pagina.titulo }}</h3>
                    <p>{{ pagina.descripcion }}</p>
                </div>
            </div>
        </div>
    `
});