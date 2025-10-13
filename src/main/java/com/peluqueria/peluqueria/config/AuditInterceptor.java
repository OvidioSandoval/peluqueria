package com.peluqueria.peluqueria.config;

import com.peluqueria.peluqueria.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuditInterceptor implements HandlerInterceptor {

    @Autowired
    private AuditoriaService auditoriaService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String uri = request.getRequestURI();
            String method = request.getMethod();
            
            // Only log page visits (GET requests to /web/ or /app/ paths)
            if ("GET".equals(method) && (uri.startsWith("/web/") || uri.startsWith("/app/"))) {
                String pageName = extractPageName(uri);
                auditoriaService.registrarAccion("PAGE_VIEW", null, null, 
                    "Acceso a página: " + pageName, request);
            }
        }
        
        return true;
    }
    
    private String extractPageName(String uri) {
        if (uri.startsWith("/web/")) {
            return uri.substring(5); // Remove "/web/"
        } else if (uri.startsWith("/app/")) {
            return uri.substring(5); // Remove "/app/"
        }
        return uri;
    }
}