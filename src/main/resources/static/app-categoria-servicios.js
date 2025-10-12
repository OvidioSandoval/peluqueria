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
            categorias: [],
            categoriasFiltradas: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaCategoria: { 
                id: null, 
                descripcion: ''
            },
            categoriaSeleccionada: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchCategorias();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.categoriasFiltradas.length / this.itemsPorPagina);
        },
        categoriasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.categoriasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/categoria-servicios';
            }
        },
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.categorias = await response.json();
                this.filtrarCategorias();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                alert(`Error al cargar las categorías: ${error.message}`);
            }
        },
        filtrarCategorias() {
            let categoriasFiltradas = this.categorias;
            
            if (this.filtroBusqueda.trim() !== '') {
                const busqueda = this.filtroBusqueda.toLowerCase();
                categoriasFiltradas = categoriasFiltradas.filter(categoria =>
                    categoria.descripcion.toLowerCase().includes(busqueda)
                );
            }
            
            this.categoriasFiltradas = categoriasFiltradas;
            this.paginaActual = 1;
        },
        async agregarCategoria() {
            try {
                const categoriaData = {
                    ...this.nuevaCategoria,
                    descripcion: this.capitalizarTexto(this.nuevaCategoria.descripcion)
                };
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios/agregar_categoria`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCategorias();
                    NotificationSystem.success('Categoría agregada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar categoría:', error);
                NotificationSystem.error(`Error al agregar categoría: ${error.message}`);
            }
        },
        async modificarCategoria() {
            try {
                const categoriaData = {
                    ...this.nuevaCategoria,
                    descripcion: this.capitalizarTexto(this.nuevaCategoria.descripcion)
                };
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios/actualizar_categoria/${this.nuevaCategoria.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
                if (response.ok) {
                    this.toggleFormulario();
                    await this.fetchCategorias();
                    NotificationSystem.success('Categoría actualizada exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar categoría:', error);
                NotificationSystem.error(`Error al modificar categoría: ${error.message}`);
            }
        },
        async eliminarCategoria(categoria) {
            NotificationSystem.confirm(`¿Eliminar categoría "${categoria.descripcion}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/categoria-servicios/eliminar_categoria/${categoria.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchCategorias();
                        NotificationSystem.success('Categoría eliminada exitosamente');
                    } else if (response.status === 404) {
                        NotificationSystem.error('La categoría no existe o ya fue eliminada');
                        await this.fetchCategorias();
                    } else {
                        NotificationSystem.error('No se puede eliminar la categoría porque tiene servicios asociados');
                    }
                } catch (error) {
                    console.error('Error al eliminar categoría:', error);
                    NotificationSystem.error('Error al eliminar categoría');
                }
            });
        },
        async toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevaCategoria = { 
                id: null, 
                descripcion: ''
            };
            this.categoriaSeleccionada = '';
            if (!this.formularioVisible) {
                await this.fetchCategorias();
            }
        },
        cargarCategoria(categoria) {
            this.nuevaCategoria = { ...categoria };
            this.formularioVisible = true;
            this.categoriaSeleccionada = categoria.descripcion;
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchCategorias();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirCategoriaServicios() {
            window.location.href = '/web/categoria-servicios';
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
            try {
                if (!window.jspdf) {
                    NotificationSystem.error('Error: Librería PDF no cargada');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const categoriasParaExportar = this.categoriasFiltradas;
                const itemsPorPagina = 25;
                const totalPaginas = Math.ceil(categoriasParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE CATEGORÍAS DE SERVICIOS', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${categoriasParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, categoriasParaExportar.length);
                    const categoriasPagina = categoriasParaExportar.slice(inicio, fin);
                    
                    const headers = [['ID', 'DESCRIPCIÓN']];
                    const data = categoriasPagina.map((categoria) => [
                        categoria.id.toString(),
                        categoria.descripcion || ''
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
                doc.save(`lista-categorias${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Lista de categorías exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF. Asegúrate de que la librería esté cargada.');
            }
        },
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Categoria de Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">

                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Categoría:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarCategorias" placeholder="Buscar por descripción..." class="search-bar" style="width: 300px; padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;"/>
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
                                <th>ID</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="categoria in categoriasPaginadas" :key="categoria.id">
                                <td>{{ categoria.id }}</td>
                                <td>{{ categoria.descripcion }}</td>
                                <td>
                                    <button @click="eliminarCategoria(categoria)" class="btn-small btn-danger">Eliminar</button>
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




