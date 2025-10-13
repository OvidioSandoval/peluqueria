-- Crear tabla de auditoría
CREATE TABLE auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT,
    usuario_nombre VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id BIGINT,
    detalles TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_hora);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);