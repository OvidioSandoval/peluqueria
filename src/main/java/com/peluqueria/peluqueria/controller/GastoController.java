package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Gasto;
import com.peluqueria.peluqueria.services.GastoService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(GastoController.class);

    @Autowired
    private GastoService gastoService;

    @GetMapping
    public List<Gasto> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return gastoService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gasto> obtenerPorId(@PathVariable Integer id) {
        Optional<Gasto> gasto = gastoService.findById(id);
        if (gasto.isPresent()) {
            return ResponseEntity.ok(gasto.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_gasto/{id}")
    public ResponseEntity<Gasto> actualizarGasto(@PathVariable Integer id, @RequestBody Gasto gastoActualizado) {
        return gastoService.actualizarGasto(id, gastoActualizado);
    }

    @PostMapping("/agregar_gasto")
    public ResponseEntity<Gasto> crearGasto(@RequestBody Gasto gasto) {
        return gastoService.agregarGasto(gasto);
    }

    @DeleteMapping("/eliminar_gasto/{id}")
    public ResponseEntity<Void> eliminarGasto(@PathVariable Integer id) {
        try {
            gastoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}