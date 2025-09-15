// Optimizador de espacios compactos
document.addEventListener('DOMContentLoaded', function() {
    
    // Función para optimizar formularios existentes
    function optimizeExistingForms() {
        // Buscar todos los formularios y aplicar clases compactas
        const formContainers = document.querySelectorAll('.form-container');
        formContainers.forEach(container => {
            // Buscar grupos de campos relacionados y agruparlos en filas
            const inputs = container.querySelectorAll('input, select, textarea');
            let currentRow = null;
            
            inputs.forEach((input, index) => {
                const label = input.previousElementSibling;
                
                // Crear filas para campos relacionados
                if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
                    if (!currentRow || currentRow.children.length >= 2) {
                        currentRow = document.createElement('div');
                        currentRow.className = 'form-row';
                        input.parentNode.insertBefore(currentRow, label);
                    }
                    
                    const formCol = document.createElement('div');
                    formCol.className = 'form-col';
                    formCol.appendChild(label);
                    formCol.appendChild(input);
                    currentRow.appendChild(formCol);
                }
                
                // Agrupar fecha y hora
                if (input.type === 'date' || input.type === 'time') {
                    if (!currentRow || !currentRow.classList.contains('datetime-row')) {
                        currentRow = document.createElement('div');
                        currentRow.className = 'datetime-row';
                        input.parentNode.insertBefore(currentRow, label);
                    }
                    
                    const dateTimeCol = document.createElement('div');
                    dateTimeCol.appendChild(label);
                    dateTimeCol.appendChild(input);
                    currentRow.appendChild(dateTimeCol);
                }
            });
        });
        
        // Optimizar botones
        const buttonContainers = document.querySelectorAll('.form-buttons');
        buttonContainers.forEach(container => {
            if (!container.classList.contains('form-buttons')) {
                container.classList.add('form-buttons');
            }
        });
        
        // Optimizar filtros
        const filtersContainers = document.querySelectorAll('.filters-container');
        filtersContainers.forEach(container => {
            const inputs = container.querySelectorAll('input, select');
            inputs.forEach(input => {
                const wrapper = input.parentElement;
                if (!wrapper.classList.contains('filter-group')) {
                    wrapper.classList.add('filter-group');
                }
            });
        });
    }
    
    // Función para hacer tablas más compactas
    function optimizeTables() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            // Reducir padding en celdas
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.style.padding = '8px 12px';
                cell.style.fontSize = '0.875rem';
            });
            
            // Hacer headers más compactos
            const headers = table.querySelectorAll('th');
            headers.forEach(header => {
                header.style.padding = '10px 12px';
                header.style.fontSize = '0.8rem';
            });
        });
    }
    
    // Función para optimizar cards
    function optimizeCards() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            card.style.padding = '16px';
            
            const icon = card.querySelector('i');
            if (icon) {
                icon.style.fontSize = '1.75rem';
                icon.style.marginBottom = '8px';
            }
            
            const title = card.querySelector('h3');
            if (title) {
                title.style.fontSize = '1rem';
                title.style.marginBottom = '4px';
            }
            
            const description = card.querySelector('p');
            if (description) {
                description.style.fontSize = '0.75rem';
                description.style.margin = '0';
            }
        });
    }
    
    // Función para optimizar espaciado general
    function optimizeSpacing() {
        // Reducir márgenes en títulos
        const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        titles.forEach(title => {
            title.style.marginBottom = '12px';
            if (title.tagName === 'H1') {
                title.style.fontSize = '1.75rem';
                title.style.marginTop = '8px';
            }
        });
        
        // Optimizar contenedores principales
        const glassContainers = document.querySelectorAll('.glass-container');
        glassContainers.forEach(container => {
            container.style.padding = '16px';
            container.style.marginBottom = '12px';
        });
        
        // Optimizar contenido principal
        const content = document.querySelector('.content');
        if (content) {
            content.style.padding = '12px';
            content.style.paddingTop = '80px';
        }
    }
    
    // Ejecutar optimizaciones
    setTimeout(() => {
        optimizeExistingForms();
        optimizeTables();
        optimizeCards();
        optimizeSpacing();
    }, 100);
    
    // Re-ejecutar cuando se agreguen nuevos elementos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                setTimeout(() => {
                    optimizeExistingForms();
                    optimizeTables();
                    optimizeCards();
                }, 50);
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Utilidades CSS adicionales aplicadas dinámicamente
const additionalStyles = `
    /* Estilos adicionales para optimización */
    .v-application .form-container {
        padding: 16px !important;
        margin-bottom: 16px !important;
    }
    
    .v-application input, 
    .v-application select, 
    .v-application textarea {
        padding: 8px 12px !important;
        margin-bottom: 8px !important;
        font-size: 0.875rem !important;
    }
    
    .v-application label {
        margin-bottom: 4px !important;
        font-size: 0.875rem !important;
    }
    
    .v-application .btn {
        padding: 8px 16px !important;
        margin: 4px !important;
        font-size: 0.875rem !important;
    }
    
    .v-application table th {
        padding: 10px 12px !important;
        font-size: 0.8rem !important;
    }
    
    .v-application table td {
        padding: 8px 12px !important;
        font-size: 0.8rem !important;
    }
    
    /* Responsive adicional */
    @media (max-width: 768px) {
        .v-application .form-row {
            flex-direction: column !important;
        }
        
        .v-application .filters-container {
            flex-direction: column !important;
        }
        
        .v-application .main-buttons {
            flex-direction: column !important;
        }
        
        .v-application .btn {
            width: 100% !important;
            margin-bottom: 8px !important;
        }
    }
`;

// Inyectar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);