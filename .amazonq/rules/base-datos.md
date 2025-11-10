# REGLAS DE BASE DE DATOS - PELUQUERÍA LUNA

## CONFIGURACIÓN DE BASE DE DATOS
- **Motor**: MySQL 8.0+
- **Base de datos**: `peluqueria`
- **Usuario**: root
- **Puerto**: 3306
- **Zona horaria**: America/Asuncion
- **Charset**: UTF-8

## ESTRUCTURA DE TABLAS

### TABLA: cliente
```sql
id_cliente INT PRIMARY KEY AUTO_INCREMENT
nombre_completo VARCHAR(200) NOT NULL
telefono VARCHAR(10)
ruc VARCHAR(20)
correo VARCHAR(100)
redes_sociales TEXT
fecha_nacimiento DATE
fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### TABLA: empleado
```sql
id_empleado INT PRIMARY KEY AUTO_INCREMENT
nombre_completo VARCHAR(100) NOT NULL
correo VARCHAR(100)
telefono VARCHAR(20)
area_id INT NOT NULL (FK -> area.id_area)
sueldo_base INT NOT NULL
comision_porcentaje INT DEFAULT 0
activo BOOLEAN DEFAULT 1
fecha_ingreso DATE
total_pagado INT DEFAULT 0
sueldo_total INT DEFAULT 0
diferencia INT DEFAULT 0
```

### TABLA: producto
```sql
id_producto INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(50) NOT NULL
descripcion VARCHAR(50)
precio_compra INT NOT NULL
precio_venta INT NOT NULL
cantidad_stock_inicial INT NOT NULL
cantidad_optima_stock INT
minimo_stock INT
activo BOOLEAN DEFAULT 1
en_promocion BOOLEAN DEFAULT 0
precio_promocion INT
```

### TABLA: servicio
```sql
id_servicio INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
descripcion VARCHAR(200)
precio INT NOT NULL
duracion_minutos INT
categoria_id INT (FK -> categoria_servicio.id_categoria)
activo BOOLEAN DEFAULT 1
```

### TABLA: venta
```sql
id_venta INT PRIMARY KEY AUTO_INCREMENT
cliente_id INT (FK -> cliente.id_cliente)
empleado_id INT (FK -> empleado.id_empleado)
fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
total INT NOT NULL
metodo_pago VARCHAR(50)
estado VARCHAR(20) DEFAULT 'completada'
```

### TABLA: compra
```sql
id_compra INT PRIMARY KEY AUTO_INCREMENT
proveedor_id INT (FK -> proveedor.id_proveedor)
fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP
total INT NOT NULL
estado VARCHAR(20) DEFAULT 'completada'
```

### TABLA: turno
```sql
id_turno INT PRIMARY KEY AUTO_INCREMENT
cliente_id INT (FK -> cliente.id_cliente)
empleado_id INT (FK -> empleado.id_empleado)
servicio_id INT (FK -> servicio.id_servicio)
fecha_turno DATETIME NOT NULL
duracion_minutos INT
estado VARCHAR(20) DEFAULT 'pendiente'
notas TEXT
```

### TABLA: usuario
```sql
id_usuario INT PRIMARY KEY AUTO_INCREMENT
username VARCHAR(50) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL
email VARCHAR(100)
activo BOOLEAN DEFAULT 1
fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### TABLA: rol
```sql
id_rol INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(50) UNIQUE NOT NULL
descripcion VARCHAR(200)
```

### TABLA: area
```sql
id_area INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
descripcion VARCHAR(200)
```

### TABLA: categoria_servicio
```sql
id_categoria INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
descripcion VARCHAR(200)
```

### TABLA: proveedor
```sql
id_proveedor INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
telefono VARCHAR(20)
correo VARCHAR(100)
direccion VARCHAR(200)
ruc VARCHAR(20)
```

### TABLA: caja
```sql
id_caja INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100)
fecha_apertura TIMESTAMP
fecha_cierre TIMESTAMP
monto_inicial INT DEFAULT 0
monto_final INT DEFAULT 0
estado VARCHAR(20) DEFAULT 'abierta'
```

### TABLA: gasto
```sql
id_gasto INT PRIMARY KEY AUTO_INCREMENT
descripcion VARCHAR(200) NOT NULL
monto INT NOT NULL
fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
categoria VARCHAR(50)
```

