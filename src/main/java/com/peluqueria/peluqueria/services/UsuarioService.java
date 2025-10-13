package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Usuario;
import com.peluqueria.peluqueria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }
    
    public Optional<Usuario> findById(Long id) {
        return usuarioRepository.findById(id);
    }
    
    public Usuario save(Usuario usuario) {
        if (usuario.getCorreo() != null && !isValidEmail(usuario.getCorreo())) {
            throw new IllegalArgumentException("Formato de correo electrónico inválido");
        }
        
        if (usuario.getId() == null) {
            if (usuarioRepository.existsByUsername(usuario.getUsername())) {
                throw new IllegalArgumentException("El username ya existe");
            }
            if (usuario.getCorreo() != null && usuarioRepository.existsByCorreo(usuario.getCorreo())) {
                throw new IllegalArgumentException("El correo ya existe");
            }
        }
        
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }
    
    public Usuario update(Usuario usuario) {
        if (usuario.getCorreo() != null && !isValidEmail(usuario.getCorreo())) {
            throw new IllegalArgumentException("Formato de correo electrónico inválido");
        }
        
        if (usuario.getPassword() != null && !usuario.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }
        
        return usuarioRepository.save(usuario);
    }
    
    public void deleteById(Long id) {
        usuarioRepository.deleteById(id);
    }
    
    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }
    
    public boolean existsByUsername(String username) {
        return usuarioRepository.existsByUsername(username);
    }
    
    public Usuario findByUsername(String username) {
        return usuarioRepository.findByUsername(username).orElse(null);
    }
}