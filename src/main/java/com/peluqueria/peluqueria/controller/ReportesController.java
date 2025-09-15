package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {

    @Autowired
    private ServicioService servicioService;
    
    @Autowired
    private ClienteService clienteService;
    
    @Autowired
    private ProductoService productoService;
    
    @Autowired
    private EmpleadoService empleadoService;
    
    @Autowired
    private VentaService ventaService;

    @GetMapping("/servicios-mas-solicitados")
    public ResponseEntity<List<Map<String, Object>>> getServiciosMasSolicitados() {
        try {
            List<Map<String, Object>> servicios = servicioService.getServiciosMasSolicitados();
            return ResponseEntity.ok(servicios);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/clientes-mas-frecuentes")
    public ResponseEntity<List<Map<String, Object>>> getClientesMasFrecuentes() {
        try {
            List<Map<String, Object>> clientes = clienteService.getClientesMasFrecuentes();
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/productos-bajo-stock")
    public ResponseEntity<List<Map<String, Object>>> getProductosBajoStock() {
        try {
            List<Map<String, Object>> productos = productoService.getProductosBajoStock();
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/sueldos-comisiones")
    public ResponseEntity<List<Map<String, Object>>> getSueldosComisiones() {
        try {
            List<Map<String, Object>> empleados = empleadoService.getSueldosComisiones();
            return ResponseEntity.ok(empleados);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/historial-descuentos")
    public ResponseEntity<List<Map<String, Object>>> getHistorialDescuentos() {
        try {
            List<Map<String, Object>> descuentos = ventaService.getHistorialDescuentos();
            return ResponseEntity.ok(descuentos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}