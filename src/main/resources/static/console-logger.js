// Utilidad para logging consistente en consola
window.ConsoleLogger = {
    // Configuración de colores para diferentes tipos de mensajes
    colors: {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        debug: '#6c757d'
    },

    // Método para logging de éxito
    success(message, data = null) {
        console.log(`%c✅ ÉXITO: ${message}`, `color: ${this.colors.success}; font-weight: bold;`);
        if (data) console.log('Datos:', data);
    },

    // Método para logging de errores
    error(message, error = null) {
        console.error(`%c❌ ERROR: ${message}`, `color: ${this.colors.error}; font-weight: bold;`);
        if (error) console.error('Detalles del error:', error);
    },

    // Método para logging de advertencias
    warning(message, data = null) {
        console.warn(`%c⚠️ ADVERTENCIA: ${message}`, `color: ${this.colors.warning}; font-weight: bold;`);
        if (data) console.warn('Datos:', data);
    },

    // Método para logging de información
    info(message, data = null) {
        console.info(`%cℹ️ INFO: ${message}`, `color: ${this.colors.info}; font-weight: bold;`);
        if (data) console.info('Datos:', data);
    },

    // Método para logging de debug
    debug(message, data = null) {
        console.log(`%c🔍 DEBUG: ${message}`, `color: ${this.colors.debug}; font-weight: bold;`);
        if (data) console.log('Datos:', data);
    },

    // Método para logging de operaciones CRUD
    crud: {
        create: (entity, data = null) => {
            console.log(`%c➕ CREAR: ${entity} creado exitosamente`, `color: ${window.ConsoleLogger.colors.success}; font-weight: bold;`);
            if (data) console.log('Datos creados:', data);
        },
        read: (entity, data = null) => {
            console.log(`%c📖 LEER: ${entity} cargado exitosamente`, `color: ${window.ConsoleLogger.colors.info}; font-weight: bold;`);
            if (data) console.log('Datos cargados:', data);
        },
        update: (entity, data = null) => {
            console.log(`%c✏️ ACTUALIZAR: ${entity} actualizado exitosamente`, `color: ${window.ConsoleLogger.colors.success}; font-weight: bold;`);
            if (data) console.log('Datos actualizados:', data);
        },
        delete: (entity, data = null) => {
            console.log(`%c🗑️ ELIMINAR: ${entity} eliminado exitosamente`, `color: ${window.ConsoleLogger.colors.success}; font-weight: bold;`);
            if (data) console.log('Datos eliminados:', data);
        }
    },

    // Método para logging de operaciones de red
    network: {
        request: (method, url, data = null) => {
            console.log(`%c🌐 REQUEST: ${method} ${url}`, `color: ${window.ConsoleLogger.colors.info}; font-weight: bold;`);
            if (data) console.log('Datos enviados:', data);
        },
        response: (status, url, data = null) => {
            const color = status >= 200 && status < 300 ? window.ConsoleLogger.colors.success : window.ConsoleLogger.colors.error;
            console.log(`%c📡 RESPONSE: ${status} ${url}`, `color: ${color}; font-weight: bold;`);
            if (data) console.log('Datos recibidos:', data);
        }
    }
};