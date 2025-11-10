import config from './config.js';

new Vue({
    el: '#app',
    data() {
        return {
            servicios: [],
            productos: [],
            serviciosFiltrados: [],
            productosFiltrados: [],
            searchServicio: '',
            searchProducto: '',
            promocion: {
                nombre: '',
                precio: 0,
                servicioId: null,
                productoId: null,
                activo: true
            }
        };
    },
    mounted() {
        this.cargarServicios();
        this.cargarProductos();
    },
    methods: {
        async cargarServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    const data = await response.json();
                    this.servicios = data.map(s => ({
                        id: s.id,
                        nombre: s.nombre
                    }));
                }
            } catch (error) {
                console.error('Error:', error);
            }
        },
        async cargarProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (response.ok) {
                    this.productos = await response.json();
                }
            } catch (error) {
                console.error('Error:', error);
            }
        },
        filtrarServicios() {
            if (!this.searchServicio) {
                this.serviciosFiltrados = this.servicios;
            } else {
                this.serviciosFiltrados = this.servicios.filter(s => 
                    s.nombre.toLowerCase().includes(this.searchServicio.toLowerCase())
                );
            }
        },
        filtrarProductos() {
            if (!this.searchProducto) {
                this.productosFiltrados = this.productos;
            } else {
                this.productosFiltrados = this.productos.filter(p => 
                    p.nombre.toLowerCase().includes(this.searchProducto.toLowerCase())
                );
            }
        },
        async guardar() {
            if (!this.promocion.nombre || !this.promocion.precio) {
                alert('Por favor complete los campos requeridos');
                return;
            }
            
            if (!this.promocion.servicioId && !this.promocion.productoId) {
                alert('Debe seleccionar al menos un servicio o producto');
                return;
            }
            
            try {
                const data = {
                    nombre: this.promocion.nombre,
                    precio: this.promocion.precio,
                    activo: this.promocion.activo
                };
                
                if (this.promocion.servicioId) {
                    data.servicio = { id: this.promocion.servicioId };
                }
                if (this.promocion.productoId) {
                    data.producto = { id: this.promocion.productoId };
                }
                
                const response = await fetch(`${config.apiBaseUrl}/promociones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Promoción guardada exitosamente');
                    this.limpiar();
                } else {
                    alert('Error al guardar la promoción');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al guardar la promoción');
            }
        },
        limpiar() {
            this.promocion = {
                nombre: '',
                precio: 0,
                servicioId: null,
                productoId: null,
                activo: true
            };
            this.searchServicio = '';
            this.searchProducto = '';
        }
    }
});