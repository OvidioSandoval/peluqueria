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
            this.empleadosFiltrados = this.empleados.filter(emp => emp.activo);
            this.paginaActual = 1;
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
        
        exportarPDF() {
            if (!this.resumenMensual) {
                NotificationSystem.error('Primero debe calcular el resumen mensual');
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
                
                // Resumen general
                doc.setTextColor(0, 0, 0);
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
                y += 20;
                
                // Detalle por empleado
                doc.setFont('helvetica', 'bold');
                doc.text('DETALLE POR EMPLEADO', 20, y);
                y += 15;
                
                this.resumenMensual.empleados.forEach((empleado, index) => {
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
        <v-app>
            <v-main>
                <v-container fluid>
                    <v-row>
                        <v-col cols="12">
                            <h1 class="page-title">Panel de Empleados - {{ getNombreMesActual() }} {{ new Date().getFullYear() }}</h1>
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-btn @click="calcularResumenMensual" color="primary" class="mr-3">
                                <v-icon left>mdi-calculator</v-icon>
                                Calcular Resumen Mensual
                            </v-btn>
                            <v-btn @click="exportarPDF" color="success" class="mr-3" :disabled="!resumenMensual">
                                <v-icon left>mdi-file-pdf</v-icon>
                                Exportar PDF
                            </v-btn>
                            <v-btn @click="window.history.back()" color="secondary">
                                <v-icon left>mdi-arrow-left</v-icon>
                                Volver
                            </v-btn>
                        </v-col>
                    </v-row>
                    
                    <!-- Resumen Mensual -->
                    <v-row v-if="resumenMensual">
                        <v-col cols="12">
                            <v-card class="mb-4">
                                <v-card-title class="primary white--text">
                                    <v-icon left color="white">mdi-chart-line</v-icon>
                                    Resumen Mensual - {{ getNombreMesActual() }}
                                </v-card-title>
                                <v-card-text>
                                    <v-row>
                                        <v-col cols="12" md="4">
                                            <v-card color="success" dark>
                                                <v-card-text class="text-center">
                                                    <div class="text-h4">{{ formatearNumero(resumenMensual.totalAPagar) }}</div>
                                                    <div>Total a Pagar</div>
                                                </v-card-text>
                                            </v-card>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-card color="info" dark>
                                                <v-card-text class="text-center">
                                                    <div class="text-h4">{{ formatearNumero(resumenMensual.totalPagado) }}</div>
                                                    <div>Total Pagado</div>
                                                </v-card-text>
                                            </v-card>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-card :color="resumenMensual.totalDiferencia > 0 ? 'error' : 'success'" dark>
                                                <v-card-text class="text-center">
                                                    <div class="text-h4">{{ formatearNumero(resumenMensual.totalDiferencia) }}</div>
                                                    <div>Diferencia a Pagar</div>
                                                </v-card-text>
                                            </v-card>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <!-- Lista de Empleados -->
                    <v-row>
                        <v-col cols="12">
                            <v-card>
                                <v-card-title>
                                    <v-icon left>mdi-account-group</v-icon>
                                    Empleados Activos
                                </v-card-title>
                                <v-card-text>
                                    <v-data-table
                                        :headers="[
                                            { text: 'Nombre', value: 'nombreCompleto' },
                                            { text: 'Área', value: 'area.nombre' },
                                            { text: 'Sueldo Base', value: 'sueldoBase' },
                                            { text: 'Comisión %', value: 'comisionPorcentaje' },
                                            { text: 'Total Pagado', value: 'totalPagado' },
                                            { text: 'Acciones', value: 'actions', sortable: false }
                                        ]"
                                        :items="empleadosFiltrados"
                                        :items-per-page="itemsPorPagina"
                                        class="elevation-1"
                                    >
                                        <template v-slot:item.sueldoBase="{ item }">
                                            {{ formatearNumero(item.sueldoBase) }}
                                        </template>
                                        <template v-slot:item.comisionPorcentaje="{ item }">
                                            {{ item.comisionPorcentaje }}%
                                        </template>
                                        <template v-slot:item.totalPagado="{ item }">
                                            {{ formatearNumero(item.totalPagado || 0) }}
                                        </template>
                                        <template v-slot:item.actions="{ item }">
                                            <v-btn @click="seleccionarEmpleado(item)" color="primary" small>
                                                <v-icon left>mdi-eye</v-icon>
                                                Ver Detalle
                                            </v-btn>
                                        </template>
                                    </v-data-table>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <!-- Modal Detalle Empleado -->
                    <v-dialog v-model="mostrarDetalle" max-width="900px" persistent>
                        <v-card v-if="empleadoSeleccionado">
                            <v-card-title class="primary white--text">
                                <v-icon left color="white">mdi-account</v-icon>
                                {{ empleadoSeleccionado.nombreCompleto }}
                                <v-spacer></v-spacer>
                                <v-btn @click="cerrarDetalle" icon color="white">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </v-card-title>
                            
                            <v-card-text v-if="cargandoDetalle" class="text-center py-8">
                                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                                <div class="mt-4">Calculando detalle...</div>
                            </v-card-text>
                            
                            <v-card-text v-else-if="detalleEmpleado" class="pa-6">
                                <!-- Información del Empleado -->
                                <v-row class="mb-4">
                                    <v-col cols="12" md="6">
                                        <v-card color="grey lighten-4">
                                            <v-card-text>
                                                <div><strong>Área:</strong> {{ empleadoSeleccionado.area ? empleadoSeleccionado.area.nombre : 'N/A' }}</div>
                                                <div><strong>Correo:</strong> {{ empleadoSeleccionado.correo || 'N/A' }}</div>
                                                <div><strong>Teléfono:</strong> {{ empleadoSeleccionado.telefono || 'N/A' }}</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-card color="grey lighten-4">
                                            <v-card-text>
                                                <div><strong>Sueldo Base:</strong> {{ formatearNumero(detalleEmpleado.sueldoBase) }}</div>
                                                <div><strong>Comisión:</strong> {{ empleadoSeleccionado.comisionPorcentaje }}%</div>
                                                <div><strong>Servicios Realizados:</strong> {{ detalleEmpleado.totalServicios }}</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                                
                                <!-- Resumen Financiero -->
                                <v-row class="mb-4">
                                    <v-col cols="12" md="3">
                                        <v-card color="info" dark>
                                            <v-card-text class="text-center">
                                                <div class="text-h6">{{ formatearNumero(detalleEmpleado.ingresosGenerados) }}</div>
                                                <div class="caption">Ingresos Generados</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12" md="3">
                                        <v-card color="warning" dark>
                                            <v-card-text class="text-center">
                                                <div class="text-h6">{{ formatearNumero(detalleEmpleado.comisionTotal) }}</div>
                                                <div class="caption">Comisión</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12" md="3">
                                        <v-card color="success" dark>
                                            <v-card-text class="text-center">
                                                <div class="text-h6">{{ formatearNumero(detalleEmpleado.sueldoTotal) }}</div>
                                                <div class="caption">Total a Cobrar</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12" md="3">
                                        <v-card :color="detalleEmpleado.diferencia > 0 ? 'error' : 'success'" dark>
                                            <v-card-text class="text-center">
                                                <div class="text-h6">{{ formatearNumero(detalleEmpleado.diferencia) }}</div>
                                                <div class="caption">Diferencia</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                                
                                <!-- Servicios Realizados -->
                                <v-card v-if="detalleEmpleado.serviciosRealizados.length > 0">
                                    <v-card-title>Servicios Realizados en {{ getNombreMesActual() }}</v-card-title>
                                    <v-card-text>
                                        <v-data-table
                                            :headers="[
                                                { text: 'Servicio', value: 'nombre' },
                                                { text: 'Precio', value: 'precio' },
                                                { text: 'Cantidad', value: 'cantidad' },
                                                { text: 'Total', value: 'total' },
                                                { text: 'Fecha', value: 'fecha' }
                                            ]"
                                            :items="detalleEmpleado.serviciosRealizados"
                                            :items-per-page="5"
                                            class="elevation-1"
                                        >
                                            <template v-slot:item.precio="{ item }">
                                                {{ formatearNumero(item.precio) }}
                                            </template>
                                            <template v-slot:item.total="{ item }">
                                                <strong>{{ formatearNumero(item.total) }}</strong>
                                            </template>
                                            <template v-slot:item.fecha="{ item }">
                                                {{ formatearFecha(item.fecha) }}
                                            </template>
                                        </v-data-table>
                                    </v-card-text>
                                </v-card>
                                
                                <div v-else class="text-center py-4">
                                    <v-icon size="64" color="grey">mdi-information</v-icon>
                                    <div class="mt-2">No hay servicios realizados en {{ getNombreMesActual() }}</div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-dialog>
                </v-container>
            </v-main>
        </v-app>
    `
});
