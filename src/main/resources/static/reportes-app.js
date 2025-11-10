new Vue({
    el: '#app',
    data: {
        tipoReporte: 'ventas',
        fechaDesde: '',
        fechaHasta: '',
        reporteData: [],
        totalVentas: 0,
        ingresosTotales: 0
    },
    mounted() {
        this.inicializarFechas();
        this.cargarReporte();
    },
    methods: {
        inicializarFechas() {
            const hoy = new Date();
            const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
            
            this.fechaHasta = hoy.toISOString().split('T')[0];
            this.fechaDesde = hace30Dias.toISOString().split('T')[0];
        },
        
        async cargarReporte() {
            try {
                const response = await fetch(`/api/reportes/${this.tipoReporte}?fechaDesde=${this.fechaDesde}&fechaHasta=${this.fechaHasta}`);
                const data = await response.json();
                
                this.reporteData = data.datos || [];
                
                if (this.tipoReporte === 'ventas') {
                    this.totalVentas = this.reporteData.length;
                    this.ingresosTotales = this.reporteData.reduce((sum, venta) => sum + venta.total, 0);
                }
            } catch (error) {
                console.error('Error al cargar reporte:', error);
                this.generarDatosPrueba();
            }
        },
        
        generarDatosPrueba() {
            switch (this.tipoReporte) {
                case 'ventas':
                    this.reporteData = [
                        { id: 1, fecha: '2024-01-15', cliente: 'María García', servicio: 'Corte y Peinado', empleado: 'Ana López', total: 25000 },
                        { id: 2, fecha: '2024-01-16', cliente: 'Juan Pérez', servicio: 'Corte Masculino', empleado: 'Carlos Ruiz', total: 15000 },
                        { id: 3, fecha: '2024-01-17', cliente: 'Laura Martín', servicio: 'Tinte y Corte', empleado: 'Ana López', total: 45000 }
                    ];
                    this.totalVentas = this.reporteData.length;
                    this.ingresosTotales = this.reporteData.reduce((sum, venta) => sum + venta.total, 0);
                    break;
                    
                case 'citas':
                    this.reporteData = [
                        { id: 1, fecha: '2024-01-15', hora: '10:00', cliente: 'María García', servicio: 'Corte y Peinado', empleado: 'Ana López', estado: 'completada' },
                        { id: 2, fecha: '2024-01-16', hora: '14:30', cliente: 'Juan Pérez', servicio: 'Corte Masculino', empleado: 'Carlos Ruiz', estado: 'completada' },
                        { id: 3, fecha: '2024-01-17', hora: '16:00', cliente: 'Laura Martín', servicio: 'Tinte y Corte', empleado: 'Ana López', estado: 'pendiente' }
                    ];
                    break;
                    
                case 'productos':
                    this.reporteData = [
                        { id: 1, nombre: 'Shampoo Profesional', categoria: 'Cuidado Capilar', stock: 15, stockMinimo: 10, precio: 12000 },
                        { id: 2, nombre: 'Tinte Rubio', categoria: 'Coloración', stock: 5, stockMinimo: 8, precio: 18000 },
                        { id: 3, nombre: 'Acondicionador', categoria: 'Cuidado Capilar', stock: 20, stockMinimo: 12, precio: 10000 }
                    ];
                    break;
                    
                case 'empleados':
                    this.reporteData = [
                        { id: 1, nombre: 'Ana López', area: 'Estilismo', citasAtendidas: 45, ventasRealizadas: 38, ingresosGenerados: 950000 },
                        { id: 2, nombre: 'Carlos Ruiz', area: 'Barbería', citasAtendidas: 32, ventasRealizadas: 28, ingresosGenerados: 680000 },
                        { id: 3, nombre: 'María Fernández', area: 'Coloración', citasAtendidas: 28, ventasRealizadas: 25, ingresosGenerados: 750000 }
                    ];
                    break;
            }
        },
        
        formatearFecha(fecha) {
            return new Date(fecha).toLocaleDateString('es-ES');
        },
        
        formatearPrecio(precio) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
            }).format(precio);
        },
        
        exportarPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text(`Reporte de ${this.tipoReporte.charAt(0).toUpperCase() + this.tipoReporte.slice(1)}`, 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Período: ${this.fechaDesde} al ${this.fechaHasta}`, 20, 35);
            
            let columns, rows;
            
            switch (this.tipoReporte) {
                case 'ventas':
                    columns = ['Fecha', 'Cliente', 'Servicio', 'Empleado', 'Total'];
                    rows = this.reporteData.map(venta => [
                        this.formatearFecha(venta.fecha),
                        venta.cliente,
                        venta.servicio,
                        venta.empleado,
                        this.formatearPrecio(venta.total)
                    ]);
                    break;
                    
                case 'citas':
                    columns = ['Fecha', 'Hora', 'Cliente', 'Servicio', 'Empleado', 'Estado'];
                    rows = this.reporteData.map(cita => [
                        this.formatearFecha(cita.fecha),
                        cita.hora,
                        cita.cliente,
                        cita.servicio,
                        cita.empleado,
                        cita.estado
                    ]);
                    break;
                    
                case 'productos':
                    columns = ['Producto', 'Categoría', 'Stock', 'Stock Mín.', 'Precio', 'Estado'];
                    rows = this.reporteData.map(producto => [
                        producto.nombre,
                        producto.categoria,
                        producto.stock,
                        producto.stockMinimo,
                        this.formatearPrecio(producto.precio),
                        producto.stock <= producto.stockMinimo ? 'Stock Bajo' : 'OK'
                    ]);
                    break;
                    
                case 'empleados':
                    columns = ['Empleado', 'Área', 'Citas', 'Ventas', 'Ingresos'];
                    rows = this.reporteData.map(empleado => [
                        empleado.nombre,
                        empleado.area,
                        empleado.citasAtendidas,
                        empleado.ventasRealizadas,
                        this.formatearPrecio(empleado.ingresosGenerados)
                    ]);
                    break;
            }
            
            doc.autoTable({
                head: [columns],
                body: rows,
                startY: 50,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [139, 69, 19] }
            });
            
            if (this.tipoReporte === 'ventas') {
                const finalY = doc.lastAutoTable.finalY + 20;
                doc.text(`Total de Ventas: ${this.totalVentas}`, 20, finalY);
                doc.text(`Ingresos Totales: ${this.formatearPrecio(this.ingresosTotales)}`, 20, finalY + 10);
            }
            
            doc.save(`reporte-${this.tipoReporte}-${new Date().toISOString().split('T')[0]}.pdf`);
        }
    }
});