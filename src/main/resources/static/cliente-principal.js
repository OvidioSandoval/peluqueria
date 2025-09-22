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
            clientesFiltrados: [],
            clienteSeleccionado: null,
            historialServicios: [],
            clientesFrecuentes: [],
            paginaActual: 1,
            itemsPorPagina: 10,
            mostrarHistorial: false,
            mostrarFrecuentes: false,
            cargandoHistorial: false,
            cargandoFrecuentes: false,
            generandoPDF: false,
        };
    },
    mounted() {
        this.fetchClientes();
        this.fetchClientesFrecuentes();
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
                const response = await fetch(config.apiBaseUrl + '/clientes');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                this.clientes = await response.json();
                this.filtrarClientes();
            } catch (error) {
                console.error('Error al cargar clientes:', error);
                NotificationSystem.error('Error al cargar los clientes: ' + error.message);
            }
        },
        
        async fetchClientesFrecuentes() {
            try {
                this.cargandoFrecuentes = true;
                const response = await fetch(config.apiBaseUrl + '/ventas');
                if (!response.ok) throw new Error('Error ' + response.status + ': ' + response.statusText);
                const ventas = await response.json();
                
                const frecuenciaClientes = {};
                ventas.forEach(venta => {
                    if (venta.cliente && venta.cliente.id) {
                        const clienteId = venta.cliente.id;
                        if (!frecuenciaClientes[clienteId]) {
                            frecuenciaClientes[clienteId] = {
                                cliente: venta.cliente,
                                cantidadVisitas: 0,
                                montoTotal: 0
                            };
                        }
                        frecuenciaClientes[clienteId].cantidadVisitas++;
                        frecuenciaClientes[clienteId].montoTotal += venta.montoTotal || 0;
                    }
                });
                
                this.clientesFrecuentes = Object.values(frecuenciaClientes)
                    .sort((a, b) => b.cantidadVisitas - a.cantidadVisitas)
                    .slice(0, 10);
                    
            } catch (error) {
                console.error('Error al cargar clientes frecuentes:', error);
                NotificationSystem.error('Error al cargar clientes frecuentes: ' + error.message);
            } finally {
                this.cargandoFrecuentes = false;
            }
        },
        
        async fetchHistorialCliente(clienteId) {
            try {
                this.cargandoHistorial = true;
                const ventasResponse = await fetch(config.apiBaseUrl + '/ventas');
                const detalleVentasResponse = await fetch(config.apiBaseUrl + '/detalle-ventas');
                
                if (!ventasResponse.ok || !detalleVentasResponse.ok) {
                    throw new Error('Error al cargar datos del historial');
                }
                
                const ventas = await ventasResponse.json();
                const detalleVentas = await detalleVentasResponse.json();
                
                const ventasCliente = ventas.filter(venta => 
                    venta.cliente && venta.cliente.id === clienteId
                );
                
                this.historialServicios = [];
                for (const venta of ventasCliente) {
                    const detalles = detalleVentas.filter(detalle => detalle.venta && detalle.venta.id === venta.id);
                    
                    for (const detalle of detalles) {
                        this.historialServicios.push({
                            fecha: venta.fechaVenta,
                            tipoServicio: detalle.servicio ? detalle.servicio.nombre : 'Producto',
                            descripcion: detalle.servicio ? detalle.servicio.descripcion : (detalle.producto && detalle.producto.nombre) || 'N/A',
                            precioCobrado: detalle.precioUnitario || 0,
                            colaborador: venta.empleado ? venta.empleado.nombreCompleto : 'N/A',
                            metodoPago: venta.metodoPago || 'N/A',
                            observaciones: venta.observaciones || ''
                        });
                    }
                }
                
                this.historialServicios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                
            } catch (error) {
                console.error('Error al cargar historial:', error);
                NotificationSystem.error('Error al cargar el historial: ' + error.message);
            } finally {
                this.cargandoHistorial = false;
            }
        },
        
        filtrarClientes() {
            this.clientesFiltrados = this.clientes;
            this.paginaActual = 1;
        },
        
        seleccionarCliente(cliente) {
            this.clienteSeleccionado = cliente;
            this.mostrarHistorial = true;
            this.fetchHistorialCliente(cliente.id);
        },
        
        cerrarHistorial() {
            this.mostrarHistorial = false;
            this.clienteSeleccionado = null;
            this.historialServicios = [];
        },
        
        toggleFrecuentes() {
            this.mostrarFrecuentes = !this.mostrarFrecuentes;
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            const date = new Date(fecha);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES', {
                maximumFractionDigits: 0,
                useGrouping: true
            });
        },
        
        cambiarPagina(pagina) {
            if (pagina >= 1 && pagina <= this.totalPaginas) {
                this.paginaActual = pagina;
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
        },
        
        getColorMetodoPago(metodoPago) {
            const colores = {
                'Efectivo': 'green',
                'Tarjeta': 'blue',
                'Transferencia': 'purple',
                'N/A': 'grey'
            };
            return colores[metodoPago] || 'grey';
        },
        
        exportarPDF() {
            NotificationSystem.success('Función PDF disponible');
        }
    },
    template: `
        <v-app>
            <v-main>
                <v-container fluid>
                    <v-row>
                        <v-col cols="12">
                            <h1>Gestión de Clientes</h1>
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-btn @click="toggleFrecuentes" color="primary">
                                {{ mostrarFrecuentes ? 'Ocultar' : 'Mostrar' }} Clientes Frecuentes
                            </v-btn>
                        </v-col>
                    </v-row>
                    
                    <v-row v-if="mostrarFrecuentes">
                        <v-col cols="12">
                            <v-card>
                                <v-card-title>Clientes Frecuentes</v-card-title>
                                <v-card-text>
                                    <v-progress-circular v-if="cargandoFrecuentes" indeterminate></v-progress-circular>
                                    <v-list v-else>
                                        <v-list-item v-for="item in clientesFrecuentes" :key="item.cliente.id">
                                            <v-list-item-content>
                                                <v-list-item-title>{{ item.cliente.nombreCompleto }}</v-list-item-title>
                                                <v-list-item-subtitle>{{ item.cantidadVisitas }} visitas - {{ formatearNumero(item.montoTotal) }}</v-list-item-subtitle>
                                            </v-list-item-content>
                                            <v-list-item-action>
                                                <v-btn small @click="seleccionarCliente(item.cliente)">Ver Historial</v-btn>
                                            </v-list-item-action>
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-card>
                                <v-card-title>Lista de Clientes</v-card-title>
                                <v-card-text>
                                    <v-data-table
                                        :headers="[
                                            { text: 'Nombre', value: 'nombreCompleto' },
                                            { text: 'Teléfono', value: 'telefono' },
                                            { text: 'RUC', value: 'ruc' },
                                            { text: 'Email', value: 'correo' },
                                            { text: 'Edad', value: 'edad' },
                                            { text: 'Acciones', value: 'acciones', sortable: false }
                                        ]"
                                        :items="clientesPaginados"
                                        :items-per-page="itemsPorPagina"
                                        hide-default-footer
                                    >
                                        <template v-slot:item.telefono="{ item }">
                                            {{ item.telefono || 'N/A' }}
                                        </template>
                                        <template v-slot:item.ruc="{ item }">
                                            {{ item.ruc || 'N/A' }}
                                        </template>
                                        <template v-slot:item.correo="{ item }">
                                            {{ item.correo || 'N/A' }}
                                        </template>
                                        <template v-slot:item.edad="{ item }">
                                            {{ calcularEdad(item.fechaNacimiento) }}
                                        </template>
                                        <template v-slot:item.acciones="{ item }">
                                            <v-btn small color="primary" @click="seleccionarCliente(item)">Ver Historial</v-btn>
                                        </template>
                                    </v-data-table>
                                    
                                    <v-pagination
                                        v-model="paginaActual"
                                        :length="totalPaginas"
                                        @input="cambiarPagina"
                                        class="mt-4"
                                    ></v-pagination>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-dialog v-model="mostrarHistorial" max-width="1200px">
                        <v-card>
                            <v-card-title>
                                <span class="headline">Información del Cliente</span>
                                <v-spacer></v-spacer>
                                <v-btn icon @click="cerrarHistorial">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </v-card-title>
                            
                            <v-card-text v-if="clienteSeleccionado">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-card outlined>
                                            <v-card-title class="subtitle-1">Datos Personales</v-card-title>
                                            <v-card-text>
                                                <v-list dense>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Nombre Completo</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.nombreCompleto }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Teléfono</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.telefono || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>RUC</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.ruc || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Email</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.correo || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Redes Sociales</v-list-item-title>
                                                            <v-list-item-subtitle>{{ clienteSeleccionado.redesSociales || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Fecha de Nacimiento</v-list-item-title>
                                                            <v-list-item-subtitle>{{ formatearFecha(clienteSeleccionado.fechaNacimiento) || 'No registrado' }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Edad</v-list-item-title>
                                                            <v-list-item-subtitle>{{ calcularEdad(clienteSeleccionado.fechaNacimiento) }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-content>
                                                            <v-list-item-title>Cliente desde</v-list-item-title>
                                                            <v-list-item-subtitle>{{ formatearFecha(clienteSeleccionado.fechaCreacion) }}</v-list-item-subtitle>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                </v-list>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    
                                    <v-col cols="12" md="6">
                                        <v-card outlined>
                                            <v-card-title class="subtitle-1">Historial de Servicios</v-card-title>
                                            <v-card-text>
                                                <v-progress-circular v-if="cargandoHistorial" indeterminate></v-progress-circular>
                                                <div v-else-if="historialServicios.length === 0" class="text-center">
                                                    <p>No hay servicios registrados para este cliente</p>
                                                </div>
                                                <v-data-table
                                                    v-else
                                                    :headers="[
                                                        { text: 'Fecha', value: 'fecha' },
                                                        { text: 'Servicio', value: 'tipoServicio' },
                                                        { text: 'Precio', value: 'precioCobrado' },
                                                        { text: 'Método Pago', value: 'metodoPago' },
                                                        { text: 'Colaborador', value: 'colaborador' }
                                                    ]"
                                                    :items="historialServicios"
                                                    :items-per-page="5"
                                                    class="elevation-1"
                                                >
                                                    <template v-slot:item.fecha="{ item }">
                                                        {{ formatearFecha(item.fecha) }}
                                                    </template>
                                                    <template v-slot:item.precioCobrado="{ item }">
                                                        {{ formatearNumero(item.precioCobrado) }}
                                                    </template>
                                                    <template v-slot:item.metodoPago="{ item }">
                                                        <v-chip small :color="getColorMetodoPago(item.metodoPago)" text-color="white">
                                                            {{ item.metodoPago }}
                                                        </v-chip>
                                                    </template>
                                                </v-data-table>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-dialog>
                </v-container>
            </v-main>
        </v-app>
    `
});