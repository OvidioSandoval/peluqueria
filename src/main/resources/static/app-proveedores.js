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
            proveedores: [],
            proveedoresFiltrados: [],
            filtroBusqueda: '',

            paginaActual: 1,
            itemsPorPagina: 10,
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchProveedores();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.proveedoresFiltrados.length / this.itemsPorPagina);
        },
        proveedoresPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.proveedoresFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    watch: {
        filtroBusqueda(newVal) {
            if (newVal === '') {
                this.filtrarProveedores();
            }
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
                window.location.href = '/web/proveedores';
            }
        },
        async fetchProveedores() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/proveedores`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.proveedores = await response.json();
                this.filtrarProveedores();
            } catch (error) {
                console.error('Error al cargar proveedores:', error);
                NotificationSystem.error(`Error al cargar los proveedores: ${error.message}`);
            }
        },
        filtrarProveedores() {
            if (this.filtroBusqueda.trim() === '') {
                this.proveedoresFiltrados = this.proveedores;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.proveedoresFiltrados = this.proveedores.filter(proveedor =>
                    proveedor.descripcion && proveedor.descripcion.toLowerCase().includes(busqueda)
                );
            }
            this.paginaActual = 1;
        },
        

        async eliminarProveedor(proveedor) {
            NotificationSystem.confirm(`¿Eliminar proveedor "${proveedor.descripcion}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/proveedores/eliminar_proveedor/${proveedor.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchProveedores();
                        NotificationSystem.success('Proveedor eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar proveedor:', error);
                    NotificationSystem.error(`Error al eliminar proveedor: ${error.message}`);
                }
            });
        },

        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchProveedores();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirProveedores() {
            window.location.href = '/web/proveedores';
        },
        cerrarSesion() {
            this.mostrarSalir = true;
        },
        cerrarSesionConfirmado() {
            this.mostrarSalir = false;
            window.location.href = '/home';
        },
        
        exportarPDF() {
            try {
                if (!window.jspdf) {
                    NotificationSystem.error('Error: Librería PDF no cargada');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const proveedoresParaExportar = this.proveedoresFiltrados;
                const itemsPorPagina = 25;
                const totalPaginas = Math.ceil(proveedoresParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE PROVEEDORES', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${proveedoresParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, proveedoresParaExportar.length);
                    const proveedoresPagina = proveedoresParaExportar.slice(inicio, fin);
                    
                    const headers = [['ID', 'DESCRIPCIÓN']];
                    const data = proveedoresPagina.map((proveedor) => [
                        proveedor.id.toString(),
                        proveedor.descripcion || ''
                    ]);
                    
                    doc.autoTable({
                        head: headers,
                        body: data,
                        startY: this.filtroBusqueda.trim() ? 75 : 68,
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
                            0: { cellWidth: 30, halign: 'center' },
                            1: { cellWidth: 140 }
                        },
                        margin: { bottom: 40 }
                    });
                    
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
                const filtroTexto = this.filtroBusqueda.trim() ? '-filtrado' : '';
                doc.save(`lista-proveedores${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Lista de proveedores exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF. Asegúrate de que la librería esté cargada.');
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Proveedores</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group">
                            <label>Buscar Proveedor:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarProveedores" placeholder="Buscar por descripción..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: end;">
                            <button @click="exportarPDF" class="btn btn-small">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="proveedor in proveedoresPaginados" :key="proveedor.id">
                                <td>{{ proveedor.descripcion }}</td>
                                <td>
                                    <button @click="eliminarProveedor(proveedor)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                </main>
            </div>
        </div>
    `
});





