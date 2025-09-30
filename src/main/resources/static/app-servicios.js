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
            servicios: [],
            serviciosFiltrados: [],
            categorias: [],
            filtroBusqueda: '',
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoServicio: { 
                id: null, 
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            servicioSeleccionado: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchServicios();
        this.fetchCategorias();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.serviciosFiltrados.length / this.itemsPorPagina);
        },
        serviciosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.serviciosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
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
                window.location.href = '/web/servicios';
            }
        },
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.servicios = await response.json();
                this.filtrarServicios();
            } catch (error) {
                console.error('Error al cargar servicios:', error);
                NotificationSystem.error(`Error al cargar los servicios: ${error.message}`);
            }
        },
        async fetchCategorias() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/categoria-servicios`);
                this.categorias = await response.json();
            } catch (error) {
                console.error('Error al cargar categorías:', error);
            }
        },
        filtrarServicios() {
            if (this.filtroBusqueda.trim() === '') {
                this.serviciosFiltrados = this.servicios;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.serviciosFiltrados = this.servicios.filter(servicio =>
                    servicio.nombre.toLowerCase().includes(busqueda) ||
                    (servicio.descripcion && servicio.descripcion.toLowerCase().includes(busqueda))
                );
            }
        },
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtrarServicios();
        },
        async agregarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                NotificationSystem.error('El precio base debe ser mayor a 0');
                return;
            }
            try {
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: this.nuevoServicio.categoriaId }
                };
                const response = await fetch(`${config.apiBaseUrl}/servicios/agregar_servicio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servicioData)
                });
                if (response.ok) {
                    NotificationSystem.success('Servicio agregado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar servicio:', error);
                NotificationSystem.error(`Error al agregar servicio: ${error.message}`);
            }
        },
        async modificarServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                NotificationSystem.error('El precio base debe ser mayor a 0');
                return;
            }
            try {
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: this.nuevoServicio.categoriaId }
                };
                const response = await fetch(`${config.apiBaseUrl}/servicios/actualizar_servicio/${this.nuevoServicio.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servicioData)
                });
                if (response.ok) {
                    NotificationSystem.success('Servicio actualizado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar servicio:', error);
                NotificationSystem.error(`Error al modificar servicio: ${error.message}`);
            }
        },
        async eliminarServicio(servicio) {
            NotificationSystem.confirm(`¿Eliminar servicio "${servicio.nombre}"?`, async () => {
                try {
                    await fetch(`${config.apiBaseUrl}/servicios/eliminar_servicio/${servicio.id}`, {
                        method: 'DELETE'
                    });
                    NotificationSystem.success('Servicio eliminado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } catch (error) {
                    console.error('Error al eliminar servicio:', error);
                    NotificationSystem.error('Error al eliminar servicio');
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoServicio = { 
                id: null, 
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            };
            this.servicioSeleccionado = '';
        },
        cargarServicio(servicio) {
            this.nuevoServicio = { 
                id: servicio.id,
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                precioBase: servicio.precioBase || 0,
                activo: servicio.activo !== undefined ? servicio.activo : true,
                categoriaId: servicio.categoria ? servicio.categoria.id : (servicio.categoriaId || null)
            };
            this.formularioVisible = true;
            this.servicioSeleccionado = servicio.nombre;
            this.$nextTick(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },
        getCategoriaDescripcion(servicio) {
            return servicio.categoriaDescripcion || 'Sin categoría';
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        startAutoRefresh() {
            // Autorefresh deshabilitado - solo refresh manual en acciones
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirServicios() {
            window.location.href = '/web/servicios';
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
        getCategoriaSeleccionada() {
            if (!this.nuevoServicio.categoriaId) return '';
            const categoria = this.categorias.find(c => c.id == this.nuevoServicio.categoriaId);
            return categoria ? categoria.descripcion : '';
        },
        

        
        exportarPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const serviciosParaExportar = this.serviciosFiltrados;
                const itemsPorPagina = 15;
                const totalPaginas = Math.ceil(serviciosParaExportar.length / itemsPorPagina);
                
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
                    doc.text('CATÁLOGO DE SERVICIOS', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de servicios: ${serviciosParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, serviciosParaExportar.length);
                    const serviciosPagina = serviciosParaExportar.slice(inicio, fin);
                    
                    const headers = [['NOMBRE DEL SERVICIO', 'DESCRIPCIÓN', 'PRECIO BASE', 'CATEGORÍA', 'ESTADO']];
                    const data = serviciosPagina.map((servicio) => [
                        servicio.nombre || '',
                        servicio.descripcion || 'Sin descripción',
                        this.formatearNumero(servicio.precioBase),
                        this.getCategoriaDescripcion(servicio),
                        servicio.activo ? 'Activo' : 'Inactivo'
                    ]);
                    
                    doc.autoTable({
                        head: headers,
                        body: data,
                        startY: this.filtroBusqueda.trim() ? 75 : 68,
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
                            0: { cellWidth: 45, overflow: 'linebreak' },
                            1: { cellWidth: 70, overflow: 'linebreak' },
                            2: { cellWidth: 25, halign: 'right' },
                            3: { cellWidth: 30, overflow: 'linebreak' },
                            4: { cellWidth: 20, halign: 'center' }
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
                doc.save(`catalogo-servicios${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Catálogo de servicios exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Servicios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; margin-bottom: 20px; padding: 15px; background: rgba(252, 228, 236, 0.9); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1); border: 1px solid rgba(179, 229, 252, 0.3); flex-wrap: wrap; width: fit-content;">
                        <div class="filter-group">
                            <label>Buscar Servicio:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarServicios" placeholder="Buscar servicio..." class="search-bar" style="width: 300px;"/>
                        </div>
                        <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                        <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nuevo Servicio</button>
                        <button @click="exportarPDF" class="btn btn-small" v-if="!formularioVisible">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoServicio.id ? 'Modificar Servicio - ' + servicioSeleccionado : 'Nuevo Servicio' }}</h3>
                        <div class="form-row">
                            <div class="form-col">
                                <label>Nombre: *</label>
                                <input type="text" v-model="nuevoServicio.nombre" placeholder="Ingrese el nombre del servicio" required/>
                            </div>
                            <div class="form-col">
                                <label>Precio Base: *</label>
                                <input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required/>
                            </div>
                            <div class="form-col">
                                <label>Categoría:</label>
                                <select v-model="nuevoServicio.categoriaId">
                                    <option value="" disabled selected>Selecciona una categoría</option>
                                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                                        {{ categoria.descripcion }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row" style="gap: 20px;">
                            <div class="form-col" style="flex: none; width: 150px;">
                                <label>Descripción:</label>
                                <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2" style="resize: vertical; width: 150px;"></textarea>
                            </div>
                            <div class="form-col" style="flex: none; width: auto; display: flex; align-items: flex-end; padding-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; margin: 0; white-space: nowrap;">
                                    <input type="checkbox" v-model="nuevoServicio.activo" style="margin: 0;"/>
                                    Servicio Activo
                                </label>
                            </div>
                        </div>
                        <div class="form-buttons">
                            <button @click="nuevoServicio.id ? modificarServicio() : agregarServicio()" class="btn">
                                {{ nuevoServicio.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio Base</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="servicio in serviciosPaginados" :key="servicio.id">
                                <td>{{ servicio.nombre }}</td>
                                <td>{{ servicio.descripcion }}</td>
                                <td>{{ formatearNumero(servicio.precioBase) }}</td>
                                <td>{{ getCategoriaDescripcion(servicio) }}</td>
                                <td>{{ servicio.activo ? 'Activo' : 'Inactivo' }}</td>
                                <td>
                                    <button @click="cargarServicio(servicio)" class="btn-small">Editar</button>
                                    <button @click="eliminarServicio(servicio)" class="btn-small btn-danger">Eliminar</button>
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




