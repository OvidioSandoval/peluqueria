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
            clientes: [],
            filtroBusqueda: '',
            clientesFiltrados: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevoCliente: {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },

            clienteSeleccionado: '',

            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchClientes();
    },

    computed: {
        totalPaginas() {
            return Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
        },
        clientesPaginados() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.clientesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
        }
    },
    methods: {

        async fetchClientes() {
            try {
                if (window.ConsoleLogger) ConsoleLogger.network.request('GET', `${config.apiBaseUrl}/clientes`);
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.clientes = await response.json();
                if (window.ConsoleLogger) ConsoleLogger.crud.read('Clientes', { cantidad: this.clientes.length });
                this.filtrarClientes();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al cargar clientes', error);
                NotificationSystem.error(`Error al cargar los clientes: ${error.message}`);
            }
        },
        filtrarClientes() {
            if (this.filtroBusqueda.trim() === '') {
                this.clientesFiltrados = this.clientes;
            } else {
                const busqueda = this.filtroBusqueda.toLowerCase();
                this.clientesFiltrados = this.clientes.filter(cliente =>
                    (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(busqueda)) ||
                    (cliente.telefono && cliente.telefono.toLowerCase().includes(busqueda)) ||
                    (cliente.ruc && cliente.ruc.toLowerCase().includes(busqueda)) ||
                    (cliente.correo && cliente.correo.toLowerCase().includes(busqueda))
                );
            }
            this.paginaActual = 1;
        },
        async agregarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida: nombre completo requerido');
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida: email inválido', { email: this.nuevoCliente.correo });
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                if (window.ConsoleLogger) ConsoleLogger.network.request('POST', `${config.apiBaseUrl}/clientes/agregar_cliente`, clienteData);
                const response = await fetch(`${config.apiBaseUrl}/clientes/agregar_cliente`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes/agregar_cliente`);
                if (response.ok) {
                    if (window.ConsoleLogger) ConsoleLogger.crud.create('Cliente', clienteData);
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al agregar cliente', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        async modificarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida: nombre completo requerido');
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                if (window.ConsoleLogger) ConsoleLogger.warning('Validación fallida: email inválido', { email: this.nuevoCliente.correo });
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                if (window.ConsoleLogger) ConsoleLogger.network.request('PUT', `${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, clienteData);
                const response = await fetch(`${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`);
                if (response.ok) {
                    if (window.ConsoleLogger) ConsoleLogger.crud.update('Cliente', clienteData);
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar cliente:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al modificar cliente', error);
                NotificationSystem.error(`Error al modificar cliente: ${error.message}`);
            }
        },
        async eliminarCliente(cliente) {
            if (window.ConsoleLogger) ConsoleLogger.info('Solicitando confirmación para eliminar cliente', { cliente: cliente.nombreCompleto });
            NotificationSystem.confirm(`¿Eliminar cliente "${cliente.nombreCompleto}"?`, async () => {
                try {
                    if (window.ConsoleLogger) ConsoleLogger.network.request('DELETE', `${config.apiBaseUrl}/clientes/eliminar_cliente/${cliente.id}`);
                    const response = await fetch(`${config.apiBaseUrl}/clientes/eliminar_cliente/${cliente.id}`, {
                        method: 'DELETE'
                    });
                    if (window.ConsoleLogger) ConsoleLogger.network.response(response.status, `${config.apiBaseUrl}/clientes/eliminar_cliente/${cliente.id}`);
                    if (response.ok) {
                        if (window.ConsoleLogger) ConsoleLogger.crud.delete('Cliente', { id: cliente.id, nombre: cliente.nombreCompleto });
                        await this.fetchClientes();
                        NotificationSystem.success('Cliente eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar cliente:', error);
                    if (window.ConsoleLogger) ConsoleLogger.error('Error al eliminar cliente', error);
                    NotificationSystem.error(`Error al eliminar cliente: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            this.formularioVisible = !this.formularioVisible;
            this.nuevoCliente = {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            };
            this.clienteSeleccionado = '';
        },
        cargarCliente(cliente) {
            this.nuevoCliente = {
                id: cliente.id,
                nombreCompleto: this.capitalizarTexto(cliente.nombreCompleto || ''),
                telefono: cliente.telefono || '',
                ruc: cliente.ruc || '',
                correo: cliente.correo || '',
                redesSociales: cliente.redesSociales || '',
                fechaNacimiento: cliente.fechaNacimiento || null
            };
            this.formularioVisible = true;
            this.clienteSeleccionado = cliente.nombreCompleto;
            // Scroll al top de la página
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        
        validarEmail(email) {
            if (!email) return true; // Email is optional
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
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

        redirigirClientes() {
            window.location.href = '/web/clientes';
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
                if (window.ConsoleLogger) ConsoleLogger.info('Iniciando exportación de PDF de clientes');
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const clientesParaExportar = this.clientesFiltrados;
                const itemsPorPagina = 20;
                const totalPaginas = Math.ceil(clientesParaExportar.length / itemsPorPagina);
                
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
                    doc.text('LISTA DE CLIENTES', 105, 40, { align: 'center' });
                    
                    // Información del reporte
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                    doc.text(`Total de registros: ${clientesParaExportar.length}`, 20, 62);
                    if (this.filtroBusqueda.trim()) {
                        doc.text(`Filtro aplicado: "${this.filtroBusqueda}"`, 20, 69);
                    }
                    
                    const inicio = pagina * itemsPorPagina;
                    const fin = Math.min(inicio + itemsPorPagina, clientesParaExportar.length);
                    const clientesPagina = clientesParaExportar.slice(inicio, fin);
                    
                    const headers = [['NOMBRE COMPLETO', 'TELÉFONO', 'RUC', 'EMAIL', 'EDAD']];
                    const data = clientesPagina.map((cliente) => [
                        cliente.nombreCompleto || '',
                        cliente.telefono || 'No registrado',
                        cliente.ruc || 'No registrado',
                        cliente.correo || 'No registrado',
                        this.calcularEdad(cliente.fechaNacimiento)
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
                            0: { cellWidth: 50 },
                            1: { cellWidth: 30 },
                            2: { cellWidth: 30 },
                            3: { cellWidth: 50 },
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
                const nombreArchivo = `lista-clientes${filtroTexto}-${fecha}.pdf`;
                doc.save(nombreArchivo);
                if (window.ConsoleLogger) ConsoleLogger.success('PDF de clientes exportado exitosamente', { archivo: nombreArchivo, registros: this.clientesFiltrados.length });
                NotificationSystem.success('Lista de clientes exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                if (window.ConsoleLogger) ConsoleLogger.error('Error al generar PDF de clientes', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        },
        
        calcularEdad(fechaNacimiento) {
            if (!fechaNacimiento) return 'N/A';
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
            return edad + ' años';
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Lista de Clientes</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container" style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap; width: fit-content; padding: 15px; margin: 15px 0;">
                        <div class="filter-group" style="flex: none; width: auto;">
                            <label>Buscar Cliente:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarClientes" placeholder="Buscar por nombre, teléfono, RUC o email..." class="search-bar" style="width: 300px;"/>
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
                                <th>Nombre Completo</th>
                                <th>Teléfono</th>
                                <th>RUC</th>
                                <th>Correo</th>
                                <th>Fecha Nacimiento</th>
                                <th>Redes Sociales</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="cliente in clientesPaginados" :key="cliente.id">
                                <td>{{ cliente.id }}</td>
                                <td>{{ cliente.nombreCompleto }}</td>
                                <td>{{ cliente.telefono }}</td>
                                <td>{{ cliente.ruc }}</td>
                                <td>{{ cliente.correo }}</td>
                                <td>{{ formatearFecha(cliente.fechaNacimiento) }}</td>
                                <td>{{ cliente.redesSociales }}</td>
                                <td>
                                    <button @click="eliminarCliente(cliente)" class="btn-small btn-danger">Eliminar</button>
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
// Estilos para mejorar visibilidad del mensaje de confirmación
const style = document.createElement('style');
style.textContent = `
    .filters-container {
        display: flex;
        gap: 15px;
        align-items: end;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(252, 228, 236, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(233, 30, 99, 0.1);
        border: 1px solid rgba(179, 229, 252, 0.3);
        flex-wrap: wrap;
        width: fit-content;
    }
    .filter-group {
        display: flex;
        flex-direction: column;
        min-width: fit-content;
    }
    .filter-group label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #5d4037;
    }
    .search-bar {
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        transition: border-color 0.3s;
        width: 300px;
    }
    .search-bar:focus {
        border-color: #5d4037;
        outline: none;
    }
    .swal2-popup {
        color: #000 !important;
    }
    .swal2-title {
        color: #000 !important;
    }
    .swal2-content {
        color: #000 !important;
    }
`;
document.head.appendChild(style);

// Estilos para mejorar visibilidad del mensaje de confirmación
const confirmStyle = document.createElement('style');
confirmStyle.textContent = `
    .swal2-popup {
        background: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #333 !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        z-index: 99999 !important;
        width: auto !important;
        max-width: 500px !important;
        padding: 20px !important;
    }
    .swal2-title {
        color: #000000 !important;
        font-weight: bold !important;
        font-size: 18px !important;
        text-shadow: none !important;
    }
    .swal2-html-container {
        color: #000000 !important;
        font-weight: bold !important;
    }
    .swal2-content {
        color: #000000 !important;
        font-size: 16px !important;
        font-weight: 500 !important;
    }
    .swal2-confirm {
        background: #dc3545 !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-cancel {
        background: #6c757d !important;
        color: #ffffff !important;
        border: none !important;
        font-weight: bold !important;
    }
    .swal2-container {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(confirmStyle);




