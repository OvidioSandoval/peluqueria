/* ===== FUNCIONES GLOBALES Y UTILIDADES ===== */

// Configuración global
const AppConfig = {
  apiBaseUrl: '/api',
  version: '1.0.0',
  debug: true
};

// Utilidades de logging
const Logger = {
  info: (message, data = null) => {
    if (AppConfig.debug) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// Gestión de componentes dinámicos
const ComponentLoader = {
  cache: new Map(),
  
  async loadComponent(containerId, componentPath) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        Logger.error(`Container ${containerId} not found`);
        return false;
      }

      // Verificar cache
      if (this.cache.has(componentPath)) {
        container.innerHTML = this.cache.get(componentPath);
        Logger.info(`Component ${componentPath} loaded from cache`);
        return true;
      }

      // Cargar componente
      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      this.cache.set(componentPath, html);
      container.innerHTML = html;
      
      Logger.info(`Component ${componentPath} loaded successfully`);
      return true;
    } catch (error) {
      Logger.error(`Failed to load component ${componentPath}`, error);
      return false;
    }
  }
};

// Función global para cargar componentes (compatibilidad)
function loadComponent(containerId, componentPath) {
  return ComponentLoader.loadComponent(containerId, componentPath);
}

// Gestión de notificaciones
const NotificationManager = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 5000) {
    this.init();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    
    const icon = this.getIcon(type);
    notification.innerHTML = `
      <div class="notification-content">
        <i class="${icon}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close" onclick="NotificationManager.remove(this.parentElement)">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    this.container.appendChild(notification);
    
    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }
    
    return notification;
  },
  
  getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  },
  
  remove(notification) {
    if (notification && notification.parentElement) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// Gestión de modales
const ModalManager = {
  activeModals: [],
  
  create(options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: ${options.maxWidth || '500px'}">
        <div class="modal-header">
          <h3>${options.title || 'Modal'}</h3>
          <button class="modal-close" onclick="ModalManager.close(this.closest('.modal-overlay'))">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${options.content || ''}
        </div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>
    `;
    
    document.body.appendChild(modal);
    this.activeModals.push(modal);
    
    // Animación de entrada
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Cerrar con ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close(modal);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close(modal);
      }
    });
    
    return modal;
  },
  
  close(modal) {
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal.parentElement) {
          modal.parentElement.removeChild(modal);
        }
        const index = this.activeModals.indexOf(modal);
        if (index > -1) {
          this.activeModals.splice(index, 1);
        }
      }, 300);
    }
  },
  
  confirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
      const modal = this.create({
        title,
        content: `<p>${message}</p>`,
        footer: `
          <button class="btn btn-secondary" onclick="ModalManager.close(this.closest('.modal-overlay')); window.modalResolve(false);">
            Cancelar
          </button>
          <button class="btn btn-primary" onclick="ModalManager.close(this.closest('.modal-overlay')); window.modalResolve(true);">
            Confirmar
          </button>
        `
      });
      
      window.modalResolve = resolve;
    });
  }
};

// Utilidades de formato
const FormatUtils = {
  number(value, options = {}) {
    const defaults = {
      locale: 'es-ES',
      maximumFractionDigits: 0,
      useGrouping: true
    };
    
    return Number(value).toLocaleString(options.locale || defaults.locale, {
      ...defaults,
      ...options
    });
  },
  
  currency(value, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  },
  
  date(value, options = {}) {
    if (!value) return '';
    
    const date = new Date(value);
    const defaults = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return date.toLocaleDateString('es-ES', { ...defaults, ...options });
  },
  
  datetime(value) {
    if (!value) return '';
    
    const date = new Date(value);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  phone(value) {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : value;
  }
};

// Utilidades de validación
const ValidationUtils = {
  required(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
  
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  
  phone(value) {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(value) && value.replace(/\D/g, '').length >= 10;
  },
  
  number(value) {
    return !isNaN(value) && isFinite(value);
  },
  
  positiveNumber(value) {
    return this.number(value) && Number(value) > 0;
  },
  
  minLength(value, min) {
    return value && value.toString().length >= min;
  },
  
  maxLength(value, max) {
    return !value || value.toString().length <= max;
  }
};

// Gestión de formularios
const FormManager = {
  validate(form, rules = {}) {
    const errors = {};
    const formData = new FormData(form);
    
    for (const [field, validators] of Object.entries(rules)) {
      const value = formData.get(field);
      
      for (const validator of validators) {
        if (typeof validator === 'function') {
          const result = validator(value);
          if (result !== true) {
            errors[field] = result;
            break;
          }
        } else if (typeof validator === 'object') {
          const { rule, message } = validator;
          if (!rule(value)) {
            errors[field] = message;
            break;
          }
        }
      }
    }
    
    this.displayErrors(form, errors);
    return Object.keys(errors).length === 0;
  },
  
  displayErrors(form, errors) {
    // Limpiar errores previos
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    
    // Mostrar nuevos errores
    for (const [field, message] of Object.entries(errors)) {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add('error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        
        input.parentElement.appendChild(errorEl);
      }
    }
  },
  
  serialize(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }
};

// Gestión de estado de carga
const LoadingManager = {
  show(target = document.body, message = 'Cargando...') {
    const existing = target.querySelector('.loading-overlay');
    if (existing) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="inline-loader"></div>
        <span>${message}</span>
      </div>
    `;
    
    target.style.position = 'relative';
    target.appendChild(overlay);
  },
  
  hide(target = document.body) {
    const overlay = target.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
};

// API Helper
const ApiHelper = {
  async request(url, options = {}) {
    const defaults = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const config = { ...defaults, ...options };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      Logger.error(`API Request failed: ${url}`, error);
      throw error;
    }
  },
  
  get(url) {
    return this.request(url);
  },
  
  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }
};

// Utilidades de DOM
const DOMUtils = {
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },
  
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  scrollToTop(smooth = true) {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

// Inicialización global
DOMUtils.ready(() => {
  Logger.info('Application initialized');
  
  // Cargar navbar si existe el contenedor
  if (document.getElementById('navbar')) {
    ComponentLoader.loadComponent('navbar', '/navbar.html');
  }
  
  // Inicializar tooltips si existen
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(element => {
    element.addEventListener('mouseenter', function() {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip-popup';
      tooltip.textContent = this.getAttribute('data-tooltip');
      document.body.appendChild(tooltip);
      
      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    });
    
    element.addEventListener('mouseleave', function() {
      const tooltip = document.querySelector('.tooltip-popup');
      if (tooltip) tooltip.remove();
    });
  });
});

// Exportar para uso global
window.AppConfig = AppConfig;
window.Logger = Logger;
window.ComponentLoader = ComponentLoader;
window.NotificationManager = NotificationManager;
window.ModalManager = ModalManager;
window.FormatUtils = FormatUtils;
window.ValidationUtils = ValidationUtils;
window.FormManager = FormManager;
window.LoadingManager = LoadingManager;
window.ApiHelper = ApiHelper;
window.DOMUtils = DOMUtils;