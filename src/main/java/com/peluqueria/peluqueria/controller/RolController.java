package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Rol;
import com.peluqueria.peluqueria.services.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RolController {
    @Autowired
    private RolService rolService;
    
    @GetMapping
    public List<Rol> getAllRoles() {
        return rolService.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Rol> getRolById(@PathVariable Long id) {
        return rolService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Rol createRol(@RequestBody Rol rol) {
        return rolService.save(rol);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Rol> updateRol(@PathVariable Long id, @RequestBody Rol rol) {
        return rolService.findById(id)
                .map(existingRol -> {
                    rol.setId(id);
                    return ResponseEntity.ok(rolService.save(rol));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRol(@PathVariable Long id) {
        return rolService.findById(id)
                .map(rol -> {
                    rolService.deleteById(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}