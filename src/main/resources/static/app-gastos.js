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
            gastos: [],
            gastosFiltrados: [],
            empleados: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoGasto: { 
                id: null, 
                descripcion: '', 
                monto: 0,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            },
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchGastos();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.gastosFiltrados.length / this.itemsPorPagina);
        },
        gastosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.gastosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalGastos() {
            return this.gastosFiltrados.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/web/panel-control';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/gastos';
            }
        },
        async fetchGastos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/gastos`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.gastos = await response.json();
                this.filtrarGastos();
            } catch (error) {
                console.error('Error al cargar gastos:', error);
                NotificationSystem.error(`Error al cargar los gastos: ${error.message}`);
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                NotificationSystem.error(`Error al cargar empleados: ${error.message}`);
            }
        },
        filtrarGastos() {
            let filtrados = [...this.gastos];
            if (this.filtroBusqueda) {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(gasto =>
                    gasto.descripcion.toLowerCase().includes(busqueda) ||
                    gasto.categoriaGasto.toLowerCase().includes(busqueda) ||
                    gasto.monto.toString().includes(busqueda) ||
                    (gasto.empleado && gasto.empleado.nombreCompleto.toLowerCase().includes(busqueda))
                );
            }
            if (this.filtroFecha) {
                filtrados = filtrados.filter(gasto => {
                    if (!gasto.fechaGasto) return false;
                    const fechaGasto = typeof gasto.fechaGasto === 'string' ? gasto.fechaGasto : new Date(gasto.fechaGasto).toISOString().split('T')[0];
                    return fechaGasto.startsWith(this.filtroFecha);
                });
            }
            this.gastosFiltrados = filtrados;
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtroFecha = '';
            this.filtrarGastos();
        },
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Header profesional
                doc.setLineWidth(2);
                doc.line(20, 25, 190, 25);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('PELUQUERÍA LUNA', 105, 20, { align: 'center' });
                
                doc.setLineWidth(0.5);
                doc.line(20, 28, 190, 28);
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'normal');
                doc.text('REPORTE DE GASTOS', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de gastos: ${this.gastosFiltrados.length}`, 20, 62);
                
                // Tabla de gastos
                if (this.gastosFiltrados.length > 0) {
                    const headers = [['DESCRIPCIÓN', 'MONTO', 'FECHA', 'CATEGORÍA', 'EMPLEADO']];
                    const data = this.gastosFiltrados.map((gasto) => [
                        gasto.descripcion || '',
                        this.formatearNumero(gasto.monto),
                        this.formatearFecha(gasto.fechaGasto),
                        gasto.categoriaGasto || '',
                        gasto.empleado ? gasto.empleado.nombreCompleto : 'N/A'
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 75,
                        styles: { 
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 4,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1
                        },
                        headStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 5
                        },
                        bodyStyles: {
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto', halign: 'right' },
                            2: { cellWidth: 'auto', halign: 'center' },
                            3: { cellWidth: 'auto' },
                            4: { cellWidth: 'auto' }
                        },
                        margin: { bottom: 40 },
                        foot: [['', '', '', 'TOTAL FINAL:', this.formatearNumero(this.totalGastos)]],
                        footStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        }
                    };
                    
                    doc.autoTable(tableConfig);
                }
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`reporte-gastos-${fecha}.pdf`);
                NotificationSystem.success('Reporte de gastos exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        async agregarGasto() {
            try {
                const gastoData = {
                    ...this.nuevoGasto,
                    descripcion: this.capitalizarTexto(this.nuevoGasto.descripcion),
                    categoriaGasto: this.capitalizarTexto(this.nuevoGasto.categoriaGasto)
                };
                const response = await fetch(`${config.apiBaseUrl}/gastos/agregar_gasto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gastoData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchGastos();
                    NotificationSystem.success('Gasto agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar gasto:', error);
                NotificationSystem.error(`Error al agregar gasto: ${error.message}`);
            }
        },

        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoGasto = { 
                id: null, 
                descripcion: '', 
                monto: 0,
                fechaGasto: new Date().toISOString().split('T')[0],
                categoriaGasto: '',
                empleado: null
            };
            if (!this.formularioVisible) {
                await this.fetchGastos();
            }
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
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchGastos();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirGastos() {
            window.location.href = '/web/gastos';
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
                <h1 class="page-title">Gestión de Gastos</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 25px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="min-width: 350px;">
                            <label>Buscar Gasto:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarGastos" placeholder="Buscar por descripción, categoría, monto o empleado..." class="search-bar" style="width: 350px;"/>
                        </div>
                        <div class="filter-group" style="min-width: 150px;">
                            <label>Filtrar por fecha:</label>
                            <input type="date" v-model="filtroFecha" @change="filtrarGastos" class="search-bar" style="width: 150px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nuevo Gasto</button>
                        <button @click="exportarPDF" class="btn btn-small" v-if="!formularioVisible">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoGasto.id ? 'Modificar Gasto: ' + nuevoGasto.descripcion : 'Nuevo Gasto' }}</h3>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: end; width: 100%;">
                            <div class="filter-group" style="flex: 0 0 auto; width: 200px;">
                                <label>Descripción *</label>
                                <input type="text" v-model="nuevoGasto.descripcion" placeholder="Descripción del gasto" required class="search-bar"/>
                            </div>
                            <div class="filter-group" style="flex: 0 0 auto; width: 100px;">
                                <label>Monto *</label>
                                <input type="number" v-model="nuevoGasto.monto" placeholder="Monto" min="0" required class="search-bar"/>
                            </div>
                            <div class="filter-group" style="flex: 0 0 auto; width: 130px;">
                                <label>Fecha *</label>
                                <input type="date" v-model="nuevoGasto.fechaGasto" required class="search-bar"/>
                            </div>
                            <div class="filter-group" style="flex: 0 0 auto; width: 150px;">
                                <label>Categoría</label>
                                <input type="text" v-model="nuevoGasto.categoriaGasto" placeholder="Categoría" class="search-bar"/>
                            </div>
                            <div class="filter-group" style="flex: 0 0 auto; width: 180px;">
                                <label>Empleado</label>
                                <select v-model="nuevoGasto.empleado" class="search-bar">
                                    <option value="" disabled>Seleccionar Empleado</option>
                                    <option v-for="empleado in empleados" :key="empleado.id" :value="empleado">{{ empleado.nombreCompleto }}</option>
                                </select>
                            </div>
                            <div style="flex: 0 0 auto;">
                                <button @click="agregarGasto()" class="btn" v-if="!nuevoGasto.id">Agregar</button>
                            </div>
                            <div style="flex: 0 0 auto;">
                                <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                            </div>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Empleado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="gasto in gastosPaginados" :key="gasto.id">
                                <td>{{ gasto.descripcion }}</td>
                                <td>{{ formatearNumero(gasto.monto) }}</td>
                                <td>{{ formatearFecha(gasto.fechaGasto) }}</td>
                                <td>{{ gasto.categoriaGasto }}</td>
                                <td>{{ gasto.empleado ? gasto.empleado.nombreCompleto : 'N/A' }}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total: {{ formatearNumero(totalGastos) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});








