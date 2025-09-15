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
            areas: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoEmpleado: {
                id: null,
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                totalPagado: 0,
                sueldoTotal: 0,
                diferencia: 0,
                activo: true,
                fechaIngreso: new Date().toISOString().split('T')[0]
            },
            intervalId: null,
            mostrarSalir: false,
            mostrarReporte: false,
            empleadoReporte: null,
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: new Date().toISOString().split('T')[0],
            reporteData: null,
            cargandoReporte: false,
            mostrarPagos: false,
            pagosData: null,
        };
    },
    mounted() {
        this.fetchEmpleados();
        this.fetchAreas();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
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
        calcularSueldoTotal(empleado) {
            const comision = empleado.sueldoBase * (empleado.comisionPorcentaje / 100);
            return empleado.sueldoBase + comision;
        },
        
        calcularDiferencia(empleado) {
            const sueldoTotal = this.calcularSueldoTotal(empleado);
            return sueldoTotal - (empleado.totalPagado || 0);
        },
        
        async fetchEmpleados() {
            try {
                const response = await fetch(config.apiBaseUrl + '/empleados');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.empleados = await response.json();
                
                for (let empleado of this.empleados) {
                    empleado.sueldoMensual = this.calcularSueldoTotal(empleado);
                    empleado.diferenciaPago = this.calcularDiferencia(empleado);
                }
                
                this.filtrarEmpleados();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error('Error al cargar los empleados: ' + error.message);
            }
        },
        
        async fetchAreas() {
            try {
                const response = await fetch(config.apiBaseUrl + '/areas');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.areas = await response.json();
            } catch (error) {
                console.error('Error al cargar areas:', error);
                NotificationSystem.error('Error al cargar las areas: ' + error.message);
            }
        },
        
        filtrarEmpleados() {
            if (this.filtroBusqueda.trim() === '') {
                this.empleadosFiltrados = this.empleados;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.empleadosFiltrados = this.empleados.filter(empleado =>
                    empleado.nombreCompleto.toLowerCase().includes(busqueda) ||
                    empleado.correo.toLowerCase().includes(busqueda) ||
                    empleado.telefono.includes(busqueda)
                );
            }
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtrarEmpleados();
        },
        
        validarEmail(email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        },
        
        async agregarEmpleado() {
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electronico no es valido');
                return;
            }
            try {
                const empleadoData = {
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    correo: this.nuevoEmpleado.correo,
                    telefono: this.nuevoEmpleado.telefono,
                    area: this.nuevoEmpleado.area,
                    sueldoBase: parseInt(this.nuevoEmpleado.sueldoBase) || 0,
                    comisionPorcentaje: parseInt(this.nuevoEmpleado.comisionPorcentaje) || 0,
                    totalPagado: parseInt(this.nuevoEmpleado.totalPagado) || 0,
                    activo: this.nuevoEmpleado.activo,
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0]
                };
                
                const response = await fetch(config.apiBaseUrl + '/empleados/agregar_empleado', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    await this.fetchEmpleados();
                    this.toggleFormulario();
                    NotificationSystem.success('Empleado agregado exitosamente');
                } else {
                    throw new Error('Error ' + response.status + ': ' + response.statusText);
                }
            } catch (error) {
                console.error('Error al agregar empleado:', error);
                NotificationSystem.error('Error al agregar empleado: ' + error.message);
            }
        },
        
        async modificarEmpleado() {
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electronico no es valido');
                return;
            }
            try {
                const empleadoData = {
                    id: this.nuevoEmpleado.id,
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    correo: this.nuevoEmpleado.correo,
                    telefono: this.nuevoEmpleado.telefono,
                    area: this.nuevoEmpleado.area,
                    sueldoBase: parseInt(this.nuevoEmpleado.sueldoBase) || 0,
                    comisionPorcentaje: parseInt(this.nuevoEmpleado.comisionPorcentaje) || 0,
                    totalPagado: parseInt(this.nuevoEmpleado.totalPagado) || 0,
                    activo: this.nuevoEmpleado.activo,
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso
                };
                
                const response = await fetch(config.apiBaseUrl + '/empleados/actualizar_empleado/' + this.nuevoEmpleado.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleadoData)
                });
                if (response.ok) {
                    await this.fetchEmpleados();
                    this.toggleFormulario();
                    NotificationSystem.success('Empleado actualizado exitosamente');
                } else {
                    throw new Error('Error ' + response.status + ': ' + response.statusText);
                }
            } catch (error) {
                console.error('Error al modificar empleado:', error);
                NotificationSystem.error('Error al modificar empleado: ' + error.message);
            }
        },
        
        async eliminarEmpleado(empleado) {
            NotificationSystem.confirm('Eliminar empleado "' + empleado.nombreCompleto + '"?', async () => {
                try {
                    await fetch(config.apiBaseUrl + '/empleados/eliminar_empleado/' + empleado.id, {
                        method: 'DELETE'
                    });
                    await this.fetchEmpleados();
                    NotificationSystem.success('Empleado eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar empleado:', error);
                    NotificationSystem.error('Error al eliminar empleado');
                }
            });
        },
        
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            if (!this.formularioVisible) {
                this.nuevoEmpleado = {
                    id: null,
                    nombreCompleto: '',
                    correo: '',
                    telefono: '',
                    area: null,
                    sueldoBase: 0,
                    comisionPorcentaje: 0,
                    totalPagado: 0,
                    sueldoTotal: 0,
                    diferencia: 0,
                    activo: true,
                    fechaIngreso: new Date().toISOString().split('T')[0]
                };
            }
        },
        
        cargarEmpleado(empleado) {
            this.nuevoEmpleado = { ...empleado };
            this.formularioVisible = true;
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
        
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchEmpleados();
            }, 300000);
        },
        
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        
        async generarReporte(empleado) {
            console.log('Generando reporte para:', empleado.nombreCompleto);
            this.empleadoReporte = empleado;
            this.mostrarReporte = true;
            this.reporteData = null;
            await this.cargarReporteEmpleado();
        },
        
        async cargarReporteEmpleado() {
            if (!this.empleadoReporte) {
                console.error('No hay empleado seleccionado para el reporte');
                return;
            }
            
            try {
                this.cargandoReporte = true;
                console.log('Cargando reporte para empleado:', this.empleadoReporte.nombreCompleto);
                console.log('Periodo:', this.fechaInicio, 'al', this.fechaFin);
                
                const ventasResponse = await fetch(config.apiBaseUrl + '/ventas');
                const detalleVentasResponse = await fetch(config.apiBaseUrl + '/detalle-ventas');
                
                if (!ventasResponse.ok || !detalleVentasResponse.ok) {
                    throw new Error('Error al cargar datos: ' + ventasResponse.status + '/' + detalleVentasResponse.status);
                }
                
                const ventas = await ventasResponse.json();
                const detalleVentas = await detalleVentasResponse.json();
                
                console.log('Ventas totales:', ventas.length);
                console.log('Detalles totales:', detalleVentas.length);
                
                const ventasFiltradas = ventas.filter(venta => 
                    venta.empleado && venta.empleado.id === this.empleadoReporte.id &&
                    venta.fechaVenta >= this.fechaInicio && venta.fechaVenta <= this.fechaFin
                );
                
                console.log('Ventas filtradas:', ventasFiltradas.length);
                
                let serviciosRealizados = [];
                let ingresosGenerados = 0;
                let comisionTotal = 0;
                
                for (const venta of ventasFiltradas) {
                    const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    
                    for (const detalle of detalles) {
                        if (detalle.servicio) {
                            serviciosRealizados.push({
                                nombre: detalle.servicio.nombre,
                                precio: detalle.precioUnitarioNeto,
                                cantidad: detalle.cantidad,
                                total: detalle.precioUnitarioNeto * detalle.cantidad,
                                fecha: venta.fechaVenta
                            });
                        }
                    }
                    
                    const ingresoVenta = detalles.reduce((sum, detalle) => sum + (detalle.precioUnitarioNeto * detalle.cantidad), 0);
                    ingresosGenerados += ingresoVenta;
                    comisionTotal += ingresoVenta * (this.empleadoReporte.comisionPorcentaje / 100);
                }
                
                this.reporteData = {
                    serviciosRealizados,
                    totalServicios: serviciosRealizados.length,
                    ingresosGenerados,
                    comisionTotal,
                    salarioTotal: this.empleadoReporte.sueldoBase + comisionTotal,
                    pagado: this.empleadoReporte.totalPagado || 0,
                    diferencia: (this.empleadoReporte.sueldoBase + comisionTotal) - (this.empleadoReporte.totalPagado || 0),
                    ventasFiltradas
                };
                
                console.log('Reporte generado:', this.reporteData);
                
            } catch (error) {
                console.error('Error generando reporte:', error);
                NotificationSystem.error('Error al generar el reporte: ' + error.message);
            } finally {
                this.cargandoReporte = false;
            }
        },
        
        cerrarReporte() {
            this.mostrarReporte = false;
            this.empleadoReporte = null;
            this.reporteData = null;
        },
        
        exportarPDF() {
            if (!this.reporteData || !this.empleadoReporte) {
                NotificationSystem.error('No hay datos para exportar');
                return;
            }
            
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFontSize(16);
                doc.text('Reporte de Empleado', 20, 20);
                doc.setFontSize(12);
                doc.text('Empleado: ' + this.empleadoReporte.nombreCompleto, 20, 35);
                doc.text('Periodo: ' + this.fechaInicio + ' al ' + this.fechaFin, 20, 45);
                
                doc.text('Servicios Realizados: ' + this.reporteData.totalServicios, 20, 60);
                doc.text('Ingresos Generados: $' + this.formatearNumero(this.reporteData.ingresosGenerados), 20, 70);
                doc.text('Comision (' + this.empleadoReporte.comisionPorcentaje + '%): $' + this.formatearNumero(this.reporteData.comisionTotal), 20, 80);
                doc.text('Sueldo Base: $' + this.formatearNumero(this.empleadoReporte.sueldoBase), 20, 90);
                doc.text('Total a Cobrar: $' + this.formatearNumero(this.reporteData.salarioTotal), 20, 100);
                doc.text('Ya Pagado: $' + this.formatearNumero(this.reporteData.pagado || 0), 20, 110);
                doc.text('Diferencia a Pagar: $' + this.formatearNumero(this.reporteData.diferencia || 0), 20, 120);
                
                const fecha = new Date().toISOString().split('T')[0];
                const nombreArchivo = 'reporte_' + this.empleadoReporte.nombreCompleto.replace(/\s+/g, '_') + '_' + fecha + '.pdf';
                doc.save(nombreArchivo);
                NotificationSystem.success('Reporte PDF exportado exitosamente');
            } catch (error) {
                console.error('Error al exportar PDF:', error);
                NotificationSystem.error('Error al exportar PDF: ' + error.message);
            }
        },
        
        async mostrarPagosEmpleados() {
            this.mostrarPagos = true;
            await this.cargarPagosEmpleados();
        },
        
        async cargarPagosEmpleados() {
            try {
                const empleadosConPagos = [];
                for (const empleado of this.empleados) {
                    empleadosConPagos.push({
                        ...empleado,
                        sueldoTotal: this.calcularSueldoTotal(empleado),
                        pagado: empleado.totalPagado || 0,
                        diferencia: this.calcularDiferencia(empleado)
                    });
                }
                
                this.pagosData = {
                    empleados: empleadosConPagos,
                    totalAPagar: empleadosConPagos.reduce((sum, emp) => sum + emp.sueldoTotal, 0),
                    totalPagado: empleadosConPagos.reduce((sum, emp) => sum + emp.pagado, 0),
                    totalDiferencia: empleadosConPagos.reduce((sum, emp) => sum + emp.diferencia, 0)
                };
            } catch (error) {
                console.error('Error cargando pagos:', error);
                NotificationSystem.error('Error al cargar datos de pagos');
            }
        },
        
        cerrarPagos() {
            this.mostrarPagos = false;
            this.pagosData = null;
        }
    },
    template: `
        <div class="glass-container">
            <div>
                <h1 style="text-align: center; margin-top: 90px; margin-bottom: 20px; color: #5d4037; font-weight: 800;">Gestión de Empleados</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Empleado:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarEmpleados" placeholder="Buscar empleado..." class="search-bar"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar Filtros</button>
                    </div>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nuevo Empleado</button>
                    <button @click="mostrarPagosEmpleados()" class="btn" style="background: #28a745; margin-left: 10px;">Resumen de Pagos</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoEmpleado.id ? "Modificar Empleado: " + nuevoEmpleado.nombreCompleto : "Agregar Empleado" }}</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Nombre Completo *</label>
                                <input type="text" v-model="nuevoEmpleado.nombreCompleto" required/>
                            </div>
                            <div class="form-field">
                                <label>Correo Electronico</label>
                                <input type="email" v-model="nuevoEmpleado.correo"/>
                            </div>
                            <div class="form-field">
                                <label>Telefono</label>
                                <input type="tel" v-model="nuevoEmpleado.telefono"/>
                            </div>
                            <div class="form-field">
                                <label>Area *</label>
                                <select v-model="nuevoEmpleado.area" required>
                                    <option value="" disabled>Seleccionar Area</option>
                                    <option v-for="area in areas" :key="area.id" :value="area">{{ area.nombre }}</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Sueldo Base</label>
                                <input type="number" v-model="nuevoEmpleado.sueldoBase" min="0"/>
                            </div>
                            <div class="form-field">
                                <label>Comision %</label>
                                <input type="number" v-model="nuevoEmpleado.comisionPorcentaje" min="0" max="100"/>
                            </div>
                            <div class="form-field">
                                <label>Total Pagado</label>
                                <input type="number" v-model="nuevoEmpleado.totalPagado" min="0"/>
                            </div>
                            <div class="form-field">
                                <label>Sueldo Total (Calculado)</label>
                                <input type="number" :value="calcularSueldoTotal(nuevoEmpleado)" readonly style="background: #f5f5f5;"/>
                            </div>
                            <div class="form-field">
                                <label>Diferencia (Calculada)</label>
                                <input type="number" :value="calcularDiferencia(nuevoEmpleado)" readonly style="background: #f5f5f5;"/>
                            </div>
                            <div class="form-field">
                                <label>Fecha de Ingreso</label>
                                <input type="date" v-model="nuevoEmpleado.fechaIngreso"/>
                            </div>
                            <div class="form-field">
                                <label style="display: flex; align-items: center; margin: 0; padding: 0; white-space: nowrap;">Activo:
                                    <input type="checkbox" v-model="nuevoEmpleado.activo" style="margin: 0; padding: 0; margin-left: 1px;"/>
                                </label>
                            </div>
                        </div>
                        <div class="form-buttons" style="margin-top: 15px;">
                            <button @click="nuevoEmpleado.id ? modificarEmpleado() : agregarEmpleado()" class="btn">{{ nuevoEmpleado.id ? "Confirmar" : "Agregar" }}</button>
                            <button @click="toggleFormulario()" class="btn" style="background: #6c757d !important;">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Area</th>
                                <th>Sueldo Base</th>
                                <th>Comision %</th>
                                <th>Sueldo Total</th>
                                <th>Total Pagado</th>
                                <th>Diferencia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="empleado in empleadosPaginados" :key="empleado.id">
                                <td>{{ empleado.id }}</td>
                                <td>{{ empleado.nombreCompleto }}</td>
                                <td>{{ empleado.area ? empleado.area.nombre : "N/A" }}</td>
                                <td>{{ formatearNumero(empleado.sueldoBase) }}</td>
                                <td>{{ empleado.comisionPorcentaje }}%</td>
                                <td style="font-weight: bold; color: #28a745;">{{ formatearNumero(empleado.sueldoMensual || empleado.sueldoBase) }}</td>
                                <td style="color: #007bff;">{{ formatearNumero(empleado.totalPagado || 0) }}</td>
                                <td style="font-weight: bold;" :style="{ color: (empleado.diferenciaPago || 0) > 0 ? '#dc3545' : '#28a745' }">{{ formatearNumero(empleado.diferenciaPago || 0) }}</td>
                                <td><span :class="empleado.activo ? 'status-active' : 'status-inactive'">{{ empleado.activo ? "Activo" : "Inactivo" }}</span></td>
                                <td>
                                    <button @click="cargarEmpleado(empleado)" class="btn-small">Editar</button>
                                    <button @click="generarReporte(empleado)" class="btn-small" style="background: #17a2b8;">Reporte</button>
                                    <button @click="eliminarEmpleado(empleado)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Pagina {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                </main>
            </div>
            
            <!-- Modal de Reporte -->
            <div v-if="mostrarReporte" class="modal-overlay" @click.self="cerrarReporte()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Reporte de {{ empleadoReporte ? empleadoReporte.nombreCompleto : "" }}</h3>
                        <button @click="cerrarReporte()" class="btn-close">×</button>
                    </div>
                    
                    <div class="filtros-reporte">
                        <div class="fecha-input">
                            <label>Fecha Inicio:</label>
                            <input type="date" v-model="fechaInicio">
                        </div>
                        <div class="fecha-input">
                            <label>Fecha Fin:</label>
                            <input type="date" v-model="fechaFin">
                        </div>
                        <button @click="cargarReporteEmpleado()" class="btn btn-filtrar">Filtrar</button>
                        <button @click="exportarPDF()" class="btn btn-pdf" :disabled="!reporteData">Exportar PDF</button>
                    </div>
                    
                    <div v-if="cargandoReporte" class="loading">
                        <div class="spinner"></div>
                        <p>Cargando reporte...</p>
                    </div>
                    
                    <div v-else-if="reporteData" class="reporte-contenido">
                        <div class="resumen-empleado">
                            <div class="stat-card">
                                <div class="stat-number">{{ reporteData.totalServicios }}</div>
                                <div class="stat-label">Servicios</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{{ formatearNumero(reporteData.ingresosGenerados) }}</div>
                                <div class="stat-label">Ingresos</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{{ formatearNumero(reporteData.comisionTotal) }}</div>
                                <div class="stat-label">Comision</div>
                            </div>
                            <div class="stat-card total">
                                <div class="stat-number">{{ formatearNumero(reporteData.salarioTotal) }}</div>
                                <div class="stat-label">Total a Cobrar</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{{ formatearNumero(reporteData.pagado || 0) }}</div>
                                <div class="stat-label">Ya Pagado</div>
                            </div>
                            <div class="stat-card diferencia">
                                <div class="stat-number">{{ formatearNumero(reporteData.diferencia || 0) }}</div>
                                <div class="stat-label">Diferencia a Pagar</div>
                            </div>
                        </div>
                        
                        <div class="detalle-empleado">
                            <h4>Informacion del Empleado</h4>
                            <div class="info-grid">
                                <div><strong>Sueldo Base:</strong> {{ formatearNumero(empleadoReporte.sueldoBase) }}</div>
                                <div><strong>Comision:</strong> {{ empleadoReporte.comisionPorcentaje }}%</div>
                                <div><strong>Area:</strong> {{ empleadoReporte.area ? empleadoReporte.area.nombre : "N/A" }}</div>
                            </div>
                        </div>
                        
                        <div v-if="reporteData.serviciosRealizados.length > 0" class="servicios-detalle">
                            <h4>Servicios Realizados</h4>
                            <table class="servicios-tabla">
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
                                    <tr v-for="(servicio, index) in reporteData.serviciosRealizados" :key="index">
                                        <td>{{ servicio.nombre }}</td>
                                        <td>{{ formatearNumero(servicio.precio) }}</td>
                                        <td>{{ servicio.cantidad }}</td>
                                        <td style="font-weight: bold;">{{ formatearNumero(servicio.total) }}</td>
                                        <td>{{ servicio.fecha }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div v-else class="no-data">
                        <p>No hay datos para mostrar en el periodo seleccionado.</p>
                    </div>
                </div>
            </div>
            
            <!-- Modal de Resumen de Pagos -->
            <div v-if="mostrarPagos" class="modal-overlay" @click.self="cerrarPagos()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Resumen de Pagos del Mes</h3>
                        <button @click="cerrarPagos()" class="btn-close">×</button>
                    </div>
                    
                    <div v-if="pagosData" class="pagos-contenido">
                        <div class="resumen-general">
                            <div class="stat-card">
                                <div class="stat-number">{{ formatearNumero(pagosData.totalAPagar) }}</div>
                                <div class="stat-label">Total a Pagar</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{{ formatearNumero(pagosData.totalPagado) }}</div>
                                <div class="stat-label">Total Pagado</div>
                            </div>
                            <div class="stat-card diferencia">
                                <div class="stat-number">{{ formatearNumero(pagosData.totalDiferencia) }}</div>
                                <div class="stat-label">Total Diferencia</div>
                            </div>
                        </div>
                        
                        <div class="tabla-pagos">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Sueldo Base</th>
                                        <th>Comisión</th>
                                        <th>Total a Cobrar</th>
                                        <th>Ya Pagado</th>
                                        <th>Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="empleado in pagosData.empleados" :key="empleado.id">
                                        <td>{{ empleado.nombreCompleto }}</td>
                                        <td>{{ formatearNumero(empleado.sueldoBase) }}</td>
                                        <td>{{ formatearNumero(empleado.sueldoTotal - empleado.sueldoBase) }}</td>
                                        <td style="font-weight: bold;">{{ formatearNumero(empleado.sueldoTotal) }}</td>
                                        <td style="color: #007bff;">{{ formatearNumero(empleado.pagado) }}</td>
                                        <td style="font-weight: bold;" :style="{ color: empleado.diferencia > 0 ? '#dc3545' : '#28a745' }">{{ formatearNumero(empleado.diferencia) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = `
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field label { font-weight: bold; color: #333; font-size: 14px; }
.form-field input, .form-field select { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.status-active { color: #28a745; font-weight: bold; }
.status-inactive { color: #dc3545; font-weight: bold; }

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 0;
    max-width: 900px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    border-bottom: 1px solid #eee;
    background: #f8f9fa;
    border-radius: 12px 12px 0 0;
}

.modal-header h3 {
    margin: 0;
    color: #5d4037;
    font-size: 1.5em;
}

.btn-close {
    background: #dc3545;
    color: white;
    border: none;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.btn-close:hover {
    background: #c82333;
    transform: scale(1.1);
}

.filtros-reporte {
    display: flex;
    gap: 15px;
    padding: 20px 30px;
    background: #f8f9fa;
    align-items: end;
    flex-wrap: wrap;
}

.fecha-input {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.fecha-input label {
    font-weight: bold;
    color: #333;
    font-size: 14px;
}

.fecha-input input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
}

.btn-filtrar {
    background: #007bff !important;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.btn-filtrar:hover {
    background: #0056b3 !important;
}

.btn-pdf {
    background: #dc3545 !important;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.btn-pdf:hover:not(:disabled) {
    background: #c82333 !important;
}

.btn-pdf:disabled {
    background: #6c757d !important;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 60px 30px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #5d4037;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.reporte-contenido {
    padding: 30px;
}

.resumen-empleado {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 10px;
    text-align: center;
    border: 2px solid transparent;
    transition: all 0.3s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.stat-card.total {
    background: #5d4037;
    color: white;
}

.stat-card.diferencia {
    background: #dc3545;
    color: white;
}

.stat-card.diferencia .stat-label {
    color: rgba(255,255,255,0.9);
}

.stat-number {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 8px;
}

.stat-card:nth-child(1) .stat-number { color: #007bff; }
.stat-card:nth-child(2) .stat-number { color: #28a745; }
.stat-card:nth-child(3) .stat-number { color: #ffc107; }
.stat-card:nth-child(5) .stat-number { color: #007bff; }

.stat-label {
    color: #666;
    font-size: 14px;
    font-weight: 500;
}

.stat-card.total .stat-label {
    color: rgba(255,255,255,0.9);
}

.detalle-empleado {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.detalle-empleado h4 {
    margin: 0 0 15px 0;
    color: #5d4037;
    font-size: 1.2em;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.info-grid div {
    padding: 10px;
    background: white;
    border-radius: 6px;
    border-left: 4px solid #5d4037;
}

.no-data {
    text-align: center;
    padding: 60px 30px;
    color: #666;
}

.no-data p {
    font-size: 16px;
    margin: 0;
}

.pagos-contenido {
    padding: 30px;
}

.resumen-general {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.tabla-pagos {
    overflow-x: auto;
}

.tabla-pagos table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.tabla-pagos th,
.tabla-pagos td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.tabla-pagos th {
    background-color: #f8f9fa;
    font-weight: bold;
    color: #5d4037;
}

.tabla-pagos tr:hover {
    background-color: #f8f9fa;
}

.servicios-detalle {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.servicios-detalle h4 {
    margin: 0 0 15px 0;
    color: #5d4037;
    font-size: 1.2em;
}

.servicios-tabla {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

.servicios-tabla th,
.servicios-tabla td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.servicios-tabla th {
    background-color: #5d4037;
    color: white;
    font-weight: bold;
}

.servicios-tabla tr:hover {
    background-color: #f5f5f5;
}
`;
document.head.appendChild(style);
