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
            roles: [],
            filtroBusqueda: '',
            rolesFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10
        };
    },
    mounted() {
        this.fetchRoles();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.rolesFiltrados.length / this.itemsPorPagina);
        },
        rolesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.rolesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchRoles() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/roles`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.roles = await response.json();
                this.filtrarRoles();
            } catch (error) {
                console.error('Error al cargar roles:', error);
                NotificationSystem.error(`Error al cargar los roles: ${error.message}`);
            }
        },
        filtrarRoles() {
            if (this.filtroBusqueda.trim() === '') {
                this.rolesFiltrados = this.roles;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.rolesFiltrados = this.roles.filter(rol =>
                    rol.descripcion && rol.descripcion.toLowerCase().includes(busqueda)
                );
            }
            this.paginaActual = 1;
        },
        async eliminarRol(rol) {
            NotificationSystem.confirm(`¿Eliminar rol "${rol.descripcion}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/roles/${rol.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchRoles();
                        NotificationSystem.success('Rol eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar rol:', error);
                    NotificationSystem.error(`Error al eliminar rol: ${error.message}`);
                }
            });
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
        },
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const rolesParaExportar = this.rolesFiltrados;
                const itemsPorPagina = 20;
                const totalPaginas = Math.ceil(rolesParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE ROLES', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${rolesParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, rolesParaExportar.length);
                    const rolesPagina = rolesParaExportar.slice(inicio, fin);
                    
                    const headers = [['DESCRIPCIÓN']];
                    const data = rolesPagina.map((rol) => [
                        this.capitalizarTexto(rol.descripcion) || ''
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
                            0: { cellWidth: 170 }
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
                doc.save(`lista-roles${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Lista de roles exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Roles</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap; width: fit-content; padding: 15px; margin: 15px 0; background: #fce4ec; backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3);">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Rol:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarRoles" placeholder="Buscar por descripción..." class="search-bar" style="width: 300px;"/>
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
                            <tr v-for="rol in rolesPaginados" :key="rol.id">
                                <td>{{ capitalizarTexto(rol.descripcion) }}</td>
                                <td>
                                    <button @click="eliminarRol(rol)" class="btn-small btn-danger">Eliminar</button>
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