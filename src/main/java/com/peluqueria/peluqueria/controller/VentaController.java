package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Venta;
import com.peluqueria.peluqueria.services.VentaService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(VentaController.class);

    @Autowired
    private VentaService ventaService;

    @GetMapping
    public List<Venta> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return ventaService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Venta> obtenerPorId(@PathVariable Integer id) {
        Optional<Venta> venta = ventaService.findById(id);
        if (venta.isPresent()) {
            return ResponseEntity.ok(venta.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_venta/{id}")
    public ResponseEntity<Venta> actualizarVenta(@PathVariable Integer id, @RequestBody Venta ventaActualizada) {
        return ventaService.actualizarVenta(id, ventaActualizada);
    }

    @PostMapping("/agregar_venta")
    public ResponseEntity<Venta> crearVenta(@RequestBody Venta venta) {
        return ventaService.agregarVenta(venta);
    }

    @DeleteMapping("/eliminar_venta/{id}")
    public ResponseEntity<Void> eliminarVenta(@PathVariable Integer id) {
        try {
            ventaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}