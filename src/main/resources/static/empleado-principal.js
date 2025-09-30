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
            empleados: [],
            empleadosFiltrados: [],
            empleadoSeleccionado: null,
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            mostrarDetalle: false,
            cargandoDetalle: false,
            detalleEmpleado: null,
            resumenMensual: null,
        };
    },
    mounted() {
        this.fetchEmpleados();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.empleadosFiltrados.length / this.itemsPorPagina);
        },
        empleadosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.empleadosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchEmpleados() {
            try {
                const response = await fetch(config.apiBaseUrl + '/empleados');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.empleados = await response.json();
                this.filtrarEmpleados();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error('Error al cargar los empleados: ' + error.message);
            }
        },
        
        filtrarEmpleados() {
            let empleadosFiltrados = this.empleados.filter(emp => emp.activo);
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                empleadosFiltrados = empleadosFiltrados.filter(empleado =>
                    (empleado.nombreCompleto && empleado.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (empleado.area && empleado.area.nombre && empleado.area.nombre.toLowerCase().includes(busqueda))
                );
            }
            
            this.empleadosFiltrados = empleadosFiltrados;
            this.paginaActual = 1;
        },
        
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtrarEmpleados();
        },
        
        async seleccionarEmpleado(empleado) {
            this.empleadoSeleccionado = empleado;
            this.mostrarDetalle = true;
            await this.calcularDetalleEmpleado(empleado.id);
        },
        
        async calcularDetalleEmpleado(empleadoId) {
            try {
                this.cargandoDetalle = true;
                const ventasResponse = await fetch(config.apiBaseUrl + '/ventas');
                const detalleVentasResponse = await fetch(config.apiBaseUrl + '/detalle-ventas');
                
                if (!ventasResponse.ok || !detalleVentasResponse.ok) {
                    throw new Error('Error al cargar datos');
                }
                
                const ventas = await ventasResponse.json();
                const detalleVentas = await detalleVentasResponse.json();
                
                const fechaActual = new Date();
                const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
                const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
                
                const ventasEmpleado = ventas.filter(venta => 
                    venta.empleado && venta.empleado.id === empleadoId &&
                    new Date(venta.fechaVenta) >= primerDiaMes &&
                    new Date(venta.fechaVenta) <= ultimoDiaMes
                );
                
                let serviciosRealizados = [];
                let ingresosGenerados = 0;
                
                for (const venta of ventasEmpleado) {
                    const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    
                    for (const detalle of detalles) {
                        if (detalle.servicio) {
                            const total = detalle.precioUnitario * detalle.cantidad;
                            serviciosRealizados.push({
                                nombre: detalle.servicio.nombre,
                                precio: detalle.precioUnitario,
                                cantidad: detalle.cantidad,
                                total: total,
                                fecha: venta.fechaVenta
                            });
                            ingresosGenerados += total;
                        }
                    }
                }
                
                const comisionTotal = ingresosGenerados * (this.empleadoSeleccionado.comisionPorcentaje / 100);
                const sueldoTotal = this.empleadoSeleccionado.sueldoBase + comisionTotal;
                const diferencia = sueldoTotal - (this.empleadoSeleccionado.totalPagado || 0);
                
                this.detalleEmpleado = {
                    serviciosRealizados,
                    totalServicios: serviciosRealizados.length,
                    ingresosGenerados,
                    comisionTotal,
                    sueldoBase: this.empleadoSeleccionado.sueldoBase,
                    sueldoTotal,
                    pagado: this.empleadoSeleccionado.totalPagado || 0,
                    diferencia
                };
                
            } catch (error) {
                console.error('Error al calcular detalle:', error);
                NotificationSystem.error('Error al calcular el detalle: ' + error.message);
            } finally {
                this.cargandoDetalle = false;
            }
        },
        
        async calcularResumenMensual() {
            try {
                const empleadosConDetalle = [];
                
                for (const empleado of this.empleados.filter(emp => emp.activo)) {
                    const ventasResponse = await fetch(config.apiBaseUrl + '/ventas');
                    const detalleVentasResponse = await fetch(config.apiBaseUrl + '/detalle-ventas');
                    
                    const ventas = await ventasResponse.json();
                    const detalleVentas = await detalleVentasResponse.json();
                    
                    const fechaActual = new Date();
                    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
                    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
                    
                    const ventasEmpleado = ventas.filter(venta => 
                        venta.empleado && venta.empleado.id === empleado.id &&
                        new Date(venta.fechaVenta) >= primerDiaMes &&
                        new Date(venta.fechaVenta) <= ultimoDiaMes
                    );
                    
                    let ingresosGenerados = 0;
                    for (const venta of ventasEmpleado) {
                        const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                        for (const detalle of detalles) {
                            if (detalle.servicio) {
                                ingresosGenerados += detalle.precioUnitario * detalle.cantidad;
                            }
                        }
                    }
                    
                    const comisionTotal = ingresosGenerados * (empleado.comisionPorcentaje / 100);
                    const sueldoTotal = empleado.sueldoBase + comisionTotal;
                    const diferencia = sueldoTotal - (empleado.totalPagado || 0);
                    
                    empleadosConDetalle.push({
                        ...empleado,
                        ingresosGenerados,
                        comisionTotal,
                        sueldoTotal,
                        diferencia
                    });
                }
                
                this.resumenMensual = {
                    empleados: empleadosConDetalle,
                    totalAPagar: empleadosConDetalle.reduce((sum, emp) => sum + emp.sueldoTotal, 0),
                    totalPagado: empleadosConDetalle.reduce((sum, emp) => sum + (emp.totalPagado || 0), 0),
                    totalDiferencia: empleadosConDetalle.reduce((sum, emp) => sum + emp.diferencia, 0)
                };
                
            } catch (error) {
                console.error('Error al calcular resumen:', error);
                NotificationSystem.error('Error al calcular el resumen mensual: ' + error.message);
            }
        },
        
        cerrarDetalle() {
            this.mostrarDetalle = false;
            this.empleadoSeleccionado = null;
            this.detalleEmpleado = null;
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        
        getNombreMesActual() {
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return meses[new Date().getMonth()];
        },
        
        calcularSueldoNeto(empleado) {
            const comision = empleado.sueldoBase * (empleado.comisionPorcentaje / 100);
            return empleado.sueldoBase + comision;
        },
        
        calcularSueldoTotal(empleado) {
            return this.calcularSueldoNeto(empleado) - (empleado.totalPagado || 0);
        },
        
        cerrarResumen() {
            this.resumenMensual = null;
        },
        
        exportarResumenPDF() {
            if (!this.resumenMensual) {
                NotificationSystem.error('No hay resumen mensual para exportar');
                return;
            }
            
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text(`Resumen Mensual - ${this.getNombreMesActual()} ${new Date().getFullYear()}`, 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('RESUMEN GENERAL', 20, y);
                y += 15;
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(`Total a Pagar: $${this.formatearNumero(this.resumenMensual.totalAPagar)}`, 20, y);
                y += 10;
                doc.text(`Total Pagado: $${this.formatearNumero(this.resumenMensual.totalPagado)}`, 20, y);
                y += 10;
                doc.text(`Diferencia a Pagar: $${this.formatearNumero(this.resumenMensual.totalDiferencia)}`, 20, y);
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`resumen-mensual-${this.getNombreMesActual()}-${fecha}.pdf`);
                NotificationSystem.success('Resumen mensual exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        exportarDetallePDF() {
            if (!this.detalleEmpleado || !this.empleadoSeleccionado) {
                NotificationSystem.error('No hay detalle de empleado para exportar');
                return;
            }
            
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setFontSize(16);
                doc.text(`Detalle Empleado - ${this.empleadoSeleccionado.nombreCompleto}`, 20, 35);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                doc.setFontSize(12);
                doc.text(`Área: ${this.empleadoSeleccionado.area ? this.empleadoSeleccionado.area.nombre : 'N/A'}`, 20, y);
                y += 8;
                doc.text(`Sueldo Base: $${this.formatearNumero(this.detalleEmpleado.sueldoBase)}`, 20, y);
                y += 8;
                doc.text(`Comisión Total: $${this.formatearNumero(this.detalleEmpleado.comisionTotal)}`, 20, y);
                y += 8;
                doc.text(`Total a Cobrar: $${this.formatearNumero(this.detalleEmpleado.sueldoTotal)}`, 20, y);
                y += 8;
                doc.text(`Servicios Realizados: ${this.detalleEmpleado.totalServicios}`, 20, y);
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`detalle-${this.empleadoSeleccionado.nombreCompleto.replace(/\s+/g, '-')}-${fecha}.pdf`);
                NotificationSystem.success('Detalle de empleado exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        async exportarPDF() {
            if (!this.resumenMensual) {
                await this.calcularResumenMensual();
            }
            
            if (!this.resumenMensual) {
                NotificationSystem.error('Error al calcular el resumen mensual');
                return;
            }
            
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
                doc.text(`Reporte de Empleados - ${this.getNombreMesActual()} ${new Date().getFullYear()}`, 20, 35);
                
                // Fecha
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                
                // Línea decorativa
                doc.setDrawColor(218, 165, 32);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                // Detalle por empleado filtrado
                doc.setFont('helvetica', 'bold');
                doc.text('DETALLE POR EMPLEADO', 20, y);
                y += 15;
                
                this.empleadosFiltrados.forEach((empleado, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.setTextColor(218, 165, 32);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${index + 1}. ${empleado.nombreCompleto}`, 20, y);
                    y += 8;
                    
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`   Área: ${empleado.area ? empleado.area.nombre : 'N/A'}`, 25, y);
                    y += 6;
                    doc.text(`   Sueldo Base: $${this.formatearNumero(empleado.sueldoBase)}`, 25, y);
                    y += 6;
                    doc.text(`   Comisión (${empleado.comisionPorcentaje}%): $${this.formatearNumero(empleado.comisionTotal)}`, 25, y);
                    y += 6;
                    doc.text(`   Total a Cobrar: $${this.formatearNumero(empleado.sueldoTotal)}`, 25, y);
                    y += 6;
                    doc.text(`   Ya Pagado: $${this.formatearNumero(empleado.totalPagado || 0)}`, 25, y);
                    y += 6;
                    doc.text(`   Diferencia: $${this.formatearNumero(empleado.diferencia)}`, 25, y);
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
                doc.save(`reporte-empleados-${this.getNombreMesActual()}-${fecha}.pdf`);
                NotificationSystem.success('Reporte PDF generado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Panel de Empleados - {{ getNombreMesActual() }} {{ new Date().getFullYear() }}</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Empleado:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarEmpleados" placeholder="Buscar por nombre o área..." class="search-bar"/>
                        </div>
                        <div class="filter-group" style="flex-direction: row; gap: 10px; align-items: end;">
                            <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                            <button @click="calcularResumenMensual" class="btn btn-small">
                                <i class="fas fa-calculator"></i> Calcular Resumen
                            </button>
                            <button @click="exportarPDF" class="btn btn-small">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="resumenMensual" class="form-container" style="margin: 20px 0; position: relative;">
                        <button @click="cerrarResumen" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #f44336; font-size: 1.5rem; cursor: pointer; padding: 5px;">
                            <i class="fas fa-times"></i>
                        </button>
                        <h3><i class="fas fa-chart-line"></i> Resumen Mensual - {{ getNombreMesActual() }}</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                            <div class="total" style="background: rgba(76, 175, 80, 0.1); border: 2px solid #4caf50;">
                                <div style="font-size: 1.8rem; font-weight: bold; color: #4caf50;">{{ formatearNumero(resumenMensual.totalAPagar) }}</div>
                                <div style="color: #66bb6a;">Total a Pagar</div>
                            </div>
                            <div class="total" style="background: rgba(33, 150, 243, 0.1); border: 2px solid #2196f3;">
                                <div style="font-size: 1.8rem; font-weight: bold; color: #2196f3;">{{ formatearNumero(resumenMensual.totalPagado) }}</div>
                                <div style="color: #42a5f5;">Total Pagado</div>
                            </div>
                            <div class="total" :style="'background: rgba(' + (resumenMensual.totalDiferencia > 0 ? '244, 67, 54' : '76, 175, 80') + ', 0.1); border: 2px solid ' + (resumenMensual.totalDiferencia > 0 ? '#f44336' : '#4caf50') + ';'">
                                <div style="font-size: 1.8rem; font-weight: bold;" :style="'color: ' + (resumenMensual.totalDiferencia > 0 ? '#f44336' : '#4caf50') + ';'">{{ formatearNumero(resumenMensual.totalDiferencia) }}</div>
                                <div :style="'color: ' + (resumenMensual.totalDiferencia > 0 ? '#ef5350' : '#66bb6a') + ';'">Diferencia a Pagar</div>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 15px;">
                            <button @click="exportarResumenPDF" class="btn btn-small">
                                <i class="fas fa-file-pdf"></i> Exportar Resumen PDF
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Área</th>
                                <th>Sueldo Base</th>
                                <th>Comisión %</th>
                                <th>Sueldo Neto</th>
                                <th>Total Pagado</th>
                                <th>Sueldo Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="empleado in empleadosPaginados" :key="empleado.id">
                                <td>{{ empleado.nombreCompleto }}</td>
                                <td>{{ empleado.area ? empleado.area.nombre : 'N/A' }}</td>
                                <td>{{ formatearNumero(empleado.sueldoBase) }}</td>
                                <td>{{ empleado.comisionPorcentaje }}%</td>
                                <td>{{ formatearNumero(calcularSueldoNeto(empleado)) }}</td>
                                <td>{{ formatearNumero(empleado.totalPagado || 0) }}</td>
                                <td>{{ formatearNumero(calcularSueldoTotal(empleado)) }}</td>
                                <td>
                                    <button @click="seleccionarEmpleado(empleado)" class="btn-small">
                                        <i class="fas fa-eye"></i> Ver Detalle
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div v-if="mostrarDetalle" class="turno-detail-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; overflow-y: auto;">
                        <div class="modal-content" style="background: rgba(252, 228, 236, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.2); border: 1px solid rgba(179, 229, 252, 0.3);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; color: #66bb6a;"><i class="fas fa-user"></i> {{ empleadoSeleccionado.nombreCompleto }}</h3>
                                <button @click="cerrarDetalle" style="background: none; border: none; color: #f44336; font-size: 1.5rem; cursor: pointer; padding: 5px;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <div v-if="cargandoDetalle" style="text-align: center; padding: 40px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #66bb6a;"></i>
                                <div style="margin-top: 20px; color: #66bb6a;">Calculando detalle...</div>
                            </div>
                            
                            <div v-else-if="detalleEmpleado" style="padding: 20px;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                                    <div class="form-container" style="padding: 15px;">
                                        <div><strong>Área:</strong> {{ empleadoSeleccionado.area ? empleadoSeleccionado.area.nombre : 'N/A' }}</div>
                                        <div><strong>Correo:</strong> {{ empleadoSeleccionado.correo || 'N/A' }}</div>
                                        <div><strong>Teléfono:</strong> {{ empleadoSeleccionado.telefono || 'N/A' }}</div>
                                    </div>
                                    <div class="form-container" style="padding: 15px;">
                                        <div><strong>Sueldo Base:</strong> {{ formatearNumero(detalleEmpleado.sueldoBase) }}</div>
                                        <div><strong>Comisión:</strong> {{ empleadoSeleccionado.comisionPorcentaje }}%</div>
                                        <div><strong>Servicios Realizados:</strong> {{ detalleEmpleado.totalServicios }}</div>
                                    </div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
                                    <div class="total" style="background: rgba(33, 150, 243, 0.1); border: 2px solid #2196f3;">
                                        <div style="font-size: 1.4rem; font-weight: bold; color: #2196f3;">{{ formatearNumero(detalleEmpleado.ingresosGenerados) }}</div>
                                        <div style="color: #42a5f5;">Ingresos Generados</div>
                                    </div>
                                    <div class="total" style="background: rgba(255, 152, 0, 0.1); border: 2px solid #ff9800;">
                                        <div style="font-size: 1.4rem; font-weight: bold; color: #ff9800;">{{ formatearNumero(detalleEmpleado.comisionTotal) }}</div>
                                        <div style="color: #ffa726;">Comisión</div>
                                    </div>
                                    <div class="total" style="background: rgba(76, 175, 80, 0.1); border: 2px solid #4caf50;">
                                        <div style="font-size: 1.4rem; font-weight: bold; color: #4caf50;">{{ formatearNumero(detalleEmpleado.sueldoTotal) }}</div>
                                        <div style="color: #66bb6a;">Total a Cobrar</div>
                                    </div>
                                    <div class="total" :style="'background: rgba(' + (detalleEmpleado.diferencia > 0 ? '244, 67, 54' : '76, 175, 80') + ', 0.1); border: 2px solid ' + (detalleEmpleado.diferencia > 0 ? '#f44336' : '#4caf50') + ';'">
                                        <div style="font-size: 1.4rem; font-weight: bold;" :style="'color: ' + (detalleEmpleado.diferencia > 0 ? '#f44336' : '#4caf50') + ';'">{{ formatearNumero(detalleEmpleado.diferencia) }}</div>
                                        <div :style="'color: ' + (detalleEmpleado.diferencia > 0 ? '#ef5350' : '#66bb6a') + ';'">Diferencia</div>
                                    </div>
                                </div>
                                
                                <div v-if="detalleEmpleado.serviciosRealizados.length > 0" class="form-container" style="margin-top: 20px;">
                                    <h4><i class="fas fa-cut"></i> Servicios Realizados en {{ getNombreMesActual() }}</h4>
                                    <table style="margin-top: 15px;">
                                        <thead>
                                            <tr>
                                                <th>Servicio</th>
                                                <th>Precio</th>
                                                <th>Cantidad</th>
                                                <th>Total</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="servicio in detalleEmpleado.serviciosRealizados.slice(0, 10)" :key="servicio.nombre + servicio.fecha">
                                                <td>{{ servicio.nombre }}</td>
                                                <td>{{ formatearNumero(servicio.precio) }}</td>
                                                <td>{{ servicio.cantidad }}</td>
                                                <td><strong>{{ formatearNumero(servicio.total) }}</strong></td>
                                                <td>{{ formatearFecha(servicio.fecha) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div v-else style="text-align: center; padding: 40px; color: #66bb6a;">
                                    <i class="fas fa-info-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                                    <div>No hay servicios realizados en {{ getNombreMesActual() }}</div>
                                </div>
                                
                                <div style="text-align: center; margin-top: 20px;">
                                    <button @click="exportarDetallePDF" class="btn btn-small">
                                        <i class="fas fa-file-pdf"></i> Exportar Detalle PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = `
    .filters-container {
        display: flex;
        gap: 15px;
        align-items: end;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(252, 228, 236, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1);
        border: 1px solid rgba(179, 229, 252, 0.3);
        flex-wrap: wrap;
        width: fit-content;
    }
    .filter-group {
        display: flex;
        flex-direction: column;
        min-width: fit-content;
    }
    .filter-group label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #66bb6a;
    }
    .search-bar {
        padding: 8px 12px;
        border: 2px solid #b3e5fc;
        border-radius: 12px;
        font-size: 14px;
        background: rgba(255, 255, 255, 0.95);
        color: #66bb6a;
        font-weight: 500;
        transition: all 0.3s ease;
        width: 300px;
    }
    .search-bar:focus {
        border-color: #81d4fa;
        box-shadow: 0 0 15px rgba(129, 212, 250, 0.3);
        transform: translateY(-1px);
        outline: none;
    }
`;
document.head.appendChild(style);
