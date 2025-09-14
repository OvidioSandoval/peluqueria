package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.InformacionStock;
import com.peluqueria.peluqueria.services.AlertaStockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas-stock")
public class AlertaStockController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AlertaStockController.class);

    @Autowired
    private AlertaStockService alertaStockService;

    @GetMapping
    public List<InformacionStock> obtenerAlertas() {
        LOGGER.info("IN: Obteniendo alertas de stock");
        return alertaStockService.obtenerProductosConStockBajo();
    }

    @GetMapping("/stock-bajo")
    public List<InformacionStock> obtenerProductosConStockBajo() {
        LOGGER.info("IN: Obteniendo productos con stock bajo");
        return alertaStockService.obtenerProductosConStockBajo();
    }

    @PostMapping("/verificar")
    public ResponseEntity<Void> verificarStockManual() {
        try {
            alertaStockService.verificarStockBajo();
            LOGGER.info("Verificación manual de stock completada");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            LOGGER.error("Error en verificación manual de stock", e);
            return ResponseEntity.status(500).build();
        }
    }
}