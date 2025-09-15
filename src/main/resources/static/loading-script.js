// Script para manejo de pantalla de carga
(function() {
    'use strict';
    
    const LoadingScreen = {
        show() {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.style.display = 'flex';
                loader.style.opacity = '1';
            }
        },
        
        hide() {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.classList.add('loading-fade-out');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 800);
            }
        },
        
        init() {
            // Auto-hide cuando la página esté completamente cargada
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.hide();
                }, 500);
            });
            
            // Fallback si la página tarda mucho
            setTimeout(() => {
                this.hide();
            }, 10000);
        }
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LoadingScreen.init());
    } else {
        LoadingScreen.init();
    }
    
    // Exportar para uso global
    window.LoadingScreen = LoadingScreen;
})();
