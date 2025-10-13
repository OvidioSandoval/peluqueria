package com.peluqueria.peluqueria.config;

import com.peluqueria.peluqueria.service.AuditoriaService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditoriaService auditoriaService;

    @AfterReturning(pointcut = "execution(* com.peluqueria.peluqueria.controller.*Controller.*(..)) && " +
                              "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
                              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
                              "@annotation(org.springframework.web.bind.annotation.DeleteMapping))", 
                    returning = "result")
    public void auditCrudOperations(JoinPoint joinPoint, Object result) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            Object[] args = joinPoint.getArgs();
            
            HttpServletRequest request = null;
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                request = attributes.getRequest();
            }
            
            String action = determineAction(methodName);
            String tableName = extractTableName(className);
            Long recordId = extractRecordId(result, args);
            String details = buildDetails(action, tableName, methodName, recordId);
            
            auditoriaService.registrarAccion(action, tableName, recordId, details, request);
            
        } catch (Exception e) {
            System.err.println("Error en auditoría: " + e.getMessage());
        }
    }
    
    private String determineAction(String methodName) {
        if (methodName.contains("agregar") || methodName.contains("crear")) {
            return "CREATE";
        } else if (methodName.contains("actualizar") || methodName.contains("modificar")) {
            return "UPDATE";
        } else if (methodName.contains("eliminar") || methodName.contains("delete")) {
            return "DELETE";
        }
        return "OPERATION";
    }
    
    private String extractTableName(String className) {
        return className.replace("Controller", "").toLowerCase();
    }
    
    private Long extractRecordId(Object result, Object[] args) {
        try {
            // Try to get ID from ResponseEntity
            if (result instanceof ResponseEntity) {
                ResponseEntity<?> response = (ResponseEntity<?>) result;
                Object body = response.getBody();
                if (body != null && body.getClass().getMethod("getId") != null) {
                    Object id = body.getClass().getMethod("getId").invoke(body);
                    if (id instanceof Long) return (Long) id;
                    if (id instanceof Integer) return ((Integer) id).longValue();
                }
            }
            
            // Try to get ID from path variable (for updates/deletes)
            for (Object arg : args) {
                if (arg instanceof Long) return (Long) arg;
                if (arg instanceof Integer) return ((Integer) arg).longValue();
            }
        } catch (Exception e) {
            // Ignore reflection errors
        }
        return null;
    }
    
    private String buildDetails(String action, String tableName, String methodName, Long recordId) {
        StringBuilder details = new StringBuilder();
        details.append(action).append(" en tabla ").append(tableName);
        if (recordId != null) {
            details.append(" - ID: ").append(recordId);
        }
        details.append(" (").append(methodName).append(")");
        return details.toString();
    }
}