--liquibase formatted sql

--changeset peluqueria:1
CREATE TABLE IF NOT EXISTS area (
    id_area INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200)
);

--changeset peluqueria:2
CREATE TABLE IF NOT EXISTS categoria_servicio (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200)
);

--changeset peluqueria:3
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    direccion VARCHAR(200),
    ruc VARCHAR(20)
);

--changeset peluqueria:4
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(10),
    ruc VARCHAR(20),
    correo VARCHAR(100),
    redes_sociales TEXT,
    fecha_nacimiento DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--changeset peluqueria:5
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100),
    telefono VARCHAR(20),
    area_id INT NOT NULL,
    sueldo_base INT NOT NULL,
    comision_porcentaje INT DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_ingreso DATE,
    total_pagado INT DEFAULT 0,
    sueldo_total INT DEFAULT 0,
    diferencia INT DEFAULT 0,
    FOREIGN KEY (area_id) REFERENCES area(id_area)
);

--changeset peluqueria:6
CREATE TABLE IF NOT EXISTS producto (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(50),
    precio_compra INT NOT NULL,
    precio_venta INT NOT NULL,
    cantidad_stock_inicial INT NOT NULL,
    cantidad_optima_stock INT,
    minimo_stock INT,
    activo BOOLEAN DEFAULT 1,
    en_promocion BOOLEAN DEFAULT 0,
    precio_promocion INT
);

--changeset peluqueria:7
CREATE TABLE IF NOT EXISTS servicio (
    id_servicio INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    precio INT NOT NULL,
    duracion_minutos INT,
    categoria_id INT,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categoria_servicio(id_categoria)
);

--changeset peluqueria:8
CREATE TABLE IF NOT EXISTS venta (
    id_venta INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    empleado_id INT,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,
    metodo_pago VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'completada',
    FOREIGN KEY (cliente_id) REFERENCES cliente(id_cliente),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id_empleado)
);

--changeset peluqueria:9
CREATE TABLE IF NOT EXISTS compra (
    id_compra INT PRIMARY KEY AUTO_INCREMENT,
    proveedor_id INT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada',
    FOREIGN KEY (proveedor_id) REFERENCES proveedor(id_proveedor)
);

--changeset peluqueria:10
CREATE TABLE IF NOT EXISTS turno (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    empleado_id INT,
    servicio_id INT,
    fecha_turno DATETIME NOT NULL,
    duracion_minutos INT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id_cliente),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id_empleado),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id_servicio)
);

--changeset peluqueria:11
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--changeset peluqueria:12
CREATE TABLE IF NOT EXISTS rol (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(200)
);

--changeset peluqueria:13
CREATE TABLE IF NOT EXISTS caja (
    id_caja INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    fecha_apertura TIMESTAMP,
    fecha_cierre TIMESTAMP,
    monto_inicial INT DEFAULT 0,
    monto_final INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'abierta'
);

--changeset peluqueria:14
CREATE TABLE IF NOT EXISTS gasto (
    id_gasto INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(200) NOT NULL,
    monto INT NOT NULL,
    fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(50)
);

--changeset peluqueria:15
CREATE TABLE IF NOT EXISTS movimiento (
    id_movimiento INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(200),
    FOREIGN KEY (producto_id) REFERENCES producto(id_producto)
);

--changeset peluqueria:16
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT,
    producto_id INT,
    servicio_id INT,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,
    subtotal INT NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES venta(id_venta),
    FOREIGN KEY (producto_id) REFERENCES producto(id_producto),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id_servicio)
);

--changeset peluqueria:17
CREATE TABLE IF NOT EXISTS detalle_compra (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    compra_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,
    subtotal INT NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compra(id_compra),
    FOREIGN KEY (producto_id) REFERENCES producto(id_producto)
);

--changeset peluqueria:18
CREATE TABLE IF NOT EXISTS paquete_servicio (
    id_paquete INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    precio_total INT NOT NULL,
    activo BOOLEAN DEFAULT 1
);

--changeset peluqueria:19
CREATE TABLE IF NOT EXISTS paquetes_contiene_servicio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paquete_id INT,
    servicio_id INT,
    FOREIGN KEY (paquete_id) REFERENCES paquete_servicio(id_paquete),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id_servicio)
);

--changeset peluqueria:20
CREATE TABLE IF NOT EXISTS informacion_stock (
    id_informacion INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT UNIQUE,
    cantidad_actual INT NOT NULL,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id_producto)
);

--changeset peluqueria:21
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria BIGINT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(100),
    accion VARCHAR(50),
    entidad VARCHAR(100),
    entidad_id VARCHAR(50),
    detalles TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50)
);

--changeset peluqueria:22
CREATE TABLE IF NOT EXISTS promocion (
    id_promocion INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    precio INT NOT NULL,
    servicio_id INT,
    producto_id INT,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servicio_id) REFERENCES servicio(id_servicio),
    FOREIGN KEY (producto_id) REFERENCES producto(id_producto)
);

--changeset peluqueria:23
ALTER TABLE promocion DROP COLUMN IF EXISTS descripcion;

--changeset peluqueria:24
ALTER TABLE promocion DROP COLUMN IF EXISTS tipo;
