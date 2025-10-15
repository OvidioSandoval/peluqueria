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
            empleados: [],
            servicios: [],
            productos: [],
            venta: {
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: '',
                descuentoAplicado: 0
            },
            detalles: [],
            nuevoDetalle: {
                tipo: 'servicio',
                servicioId: null,
                productoId: null,
                cantidad: 1,
                precio: 0,
                descuento: 0
            },
            mostrarFormDetalle: false,
            cargando: false,
            mostrarFormCliente: false,
            nuevoCliente: {
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null
            },
            mostrarFormEmpleado: false,
            areas: [],
            nuevoEmpleado: {
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                totalPagado: 0,
                activo: true,
                fechaIngreso: new Date().toISOString().split('T')[0]
            },
            mostrarFormServicio: false,
            categorias: [],
            nuevoServicio: {
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null
            },
            mostrarFormProducto: false,
            nuevoProducto: {
                nombre: '',
                descripcion: '',
                precioCompra: 0,
                precioVenta: 0,
                cantidadStockInicial: 0,
                cantidadOptimaStock: null,
                minimoStock: null,
                activo: true,
                enPromocion: false,
                precioPromocion: null
            },
            // Mensajes de confirmación para datos existentes
            mensajeConfirmacion: null,
            tipoConfirmacion: null,
            datosExistentes: null
        };
    },
    mounted() {
        this.fetchClientes();
        this.fetchEmpleados();
        this.fetchServicios();
        this.fetchProductos();
        this.fetchAreas();
        this.fetchCategorias();
    },
    computed: {
        subtotal() {
            return this.detalles.reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precio), 0);
        },
        totalDescuentos() {
            return this.detalles.reduce((sum, detalle) => sum + (detalle.descuento || 0), 0) + (this.venta.descuentoAplicado || 0);
        },
        total() {
            return this.subtotal - this.totalDescuentos;
        },
        cantidadArticulos() {
            return this.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
        }
    },
    methods: {
        async fetchClientes() {
            try {
                const response = await fetch(config.apiBaseUrl + '/clientes');
                if (!response.ok) throw new Error('Error al cargar clientes');
                this.clientes = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar clientes');
            }
        },
        
        async fetchEmpleados() {
            try {
                const response = await fetch(config.apiBaseUrl + '/empleados');
                if (!response.ok) throw new Error('Error al cargar empleados');
                this.empleados = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar empleados');
            }
        },
        
        async fetchServicios() {
            try {
                const response = await fetch(config.apiBaseUrl + '/servicios');
                if (!response.ok) throw new Error('Error al cargar servicios');
                this.servicios = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar servicios');
            }
        },
        
        async fetchProductos() {
            try {
                const response = await fetch(config.apiBaseUrl + '/productos');
                if (!response.ok) throw new Error('Error al cargar productos');
                this.productos = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar productos');
            }
        },
        
        async fetchAreas() {
            try {
                const response = await fetch(config.apiBaseUrl + '/areas');
                if (!response.ok) throw new Error('Error al cargar areas');
                this.areas = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar areas');
            }
        },
        
        async fetchCategorias() {
            try {
                const response = await fetch(config.apiBaseUrl + '/categoria-servicios');
                if (!response.ok) throw new Error('Error al cargar categorias');
                this.categorias = await response.json();
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al cargar categorias');
            }
        },
        
        agregarDetalle() {
            if (this.nuevoDetalle.tipo === 'servicio' && !this.nuevoDetalle.servicioId) {
                NotificationSystem.error('Seleccione un servicio');
                return;
            }
            if (this.nuevoDetalle.tipo === 'producto' && !this.nuevoDetalle.productoId) {
                NotificationSystem.error('Seleccione un producto');
                return;
            }
            
            // Verificar stock disponible para productos
            if (this.nuevoDetalle.tipo === 'producto') {
                const producto = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
                if (producto && producto.cantidadStock < this.nuevoDetalle.cantidad) {
                    NotificationSystem.error(`Stock insuficiente. Disponible: ${producto.cantidadStock}`);
                    return;
                }
            }
            
            let item = null;
            if (this.nuevoDetalle.tipo === 'servicio') {
                item = this.servicios.find(s => s.id === this.nuevoDetalle.servicioId);
            } else {
                item = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
            }
            
            const detalle = {
                tipo: this.nuevoDetalle.tipo,
                item: item,
                cantidad: this.nuevoDetalle.cantidad,
                precio: this.nuevoDetalle.precio || (item ? (this.nuevoDetalle.tipo === 'servicio' ? item.precioBase : item.precioVenta || item.precio) || 0 : 0),
                descuento: this.nuevoDetalle.descuento || 0
            };
            
            this.detalles.push(detalle);
            this.limpiarFormDetalle();
            this.mostrarFormDetalle = false;
        },
        
        eliminarDetalle(index) {
            this.detalles.splice(index, 1);
        },
        
        limpiarFormDetalle() {
            this.nuevoDetalle = {
                tipo: this.nuevoDetalle.tipo || 'servicio',
                servicioId: null,
                productoId: null,
                cantidad: 1,
                precio: 0,
                descuento: 0
            };
        },
        
        onTipoChange() {
            this.nuevoDetalle.servicioId = null;
            this.nuevoDetalle.productoId = null;
            this.nuevoDetalle.precio = 0;
        },
        
        onItemChange() {
            if (this.nuevoDetalle.tipo === 'servicio' && this.nuevoDetalle.servicioId) {
                const servicio = this.servicios.find(s => s.id === this.nuevoDetalle.servicioId);
                this.nuevoDetalle.precio = servicio ? servicio.precioBase || 0 : 0;
            } else if (this.nuevoDetalle.tipo === 'producto' && this.nuevoDetalle.productoId) {
                const producto = this.productos.find(p => p.id === this.nuevoDetalle.productoId);
                this.nuevoDetalle.precio = producto ? producto.precioVenta || producto.precio || 0 : 0;
            }
        },
        
        async guardarVenta() {
            if (!this.venta.clienteId) {
                NotificationSystem.error('Seleccione un cliente');
                return;
            }
            if (!this.venta.empleadoId) {
                NotificationSystem.error('Seleccione un empleado');
                return;
            }
            if (this.detalles.length === 0) {
                NotificationSystem.error('Agregue al menos un servicio o producto');
                return;
            }
            
            try {
                this.cargando = true;
                
                const ventaData = {
                    fechaVenta: new Date().toISOString(),
                    cantidadArticulos: this.cantidadArticulos,
                    montoTotal: this.total,
                    descuentoAplicado: this.venta.descuentoAplicado || 0,
                    devolucion: false,
                    cliente: { id: this.venta.clienteId },
                    empleado: { id: this.venta.empleadoId },
                    metodoPago: this.venta.metodoPago,
                    observaciones: this.venta.observaciones || ''
                };
                
                const ventaResponse = await fetch(config.apiBaseUrl + '/ventas/agregar_venta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ventaData)
                });
                
                if (!ventaResponse.ok) throw new Error('Error al crear la venta');
                const ventaCreada = await ventaResponse.json();
                
                for (const detalle of this.detalles) {
                    const detalleData = {
                        venta: { id: ventaCreada.id },
                        servicio: detalle.tipo === 'servicio' ? { id: detalle.item.id } : null,
                        producto: detalle.tipo === 'producto' ? { id: detalle.item.id } : null,
                        cantidad: detalle.cantidad,
                        precioUnitarioBruto: detalle.precio,
                        precioTotal: detalle.cantidad * detalle.precio,
                        descuento: detalle.descuento || 0,
                        precioUnitarioNeto: detalle.precio - (detalle.descuento || 0)
                    };
                    
                    const detalleResponse = await fetch(config.apiBaseUrl + '/detalle-ventas/agregar_detalle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(detalleData)
                    });
                    
                    if (!detalleResponse.ok) throw new Error('Error al crear detalle de venta');
                    
                    // Descontar stock si es producto
                    if (detalle.tipo === 'producto') {
                        const stockResponse = await fetch(config.apiBaseUrl + `/productos/descontar_stock/${detalle.item.id}/${detalle.cantidad}`, {
                            method: 'PUT'
                        });
                        if (!stockResponse.ok) {
                            console.warn(`Advertencia: No se pudo actualizar el stock del producto ${detalle.item.nombre}`);
                        }
                    }
                }
                
                NotificationSystem.success('Venta registrada exitosamente');
                await this.fetchProductos(); // Actualizar lista de productos con nuevo stock
                this.limpiarFormulario();
                
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al guardar la venta: ' + error.message);
            } finally {
                this.cargando = false;
            }
        },
        
        limpiarFormulario() {
            this.venta = {
                clienteId: null,
                empleadoId: null,
                metodoPago: 'EFECTIVO',
                observaciones: '',
                descuentoAplicado: 0
            };
            this.detalles = [];
            this.limpiarFormDetalle();
            this.mostrarFormDetalle = false;
            this.mostrarFormCliente = false;
            this.limpiarFormCliente();
            this.mostrarFormEmpleado = false;
            this.limpiarFormEmpleado();
            this.mostrarFormServicio = false;
            this.limpiarFormServicio();
            this.mostrarFormProducto = false;
            this.limpiarFormProducto();
        },
        
        formatearNumero(numero) {
            return Number(numero).toLocaleString('es-ES');
        },
        
        getNombreCliente(clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            return cliente ? cliente.nombreCompleto : '';
        },
        
        getNombreEmpleado(empleadoId) {
            const empleado = this.empleados.find(e => e.id === empleadoId);
            return empleado ? empleado.nombreCompleto : '';
        },
        
        async agregarNuevoCliente() {
            if (!this.nuevoCliente.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (this.nuevoCliente.correo && !this.validarEmail(this.nuevoCliente.correo)) {
                NotificationSystem.error('Por favor ingrese un email válido');
                return;
            }
            
            // Verificar si el cliente ya existe (solo si no estamos editando)
            if (!this.nuevoCliente.id) {
                // Verificar por nombre
                const clienteExistentePorNombre = this.clientes.find(c => 
                    c.nombreCompleto.toLowerCase() === this.nuevoCliente.nombreCompleto.trim().toLowerCase()
                );
                if (clienteExistentePorNombre) {
                    this.mostrarConfirmacionDatos(
                        `El cliente "${clienteExistentePorNombre.nombreCompleto}" ya existe. ¿Desea modificar los datos y guardarlo en la base de datos?`,
                        'cliente',
                        clienteExistentePorNombre
                    );
                    return;
                }
                
                // Verificar por RUC si se ingresó
                if (this.nuevoCliente.ruc && this.nuevoCliente.ruc.trim()) {
                    const clienteExistentePorRuc = this.clientes.find(c => 
                        c.ruc && c.ruc.toLowerCase() === this.nuevoCliente.ruc.trim().toLowerCase()
                    );
                    if (clienteExistentePorRuc) {
                        this.mostrarConfirmacionDatos(
                            `Ya existe un cliente con el RUC "${this.nuevoCliente.ruc}": ${clienteExistentePorRuc.nombreCompleto}. ¿Desea modificar los datos y guardarlo en la base de datos?`,
                            'cliente',
                            clienteExistentePorRuc
                        );
                        return;
                    }
                }
                
                // Verificar por correo si se ingresó
                if (this.nuevoCliente.correo && this.nuevoCliente.correo.trim()) {
                    const clienteExistentePorCorreo = this.clientes.find(c => 
                        c.correo && c.correo.toLowerCase() === this.nuevoCliente.correo.trim().toLowerCase()
                    );
                    if (clienteExistentePorCorreo) {
                        this.mostrarConfirmacionDatos(
                            `Ya existe un cliente con el correo "${this.nuevoCliente.correo}": ${clienteExistentePorCorreo.nombreCompleto}. ¿Desea modificar los datos y guardarlo en la base de datos?`,
                            'cliente',
                            clienteExistentePorCorreo
                        );
                        return;
                    }
                }
            }
            
            try {
                const clienteData = {
                    nombreCompleto: this.capitalizarTexto(this.nuevoCliente.nombreCompleto),
                    telefono: this.nuevoCliente.telefono || '',
                    ruc: this.nuevoCliente.ruc || '',
                    correo: this.nuevoCliente.correo || '',
                    redesSociales: this.nuevoCliente.redesSociales || '',
                    fechaNacimiento: this.nuevoCliente.fechaNacimiento || null
                };
                
                let response, mensaje;
                if (this.nuevoCliente.id) {
                    response = await fetch(config.apiBaseUrl + `/clientes/actualizar_cliente/${this.nuevoCliente.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clienteData)
                    });
                    mensaje = 'Cliente actualizado exitosamente';
                } else {
                    response = await fetch(config.apiBaseUrl + '/clientes/agregar_cliente', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clienteData)
                    });
                    mensaje = 'Cliente agregado exitosamente';
                }
                
                if (response.ok) {
                    const clienteResult = await response.json();
                    NotificationSystem.success(mensaje);
                    this.limpiarFormCliente();
                    this.mostrarFormCliente = false;
                    await this.fetchClientes();
                    this.venta.clienteId = clienteResult.id;
                } else {
                    throw new Error('Error al procesar el cliente');
                }
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al procesar cliente: ' + error.message);
            }
        },
        
        limpiarFormCliente() {
            this.nuevoCliente = {
                id: null,
                nombreCompleto: '',
                telefono: '',
                ruc: '',
                correo: '',
                redesSociales: '',
                fechaNacimiento: null,
                isExisting: false
            };
        },
        
        validarEmail(email) {
            if (!email) return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        },
        
        async agregarNuevoEmpleado() {
            if (!this.nuevoEmpleado.nombreCompleto.trim()) {
                NotificationSystem.error('El nombre completo es obligatorio');
                return;
            }
            if (!this.nuevoEmpleado.area) {
                NotificationSystem.error('El área es obligatoria');
                return;
            }
            if (this.nuevoEmpleado.correo && !this.validarEmail(this.nuevoEmpleado.correo)) {
                NotificationSystem.error('El formato del correo electrónico no es válido');
                return;
            }
            
            // Verificar si el empleado ya existe (solo si no estamos editando)
            if (!this.nuevoEmpleado.id) {
                const empleadoExistente = this.empleados.find(e => 
                    e.nombreCompleto.toLowerCase() === this.nuevoEmpleado.nombreCompleto.trim().toLowerCase()
                );
                if (empleadoExistente) {
                    this.mostrarConfirmacionDatos(
                        `El empleado "${empleadoExistente.nombreCompleto}" ya existe. ¿Desea modificar los datos y guardarlo en la base de datos?`,
                        'empleado',
                        empleadoExistente
                    );
                    return;
                }
            }
            
            try {
                const empleadoData = {
                    nombreCompleto: this.capitalizarTexto(this.nuevoEmpleado.nombreCompleto),
                    correo: this.nuevoEmpleado.correo || '',
                    telefono: this.nuevoEmpleado.telefono || '',
                    area: this.nuevoEmpleado.area,
                    sueldoBase: this.nuevoEmpleado.id ? this.nuevoEmpleado.sueldoBase : (parseInt(this.nuevoEmpleado.sueldoBase) || 0),
                    comisionPorcentaje: this.nuevoEmpleado.id ? this.nuevoEmpleado.comisionPorcentaje : (parseInt(this.nuevoEmpleado.comisionPorcentaje) || 0),
                    totalPagado: this.nuevoEmpleado.id ? this.nuevoEmpleado.totalPagado : (parseInt(this.nuevoEmpleado.totalPagado) || 0),
                    activo: this.nuevoEmpleado.activo,
                    fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0]
                };
                
                let response, mensaje;
                if (this.nuevoEmpleado.id) {
                    response = await fetch(config.apiBaseUrl + `/empleados/actualizar_empleado/${this.nuevoEmpleado.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(empleadoData)
                    });
                    mensaje = 'Empleado actualizado exitosamente';
                } else {
                    response = await fetch(config.apiBaseUrl + '/empleados/agregar_empleado', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(empleadoData)
                    });
                    mensaje = 'Empleado agregado exitosamente';
                }
                
                if (response.ok) {
                    const empleadoResult = await response.json();
                    NotificationSystem.success(mensaje);
                    this.limpiarFormEmpleado();
                    this.mostrarFormEmpleado = false;
                    await this.fetchEmpleados();
                    this.venta.empleadoId = empleadoResult.id;
                } else {
                    throw new Error('Error al procesar el empleado');
                }
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al procesar empleado: ' + error.message);
            }
        },
        
        limpiarFormEmpleado() {
            this.nuevoEmpleado = {
                id: null,
                nombreCompleto: '',
                correo: '',
                telefono: '',
                area: null,
                sueldoBase: 0,
                comisionPorcentaje: 0,
                totalPagado: 0,
                activo: true,
                fechaIngreso: new Date().toISOString().split('T')[0],
                isExisting: false
            };
        },
        
        async agregarNuevoServicio() {
            if (!this.nuevoServicio.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoServicio.precioBase || this.nuevoServicio.precioBase <= 0) {
                NotificationSystem.error('El precio base debe ser mayor a 0');
                return;
            }
            
            // Verificar si el servicio ya existe (solo si no estamos editando)
            if (!this.nuevoServicio.id) {
                const servicioExistente = this.servicios.find(s => 
                    s.nombre.toLowerCase() === this.nuevoServicio.nombre.trim().toLowerCase()
                );
                if (servicioExistente) {
                    this.mostrarConfirmacionDatos(
                        `Ya existe un servicio con el nombre "${this.nuevoServicio.nombre}". ¿Desea modificar los datos y guardarlo en la base de datos?`,
                        'servicio',
                        servicioExistente
                    );
                    return;
                }
            }
            
            try {
                const categoriaId = this.nuevoServicio.categoriaId || (this.nuevoServicio.categoria?.id);
                
                // Validar que se seleccione una categoría
                if (!categoriaId) {
                    NotificationSystem.error('Debe seleccionar una categoría');
                    return;
                }
                
                const servicioData = {
                    nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                    precioBase: this.nuevoServicio.id ? this.nuevoServicio.precioBase : parseInt(this.nuevoServicio.precioBase),
                    activo: this.nuevoServicio.activo,
                    categoria: { id: categoriaId }
                };
                
                let response, mensaje;
                if (this.nuevoServicio.id) {
                    const servicioUpdateData = {
                        nombre: this.capitalizarTexto(this.nuevoServicio.nombre.trim()),
                        descripcion: this.capitalizarTexto(this.nuevoServicio.descripcion ? this.nuevoServicio.descripcion.trim() : ''),
                        precioBase: this.nuevoServicio.precioBase,
                        activo: this.nuevoServicio.activo,
                        categoria: this.nuevoServicio.categoria
                    };
                    response = await fetch(config.apiBaseUrl + `/servicios/actualizar_servicio/${this.nuevoServicio.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(servicioUpdateData)
                    });
                    mensaje = 'Servicio actualizado exitosamente';
                } else {
                    response = await fetch(config.apiBaseUrl + '/servicios/agregar_servicio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(servicioData)
                    });
                    mensaje = 'Servicio agregado exitosamente';
                }
                
                if (response.ok) {
                    const servicioResult = await response.json();
                    NotificationSystem.success(mensaje);
                    this.limpiarFormServicio();
                    this.mostrarFormServicio = false;
                    await this.fetchServicios();
                    this.nuevoDetalle.servicioId = servicioResult.id;
                    this.nuevoDetalle.tipo = 'servicio';
                    this.onItemChange();
                } else {
                    throw new Error('Error al procesar el servicio');
                }
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al procesar servicio: ' + error.message);
            }
        },
        
        limpiarFormServicio() {
            this.nuevoServicio = {
                id: null,
                nombre: '',
                descripcion: '',
                precioBase: 0,
                activo: true,
                categoriaId: null,
                isExisting: false
            };
        },
        
        async agregarNuevoProducto() {
            if (!this.nuevoProducto.nombre.trim()) {
                NotificationSystem.error('El nombre es requerido');
                return;
            }
            if (!this.nuevoProducto.precioCompra || this.nuevoProducto.precioCompra <= 0) {
                NotificationSystem.error('El precio de compra debe ser mayor a 0');
                return;
            }
            if (!this.nuevoProducto.precioVenta || this.nuevoProducto.precioVenta <= 0) {
                NotificationSystem.error('El precio de venta debe ser mayor a 0');
                return;
            }
            if (this.nuevoProducto.cantidadStockInicial === null || this.nuevoProducto.cantidadStockInicial < 0) {
                NotificationSystem.error('El stock inicial debe ser mayor o igual a 0');
                return;
            }
            
            // Verificar si el producto ya existe (solo si no estamos editando)
            if (!this.nuevoProducto.id) {
                const productoExistente = this.productos.find(p => 
                    p.nombre.toLowerCase() === this.nuevoProducto.nombre.trim().toLowerCase()
                );
                if (productoExistente) {
                    this.mostrarConfirmacionDatos(
                        `Ya existe un producto con el nombre "${this.nuevoProducto.nombre}". ¿Desea modificar los datos y guardarlo en la base de datos?`,
                        'producto',
                        productoExistente
                    );
                    return;
                }
            }
            
            try {
                const productoData = {
                    nombre: this.capitalizarTexto(this.nuevoProducto.nombre.trim()),
                    descripcion: this.capitalizarTexto(this.nuevoProducto.descripcion ? this.nuevoProducto.descripcion.trim() : ''),
                    precioCompra: this.nuevoProducto.id ? this.nuevoProducto.precioCompra : parseInt(this.nuevoProducto.precioCompra),
                    precioVenta: this.nuevoProducto.id ? this.nuevoProducto.precioVenta : parseInt(this.nuevoProducto.precioVenta),
                    cantidadStockInicial: this.nuevoProducto.id ? this.nuevoProducto.cantidadStockInicial : parseInt(this.nuevoProducto.cantidadStockInicial),
                    cantidadOptimaStock: this.nuevoProducto.cantidadOptimaStock ? (this.nuevoProducto.id ? this.nuevoProducto.cantidadOptimaStock : parseInt(this.nuevoProducto.cantidadOptimaStock)) : null,
                    minimoStock: this.nuevoProducto.minimoStock ? (this.nuevoProducto.id ? this.nuevoProducto.minimoStock : parseInt(this.nuevoProducto.minimoStock)) : null,
                    activo: this.nuevoProducto.activo,
                    enPromocion: this.nuevoProducto.enPromocion,
                    precioPromocion: this.nuevoProducto.precioPromocion ? (this.nuevoProducto.id ? this.nuevoProducto.precioPromocion : parseInt(this.nuevoProducto.precioPromocion)) : null
                };
                
                let response, mensaje;
                if (this.nuevoProducto.id) {
                    response = await fetch(config.apiBaseUrl + `/productos/actualizar_producto/${this.nuevoProducto.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productoData)
                    });
                    mensaje = 'Producto actualizado exitosamente';
                } else {
                    response = await fetch(config.apiBaseUrl + '/productos/agregar_producto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productoData)
                    });
                    mensaje = 'Producto agregado exitosamente';
                }
                
                if (response.ok) {
                    const productoResult = await response.json();
                    NotificationSystem.success(mensaje);
                    this.limpiarFormProducto();
                    this.mostrarFormProducto = false;
                    await this.fetchProductos();
                    this.nuevoDetalle.productoId = productoResult.id;
                    this.nuevoDetalle.tipo = 'producto';
                    this.onItemChange();
                } else {
                    throw new Error('Error al procesar el producto');
                }
            } catch (error) {
                console.error('Error:', error);
                NotificationSystem.error('Error al procesar producto: ' + error.message);
            }
        },
        
        limpiarFormProducto() {
            this.nuevoProducto = {
                id: null,
                nombre: '',
                descripcion: '',
                precioCompra: 0,
                precioVenta: 0,
                cantidadStockInicial: 0,
                cantidadOptimaStock: null,
                minimoStock: null,
                activo: true,
                enPromocion: false,
                precioPromocion: null,
                isExisting: false
            };
        },
        
        mostrarConfirmacionDatos(mensaje, tipo, datosExistentes) {
            this.mensajeConfirmacion = mensaje;
            this.tipoConfirmacion = tipo;
            this.datosExistentes = datosExistentes;
        },
        
        confirmarModificacion() {
            if (this.tipoConfirmacion === 'cliente') {
                this.nuevoCliente = { ...this.datosExistentes, id: this.datosExistentes.id, isExisting: true };
                if (this.datosExistentes.fechaNacimiento && Array.isArray(this.datosExistentes.fechaNacimiento)) {
                    const [year, month, day] = this.datosExistentes.fechaNacimiento;
                    this.nuevoCliente.fechaNacimiento = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            } else if (this.tipoConfirmacion === 'empleado') {
                this.nuevoEmpleado = { ...this.datosExistentes, area: this.datosExistentes.area, id: this.datosExistentes.id, isExisting: true };
            } else if (this.tipoConfirmacion === 'servicio') {
                this.nuevoServicio = { 
                    ...this.datosExistentes, 
                    categoriaId: this.datosExistentes.categoriaId, 
                    categoria: this.categorias.find(c => c.id === this.datosExistentes.categoriaId),
                    id: this.datosExistentes.id, 
                    isExisting: true 
                };
            } else if (this.tipoConfirmacion === 'producto') {
                this.nuevoProducto = { ...this.datosExistentes, id: this.datosExistentes.id, isExisting: true };
            }
            this.cerrarConfirmacion();
        },
        
        cerrarConfirmacion() {
            this.mensajeConfirmacion = null;
            this.tipoConfirmacion = null;
            this.datosExistentes = null;
        },
        
        exportarPDF() {
            if (!this.venta.clienteId || !this.venta.empleadoId) {
                NotificationSystem.error('Complete la información de cliente y empleado');
                return;
            }
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
                doc.text('REGISTRO DE VENTA', 105, 40, { align: 'center' });
                
                // Información del reporte
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 55);
                doc.text(`Total de artículos: ${this.cantidadArticulos}`, 20, 62);
                
                // Información del cliente y empleado
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Cliente: ${this.getNombreCliente(this.venta.clienteId)}`, 20, 75);
                doc.text(`Empleado: ${this.getNombreEmpleado(this.venta.empleadoId)}`, 20, 85);
                doc.text(`Método de Pago: ${this.venta.metodoPago}`, 120, 75);
                
                if (this.venta.descuentoAplicado > 0) {
                    doc.text(`Descuento General: ${this.formatearNumero(this.venta.descuentoAplicado)}`, 120, 85);
                }
                
                // Tabla de detalles
                if (this.detalles.length > 0) {
                    const headers = [['TIPO', 'ITEM', 'CANT.', 'PRECIO UNIT.', 'DESCUENTO', 'SUBTOTAL']];
                    const data = this.detalles.map((detalle) => [
                        detalle.tipo.toUpperCase(),
                        detalle.item.nombre || '',
                        detalle.cantidad.toString(),
                        this.formatearNumero(detalle.precio),
                        this.formatearNumero(detalle.descuento || 0),
                        this.formatearNumero(detalle.cantidad * detalle.precio)
                    ]);
                    
                    const tableConfig = {
                        head: headers,
                        body: data,
                        startY: 95,
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
                            0: { cellWidth: 'auto', halign: 'center' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 'auto', halign: 'center' },
                            3: { cellWidth: 'auto', halign: 'right' },
                            4: { cellWidth: 'auto', halign: 'right' },
                            5: { cellWidth: 'auto', halign: 'right' }
                        },
                        margin: { bottom: 40 },
                        foot: [['', '', '', 'SUBTOTAL:', this.formatearNumero(this.totalDescuentos), this.formatearNumero(this.subtotal)],
                               ['', '', '', 'DESCUENTOS:', '', this.formatearNumero(this.totalDescuentos)],
                               ['', '', '', 'TOTAL FINAL:', '', this.formatearNumero(this.total)]],
                        footStyles: { 
                            fontSize: 10,
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            font: 'helvetica',
                            halign: 'right'
                        }
                    };
                    
                    doc.autoTable(tableConfig);
                }
                
                // Footer profesional
                const pageHeight = doc.internal.pageSize.height;
                doc.setLineWidth(0.5);
                doc.line(20, pageHeight - 25, 190, pageHeight - 25);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Página 1 de 1', 20, pageHeight - 15);
                doc.text(new Date().toLocaleTimeString('es-ES'), 190, pageHeight - 15, { align: 'right' });
                
                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`registro-venta-${fecha}.pdf`);
                NotificationSystem.success('Registro de venta exportado exitosamente');
                
            } catch (error) {
                console.error('Error al generar PDF:', error);
                NotificationSystem.error('Error al generar el PDF: ' + error.message);
            }
        }
    },
    template: '<div class="page-container">' +
        '<div><h1 class="page-title">Registro de Venta</h1>' +
        '<button @click="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Volver</button>' +
        '<main class="main-content">' +
        '<div class="form-container" style="padding: 10px;">' +
        '<h3 style="color: #5d4037; margin-bottom: 8px; font-size: 16px;"><i class="fas fa-user"></i> Información de la Venta</h3>' +
        '<div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: end; width: 100%;">' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 250px;">' +
        '<label>Cliente *</label>' +
        '<div style="display: flex; gap: 4px;">' +
        '<select v-model="venta.clienteId" required class="search-bar" style="height: 40px; font-size: 14px; flex: 1; padding: 8px;">' +
        '<option value="" disabled>Seleccionar Cliente</option>' +
        '<option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombreCompleto }}</option></select>' +
        '<button @click="mostrarFormCliente = true" class="btn btn-secondary" style="height: 40px; padding: 4px 8px; font-size: 12px; min-width: 32px;"><i class="fas fa-plus"></i></button>' +
        '</div></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 250px;"><label>Empleado *</label>' +
        '<div style="display: flex; gap: 4px;">' +
        '<select v-model="venta.empleadoId" required class="search-bar" style="height: 40px; font-size: 14px; flex: 1; padding: 8px;">' +
        '<option value="" disabled>Seleccionar Empleado</option>' +
        '<option v-for="empleado in empleados" :key="empleado.id" :value="empleado.id">{{ empleado.nombreCompleto }}</option></select>' +
        '<button @click="mostrarFormEmpleado = true" class="btn btn-secondary" style="height: 40px; padding: 4px 8px; font-size: 12px; min-width: 32px;"><i class="fas fa-plus"></i></button>' +
        '</div></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 120px;"><label>Método</label><select v-model="venta.metodoPago" class="filter-select" style="height: 40px; font-size: 14px; padding: 8px;">' +
        '<option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transfer.</option></select></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 100px;"><label>Descuento</label><input type="number" v-model="venta.descuentoAplicado" min="0" class="search-bar" style="height: 40px; font-size: 14px; padding: 8px;"></div>' +
        '<button @click="exportarPDF" class="btn btn-secondary" style="flex: 0 0 auto; height: 40px; padding: 4px 8px; font-size: 12px;"><i class="fas fa-file-pdf"></i> PDF</button></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 400px; margin-top: 8px;"><label>Observaciones</label><textarea v-model="venta.observaciones" placeholder="Observaciones..." class="search-bar" style="resize: vertical; min-height: 40px; height: 40px; font-size: 14px; padding: 8px;"></textarea></div></div>' +
        '<div class="form-container">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><h3 style="color: #5d4037; margin: 0;">' +
        '<i class="fas fa-list"></i> Servicios y Productos</h3><button @click="mostrarFormDetalle = !mostrarFormDetalle" class="btn btn-secondary"><i class="fas fa-plus"></i> Agregar Item</button></div>' +
        '<div v-if="mostrarFormDetalle" class="form-container" style="background: #fccce2; margin-top: 10px; padding: 15px;">' +
        '<div style="display: flex; gap: 6px; align-items: end; flex-wrap: wrap; width: 100%;"><div class="filter-group" style="flex: 0 0 auto; width: 80px;">' +
        '<label>Tipo</label><select v-model="nuevoDetalle.tipo" @change="onTipoChange" class="filter-select">' +
        '<option value="servicio">Servicio</option><option value="producto">Producto</option></select></div>' +
        '<div v-if="nuevoDetalle.tipo === \'servicio\'" class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Servicio</label>' +
        '<div style="display: flex; gap: 4px;">' +
        '<select v-model="nuevoDetalle.servicioId" @change="onItemChange" class="search-bar" style="flex: 1;">' +
        '<option value="" disabled>Seleccionar Servicio</option><option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">{{ servicio.nombre }}</option></select>' +
        '<button @click="mostrarFormServicio = true" class="btn btn-secondary" style="height: 32px; padding: 4px 8px; font-size: 12px; min-width: 32px;"><i class="fas fa-plus"></i></button>' +
        '</div></div>' +
        '<div v-if="nuevoDetalle.tipo === \'producto\'" class="filter-group" style="flex: 0 0 auto; width: 200px;"><label>Producto</label>' +
        '<div style="display: flex; gap: 4px;">' +
        '<select v-model="nuevoDetalle.productoId" @change="onItemChange" class="search-bar" style="flex: 1;">' +
        '<option value="" disabled>Seleccionar Producto</option>' +
        '<option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option></select>' +
        '<button @click="mostrarFormProducto = true" class="btn btn-secondary" style="height: 32px; padding: 4px 8px; font-size: 12px; min-width: 32px;"><i class="fas fa-plus"></i></button>' +
        '</div></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 60px;"><label>Cant.</label><input type="number" v-model="nuevoDetalle.cantidad" min="1" class="filter-select"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Precio</label><input type="number" v-model="nuevoDetalle.precio" min="0" class="search-bar"></div>' +
        '<div class="filter-group" style="flex: 0 0 auto; width: 80px;"><label>Descuento</label><input type="number" v-model="nuevoDetalle.descuento" min="0" class="search-bar"></div>' +
        '<div style="flex: 0 0 auto;"><button @click="agregarDetalle" class="btn btn-secondary">Agregar</button></div></div>' +
        '<div style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">Tip: Use el botón + para agregar nuevos servicios o productos si no están en la lista</div></div>' +
        '<div v-if="detalles.length > 0" style="margin-top: 10px;"><table class="data-table"><thead><tr><th>Tipo</th><th>Item</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody><tr v-for="(detalle, index) in detalles" :key="index"><td style="text-transform: capitalize;">{{ detalle.tipo }}</td><td>{{ detalle.item.nombre }}</td><td style="text-align: center;">{{ detalle.cantidad }}</td><td style="text-align: right;">{{ formatearNumero(detalle.precio) }}</td><td style="text-align: right;">${{ formatearNumero(detalle.descuento) }}</td><td style="text-align: right;">{{ formatearNumero(detalle.cantidad * detalle.precio) }}</td><td style="text-align: center;"><button @click="eliminarDetalle(index)" class="btn btn-danger btn-small">×</button></td></tr></tbody></table></div><div v-else style="text-align: center; padding: 30px; color: #666;"><i class="fas fa-shopping-cart" style="font-size: 36px; margin-bottom: 8px;"></i><p>No hay items agregados</p></div></div>' +
        '<div class="form-container"><h3 style="color: #5d4037; margin-bottom: 10px;"><i class="fas fa-calculator"></i> Resumen de la Venta</h3><div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;"><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #007bff;">{{ cantidadArticulos }}</div><div class="summary-label">Artículos</div></div><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #28a745;">{{ formatearNumero(subtotal) }}</div><div class="summary-label">Subtotal</div></div><div class="summary-card" style="flex: 1; min-width: 100px;"><div class="summary-value" style="color: #dc3545;">{{ formatearNumero(totalDescuentos) }}</div><div class="summary-label">Descuentos</div></div><div class="summary-card" style="flex: 1; min-width: 120px;"><div class="summary-value" style="color: #66bb6a; font-size: 22px;">{{ formatearNumero(total) }}</div><div class="summary-label" style="font-size: 13px;">TOTAL</div></div></div></div>' +
        '<div style="text-align: center; margin-top: 15px; display: flex; gap: 10px; justify-content: center;"><button @click="guardarVenta" :disabled="cargando || detalles.length === 0" class="btn"><i class="fas fa-save"></i> {{ cargando ? "Guardando..." : "Guardar Venta" }}</button><button @click="window.history.back()" class="btn btn-secondary">' +
        '<i class="fas fa-times"></i> Cancelar</button></div>' +
        '<div v-if="mensajeConfirmacion" class="mensaje-confirmacion-overlay">' +
        '<div class="mensaje-confirmacion-content">' +
        '<div class="mensaje-confirmacion-header">' +
        '<h3><i class="fas fa-exclamation-triangle"></i> Datos Existentes</h3>' +
        '</div>' +
        '<div class="mensaje-confirmacion-body">' +
        '<p>{{ mensajeConfirmacion }}</p>' +
        '</div>' +
        '<div class="mensaje-confirmacion-footer">' +
        '<button @click="confirmarModificacion" class="btn btn-primary"><i class="fas fa-check"></i> Sí, Modificar</button>' +
        '<button @click="cerrarConfirmacion" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div v-if="mostrarFormCliente" class="modal-overlay" @click="mostrarFormCliente = false">' +
        '<div class="modal-content" @click.stop>' +
        '<div class="modal-header"><h3><i class="fas fa-user-plus"></i> Registrar Nuevo Cliente</h3>' +
        '<button @click="mostrarFormCliente = false" class="btn-close-red">&times;</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Nombre Completo *</label>' +
        '<input type="text" v-model="nuevoCliente.nombreCompleto" placeholder="Ingrese el nombre completo" required></div>' +
        '<div class="form-col"><label>Teléfono</label>' +
        '<input type="tel" v-model="nuevoCliente.telefono" placeholder="Ej: 0981234567" maxlength="10"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col"><label>RUC</label>' +
        '<input type="text" v-model="nuevoCliente.ruc" placeholder="Ingrese el RUC" maxlength="20"></div>' +
        '<div class="form-col"><label>Correo Electrónico</label>' +
        '<input type="email" v-model="nuevoCliente.correo" placeholder="ejemplo@correo.com"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Fecha de Nacimiento</label>' +
        '<input type="date" v-model="nuevoCliente.fechaNacimiento"></div>' +
        '<div class="form-col"><label>Redes Sociales</label>' +
        '<textarea v-model="nuevoCliente.redesSociales" placeholder="Facebook, Instagram, etc." rows="2"></textarea></div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button @click="agregarNuevoCliente" class="btn"><i class="fas fa-save"></i> Guardar Cliente</button>' +
        '<button @click="mostrarFormCliente = false; limpiarFormCliente()" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>' +
        '</div></div></div>' +
        '<div v-if="mostrarFormEmpleado" class="modal-overlay" @click="mostrarFormEmpleado = false">' +
        '<div class="modal-content" @click.stop>' +
        '<div class="modal-header"><h3><i class="fas fa-user-plus"></i> Registrar Nuevo Empleado</h3>' +
        '<button @click="mostrarFormEmpleado = false" class="btn-close-red">&times;</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Nombre Completo *</label>' +
        '<input type="text" v-model="nuevoEmpleado.nombreCompleto" placeholder="Ingrese el nombre completo" required></div>' +
        '<div class="form-col"><label>Correo Electrónico</label>' +
        '<input type="email" v-model="nuevoEmpleado.correo" placeholder="ejemplo@correo.com"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Teléfono</label>' +
        '<input type="tel" v-model="nuevoEmpleado.telefono" placeholder="Ej: 0981234567" maxlength="10"></div>' +
        '<div class="form-col" v-if="!nuevoEmpleado.id"><label>Área *</label>' +
        '<select v-model="nuevoEmpleado.area" required>' +
        '<option value="" disabled>Seleccionar Área</option>' +
        '<option v-for="area in areas" :key="area.id" :value="area">{{ area.nombre }}</option></select></div>' +
        '<div class="form-col" v-if="nuevoEmpleado.id"><label>Área</label>' +
        '<input type="text" :value="nuevoEmpleado.area?.nombre || \'Sin área\'" readonly style="background: #fccce2 !important; cursor: not-allowed;"></div>' +
        '</div>' +
        '<div class="form-row" v-if="!nuevoEmpleado.id">' +
        '<div class="form-col"><label>Sueldo Base</label>' +
        '<input type="number" v-model="nuevoEmpleado.sueldoBase" placeholder="Sueldo base" min="0"></div>' +
        '<div class="form-col"><label>Comisión %</label>' +
        '<input type="number" v-model="nuevoEmpleado.comisionPorcentaje" placeholder="Comisión %" min="0" max="100"></div>' +
        '</div>' +
        '<div class="form-row" v-if="!nuevoEmpleado.id">' +
        '<div class="form-col"><label>Fecha de Ingreso</label>' +
        '<input type="date" v-model="nuevoEmpleado.fechaIngreso"></div>' +
        '<div class="form-col"><label style="display: flex; align-items: center; gap: 5px; margin-top: 25px;">' +
        '<input type="checkbox" v-model="nuevoEmpleado.activo"> Empleado Activo</label></div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button @click="agregarNuevoEmpleado" class="btn"><i class="fas fa-save"></i> Guardar Empleado</button>' +
        '<button @click="mostrarFormEmpleado = false; limpiarFormEmpleado()" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>' +
        '</div></div></div>' +
        '<div v-if="mostrarFormServicio" class="modal-overlay" @click="mostrarFormServicio = false">' +
        '<div class="modal-content" @click.stop>' +
        '<div class="modal-header"><h3><i class="fas fa-plus"></i> Registrar Nuevo Servicio</h3>' +
        '<button @click="mostrarFormServicio = false" class="btn-close-red">&times;</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Nombre *</label>' +
        '<input type="text" v-model="nuevoServicio.nombre" placeholder="Ingrese el nombre del servicio" required></div>' +
        '<div class="form-col" v-if="!nuevoServicio.id"><label>Precio Base *</label>' +
        '<input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required></div>' +
        '<div class="form-col" v-if="nuevoServicio.id"><label>Precio Base *</label>' +
        '<input type="number" v-model="nuevoServicio.precioBase" placeholder="Ingrese el precio base" required></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col" v-if="!nuevoServicio.id"><label>Categoría</label>' +
        '<select v-model="nuevoServicio.categoriaId">' +
        '<option value="" disabled>Selecciona una categoría</option>' +
        '<option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">{{ categoria.descripcion }}</option></select></div>' +
        '<div class="form-col" v-if="nuevoServicio.id"><label>Categoría</label>' +
        '<input type="text" :value="nuevoServicio.categoria?.descripcion || \'Sin categoría\'" readonly style="background: #fccce2 !important; cursor: not-allowed;"></div>' +
        '<div class="form-col"><label>Descripción</label>' +
        '<textarea v-model="nuevoServicio.descripcion" placeholder="Descripción del servicio" rows="2"></textarea></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col"><label style="display: flex; align-items: center; gap: 5px; margin-top: 25px;">' +
        '<input type="checkbox" v-model="nuevoServicio.activo"> Servicio Activo</label></div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button @click="agregarNuevoServicio" class="btn"><i class="fas fa-save"></i> Guardar Servicio</button>' +
        '<button @click="mostrarFormServicio = false; limpiarFormServicio()" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>' +
        '</div></div></div>' +
        '<div v-if="mostrarFormProducto" class="modal-overlay" @click="mostrarFormProducto = false">' +
        '<div class="modal-content" @click.stop>' +
        '<div class="modal-header"><h3><i class="fas fa-plus"></i> Registrar Nuevo Producto</h3>' +
        '<button @click="mostrarFormProducto = false" class="btn-close-red">&times;</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Nombre *</label>' +
        '<input type="text" v-model="nuevoProducto.nombre" placeholder="Nombre del producto" required></div>' +
        '<div class="form-col" v-if="!nuevoProducto.id"><label>Precio Compra *</label>' +
        '<input type="number" v-model="nuevoProducto.precioCompra" placeholder="Precio compra" required></div>' +
        '</div>' +
        '<div class="form-row" v-if="!nuevoProducto.id">' +
        '<div class="form-col"><label>Precio Venta *</label>' +
        '<input type="number" v-model="nuevoProducto.precioVenta" placeholder="Precio venta" required></div>' +
        '<div class="form-col"><label>Stock Inicial *</label>' +
        '<input type="number" v-model="nuevoProducto.cantidadStockInicial" placeholder="Stock inicial" required></div>' +
        '</div>' +
        '<div class="form-row" v-if="!nuevoProducto.id">' +
        '<div class="form-col"><label>Stock Óptimo</label>' +
        '<input type="number" v-model="nuevoProducto.cantidadOptimaStock" placeholder="Stock óptimo"></div>' +
        '<div class="form-col"><label>Stock Mínimo</label>' +
        '<input type="number" v-model="nuevoProducto.minimoStock" placeholder="Stock mínimo"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-col"><label>Descripción</label>' +
        '<textarea v-model="nuevoProducto.descripcion" placeholder="Descripción del producto" rows="2"></textarea></div>' +
        '<div class="form-col" v-if="!nuevoProducto.id">' +
        '<label style="display: flex; align-items: center; gap: 5px; margin-top: 25px;">' +
        '<input type="checkbox" v-model="nuevoProducto.activo"> Activo</label>' +
        '<label style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">' +
        '<input type="checkbox" v-model="nuevoProducto.enPromocion"> Promoción</label>' +
        '</div>' +
        '</div>' +
        '<div v-if="nuevoProducto.enPromocion && !nuevoProducto.id" class="form-row">' +
        '<div class="form-col"><label>Precio Promoción</label>' +
        '<input type="number" v-model="nuevoProducto.precioPromocion" placeholder="Precio promoción"></div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button @click="agregarNuevoProducto" class="btn"><i class="fas fa-save"></i> Guardar Producto</button>' +
        '<button @click="mostrarFormProducto = false; limpiarFormProducto()" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>' +
        '</div></div></div></main></div></div>'
});

const style = document.createElement('style');
style.textContent = '.btn:disabled { opacity: 0.6; cursor: not-allowed; } .btn-small { padding: 4px 8px; font-size: 11px; min-width: 30px; } .btn-danger { background: #add8e6 !important; color: #dc3545 !important; border: 1px solid #87ceeb; } label { display: block; margin-bottom: 3px; font-weight: bold; color: #333; font-size: 13px; } .summary-card { background: #fcccce2; padding: 12px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .summary-value { font-size: 18px; font-weight: bold; margin-bottom: 3px; } .summary-label { font-size: 11px; color: #666; } .form-container { margin-bottom: 15px; } .page-registro-venta input, .page-registro-venta textarea, .page-registro-venta select { background: #fccce2 !important; color: #000000 !important; border: 2px solid #87CEEB !important; font-weight: bold !important; } .page-registro-venta option { background: #fccce2 !important; color: #000000 !important; } .page-registro-venta .fas.fa-list { font-size: 14px !important; } .page-registro-venta .fas.fa-shopping-cart { font-size: 24px !important; } .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; } .modal-content { background: #fccce2; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; } .modal-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; } .modal-header h3 { margin: 0; color: #5d4037; } .btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; } .btn-close-red { background: none; border: none; font-size: 24px; cursor: pointer; color: #dc3545; font-weight: bold; } .modal-body { padding: 20px; background: #fccce2; } .modal-footer { padding: 15px 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end; background: #fccce2; } .form-row { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; } .form-col { flex: 1; min-width: 200px; } .form-col label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; } .form-col input, .form-col textarea, .form-col select { width: 100%; padding: 8px; border: 2px solid #87CEEB; border-radius: 4px; font-size: 14px; background: #fccce2 !important; color: #000000 !important; font-weight: bold !important; } .modal-body input, .modal-body textarea, .modal-body select { background: #fccce2 !important; color: #000000 !important; border: 2px solid #87CEEB !important; font-weight: bold !important; } .modal-body option { background: #fccce2 !important; color: #000000 !important; } .modal-body input.existing-data, .modal-body textarea.existing-data, .modal-body select.existing-data { background: #fccce2 !important; border: 3px solid #ff6b6b !important; } .form-col textarea { resize: vertical; min-height: 60px; } .form-col input[type="checkbox"] { width: 16px !important; height: 16px !important; min-width: 16px !important; margin-right: 5px; } .mensaje-confirmacion-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; } .mensaje-confirmacion-content { background: #fccce2; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 3px solid #ff6b6b; } .mensaje-confirmacion-header { padding: 20px; border-bottom: 2px solid #ff6b6b; text-align: center; background: #f8d7da; } .mensaje-confirmacion-header h3 { margin: 0; color: #721c24; font-size: 18px; } .mensaje-confirmacion-header i { color: #ff6b6b; margin-right: 8px; } .mensaje-confirmacion-body { padding: 25px; text-align: center; } .mensaje-confirmacion-body p { margin: 0; font-size: 16px; color: #333; line-height: 1.5; font-weight: bold; } .mensaje-confirmacion-footer { padding: 20px; display: flex; gap: 15px; justify-content: center; border-top: 1px solid #ddd; } .btn-primary { background: #28a745 !important; color: white !important; border: 2px solid #28a745 !important; } .btn-primary:hover { background: #218838 !important; border-color: #218838 !important; }';
document.head.appendChild(style);