package com.peluqueria.peluqueria.config;

import com.peluqueria.peluqueria.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private AuditoriaService auditoriaService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        // Log successful login
        auditoriaService.registrarAccion("LOGIN", "usuario", null, 
            "Usuario autenticado exitosamente", request);
        
        response.sendRedirect("/web/panel-control");
    }
}