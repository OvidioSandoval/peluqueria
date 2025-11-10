package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Promocion;
import com.peluqueria.peluqueria.services.PromocionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promociones")
public class PromocionController {

    @Autowired
    private PromocionService promocionService;

    @GetMapping
    public List<Promocion> obtenerTodas() {
        return promocionService.findAll();
    }

    @GetMapping("/activas")
    public List<Promocion> obtenerActivas() {
        return promocionService.findActivas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Promocion> obtenerPorId(@PathVariable Integer id) {
        return promocionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Promocion> crear(@RequestBody Promocion promocion) {
        Promocion saved = promocionService.save(promocion);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Promocion> actualizar(@PathVariable Integer id, @RequestBody Promocion promocion) {
        return promocionService.findById(id)
                .map(existing -> {
                    promocion.setId(id);
                    return ResponseEntity.ok(promocionService.save(promocion));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (promocionService.findById(id).isPresent()) {
            promocionService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
