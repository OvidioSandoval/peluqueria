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
            filtroArea: '',
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
            let filtrados = this.empleados;
            
            // Filtro por texto
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                filtrados = filtrados.filter(empleado =>
                    empleado.nombreCompleto.toLowerCase().includes(busqueda) ||
                    empleado.correo.toLowerCase().includes(busqueda) ||
                    empleado.telefono.includes(busqueda)
                );
            }
            
            // Filtro por área
            if (this.filtroArea.trim() !== '') {
                filtrados = filtrados.filter(empleado =>
                    empleado.area && empleado.area.nombre.toLowerCase().includes(this.filtroArea.toLowerCase())
                );
            }
            
            this.empleadosFiltrados = filtrados;
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
        
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const empleadosParaExportar = this.empleadosFiltrados;
                const itemsPorPagina = 15;
                const totalPaginas = Math.ceil(empleadosParaExportar.length / itemsPorPagina);
                
                for (let pagina = 0; pagina < totalPaginas; pagina++) {
                    if (pagina > 0) doc.addPage();
                    
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
                    doc.text('LISTA DE EMPLEADOS', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de empleados: ${empleadosParaExportar.length}`, 20, 62);
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, empleadosParaExportar.length);
                    const empleadosPagina = empleadosParaExportar.slice(inicio, fin);
                    
                    const headers = [['NOMBRE', 'CORREO', 'ÁREA', 'SUELDO BASE', 'COMISIÓN %', 'SUELDO TOTAL', 'TOTAL PAGADO', 'DIFERENCIA']];
                    const data = empleadosPagina.map((empleado) => [
                        empleado.nombreCompleto || '',
                        empleado.correo || 'No registrado',
                        empleado.area ? empleado.area.nombre : 'Sin área',
                        this.formatearNumero(empleado.sueldoBase),
                        empleado.comisionPorcentaje + '%',
                        this.formatearNumero(this.calcularSueldoTotal(empleado)),
                        this.formatearNumero(empleado.totalPagado || 0),
                        this.formatearNumero(this.calcularDiferencia(empleado))
                    ]);
                    
                    // Calcular total pagado general
                    const totalPagadoGeneral = empleadosParaExportar.reduce((sum, emp) => sum + (emp.totalPagado || 0), 0);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 68,
                        styles: { 
                            fontSize: 8,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 2,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            overflow: 'linebreak'
                        },
                        headStyles: { 
                            fontSize: 8,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 3
                        },
                        bodyStyles: {
                            fontSize: 8,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        columnStyles: {
                            0: { cellWidth: 'auto', overflow: 'linebreak' },
                            1: { cellWidth: 'auto', overflow: 'linebreak' },
                            2: { cellWidth: 'auto', overflow: 'linebreak' },
                            3: { cellWidth: 'auto', halign: 'right' },
                            4: { cellWidth: 'auto', halign: 'center' },
                            5: { cellWidth: 'auto', halign: 'right' },
                            6: { cellWidth: 'auto', halign: 'right' },
                            7: { cellWidth: 'auto', halign: 'right' }
                        },
                        margin: { bottom: 40 }
                    };
                    
                    // Agregar footer con total en la última página
                    if (pagina === totalPaginas - 1) {
                        tableConfig.foot = [['', '', '', '', '', '', 'TOTAL GENERAL:', this.formatearNumero(totalPagadoGeneral)]];
                        tableConfig.footStyles = { 
                            fontSize: 9,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        };
                    }
                    
                    doc.autoTable(tableConfig);
                    
                    // Footer profesional
                    const pageHeight = doc.internal.pageSize.height;
                    doc.setLineWidth(0.5);
                    doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                    
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Página ${pagina + 1} de ${totalPaginas}`, 20, pageHeight - 15);
                    doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`lista-empleados-${fecha}.pdf`);
                NotificationSystem.success('Lista de empleados exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        goBack() {
            window.history.back();
        }

    },
    template: `
        <div class="glass-container">
            <div>
                <h1 class="page-title">Lista de Empleados</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 30px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="margin-right: 25px;">
                            <label>Buscar Empleado:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarEmpleados" placeholder="Buscar empleado..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <div class="filter-group" style="margin-right: 25px;">
                            <label>Filtrar por Área:</label>
                            <input type="text" v-model="filtroArea" @input="filtrarEmpleados" placeholder="Buscar por área..." class="search-bar" style="width: 200px;"/>
                        </div>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
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
                                <td>{{ empleado.nombreCompleto }}</td>
                                <td>{{ empleado.correo || '-' }}</td>
                                <td>{{ empleado.area ? empleado.area.nombre : "N/A" }}</td>
                                <td>{{ formatearNumero(empleado.sueldoBase) }}</td>
                                <td>{{ empleado.comisionPorcentaje }}%</td>
                                <td style="font-weight: bold; color: #28a745;">{{ formatearNumero(empleado.sueldoMensual || empleado.sueldoBase) }}</td>
                                <td style="color: #007bff;">{{ formatearNumero(empleado.totalPagado || 0) }}</td>
                                <td style="font-weight: bold;" :style="{ color: (empleado.diferenciaPago || 0) > 0 ? '#dc3545' : '#28a745' }">{{ formatearNumero(empleado.diferenciaPago || 0) }}</td>
                                <td><span :class="empleado.activo ? 'status-active' : 'status-inactive'">{{ empleado.activo ? "Activo" : "Inactivo" }}</span></td>
                                <td>
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
    margin-top: 200px;
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
    margin-top: 200px;
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






