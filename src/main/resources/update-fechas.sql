-- Actualizar registros sin fecha de registro
UPDATE informacion_stock 
SET fecha_registro_informacion_stock = NOW() 
WHERE fecha_registro_informacion_stock IS NULL;