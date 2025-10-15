// Funciones comunes para todas las aplicaciones
window.CommonFunctions = {
    formatearNumero(numero) {
        const resultado = Number(numero).toLocaleString('es-ES');
        if (window.ConsoleLogger) ConsoleLogger.debug('Número formateado', { original: numero, formateado: resultado });
        return resultado;
    },
    
    formatearFecha(fecha) {
        const resultado = fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        if (window.ConsoleLogger) ConsoleLogger.debug('Fecha formateada', { original: fecha, formateada: resultado });
        return resultado;
    },
    
    formatearFechaHora(fecha) {
        const resultado = fecha ? new Date(fecha).toLocaleString('es-ES') : '';
        if (window.ConsoleLogger) ConsoleLogger.debug('Fecha y hora formateada', { original: fecha, formateada: resultado });
        return resultado;
    },
    
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const esValido = regex.test(email);
        if (window.ConsoleLogger) {
            if (esValido) {
                ConsoleLogger.success('Email válido', { email });
            } else {
                ConsoleLogger.warning('Email inválido', { email });
            }
        }
        return esValido;
    },
    
    validarTelefono(telefono) {
        const regex = /^[\d\s\-\+\(\)]+$/;
        const esValido = regex.test(telefono) && telefono.replace(/\D/g, '').length >= 10;
        if (window.ConsoleLogger) {
            if (esValido) {
                ConsoleLogger.success('Teléfono válido', { telefono });
            } else {
                ConsoleLogger.warning('Teléfono inválido', { telefono });
            }
        }
        return esValido;
    },
    
    scrollToTop() {
        if (window.ConsoleLogger) ConsoleLogger.info('Desplazando hacia arriba');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    confirmarEliminacion(nombre) {
        if (window.ConsoleLogger) ConsoleLogger.info('Solicitando confirmación de eliminación', { nombre });
        const confirmado = confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`);
        if (window.ConsoleLogger) {
            if (confirmado) {
                ConsoleLogger.warning('Eliminación confirmada por el usuario', { nombre });
            } else {
                ConsoleLogger.info('Eliminación cancelada por el usuario', { nombre });
            }
        }
        return confirmado;
    }
};

// Cargar el logger de consola si no está disponible
if (typeof window.ConsoleLogger === 'undefined') {
    const script = document.createElement('script');
    script.src = '/console-logger.js';
    document.head.appendChild(script);
}
