package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Caja;
import com.peluqueria.peluqueria.services.CajaService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cajas")
public class CajaController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(CajaController.class);

    @Autowired
    private CajaService cajaService;

    @GetMapping
    public List<Caja> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return cajaService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Caja> obtenerPorId(@PathVariable Integer id) {
        Optional<Caja> caja = cajaService.findById(id);
        if (caja.isPresent()) {
            return ResponseEntity.ok(caja.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_caja/{id}")
    public ResponseEntity<Caja> actualizarCaja(@PathVariable Integer id, @RequestBody Caja cajaActualizada) {
        return cajaService.actualizarCaja(id, cajaActualizada);
    }

    @PostMapping("/agregar_caja")
    public ResponseEntity<Caja> crearCaja(@RequestBody Caja caja) {
        return cajaService.agregarCaja(caja);
    }

    @DeleteMapping("/eliminar_caja/{id}")
    public ResponseEntity<Void> eliminarCaja(@PathVariable Integer id) {
        try {
            cajaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}