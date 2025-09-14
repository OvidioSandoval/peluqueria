package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Area;
import com.peluqueria.peluqueria.services.AreaService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(AreaController.class);

    @Autowired
    private AreaService areaService;

    @GetMapping
    public List<Area> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return areaService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Area> obtenerPorId(@PathVariable Integer id) {
        Optional<Area> area = areaService.findById(id);
        if (area.isPresent()) {
            return ResponseEntity.ok(area.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_area/{id}")
    public ResponseEntity<Area> actualizarArea(@PathVariable Integer id, @RequestBody Area areaActualizada) {
        return areaService.actualizarArea(id, areaActualizada);
    }

    @PostMapping("/agregar_area")
    public ResponseEntity<Area> crearArea(@RequestBody Area area) {
        return areaService.agregarArea(area);
    }

    @DeleteMapping("/eliminar_area/{id}")
    public ResponseEntity<Void> eliminarArea(@PathVariable Integer id) {
        try {
            areaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}