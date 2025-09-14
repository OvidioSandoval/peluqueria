package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.DetalleVenta;
import com.peluqueria.peluqueria.services.DetalleVentaService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/detalle-ventas")
public class DetalleVentaController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(DetalleVentaController.class);

    @Autowired
    private DetalleVentaService detalleVentaService;

    @GetMapping
    public List<DetalleVenta> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return detalleVentaService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DetalleVenta> obtenerPorId(@PathVariable Integer id) {
        Optional<DetalleVenta> detalle = detalleVentaService.findById(id);
        if (detalle.isPresent()) {
            return ResponseEntity.ok(detalle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_detalle/{id}")
    public ResponseEntity<DetalleVenta> actualizarDetalle(@PathVariable Integer id, @RequestBody DetalleVenta detalleActualizado) {
        return detalleVentaService.actualizarDetalleVenta(id, detalleActualizado);
    }

    @PostMapping("/agregar_detalle")
    public ResponseEntity<DetalleVenta> crearDetalle(@RequestBody DetalleVenta detalle) {
        return detalleVentaService.agregarDetalleVenta(detalle);
    }

    @DeleteMapping("/eliminar_detalle/{id}")
    public ResponseEntity<Void> eliminarDetalle(@PathVariable Integer id) {
        try {
            detalleVentaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}