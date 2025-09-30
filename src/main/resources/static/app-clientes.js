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
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.clientes = await response.json();
                this.filtrarClientes();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
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
        limpiarFiltros() {
            this.filtroBusqueda = '';
            this.filtrarClientes();
        },
        async agregarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                const response = await fetch(`${config.apiBaseUrl}/clientes/agregar_cliente`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (response.ok) {
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente agregado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar cliente:', error);
                NotificationSystem.error(`Error al agregar cliente: ${error.message}`);
            }
        },
        async modificarCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.validarEmail(this.nuevoCliente.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            try {
                const clienteData = {
                    ...this.nuevoCliente,
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto)
                };
                const response = await fetch(`${config.apiBaseUrl}/clientes/actualizar_cliente/${this.nuevoCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                });
                if (response.ok) {
                    await this.fetchClientes();
                    this.toggleFormulario();
                    NotificationSystem.success('Cliente actualizado exitosamente');
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar cliente:', error);
                NotificationSystem.error(`Error al modificar cliente: ${error.message}`);
            }
        },
        async eliminarCliente(cliente) {
            NotificationSystem.confirm(`¿Eliminar cliente "${cliente.nombreCompleto}"?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/clientes/eliminar_cliente/${cliente.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await this.fetchClientes();
                        NotificationSystem.success('Cliente eliminado exitosamente');
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar cliente:', error);
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
            // Scroll al formulario
            this.$nextTick(() => {
                const formulario = document.querySelector('.form-container');
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
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
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Título
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Peluquería LUNA', 20, 20);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(16);
                doc.text('Lista de Clientes', 20, 35);
                
                // Fecha y total
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 15);
                doc.text(`Total de clientes: ${this.clientesFiltrados.length}`, 150, 25);
                
                // Línea decorativa
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(20, 45, 190, 45);
                
                let y = 60;
                
                // Lista de clientes
                this.clientesFiltrados.forEach((cliente, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${index + 1}. ${cliente.nombreCompleto}`, 20, y);
                    y += 8;
                    
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    
                    if (cliente.telefono) {
                        doc.text(`   Teléfono: ${cliente.telefono}`, 25, y);
                        y += 6;
                    }
                    if (cliente.ruc) {
                        doc.text(`   RUC: ${cliente.ruc}`, 25, y);
                        y += 6;
                    }
                    if (cliente.correo) {
                        doc.text(`   Email: ${cliente.correo}`, 25, y);
                        y += 6;
                    }
                    if (cliente.fechaNacimiento) {
                        doc.text(`   Fecha Nacimiento: ${this.formatearFecha(cliente.fechaNacimiento)}`, 25, y);
                        y += 6;
                    }
                    if (cliente.redesSociales) {
                        const redes = cliente.redesSociales.length > 50 ? 
                            cliente.redesSociales.substring(0, 50) + '...' : cliente.redesSociales;
                        doc.text(`   Redes Sociales: ${redes}`, 25, y);
                        y += 6;
                    }
                    y += 8;
                });
                
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(20, 280, 190, 280);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(8);
                    doc.text('Peluquería LUNA - Sistema de Gestión', 20, 290);
                    doc.text(`Página ${i} de ${pageCount}`, 170, 290);
                }
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`lista-clientes-${fecha}.pdf`);
                NotificationSystem.success('Lista de clientes exportada exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 class="page-title">Gestión de Clientes</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>
                <main style="padding: 20px;">
                    <div class="filters-container">
                        <div class="filter-group">
                            <label>Buscar Cliente:</label>
                            <input type="text" v-model="filtroBusqueda" @input="filtrarClientes" placeholder="Buscar por nombre, teléfono, RUC o email..." class="search-bar"/>
                        </div>
                        <div class="filter-group" style="flex-direction: row; gap: 10px; align-items: end;">
                            <button @click="limpiarFiltros" class="btn btn-secondary btn-small">Limpiar</button>
                            <button @click="toggleFormulario()" class="btn btn-small" v-if="!formularioVisible">Nuevo Cliente</button>
                            <button @click="exportarPDF" class="btn btn-small">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevoCliente.id ? 'Modificar Cliente - ' + clienteSeleccionado : 'Nuevo Cliente' }}</h3>
                        <label>Nombre Completo: *</label>
                        <input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Ingrese el nombre completo" required/>
                        <label>Teléfono:</label>
                        <input type="tel" v-model="nuevoCliente.telefono" placeholder="Ej: 0981234567" maxlength="10"/>
                        <label>RUC:</label>
                        <input type="text" v-model="nuevoCliente.ruc" placeholder="Ingrese el RUC" maxlength="20"/>
                        <label>Correo Electrónico:</label>
                        <input type="email" v-model="nuevoCliente.correo" placeholder="ejemplo@correo.com"/>
                        <label>Fecha de Nacimiento:</label>
                        <input type="date" v-model="nuevoCliente.fechaNacimiento" style="width: auto;"/>
                        <label>Redes Sociales:</label>
                        <textarea v-model="nuevoCliente.redesSociales" placeholder="Facebook, Instagram, etc." rows="3" style="width: auto; min-width: 250px; resize: vertical;"></textarea>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button @click="nuevoCliente.id ? modificarCliente() : agregarCliente()" class="btn">
                                {{ nuevoCliente.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">Cancelar</button>
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
                                    <button @click="cargarCliente(cliente)" class="btn-small">Editar</button>
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




