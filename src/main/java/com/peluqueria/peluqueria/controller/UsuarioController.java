package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Usuario;
import com.peluqueria.peluqueria.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioService;
    
    @GetMapping
    public List<Usuario> getAllUsuarios() {
        return usuarioService.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getUsuarioById(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createUsuario(@Valid @RequestBody Usuario usuario) {
        try {
            Usuario savedUsuario = usuarioService.save(usuario);
            return ResponseEntity.ok(savedUsuario);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUsuario(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        return usuarioService.findById(id)
                .map(existingUsuario -> {
                    try {
                        usuario.setId(id);
                        Usuario updatedUsuario = usuarioService.update(usuario);
                        return ResponseEntity.ok(updatedUsuario);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUsuario(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(usuario -> {
                    usuarioService.deleteById(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}