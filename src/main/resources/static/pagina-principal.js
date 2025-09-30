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
                { titulo: 'Calendario', icono: 'fas fa-calendar-alt', url: '/web/calendario-turno', descripcion: 'Calendario de turnos' },
                { titulo: 'Nueva Venta', icono: 'fas fa-plus-circle', url: '/web/registro-venta', descripcion: 'Registro de ventas' },
                { titulo: 'Nueva Compra', icono: 'fas fa-cart-plus', url: '/web/registro-compra', descripcion: 'Registro de compras' },
                { titulo: 'Servicios', icono: 'fas fa-cut', url: '/web/servicios', descripcion: 'Gestión de servicios' },
                { titulo: 'Productos', icono: 'fas fa-shopping-bag', url: '/web/productos', descripcion: 'Gestión de productos' },
                { titulo: 'Empleados', icono: 'fas fa-user-tie', url: '/web/empleado-principal', descripcion: 'Panel de empleados y sueldos' },
                { titulo: 'Empleados Principal', icono: 'fas fa-users-cog', url: '/web/empleados-principal', descripcion: 'Gestión avanzada de empleados' },
                { titulo: 'Áreas', icono: 'fas fa-map-marker-alt', url: '/web/areas', descripcion: 'Gestión de áreas' },
                { titulo: 'Cajas', icono: 'fas fa-cash-register', url: '/web/cajas', descripcion: 'Control de cajas' },
                { titulo: 'Categorías', icono: 'fas fa-tags', url: '/web/categorias', descripcion: 'Categorías de servicios' },
                { titulo: 'Compras', icono: 'fas fa-shopping-cart', url: '/web/compras', descripcion: 'Historial de compras' },
                { titulo: 'Ventas', icono: 'fas fa-dollar-sign', url: '/web/ventas', descripcion: 'Historial de ventas' },
                { titulo: 'Detalle Compras', icono: 'fas fa-list-alt', url: '/web/detalle-compras', descripcion: 'Detalles de compras' },
                { titulo: 'Detalle Ventas', icono: 'fas fa-list-ul', url: '/web/detalle-ventas', descripcion: 'Detalles de ventas' },
                { titulo: 'Gastos', icono: 'fas fa-receipt', url: '/web/gastos', descripcion: 'Control de gastos' },
                { titulo: 'Stock', icono: 'fas fa-boxes', url: '/web/informacion-stock', descripcion: 'Información de stock' },
                { titulo: 'Movimientos', icono: 'fas fa-exchange-alt', url: '/web/movimientos', descripcion: 'Movimientos de inventario' },
                { titulo: 'Paquetes', icono: 'fas fa-gift', url: '/web/paquete-servicios', descripcion: 'Paquetes de servicios' },
                { titulo: 'Paquetes-Servicios', icono: 'fas fa-link', url: '/web/paquetes-contiene-servicio', descripcion: 'Relación paquetes-servicios' },
                { titulo: 'Proveedores', icono: 'fas fa-truck', url: '/web/proveedores', descripcion: 'Gestión de proveedores' },
                { titulo: 'Alertas Stock', icono: 'fas fa-exclamation-triangle', url: '/web/alertas-stock', descripcion: 'Alertas de stock bajo' },
                { titulo: 'Reportes', icono: 'fas fa-chart-bar', url: '/web/reportes', descripcion: 'Reportes y estadísticas' },
                { titulo: 'Usuarios', icono: 'fas fa-user-cog', url: '/web/usuarios', descripcion: 'Gestión de usuarios' },
                { titulo: 'Gestión Clientes', icono: 'fas fa-user-friends', url: '/web/clientes', descripcion: 'CRUD de clientes' },
                { titulo: 'Gestión Empleados', icono: 'fas fa-users-cog', url: '/web/empleados', descripcion: 'CRUD de empleados' }
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
            <h1 class="page-title">Página Principal - Peluquería LUNA</h1>
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
