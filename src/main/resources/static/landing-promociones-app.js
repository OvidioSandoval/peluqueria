import config from './config.js';

new Vue({
    el: '#app',
    data() {
        return {
            promociones: []
        };
    },
    mounted() {
        this.cargarPromociones();
    },
    methods: {
        cargarPromociones() {
            const promocionesGuardadas = localStorage.getItem('promociones');
            if (promocionesGuardadas) {
                this.promociones = JSON.parse(promocionesGuardadas);
            } else {
                // Datos por defecto si no hay promociones guardadas
                this.promociones = [
                    {
                        id: 1,
                        titulo: 'Combo Completo',
                        descripcion: 'Corte + Lavado + Peinado',
                        precio: 60000
                    },
                    {
                        id: 2,
                        titulo: 'Tratamiento Capilar',
                        descripcion: 'Hidratación profunda + Corte',
                        precio: 90000
                    },
                    {
                        id: 3,
                        titulo: 'Manicure + Pedicure',
                        descripcion: 'Cuidado completo de uñas',
                        precio: 50000
                    }
                ];
            }
        },
        formatearPrecio(precio) {
            return Number(precio).toLocaleString('es-PY', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
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
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        }
    }
});