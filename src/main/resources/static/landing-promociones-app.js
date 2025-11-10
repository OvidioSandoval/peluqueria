import config from './config.js';

new Vue({
    el: '#app',
    data() {
        return {
            promociones: [],
            tienePromociones: false
        };
    },
    mounted() {
        this.cargarPromociones();
        this.verificarPromociones();
    },
    methods: {
        async cargarPromociones() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/promociones/activas`);
                if (response.ok) {
                    this.promociones = await response.json();
                }
            } catch (error) {
                console.error('Error:', error);
            }
        },
        async verificarPromociones() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/promociones/activas`);
                if (response.ok) {
                    const data = await response.json();
                    this.tienePromociones = data.length > 0;
                }
            } catch (error) {
                this.tienePromociones = false;
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
                "¡Hola! Me gustaría consultar sobre las promociones de Peluquería Luna.\n" +
                "Horarios:\n📅 Lunes a Viernes: 7:00 AM - 12:00 PM y 1:00 PM - 5:00 PM\n📅 Sábados: 7:00 AM - 12:00 PM"
            );
            window.open(`https://wa.me/595976763408?text=${mensaje}`, '_blank');
        },
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.split(' ').map(palabra => 
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            ).join(' ');
        }
    }
});