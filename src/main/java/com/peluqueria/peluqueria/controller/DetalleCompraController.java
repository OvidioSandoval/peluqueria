package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.DetalleCompra;
import com.peluqueria.peluqueria.services.DetalleCompraService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/detalle-compras")
public class DetalleCompraController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(DetalleCompraController.class);

    @Autowired
    private DetalleCompraService detalleCompraService;

    @GetMapping
    public List<DetalleCompra> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return detalleCompraService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DetalleCompra> obtenerPorId(@PathVariable Integer id) {
        Optional<DetalleCompra> detalle = detalleCompraService.findById(id);
        if (detalle.isPresent()) {
            return ResponseEntity.ok(detalle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_detalle/{id}")
    public ResponseEntity<DetalleCompra> actualizarDetalle(@PathVariable Integer id, @RequestBody DetalleCompra detalleActualizado) {
        return detalleCompraService.actualizarDetalleCompra(id, detalleActualizado);
    }

    @PostMapping("/agregar_detalle")
    public ResponseEntity<DetalleCompra> crearDetalle(@RequestBody DetalleCompra detalle) {
        return detalleCompraService.agregarDetalleCompra(detalle);
    }

    @DeleteMapping("/eliminar_detalle/{id}")
    public ResponseEntity<Void> eliminarDetalle(@PathVariable Integer id) {
        try {
            detalleCompraService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}