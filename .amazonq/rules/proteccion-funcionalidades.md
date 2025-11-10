# REGLAS DE PROTECCIÓN DE FUNCIONALIDADES

## PROHIBICIONES ABSOLUTAS

### NO ELIMINAR NUNCA:
- Archivos HTML de templates
- Archivos JavaScript de aplicaciones
- Controladores Java existentes
- Servicios Java existentes
- Repositorios Java existentes
- Modelos/Entidades Java existentes
- Archivos CSS de estilos
- Configuraciones de seguridad
- Rutas y endpoints existentes

### NO MODIFICAR SIN AUTORIZACIÓN EXPLÍCITA:
- Estructura de navegación (navbar/sidebar)
- Sistema de autenticación
- Configuración de base de datos
- Mapeo de URLs
- Funcionalidades CRUD existentes
- Sistema de roles y permisos

### MANTENER SIEMPRE:
- Todas las rutas listadas en urls.txt
- Funcionalidades de gestión (usuarios, clientes, empleados, etc.)
- Sistema de reportes y auditoría
- Páginas de landing públicas
- APIs públicas existentes

## REGLAS DE MODIFICACIÓN

### SOLO SE PERMITE:
- Agregar nuevas funcionalidades sin afectar las existentes
- Mejorar estilos CSS sin romper layouts
- Optimizar código sin cambiar funcionalidad
- Corregir bugs específicos solicitados
- Agregar validaciones adicionales

### ANTES DE CUALQUIER CAMBIO:
1. Verificar que no afecte funcionalidades existentes
2. Confirmar que las rutas siguen funcionando
3. Asegurar que la navegación permanece intacta
4. Validar que los permisos se mantienen

## ESTRUCTURA PROTEGIDA

### ARCHIVOS CRÍTICOS:
- SecurityConfig.java
- FrontController.java
- script.js
- navbar.html
- Todos los archivos de templates/
- Todos los controladores existentes

### FUNCIONALIDADES CORE:
- Sistema de login/logout
- Gestión de usuarios y roles
- CRUD de todas las entidades
- Sistema de turnos y citas
- Gestión de ventas y compras
- Reportes y auditoría
- Landing pages públicas

## ADVERTENCIA
Cualquier modificación que elimine o rompa funcionalidades existentes está ESTRICTAMENTE PROHIBIDA.