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
            auditoria: [],
            loading: true,
            search: '',
            headers: [
                { text: 'Usuario', value: 'usuarioNombre', width: '120px' },
                { text: 'Acción', value: 'accion', width: '100px' },
                { text: 'Tabla', value: 'tablaAfectada', width: '120px' },
                { text: 'Detalles', value: 'detalles', width: '250px' },
                { text: 'IP', value: 'ipAddress', width: '120px' },
                { text: 'Fecha/Hora', value: 'fechaHora', width: '150px' }
            ]
        };
    },
    mounted() {
        this.fetchAuditoria();
    },
    methods: {
        async fetchAuditoria() {
            try {
                this.loading = true;
                const response = await fetch(`${config.apiBaseUrl}/auditoria`);
                if (!response.ok) throw new Error('Error al cargar auditoría');
                this.auditoria = await response.json();
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.loading = false;
            }
        },
        formatFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        },
        exportToPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const auditoriaParaExportar = this.auditoria.filter(a => 
                    !this.search || 
                    a.usuarioNombre.toLowerCase().includes(this.search.toLowerCase()) ||
                    a.accion.toLowerCase().includes(this.search.toLowerCase()) ||
                    (a.detalles && a.detalles.toLowerCase().includes(this.search.toLowerCase()))
                );
                const itemsPorPagina = 25;
                const totalPaginas = Math.ceil(auditoriaParaExportar.length / itemsPorPagina);
                
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
                    doc.text('REPORTE DE AUDITORÍA', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${auditoriaParaExportar.length}`, 20, 62);
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, auditoriaParaExportar.length);
                    const auditoriaPagina = auditoriaParaExportar.slice(inicio, fin);
                    
                    const headers = [['USUARIO', 'ACCIÓN', 'TABLA', 'DETALLES', 'IP', 'FECHA/HORA']];
                    const data = auditoriaPagina.map((item) => [
                        item.usuarioNombre || '',
                        item.accion || '',
                        item.tablaAfectada || '-',
                        item.detalles || '-',
                        item.ipAddress || '-',
                        this.formatFecha(item.fechaHora)
                    ]);
                    
                    doc.autoTable({
                        head: headers,
                        body: data,
                        startY: 68,
                        margin: { left: 10, right: 10, bottom: 30 },
                        styles: { 
                            fontSize: 6,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            cellPadding: 1,
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            overflow: 'linebreak'
                        },
                        headStyles: { 
                            fontSize: 6,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'center',
                            cellPadding: 2
                        },
                        bodyStyles: {
                            fontSize: 6,
                            textColor: [0, 0, 0],
                            fillColor: [255, 255, 255],
                            font: 'helvetica',
                            overflow: 'linebreak',
                            valign: 'top'
                        },
                        columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 'auto' },
                            3: { cellWidth: 'auto' },
                            4: { cellWidth: 'auto' },
                            5: { cellWidth: 'auto' }
                        },
                        tableWidth: 'auto'
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
                doc.save(`auditoria-${fecha}.pdf`);
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
            }
        },
        exportIndividualPDF(item) {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Header
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
                doc.text('REGISTRO DE AUDITORÍA', 105, 40, { align: 'center' });
                
                // Información del registro
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                let yPos = 60;
                
                doc.text('USUARIO:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(item.usuarioNombre || '-', 50, yPos);
                yPos += 15;
                
                doc.setFont('helvetica', 'bold');
                doc.text('ACCIÓN:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(item.accion || '-', 50, yPos);
                yPos += 15;
                
                doc.setFont('helvetica', 'bold');
                doc.text('TABLA AFECTADA:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(item.tablaAfectada || '-', 70, yPos);
                yPos += 15;
                
                doc.setFont('helvetica', 'bold');
                doc.text('DIRECCIÓN IP:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(item.ipAddress || '-', 60, yPos);
                yPos += 15;
                
                doc.setFont('helvetica', 'bold');
                doc.text('FECHA/HORA:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(this.formatFecha(item.fechaHora), 60, yPos);
                yPos += 20;
                
                doc.setFont('helvetica', 'bold');
                doc.text('DETALLES:', 20, yPos);
                yPos += 10;
                
                doc.setFont('helvetica', 'normal');
                const detalles = item.detalles || 'Sin detalles';
                const splitDetalles = doc.splitTextToSize(detalles, 170);
                doc.text(splitDetalles, 20, yPos);
                
                // Footer
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Generado el: ' + new Date().toLocaleString('es-ES'), 20, pageHeight - 15);
                
                const fileName = `auditoria-${item.id}-${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(fileName);
                
            } catch (error) {
                console.error('Error al generar PDF individual:', error);
            }
        },
        goBack() {
            window.history.back();
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Auditoría del Sistema</h1>
                <button @click="goBack" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <main style="padding: 20px;">
                    <div class="table-container">
                        <div class="filters-container" style="gap: 10px; padding: 15px; width: fit-content;">
                            <div class="filter-group" style="min-width: auto; flex: none;">
                                <label>Buscar en Auditoría:</label>
                                <input type="text" v-model="search" placeholder="Buscar usuario, acción o detalles..." class="search-bar" style="width: 280px;"/>
                            </div>
                            <button @click="exportToPDF" class="btn btn-small" style="margin: 0 2px;">
                                <i class="fas fa-file-pdf"></i> Exportar
                            </button>
                        </div>
                        
                        <div v-if="loading" class="loading">
                            <i class="fas fa-spinner fa-spin"></i> Cargando...
                        </div>
                        
                        <div v-else class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Tabla</th>
                                        <th>Detalles</th>
                                        <th>IP</th>
                                        <th>Fecha/Hora</th>
                                        <th>Exportar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in auditoria.filter(a => 
                                        !search || 
                                        a.usuarioNombre.toLowerCase().includes(search.toLowerCase()) ||
                                        a.accion.toLowerCase().includes(search.toLowerCase()) ||
                                        (a.detalles && a.detalles.toLowerCase().includes(search.toLowerCase()))
                                    )" :key="item.id">
                                        <td>{{ item.usuarioNombre }}</td>
                                        <td>
                                            <span class="action-badge" :class="'action-' + item.accion.toLowerCase()">
                                                {{ item.accion }}
                                            </span>
                                        </td>
                                        <td>{{ item.tablaAfectada || '-' }}</td>
                                        <td class="detalles-cell" :title="item.detalles">
                                            {{ item.detalles ? (item.detalles.length > 60 ? item.detalles.substring(0, 60) + '...' : item.detalles) : '-' }}
                                        </td>
                                        <td>{{ item.ipAddress || '-' }}</td>
                                        <td>{{ formatFecha(item.fechaHora) }}</td>
                                        <td>
                                            <button @click="exportIndividualPDF(item)" class="btn btn-small" style="padding: 4px 8px; font-size: 11px;">
                                                <i class="fas fa-file-pdf"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div v-if="!loading && auditoria.length === 0" class="no-data">
                            <i class="fas fa-inbox"></i>
                            <p>No hay registros de auditoría</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `
});

const style = document.createElement('style');
style.textContent = `
    .action-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
    }
    .action-login { background: #4caf50; color: white; }
    .action-create { background: #2196f3; color: white; }
    .action-update { background: #ff9800; color: white; }
    .action-delete { background: #f44336; color: white; }
    .action-page_view { background: #9c27b0; color: white; }
    
    .detalles-cell {
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: help;
    }
    
    .filter-group {
        display: flex;
        flex-direction: column;
    }
    
    .search-bar {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background: white;
    }
    
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 16px;
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        color: #999;
    }
    
    .no-data i {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
    }
`;
document.head.appendChild(style);