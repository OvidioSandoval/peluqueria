package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Compra;
import com.peluqueria.peluqueria.services.CompraService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(CompraController.class);

    @Autowired
    private CompraService compraService;

    @GetMapping
    public List<Compra> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return compraService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Compra> obtenerPorId(@PathVariable Integer id) {
        Optional<Compra> compra = compraService.findById(id);
        if (compra.isPresent()) {
            return ResponseEntity.ok(compra.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_compra/{id}")
    public ResponseEntity<Compra> actualizarCompra(@PathVariable Integer id, @RequestBody Compra compraActualizada) {
        return compraService.actualizarCompra(id, compraActualizada);
    }

    @PostMapping("/agregar_compra")
    public ResponseEntity<Compra> crearCompra(@RequestBody Compra compra) {
        return compraService.agregarCompra(compra);
    }

    @DeleteMapping("/eliminar_compra/{id}")
    public ResponseEntity<Void> eliminarCompra(@PathVariable Integer id) {
        try {
            compraService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}