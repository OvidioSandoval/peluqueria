// Funciones comunes para todas las aplicaciones
window.CommonFunctions = {
    formatearNumero(numero) {
        return Number(numero).toLocaleString('es-ES');
    },
    
    formatearFecha(fecha) {
        return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
    },
    
    formatearFechaHora(fecha) {
        return fecha ? new Date(fecha).toLocaleString('es-ES') : '';
    },
    
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    validarTelefono(telefono) {
        const regex = /^[\d\s\-\+\(\)]+$/;
        return regex.test(telefono) && telefono.replace(/\D/g, '').length >= 10;
    },
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    confirmarEliminacion(nombre) {
        return confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`);
    }
};
