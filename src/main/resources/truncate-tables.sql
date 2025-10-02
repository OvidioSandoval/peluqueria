-- Script para truncar todas las tablas de la base de datos peluqueria
-- ADVERTENCIA: Este script eliminará todos los datos de las tablas

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE detalle_venta;
TRUNCATE TABLE detalle_compra;
TRUNCATE TABLE paquetes_contiene_servicio;
TRUNCATE TABLE venta;
TRUNCATE TABLE compra;
TRUNCATE TABLE turno;
TRUNCATE TABLE movimiento;
TRUNCATE TABLE informacion_stock;
TRUNCATE TABLE gasto;
TRUNCATE TABLE caja;
TRUNCATE TABLE paquete_servicio;
TRUNCATE TABLE servicio;
TRUNCATE TABLE categoria_servicio;
TRUNCATE TABLE producto;
TRUNCATE TABLE proveedor;
TRUNCATE TABLE empleado;
TRUNCATE TABLE cliente;
TRUNCATE TABLE area;

SET FOREIGN_KEY_CHECKS = 1;