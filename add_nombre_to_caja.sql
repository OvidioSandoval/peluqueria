-- Add nombre column to caja table
ALTER TABLE caja ADD COLUMN nombre VARCHAR(100);

-- Update existing records with default names
UPDATE caja SET nombre = CONCAT('Caja ', id) WHERE nombre IS NULL;