-- Crear tabla rol
CREATE TABLE rol (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL
);

-- Crear tabla usuario
CREATE TABLE usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    correo VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    rol_id BIGINT,
    FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- Insertar roles básicos
INSERT INTO rol (descripcion) VALUES ('ADMIN');
INSERT INTO rol (descripcion) VALUES ('CAJERO');
INSERT INTO rol (descripcion) VALUES ('PELUQUERO');