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
            ventas: [],
            ventasFiltradas: [],
            clientes: [],
            empleados: [],
            filtroBusqueda: '',
            filtroFecha: new Date().toISOString().split('T')[0],
            paginaActual: 1,
            itemsPorPagina: 10,
            formularioVisible: false,
            nuevaVenta: { 
                id: null, 
                fechaVenta: null,
                cantidadArticulos: null,
                montoTotal: null,
                descuentoAplicado: 0,
                devolucion: false,
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: ''
            },
            ventaSeleccionada: '',
            intervalId: null,
            mostrarSalir: false,
        };
    },
    mounted() {
        this.fetchVentas();
        this.fetchClientes();
        this.fetchEmpleados();
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    computed: {
        totalPaginas() {
            return Math.ceil(this.ventasFiltradas.length / this.itemsPorPagina);
        },
        ventasPaginadas() {
            const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
            return this.ventasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
        },
        totalVentas() {
            return this.ventasFiltradas.reduce((sum, venta) => sum + (venta.montoTotal || 0), 0);
        }
    },
    methods: {
        async checkAuthAndRedirect() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/usuarios/usuario-sesion`);
                if (!response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                window.location.href = '/web/ventas';
            }
        },
        async fetchVentas() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/ventas`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                this.ventas = await response.json();
                this.filtrarVentas();
            } catch (error) {
                console.error('Error al cargar ventas:', error);
                NotificationSystem.error(`Error al cargar las ventas: ${error.message}`);
            }
        },

        async fetchClientes() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/clientes`);
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
            }
        },
        async fetchEmpleados() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/empleados`);
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error al cargar empleados:', error);
            }
        },
        filtrarVentas() {
            let filtradas = [...this.ventas];
            
            if (this.filtroBusqueda) {
                filtradas = filtradas.filter(venta =>
                    venta.id.toString().includes(this.filtroBusqueda) ||
                    venta.montoTotal.toString().includes(this.filtroBusqueda) ||
                    this.getClienteName(venta).toLowerCase().includes(this.filtroBusqueda.toLowerCase())
                );
            }
            
            if (this.filtroFecha) {
                filtradas = filtradas.filter(venta =>
                    venta.fechaVenta && venta.fechaVenta.startsWith(this.filtroFecha)
                );
            }
            
            this.ventasFiltradas = filtradas;
        },
        async agregarVenta() {
            if (!this.nuevaVenta.cantidadArticulos || !this.nuevaVenta.montoTotal) {
                NotificationSystem.error('Cantidad de artículos y monto total son requeridos');
                return;
            }
            try {
                const ventaData = {
                    fechaVenta: this.nuevaVenta.fechaVenta || new Date().toISOString(),
                    cantidadArticulos: parseInt(this.nuevaVenta.cantidadArticulos),
                    montoTotal: parseInt(this.nuevaVenta.montoTotal),
                    descuentoAplicado: parseInt(this.nuevaVenta.descuentoAplicado) || 0,
                    devolucion: this.nuevaVenta.devolucion,
                    cliente: this.nuevaVenta.clienteId ? { id: this.nuevaVenta.clienteId } : null,
                    empleado: this.nuevaVenta.empleadoId ? { id: this.nuevaVenta.empleadoId } : null,
                    metodoPago: this.capitalizarTexto(this.nuevaVenta.metodoPago),
                    observaciones: this.capitalizarTexto(this.nuevaVenta.observaciones)
                };
                const response = await fetch(`${config.apiBaseUrl}/ventas/agregar_venta`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ventaData)
                });
                if (response.ok) {
                    NotificationSystem.success('Venta agregada exitosamente');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al agregar venta:', error);
                NotificationSystem.error(`Error al agregar venta: ${error.message}`);
            }
        },
        async modificarVenta() {
            if (!this.nuevaVenta.cantidadArticulos || !this.nuevaVenta.montoTotal) {
                NotificationSystem.error('Cantidad de artículos y monto total son requeridos');
                return;
            }
            try {
                const ventaData = {
                    fechaVenta: this.nuevaVenta.fechaVenta || new Date().toISOString(),
                    cantidadArticulos: parseInt(this.nuevaVenta.cantidadArticulos),
                    montoTotal: parseInt(this.nuevaVenta.montoTotal),
                    descuentoAplicado: parseInt(this.nuevaVenta.descuentoAplicado) || 0,
                    devolucion: this.nuevaVenta.devolucion,
                    cliente: this.nuevaVenta.clienteId ? { id: this.nuevaVenta.clienteId } : null,
                    empleado: this.nuevaVenta.empleadoId ? { id: this.nuevaVenta.empleadoId } : null,
                    metodoPago: this.capitalizarTexto(this.nuevaVenta.metodoPago),
                    observaciones: this.capitalizarTexto(this.nuevaVenta.observaciones)
                };
                const response = await fetch(`${config.apiBaseUrl}/ventas/actualizar_venta/${this.nuevaVenta.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ventaData)
                });
                if (response.ok) {
                    NotificationSystem.success('Venta actualizada exitosamente');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error al modificar venta:', error);
                NotificationSystem.error(`Error al modificar venta: ${error.message}`);
            }
        },
        async eliminarVenta(venta) {
            NotificationSystem.confirm(`¿Eliminar venta ID ${venta.id}?`, async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/ventas/eliminar_venta/${venta.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        NotificationSystem.success('Venta eliminada exitosamente');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar venta:', error);
                    NotificationSystem.error(`Error al eliminar venta: ${error.message}`);
                }
            });
        },
        toggleFormulario() {
            if (this.formularioVisible) {
                setTimeout(() => window.location.reload(), 500);
            }
            this.formularioVisible = !this.formularioVisible;
            this.nuevaVenta = { 
                id: null, 
                fechaVenta: new Date().toISOString().slice(0, 16),
                cantidadArticulos: null,
                montoTotal: null,
                descuentoAplicado: 0,
                devolucion: false,
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: ''
            };
            this.ventaSeleccionada = '';
        },
        cargarVenta(venta) {
            this.nuevaVenta = {
                id: venta.id,
                fechaVenta: venta.fechaVenta,
                cantidadArticulos: venta.cantidadArticulos,
                montoTotal: venta.montoTotal,
                descuentoAplicado: venta.descuentoAplicado || 0,
                devolucion: venta.devolucion || false,
                clienteId: venta.cliente ? venta.cliente.id : null,
                empleadoId: venta.empleado ? venta.empleado.id : null,
                metodoPago: venta.metodoPago || 'EFECTIVO',
                observaciones: venta.observaciones || ''
            };
            this.formularioVisible = true;
            this.ventaSeleccionada = `Venta ${venta.id}`;
        },
        getClienteName(venta) {
            return venta.cliente ? venta.cliente.nombreCompleto || venta.cliente.nombre : '-';
        },
        getEmpleadoName(venta) {
            return venta.empleado ? venta.empleado.nombreCompleto || venta.empleado.nombre : '-';
        },
        getClienteNameById(clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            return cliente ? cliente.nombreCompleto || cliente.nombre : '-';
        },
        getEmpleadoNameById(empleadoId) {
            const empleado = this.empleados.find(e => e.id === empleadoId);
            return empleado ? empleado.nombreCompleto || empleado.nombre : '-';
        },
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
            }
        },

        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        formatearFecha(fecha) {
            return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        },
        startAutoRefresh() {
            this.intervalId = setInterval(() => {
                this.fetchVentas();
            }, 300000);
        },
        stopAutoRefresh() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        redirigirVentas() {
            window.location.href = '/web/ventas';
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
    },
    template: `
        <div class="glass-container">
            <div id="app">
                <h1 style="text-align: center; margin-top: 60px; margin-bottom: var(--space-8); color: #5d4037; text-shadow: 0 2px 4px rgba(255,255,255,0.9), 0 1px 2px rgba(93,64,55,0.4); font-weight: 800;">Gestión de Ventas</h1>
                <button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i></button>
                <main style="padding: 20px;">
                    <label>Buscar Venta:</label>
                    <input type="text" v-model="filtroBusqueda" @input="filtrarVentas" placeholder="Buscar por ID, monto o cliente..." class="search-bar"/>
                    <label>Filtrar por Fecha:</label>
                    <input type="date" v-model="filtroFecha" @change="filtrarVentas" class="search-bar"/>
                    <button @click="toggleFormulario()" class="btn" v-if="!formularioVisible">Nueva Venta</button>
                    
                    <div v-if="formularioVisible" class="form-container">
                        <h3>{{ nuevaVenta.id ? 'Modificar' : 'Agregar' }} Venta</h3>
                        <div v-if="nuevaVenta.id" class="info-section">
                            <p><strong>Cliente:</strong> {{ getClienteNameById(nuevaVenta.clienteId) }}</p>
                        </div>
                        <label>Cliente:</label>
                        <select v-model="nuevaVenta.clienteId">
                            <option value="" disabled>Seleccionar Cliente</option>
                            <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                                {{ cliente.nombreCompleto || cliente.nombre }}
                            </option>
                        </select>
                        <label>Empleado:</label>
                        <select v-model="nuevaVenta.empleadoId">
                            <option value="" disabled>Seleccionar Empleado</option>
                            <option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">
                                {{ empleado.nombreCompleto || empleado.nombre }}
                            </option>
                        </select>
                        <br>
                        <label>Fecha Venta:</label>
                        <br>
                        <input type="datetime-local" v-model="nuevaVenta.fechaVenta"/>
                        <br>
                        <label>Cantidad Artículos:</label>
                        <input type="number" v-model="nuevaVenta.cantidadArticulos" placeholder="Cantidad de artículos" required/>
                        <label>Monto Total:</label>
                        <input type="number" v-model="nuevaVenta.montoTotal" placeholder="Monto total" required/>
                        <label>Descuento Aplicado:</label>
                        <input type="number" v-model="nuevaVenta.descuentoAplicado" placeholder="Descuento aplicado"/>
                        <label>Método Pago:</label>
                        <select v-model="nuevaVenta.metodoPago">
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                        <br><br>
                        <label>Observaciones:</label>
                        <textarea v-model="nuevaVenta.observaciones" placeholder="Observaciones"></textarea>
                        <br>
                        <label>Devolución:</label>
                        <select v-model="nuevaVenta.devolucion">
                            <option :value="false">No</option>
                            <option :value="true">Sí</option>
                        </select>
                        <br><br>
                        <div class="form-buttons">
                            <button @click="nuevaVenta.id ? modificarVenta() : agregarVenta()" class="btn">
                                {{ nuevaVenta.id ? 'Modificar' : 'Agregar' }}
                            </button>
                            <button @click="toggleFormulario()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Empleado</th>
                                <th>Fecha</th>
                                <th>Monto Total</th>
                                <th>Método Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="venta in ventasPaginadas" :key="venta.id">
                                <td>{{ venta.id }}</td>
                                <td>{{ getClienteName(venta) }}</td>
                                <td>{{ getEmpleadoName(venta) }}</td>
                                <td>{{ formatearFecha(venta.fechaVenta) }}</td>
                                <td>{{ formatearNumero(venta.montoTotal) }}</td>
                                <td>{{ venta.metodoPago }}</td>
                                <td>
                                    <button @click="cargarVenta(venta)" class="btn-small">Editar</button>
                                    <button @click="eliminarVenta(venta)" class="btn-small btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="pagination">
                        <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button>
                        <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                        <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button>
                    </div>
                    
                    <div class="total">
                        <strong>Total: {{ formatearNumero(totalVentas) }}</strong>
                    </div>
                </main>
            </div>
        </div>
    `
});
// Estilos adicionales para el formulario
const style = document.createElement('style');
style.textContent = `
    .info-section {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        border-left: 4px solid #007bff;
    }
    .info-section p {
        margin: 5px 0;
        color: #333;
    }
`;
document.head.appendChild(style);