package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Producto;
import com.peluqueria.peluqueria.services.ProductoService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(ProductoController.class);

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public List<Producto> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return productoService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable Integer id) {
        Optional<Producto> producto = productoService.findById(id);
        if (producto.isPresent()) {
            return ResponseEntity.ok(producto.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_producto/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Integer id, @RequestBody Producto productoActualizado) {
        return productoService.actualizarProducto(id, productoActualizado);
    }

    @PostMapping("/agregar_producto")
    public ResponseEntity<Producto> crearProducto(@RequestBody Producto producto) {
        return productoService.agregarProducto(producto);
    }

    @DeleteMapping("/eliminar_producto/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Integer id) {
        try {
            productoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/bajo-stock")
    public List<java.util.Map<String, Object>> obtenerProductosBajoStock() {
        LOGGER.info("IN: Obteniendo productos con bajo stock");
        try {
            List<java.util.Map<String, Object>> productos = productoService.getProductosBajoStock();
            LOGGER.info("OUT: [{}] productos con bajo stock encontrados", productos.size());
            return productos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener productos con bajo stock", e);
            throw e;
        }
    }
}