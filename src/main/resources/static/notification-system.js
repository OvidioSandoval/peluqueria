// Sistema de notificaciones para reemplazar alert() y confirm()
const NotificationSystem = {
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    },
    
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    confirm(message, onConfirm, onCancel = null) {
        const modal = document.createElement('div');
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="notification-modal-content">
                <p>${message}</p>
                <div class="notification-modal-buttons">
                    <button class="btn-confirm">Confirmar</button>
                    <button class="btn-cancel">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.btn-confirm').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        
        modal.querySelector('.btn-cancel').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
    }
};

// Estilos CSS para las notificaciones
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.notification-success { background: #28a745; }
.notification-error { background: #dc3545; }
.notification-info { background: #17a2b8; }

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
}

.notification-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.notification-modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.notification-modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 15px;
}

.btn-confirm, .btn-cancel {
    padding: 8px 16px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.btn-confirm { background: #28a745; color: white; }
.btn-cancel { background: #6c757d; color: white; }
</style>
`;

// Insertar estilos en el documento
document.head.insertAdjacentHTML('beforeend', notificationStyles);

export default NotificationSystem;