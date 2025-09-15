-- Agregar columna total_pagado a la tabla empleado
ALTER TABLE empleado ADD COLUMN total_pagado INT DEFAULT 0;

-- Actualizar registros existentes con valor por defecto
UPDATE empleado SET total_pagado = 0 WHERE total_pagado IS NULL;