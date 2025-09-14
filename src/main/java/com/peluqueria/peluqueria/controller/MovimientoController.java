package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Movimiento;
import com.peluqueria.peluqueria.services.MovimientoService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(MovimientoController.class);

    @Autowired
    private MovimientoService movimientoService;

    @GetMapping
    public List<Movimiento> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return movimientoService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movimiento> obtenerPorId(@PathVariable Integer id) {
        Optional<Movimiento> movimiento = movimientoService.findById(id);
        if (movimiento.isPresent()) {
            return ResponseEntity.ok(movimiento.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_movimiento/{id}")
    public ResponseEntity<Movimiento> actualizarMovimiento(@PathVariable Integer id, @RequestBody Movimiento movimientoActualizado) {
        return movimientoService.actualizarMovimiento(id, movimientoActualizado);
    }

    @PostMapping("/agregar_movimiento")
    public ResponseEntity<Movimiento> crearMovimiento(@RequestBody Movimiento movimiento) {
        return movimientoService.agregarMovimiento(movimiento);
    }

    @DeleteMapping("/eliminar_movimiento/{id}")
    public ResponseEntity<Void> eliminarMovimiento(@PathVariable Integer id) {
        try {
            movimientoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}