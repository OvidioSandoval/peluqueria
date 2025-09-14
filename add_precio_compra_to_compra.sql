-- Add precio_compra column to compra table
ALTER TABLE compra ADD COLUMN precio_compra INT NOT NULL DEFAULT 0;

-- Update existing records to calculate precio_compra from total/cantidad
UPDATE compra SET precio_compra = CASE 
    WHEN cantidad > 0 THEN total / cantidad 
    ELSE 0 
END 
WHERE precio_compra = 0;