### TABLA: movimiento
```sql
id_movimiento INT PRIMARY KEY AUTO_INCREMENT
producto_id INT (FK -> producto.id_producto)
tipo_movimiento VARCHAR(20) NOT NULL (entrada/salida)
cantidad INT NOT NULL
fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
motivo VARCHAR(200)
```

### TABLA: detalle_venta
```sql
id_detalle INT PRIMARY KEY AUTO_INCREMENT
venta_id INT (FK -> venta.id_venta)
producto_id INT (FK -> producto.id_producto)
servicio_id INT (FK -> servicio.id_servicio)
cantidad INT NOT NULL
precio_unitario INT NOT NULL
subtotal INT NOT NULL
```

### TABLA: detalle_compra
```sql
id_detalle INT PRIMARY KEY AUTO_INCREMENT
compra_id INT (FK -> compra.id_compra)
producto_id INT (FK -> producto.id_producto)
cantidad INT NOT NULL
precio_unitario INT NOT NULL
subtotal INT NOT NULL
```

### TABLA: paquete_servicio
```sql
id_paquete INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
descripcion VARCHAR(200)
precio_total INT NOT NULL
activo BOOLEAN DEFAULT 1
```

### TABLA: paquetes_contiene_servicio
```sql
id INT PRIMARY KEY AUTO_INCREMENT
paquete_id INT (FK -> paquete_servicio.id_paquete)
servicio_id INT (FK -> servicio.id_servicio)
```

### TABLA: informacion_stock
```sql
id_informacion INT PRIMARY KEY AUTO_INCREMENT
producto_id INT UNIQUE (FK -> producto.id_producto)
cantidad_actual INT NOT NULL
ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### TABLA: auditoria
```sql
id_auditoria BIGINT PRIMARY KEY AUTO_INCREMENT
usuario VARCHAR(100)
accion VARCHAR(50)
entidad VARCHAR(100)
entidad_id VARCHAR(50)
detalles TEXT
fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
ip_address VARCHAR(50)
```

## LÓGICA DE ACCESO A DATOS

### PATRÓN REPOSITORY
- Usar JpaRepository para todas las entidades
- Métodos básicos: findAll(), findById(), save(), deleteById()
- Queries personalizadas con @Query cuando sea necesario

### PATRÓN SERVICE
- Toda lógica de negocio en capa Service
- Transacciones con @Transactional
- Validaciones antes de guardar/actualizar

### CONVENCIONES
1. **IDs**: Siempre AUTO_INCREMENT, tipo Integer
2. **Fechas**: LocalDate para fechas, LocalDateTime para timestamps
3. **Booleanos**: DEFAULT 1 para activo, 0 para inactivo
4. **Precios**: Tipo Integer (guaraníes sin decimales)
5. **Foreign Keys**: Usar @ManyToOne con FetchType.EAGER para relaciones necesarias
6. **Nombres**: snake_case en BD, camelCase en Java

### OPERACIONES CRUD

#### CREAR (INSERT)
```java
// Service recibe DTO/Entity
// Valida datos
// Repository.save(entity)
// Retorna entity guardada
```

#### LEER (SELECT)
```java
// Repository.findAll() - Lista completa
// Repository.findById(id) - Por ID
// Repository.findByNombre(nombre) - Query personalizada
```

#### ACTUALIZAR (UPDATE)
```java
// Buscar entity existente por ID
// Actualizar campos necesarios
// Repository.save(entity)
```

#### ELIMINAR (DELETE)
```java
// Preferir soft delete (activo = false)
// Repository.deleteById(id) solo si es necesario
```

### RELACIONES
- **@ManyToOne**: Empleado -> Area, Venta -> Cliente
- **@OneToMany**: Cliente -> List<Venta> (evitar carga eager)
- **@ManyToMany**: Paquete <-> Servicio (tabla intermedia)

### TRANSACCIONES
- Usar @Transactional en métodos Service que modifican datos
- Rollback automático en caso de excepción
- Timeout: 30 segundos por defecto

### AUDITORÍA
- Registrar todas las operaciones importantes
- Guardar: usuario, acción, entidad, ID, detalles, fecha, IP
- No auditar consultas SELECT

## REGLAS IMPORTANTES
1. NUNCA eliminar datos sin verificar dependencias
2. SIEMPRE validar datos antes de guardar
3. Usar transacciones para operaciones múltiples
4. Mantener integridad referencial
5. Actualizar stock en movimientos/ventas/compras
6. Registrar auditoría en operaciones críticas
