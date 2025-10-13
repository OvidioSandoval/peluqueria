import config from './config.js';

new Vue({
    el: '#app',
    data() {
        return {
            servicios: [],
            productos: []
        };
    },
    mounted() {
        this.fetchServicios();
        this.fetchProductos();
    },
    methods: {
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    this.servicios = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (response.ok) {
                    this.productos = await response.json();
                }
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        },
        formatearPrecio(precio) {
            return Number(precio).toLocaleString('es-PY', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        getServiceIcon(nombre) {
            const iconMap = {
                'corte': 'fas fa-cut',
                'lavado': 'fas fa-shower',
                'peinado': 'fas fa-magic',
                'tinte': 'fas fa-palette',
                'manicure': 'fas fa-hand-paper',
                'pedicure': 'fas fa-shoe-prints',
                'tratamiento': 'fas fa-leaf',
                'depilacion': 'fas fa-feather',
                'maquillaje': 'fas fa-paint-brush'
            };
            
            const nombreLower = nombre.toLowerCase();
            for (const key in iconMap) {
                if (nombreLower.includes(key)) {
                    return iconMap[key];
                }
            }
            return 'fas fa-scissors';
        },
        scrollTo(element) {
            document.querySelector(element).scrollIntoView({
                behavior: 'smooth'
            });
        },
        abrirWhatsApp() {
            const mensaje = encodeURIComponent(
                "¡Hola! Me gustaría reservar un turno en Peluquería Luna. " +
                "Horarios de atención:\n" +
                "📅 Lunes a Viernes: 7:00 AM - 12:00 PM y 1:00 PM - 5:00 PM\n" +
                "📅 Sábados: 7:00 AM - 12:00 PM"
            );
            window.open(`https://bot-whatsapp.netlify.app/?message=${mensaje}`, '_blank');
        }
    }
});