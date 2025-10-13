package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    boolean existsByUsername(String username);
    boolean existsByCorreo(String correo);
    Usuario findByUsername(String username);
}