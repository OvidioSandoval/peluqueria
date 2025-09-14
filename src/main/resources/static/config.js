let apiBaseUrl = '';

async function loadConfig() {
    try {
        const response = await fetch('/config/api-url');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        apiBaseUrl = await response.text();
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback to default API base URL
        apiBaseUrl = '/api';
    }
}

await loadConfig();

const config = {
    apiBaseUrl,
    
    // Common error handler
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        const message = error.message || 'Error desconocido';
        alert(`${context ? context + ': ' : ''}${message}`);
    },
    
    // Common fetch wrapper with error handling
    async fetchWithErrorHandling(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response;
        } catch (error) {
            this.handleError(error, 'Fetch request');
            throw error;
        }
    }
};

export default config;
