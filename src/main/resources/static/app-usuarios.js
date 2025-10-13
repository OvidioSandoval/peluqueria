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
            usuarios: [],
            filtroBusqueda: '',
            usuariosFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10
        };
    },
    mounted() {
        this.fetchUsuarios();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
        },
        usuariosPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.usuariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {
        async fetchUsuarios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.usuarios = await response.json();
                this.filtrarUsuarios();
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
                NotificationSystem.error(`Error al cargar los usuarios: ${error.message}`);
            }
        },
        filtrarUsuarios() {
            if (this.filtroBusqueda.trim() === '') {
                this.usuariosFiltrados = this.usuarios;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.usuariosFiltrados = this.usuarios.filter(usuario =>
                    (usuario.username && usuario.username.toLowerCase().includes(busqueda)) ||
                    (usuario.correo && usuario.correo.toLowerCase().includes(busqueda)) ||
                    (usuario.rol && usuario.rol.descripcion && usuario.rol.descripcion.toLowerCase().includes(busqueda))
                );
            }
            this.paginaActual = 1;
        },
        async eliminarUsuario(usuario) {
            NotificationSystem.confirm(`¿Eliminar usuario "${usuario.username}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/usuarios/${usuario.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchUsuarios();
                        NotificationSystem.success('Usuario eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar usuario:', error);
                    NotificationSystem.error(`Error al eliminar usuario: ${error.message}`);
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
                
                const usuariosParaExportar = this.usuariosFiltrados;
                const itemsPorPagina = 20;
                const totalPaginas = Math.ceil(usuariosParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE USUARIOS', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${usuariosParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, usuariosParaExportar.length);
                    const usuariosPagina = usuariosParaExportar.slice(inicio, fin);
                    
                    const headers = [['USUARIO', 'CORREO', 'ROL', 'ESTADO']];
                    const data = usuariosPagina.map((usuario) => [
                        usuario.username || '',
                        usuario.correo || 'No registrado',
                        usuario.rol ? usuario.rol.descripcion : 'Sin rol',
                        usuario.activo ? 'Activo' : 'Inactivo'
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
                            0: { cellWidth: 40 },
                            1: { cellWidth: 60 },
                            2: { cellWidth: 40 },
                            3: { cellWidth: 30, halign: 'center' }
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
                doc.save(`lista-usuarios${filtroTexto}-${fecha}.pdf`);
                NotificationSystem.success('Lista de usuarios exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Usuarios</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Usuario:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarUsuarios" placeholder="Buscar por username, correo o rol..." class="search-bar"/>
                        </div>
                        <button @click="exportarPDF" class="btn btn-small">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre de Usuario</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="usuario in usuariosPaginados" :key="usuario.id">
                                <td>{{ usuario.username }}</td>
                                <td>{{ usuario.correo || 'No registrado' }}</td>
                                <td>{{ usuario.rol ? capitalizarTexto(usuario.rol.descripcion) : 'Sin rol' }}</td>
                                <td>
                                    <span :class="usuario.activo ? 'status-active' : 'status-inactive'">
                                        {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </td>
                                <td>
                                    <button @click="eliminarUsuario(usuario)" class="btn-small btn-danger">Eliminar</button>
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