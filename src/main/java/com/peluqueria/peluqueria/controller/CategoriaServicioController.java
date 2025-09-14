package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.CategoriaServicio;
import com.peluqueria.peluqueria.services.CategoriaServicioService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categoria-servicios")
public class CategoriaServicioController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(CategoriaServicioController.class);

    @Autowired
    private CategoriaServicioService categoriaServicioService;

    @GetMapping
    public List<CategoriaServicio> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return categoriaServicioService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaServicio> obtenerPorId(@PathVariable Integer id) {
        Optional<CategoriaServicio> categoria = categoriaServicioService.findById(id);
        if (categoria.isPresent()) {
            return ResponseEntity.ok(categoria.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_categoria/{id}")
    public ResponseEntity<CategoriaServicio> actualizarCategoria(@PathVariable Integer id, @RequestBody CategoriaServicio categoriaActualizada) {
        return categoriaServicioService.actualizarCategoria(id, categoriaActualizada);
    }

    @PostMapping("/agregar_categoria")
    public ResponseEntity<CategoriaServicio> crearCategoria(@RequestBody CategoriaServicio categoria) {
        return categoriaServicioService.agregarCategoria(categoria);
    }

    @DeleteMapping("/eliminar_categoria/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Integer id) {
        try {
            categoriaServicioService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}