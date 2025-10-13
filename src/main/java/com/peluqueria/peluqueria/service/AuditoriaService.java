package com.peluqueria.peluqueria.service;

import com.peluqueria.peluqueria.model.Auditoria;
import com.peluqueria.peluqueria.model.Usuario;
import com.peluqueria.peluqueria.repository.AuditoriaRepository;
import com.peluqueria.peluqueria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

@Service
public class AuditoriaService {
    
    @Autowired
    private AuditoriaRepository auditoriaRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    public void registrarAccion(String accion, String detalles) {
        registrarAccion(accion, null, null, detalles, null);
    }
    
    public void registrarAccion(String accion, String tablaAfectada, Long registroId, String detalles, HttpServletRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String usuarioNombre = auth != null ? auth.getName() : "ANONIMO";
            
            Auditoria auditoria = new Auditoria();
            auditoria.setUsuarioNombre(usuarioNombre);
            auditoria.setAccion(accion);
            auditoria.setTablaAfectada(tablaAfectada);
            auditoria.setRegistroId(registroId);
            auditoria.setDetalles(detalles);
            auditoria.setFechaHora(LocalDateTime.now());
            
            // Set usuario_id if user exists
            if (!"ANONIMO".equals(usuarioNombre)) {
                Usuario usuario = usuarioRepository.findByUsername(usuarioNombre).orElse(null);
                if (usuario != null) {
                    auditoria.setUsuarioId(usuario.getId());
                }
            }
            
            if (request != null) {
                auditoria.setIpAddress(getClientIpAddress(request));
                auditoria.setUserAgent(request.getHeader("User-Agent"));
            }
            
            auditoriaRepository.save(auditoria);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Error registrando auditoría: " + e.getMessage());
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0];
        }
    }
}