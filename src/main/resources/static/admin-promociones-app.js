import config from './config.js';
import NotificationSystem from './notification-system.js';

new Vue({
    el: '#app',
    data() {
        return {
            promociones: [],
            promocionesFiltradas: [],
            filtroBusqueda: ''
        };
    },
    mounted() {
        this.cargarPromociones();
    },
    methods: {
        cargarPromociones() {
            const promocionesGuardadas = localStorage.getItem('promociones');
            if (promocionesGuardadas) {
                this.promociones = JSON.parse(promocionesGuardadas);
            } else {
                this.promociones = [];
            }
            this.filtrarPromociones();
        },
        filtrarPromociones() {
            if (this.filtroBusqueda.trim() === '') {
                this.promocionesFiltradas = this.promociones;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.promocionesFiltradas = this.promociones.filter(promo =>
                    promo.descripcion && promo.descripcion.toLowerCase().includes(busqueda)
                );
            }
        },
        eliminarPromocion(id) {
            NotificationSystem.confirm('¿Eliminar esta promoción?', () => {
                this.promociones = this.promociones.filter(p => p.id !== id);
                localStorage.setItem('promociones', JSON.stringify(this.promociones));
                this.cargarPromociones();
                NotificationSystem.success('Promoción eliminada exitosamente');
            });
        },
        formatearPrecio(precio) {
            return Number(precio).toLocaleString('es-PY', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
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
                doc.text('LISTA DE PROMOCIONES', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de registros: ${this.promocionesFiltradas.length}`, 20, 62);
                if (this.filtroBusqueda.trim()) {
                    doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                }
                
                const headers = [['TÍTULO', 'DESCRIPCIÓN', 'PRECIO']];
                const data = this.promocionesFiltradas.map((promo) => [
                    promo.titulo || '',
                    promo.descripcion || '',
                    this.formatearPrecio(promo.precio) || ''
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
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 90 },
                        2: { cellWidth: 40, halign: 'center' }
                    },
                    margin: { bottom: 40 }
                });
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`promociones-${fecha}.pdf`);
                NotificationSystem.success('Lista de promociones exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    }
});