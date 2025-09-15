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
        }
    },
    template: '<div class="glass-container"><div><h1 style="text-align: center; margin-top: 60px; margin-bottom: 20px; color: #5d4037; font-weight: 800;"><i class="fas fa-users"></i> Panel Principal de Clientes</h1><button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button><main style="padding: 20px;"><div style="display: flex; justify-content: center; margin-bottom: 20px;"><button @click="toggleFrecuentes()" class="btn" style="background: #28a745;"><i class="fas fa-star"></i> {{ mostrarFrecuentes ? "Ocultar" : "Ver" }} Frecuentes</button></div><div v-if="mostrarFrecuentes" class="frequent-clients-section" style="margin-bottom: 30px;"><h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-star"></i> Clientes Frecuentes</h3><div v-if="cargandoFrecuentes" class="loading">Cargando clientes frecuentes...</div><div v-else class="frequent-clients-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;"><div v-for="(item, index) in clientesFrecuentes" :key="item.cliente.id" class="frequent-client-card" style="background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border: 2px solid #28a745; border-radius: 10px; padding: 15px; cursor: pointer;" @click="seleccionarCliente(item.cliente)"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><span style="background: #28a745; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">{{ index + 1 }}</span><span style="color: #28a745; font-weight: bold;">{{ item.cantidadVisitas }} visitas</span></div><h4 style="margin: 0 0 5px 0; color: #5d4037;">{{ item.cliente.nombreCompleto }}</h4><p style="margin: 0; color: #666; font-size: 14px;">Total gastado: ${{ formatearNumero(item.montoTotal) }}</p></div></div></div><div v-if="!mostrarHistorial"><h3 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-users"></i> Lista de Clientes ({{ clientesFiltrados.length }})</h3><div class="clients-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;"><div v-for="cliente in clientesPaginados" :key="cliente.id" class="client-card" style="background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border: 1px solid #ddd; border-radius: 10px; padding: 20px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" @click="seleccionarCliente(cliente)"><div style="display: flex; align-items: center; margin-bottom: 15px;"><div style="background: #5d4037; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 15px;"><i class="fas fa-user"></i></div><div><h4 style="margin: 0; color: #5d4037; font-size: 18px;">{{ cliente.nombreCompleto }}</h4></div></div><div class="client-info"><div style="margin-bottom: 8px;"><i class="fas fa-phone" style="color: #28a745; width: 20px;"></i><span>{{ cliente.telefono || "No registrado" }}</span></div><div style="margin-bottom: 8px;"><i class="fas fa-envelope" style="color: #007bff; width: 20px;"></i><span>{{ cliente.correo || "No registrado" }}</span></div><div style="margin-bottom: 8px;"><i class="fas fa-birthday-cake" style="color: #ff6b6b; width: 20px;"></i><span>{{ calcularEdad(cliente.fechaNacimiento) }}</span></div><div v-if="cliente.redesSociales" style="margin-bottom: 8px;"><i class="fas fa-share-alt" style="color: #8e44ad; width: 20px;"></i><span>{{ cliente.redesSociales }}</span></div></div><div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;"><small style="color: #28a745; font-weight: bold;"><i class="fas fa-mouse-pointer"></i> Click para ver historial</small></div></div></div><div class="pagination" style="margin-top: 30px;"><button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">Anterior</button><span>Página {{ paginaActual }} de {{ totalPaginas }}</span><button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">Siguiente</button></div></div><div v-if="mostrarHistorial && clienteSeleccionado"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;"><h3 style="color: #5d4037; margin: 0;"><i class="fas fa-history"></i> Historial de {{ clienteSeleccionado.nombreCompleto }}</h3><button @click="cerrarHistorial()" class="btn" style="background: #6c757d;"><i class="fas fa-times"></i> Cerrar</button></div><div class="client-detail-card" style="background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border: 2px solid #5d4037; border-radius: 10px; padding: 20px; margin-bottom: 20px;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;"><div><strong>Nombre:</strong> {{ clienteSeleccionado.nombreCompleto }}</div><div><strong>Teléfono:</strong> {{ clienteSeleccionado.telefono || "No registrado" }}</div><div><strong>Correo:</strong> {{ clienteSeleccionado.correo || "No registrado" }}</div><div><strong>Edad:</strong> {{ calcularEdad(clienteSeleccionado.fechaNacimiento) }}</div><div v-if="clienteSeleccionado.redesSociales"><strong>Redes Sociales:</strong> {{ clienteSeleccionado.redesSociales }}</div></div></div><div v-if="cargandoHistorial" class="loading" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</div><div v-else-if="historialServicios.length === 0" style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-info-circle"></i> No hay servicios registrados para este cliente</div><div v-else><h4 style="color: #5d4037; margin-bottom: 15px;"><i class="fas fa-list"></i> Servicios Recibidos ({{ historialServicios.length }})</h4><div class="services-timeline"><div v-for="(servicio, index) in historialServicios" :key="index" class="service-item" style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #5d4037;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; align-items: center;"><div><strong style="color: #5d4037;">{{ servicio.tipoServicio }}</strong><div style="font-size: 14px; color: #666;">{{ servicio.descripcion }}</div></div><div><i class="fas fa-calendar"></i> {{ formatearFecha(servicio.fecha) }}</div><div><i class="fas fa-dollar-sign"></i> ${{ formatearNumero(servicio.precioCobrado) }}</div><div><i class="fas fa-user-tie"></i> {{ servicio.colaborador }}</div><div><i class="fas fa-credit-card"></i> {{ servicio.metodoPago }}</div><div v-if="servicio.observaciones"><i class="fas fa-comment"></i> {{ servicio.observaciones }}</div></div></div></div></div></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.filters-container input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; } .client-card:hover { border-color: #5d4037 !important; transform: translateY(-5px); transition: all 0.3s; } .frequent-client-card:hover { border-color: #28a745 !important; transform: scale(1.02); transition: all 0.2s; } .loading { text-align: center; padding: 20px; color: #666; font-style: italic; } .service-item:hover { background: #f8f9fa !important; transform: translateX(5px); transition: all 0.2s; } @media (max-width: 768px) { .clients-grid { grid-template-columns: 1fr !important; } .frequent-clients-grid { grid-template-columns: 1fr !important; } .filters-container { flex-direction: column !important; } }';
document.head.appendChild(style);
