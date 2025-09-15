-- Agregar columna sueldo_total a la tabla empleado
ALTER TABLE empleado ADD COLUMN sueldo_total INT DEFAULT 0;

-- Actualizar registros existentes con valor por defecto (sueldo_base)
UPDATE empleado SET sueldo_total = sueldo_base WHERE sueldo_total IS NULL OR sueldo_total = 0;