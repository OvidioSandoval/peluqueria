import config from './config.js';

new Vue({
    el: '#app',
    data() {
        return {
            servicios: [],
            productos: [],
            tienePromociones: false,
            mensajeChat: '',
            chatAbierto: false
        };
    },
    mounted() {
        this.fetchServicios();
        this.fetchProductos();
        this.verificarPromociones();
    },
    methods: {
        async fetchServicios() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/servicios`);
                if (response.ok) {
                    const data = await response.json();
                    this.servicios = data.map(s => ({
                        ...s,
                        precio: s.precioBase || s.precio || 0
                    }));
                }
            } catch (error) {
                console.error('Error al cargar servicios:', error);
            }
        },
        async fetchProductos() {
            try {
                const response = await fetch(`${config.apiBaseUrl}/productos`);
                if (response.ok) {
                    const data = await response.json();
                    this.productos = data.map(p => ({
                        ...p,
                        precio: p.precioVenta || p.precio || 0
                    }));
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
                if (nombreLower.includes(key)) return iconMap[key];
            }
            return 'fas fa-scissors';
        },
        toggleChat() {
            this.chatAbierto = !this.chatAbierto;
            const widget = document.getElementById('chatbot-widget');
            widget.style.display = this.chatAbierto ? 'flex' : 'none';
        },
        cerrarChat() {
            this.chatAbierto = false;
            document.getElementById('chatbot-widget').style.display = 'none';
        },
        async enviarMensaje() {
            if (!this.mensajeChat.trim()) return;
            
            const chatMessages = document.getElementById('chat-messages');
            
            const userMsg = document.createElement('div');
            userMsg.style.cssText = 'background: #cd853f; color: white; padding: 10px; border-radius: 10px; margin-bottom: 10px; text-align: right; margin-left: 50px;';
            userMsg.textContent = this.mensajeChat;
            chatMessages.appendChild(userMsg);
            
            const mensaje = this.mensajeChat;
            this.mensajeChat = '';
            
            try {
                const response = await fetch('/webhook/chat-web', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: mensaje })
                });
                
                const data = await response.json();
                
                const botMsg = document.createElement('div');
                botMsg.style.cssText = 'background: white; padding: 10px; border-radius: 10px; margin-bottom: 10px; margin-right: 50px;';
                botMsg.innerHTML = data.reply.replace(/\n/g, '<br>');
                chatMessages.appendChild(botMsg);
                
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                console.error('Error:', error);
            }
        },
        verificarPromociones() {
            const promocionesGuardadas = localStorage.getItem('promociones');
            this.tienePromociones = promocionesGuardadas && JSON.parse(promocionesGuardadas).length > 0;
        }
    }
});