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
            cajas: [],
            cajasFiltradas: [],

            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaCaja: { 
                id: null, 
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                horaCierre: null,
                montoInicial: null,
                montoFinal: null,
                totalServicios: 0,
                totalProductos: 0,
                totalDescuentos: 0,
                estado: 'abierto',
                empleadoId: null
            },
            empleados: [],
            cajaSeleccionada: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchCajas();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.cajasFiltradas.length / this.itemsPorPagina);
        },
        cajasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.cajasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalServicios() {
            return this.cajasFiltradas.reduce((sum, caja) => sum + (caja.totalServicios || 0), 0);
        },
        totalProductos() {
            return this.cajasFiltradas.reduce((sum, caja) => sum + (caja.totalProductos || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/cajas';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/panel-control';
            }
        },
        async fetchCajas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/cajas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                const cajas = await response.json();
                // Ensure employee data is properly loaded
                this.cajas = cajas.map(caja => ({
                    ...caja,
                    empleado: caja.empleado || null
                }));
                this.filtrarCajas();
            } catch (error) {
                console.error('Error al cargar cajas:', error);
                NotificationSystem.error(`Error al cargar las cajas: ${error.message}`);
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
            }
        },
        filtrarCajas() {
            this.cajasFiltradas = [...this.cajas];
        },
        async agregarCaja() {
            if (!this.nuevaCaja.nombre || !this.nuevaCaja.montoInicial) {
                NotificationSystem.error('Nombre de caja y monto inicial son requeridos');
                return;
            }
            try {
                const cajaData = {
                    ...this.nuevaCaja,
                    nombre: this.capitalizarTexto(this.nuevaCaja.nombre),
                    estado: this.capitalizarTexto(this.nuevaCaja.estado),
                    empleado: this.nuevaCaja.empleadoId ? { id: this.nuevaCaja.empleadoId } : null
                };
                delete cajaData.empleadoId;
                const response = await fetch(`${config.apiBaseUrl}/cajas/agregar_caja`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cajaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCajas();
                    NotificationSystem.success('Caja agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar caja:', error);
                NotificationSystem.error(`Error al agregar caja: ${error.message}`);
            }
        },
        async modificarCaja() {
            if (!this.nuevaCaja.nombre || !this.nuevaCaja.montoInicial) {
                NotificationSystem.error('Nombre de caja y monto inicial son requeridos');
                return;
            }
            try {
                await this.calcularTotales();
                const cajaData = {
                    ...this.nuevaCaja,
                    nombre: this.capitalizarTexto(this.nuevaCaja.nombre),
                    estado: this.capitalizarTexto(this.nuevaCaja.estado),
                    empleado: this.nuevaCaja.empleadoId ? { id: this.nuevaCaja.empleadoId } : null
                };
                delete cajaData.empleadoId;
                const response = await fetch(`${config.apiBaseUrl}/cajas/actualizar_caja/${this.nuevaCaja.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cajaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCajas();
                    NotificationSystem.success('Caja actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar caja:', error);
                NotificationSystem.error(`Error al modificar caja: ${error.message}`);
            }
        },
        async eliminarCaja(caja) {
            NotificationSystem.confirm(`¿Eliminar caja "${caja.nombre}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/cajas/eliminar_caja/${caja.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchCajas();
                        NotificationSystem.success('Caja eliminada exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar caja:', error);
                    NotificationSystem.error(`Error al eliminar caja: ${error.message}`);
                }
            });
        },
        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaCaja = { 
                id: null, 
                nombre: '',
                fecha: new Date().toISOString().split('T')[0],
                horaApertura: new Date().toTimeString().substring(0, 8),
                horaCierre: null,
                montoInicial: null,
                montoFinal: null,
                totalServicios: 0,
                totalProductos: 0,
                totalDescuentos: 0,
                estado: 'abierto',
                empleadoId: null
            };
            this.cajaSeleccionada = '';
            if (!this.formularioVisible) {
                await this.fetchCajas();
            }
        },
        async cargarCaja(caja) {
            this.nuevaCaja = {
                id: caja.id,
                nombre: caja.nombre || '',
                fecha: caja.fecha || new Date().toISOString().split('T')[0],
                horaApertura: caja.horaApertura || new Date().toTimeString().substring(0, 8),
                horaCierre: caja.horaCierre || null,
                montoInicial: caja.montoInicial || null,
                montoFinal: caja.montoFinal || null,
                totalServicios: caja.totalServicios || 0,
                totalProductos: caja.totalProductos || 0,
                totalDescuentos: caja.totalDescuentos || 0,
                estado: caja.estado || 'abierto',
                empleadoId: caja.empleado ? caja.empleado.id : null
            };
            await this.calcularTotales();
            this.formularioVisible = true;
            this.cajaSeleccionada = caja.nombre || `Caja ${caja.id}`;
        },
        getEmpleadoName(caja) {
            return caja.empleado ? caja.empleado.nombreCompleto : '-';
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        },
        onEstadoChange() {
            if (this.nuevaCaja.estado === 'cerrado' && !this.nuevaCaja.horaCierre) {
                this.nuevaCaja.horaCierre = new Date().toTimeString().substring(0, 8);
            }
        },
        async calcularTotales() {
            if (!this.nuevaCaja.id) return;
            try {
                const [detalleVentaRes, ventasRes, movimientosRes] = await Promise.all([
                    fetch(`${config.apiBaseUrl}/detalle-venta`),
                    fetch(`${config.apiBaseUrl}/ventas`),
                    fetch(`${config.apiBaseUrl}/movimientos-caja`)
                ]);
                const detalleVentas = await detalleVentaRes.json();
                const ventas = await ventasRes.json();
                const movimientos = await movimientosRes.json();
                
                const fechaCaja = this.nuevaCaja.fecha;
                const ventasDelDia = ventas.filter(venta => 
                    venta.fechaVenta && venta.fechaVenta.startsWith(fechaCaja)
                );
                const ventasIds = ventasDelDia.map(venta => venta.id);
                
                const detallesDelDia = detalleVentas.filter(detalle => 
                    ventasIds.includes(detalle.venta?.id)
                );
                
                this.nuevaCaja.totalServicios = detallesDelDia
                    .filter(detalle => detalle.servicio)
                    .reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario || 0), 0);
                    
                this.nuevaCaja.totalProductos = detallesDelDia
                    .filter(detalle => detalle.producto)
                    .reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario || 0), 0);
                    
                this.nuevaCaja.totalDescuentos = ventasDelDia.reduce((sum, venta) => sum + (venta.descuentoAplicado || 0), 0);
                
                // Calcular monto final
                const montoTotal = this.nuevaCaja.totalServicios + this.nuevaCaja.totalProductos;
                const movimientosDelDia = movimientos.filter(mov => 
                    mov.fecha && mov.fecha.startsWith(fechaCaja) && mov.cajaId === this.nuevaCaja.id
                );
                const totalMovimientos = movimientosDelDia.reduce((sum, mov) => {
                    return mov.tipo === 'ingreso' ? sum + mov.monto : sum - mov.monto;
                }, 0);
                
                this.nuevaCaja.montoFinal = this.nuevaCaja.montoInicial + montoTotal + totalMovimientos;
            } catch (error) {
                console.error('Error al calcular totales:', error);
            }
        },
        formatearHora(hora) {
            if (!hora) return '-';
            if (Array.isArray(hora)) {
                const [h, m, s] = hora;
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`;
            }
            const horaStr = hora.toString().trim();
            if (horaStr.includes(':')) {
                const parts = horaStr.split(':');
                const hh = parts[0].padStart(2, '0');
                const mm = (parts[1] || '00').padStart(2, '0');
                const ss = (parts[2] || '00').padStart(2, '0');
                return `${hh}:${mm}:${ss}`;
            }
            return horaStr;
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchCajas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirCajas() {
            window.location.href = '/web/cajas';
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
        

        
        exportarPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.text('Reporte de Cajas', 20, 20);
            doc.setFontSize(10);
            doc.text('Fecha: ' + new Date().toLocaleDateString('es-ES'), 20, 30);
            
            const headers = [['ID', 'Nombre', 'Fecha', 'Empleado', 'Apertura', 'Cierre', 'M. Inicial', 'Estado']];
            const data = this.cajasFiltradas.map(caja => [
                caja.id,
                caja.nombre || 'Sin nombre',
                this.formatearFecha(caja.fecha),
                this.getEmpleadoName(caja),
                this.formatearHora(caja.horaApertura),
                this.formatearHora(caja.horaCierre),
                this.formatearNumero(caja.montoInicial || 0),
                caja.estado
            ]);
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [93, 64, 55] }
            });
            
            const fecha = new Date().toISOString().split('T')[0];
            doc.save('cajas_' + fecha + '.pdf');
            NotificationSystem.success('Archivo PDF exportado exitosamente');
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <style>
                    .filters-container { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
                    .filter-field { display: flex; flex-direction: column; min-width: 200px; }
                    .filter-field label { margin-bottom: 5px; font-weight: bold; }
                    .badge-abierto { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .badge-cerrado { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .btn-secondary { background: #6c757d !important; color: white !important; }
                    .btn-secondary:hover { background: #5a6268 !important; }
                </style>
                <h1 class="page-title">Gestión de Cajas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                        <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nueva Caja</button>

                        <button @click="exportarPDF()" class="btn" class="btn"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevaCaja.id ? 'Modificar Caja: ' + cajaSeleccionada : 'Agregar Nueva Caja' }}</h3>
                        <label>Nombre de la Caja:</label>
                        <input type="text" v-model="nuevaCaja.nombre" placeholder="Nombre de la caja" required/>
                        <label>Fecha:</label>
                        <input type="date" v-model="nuevaCaja.fecha" :readonly="nuevaCaja.id" required/>
                        <label>Hora Apertura:</label>
                        <input type="time" v-model="nuevaCaja.horaApertura" step="1" :readonly="nuevaCaja.id"/>
                        <label>Hora Cierre:</label>
                        <input type="time" v-model="nuevaCaja.horaCierre" step="1" :readonly="nuevaCaja.id"/>
                        <label>Monto Inicial:</label>
                        <input type="number" v-model="nuevaCaja.montoInicial" placeholder="Monto Inicial" :readonly="nuevaCaja.id" required/>
                        <label>Monto Final:</label>
                        <input type="number" v-model="nuevaCaja.montoFinal" placeholder="Monto Final" :readonly="nuevaCaja.id"/>
                        <label>Total Servicios:</label>
                        <input type="number" v-model="nuevaCaja.totalServicios" placeholder="Total Servicios" readonly/>
                        <label>Total Productos:</label>
                        <input type="number" v-model="nuevaCaja.totalProductos" placeholder="Total Productos" readonly/>
                        <label>Total Descuentos:</label>
                        <input type="number" v-model="nuevaCaja.totalDescuentos" placeholder="Total Descuentos" readonly/>
                        <label>Empleado:</label>
                        <select v-model="nuevaCaja.empleadoId" :disabled="nuevaCaja.id">
                            <option value="" disabled>Seleccionar Empleado</option>
                            <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                {{ empleado.nombreCompleto }}
                            </option>
                        </select>
                        <label>Estado:</label>
                        <select v-model="nuevaCaja.estado" @change="onEstadoChange" required>
                            <option value="abierto">Abierto</option>
                            <option value="cerrado">Cerrado</option>
                        </select>
                        <div class="form-buttons">
                            <button @click="nuevaCaja.id ? modificarCaja() : agregarCaja()" class="btn">
                                {{ nuevaCaja.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Fecha</th>
                                <th>Empleado</th>
                                <th>Apertura</th>
                                <th>Cierre</th>
                                <th>Monto Inicial</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="caja in cajasPaginadas" :key="caja.id">
                                <td>{{ caja.id }}</td>
                                <td><strong>{{ caja.nombre || 'Sin nombre' }}</strong></td>
                                <td>{{ formatearFecha(caja.fecha) }}</td>
                                <td>{{ getEmpleadoName(caja) }}</td>
                                <td>{{ formatearHora(caja.horaApertura) }}</td>
                                <td>{{ formatearHora(caja.horaCierre) }}</td>
                                <td>{{ formatearNumero(caja.montoInicial) }}</td>
                                <td><span :class="{'badge-abierto': caja.estado === 'abierto', 'badge-cerrado': caja.estado === 'cerrado'}">{{ caja.estado.toUpperCase() }}</span></td>
                                <td>
                                    <button @click="cargarCaja(caja)" class="btn-small">Editar</button>
                                    <button @click="eliminarCaja(caja)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total Servicios: {{ formatearNumero(totalServicios) }} | Total Productos: {{ formatearNumero(totalProductos) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});




