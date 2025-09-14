package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.InformacionStock;
import com.peluqueria.peluqueria.repository.InformacionStockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertaStockService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AlertaStockService.class);

    @Autowired
    private InformacionStockRepository informacionStockRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private WhatsAppService whatsAppService;

    @Scheduled(fixedRate = 3600000) // Cada hora
    public void verificarStockBajo() {
        LOGGER.info("Verificando productos con stock bajo");
        
        List<InformacionStock> productosStockBajo = informacionStockRepository.findProductosConStockBajo();
        
        for (InformacionStock stock : productosStockBajo) {
            enviarAlertaStock(stock);
        }
        
        LOGGER.info("Verificación de stock completada. Productos con stock bajo: {}", productosStockBajo.size());
    }

    public List<InformacionStock> obtenerProductosConStockBajo() {
        try {
            List<InformacionStock> productos = informacionStockRepository.findProductosConStockBajo();
            LOGGER.info("Productos con stock bajo encontrados: {}", productos.size());
            return productos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener productos con stock bajo", e);
            throw e;
        }
    }

    private void enviarAlertaStock(InformacionStock stock) {
        String mensaje = String.format("ALERTA: El producto '%s' tiene stock bajo. Stock actual: %d, Mínimo: %d",
            stock.getProducto().getNombre(),
            stock.getStockActual(),
            stock.getProducto().getMinimoStock());
        
        LOGGER.warn(mensaje);
        
        // Enviar por email y WhatsApp a administradores
        // emailService.enviarAlerta("admin@peluqueria.com", "Alerta de Stock Bajo", mensaje);
        // whatsAppService.enviarAlerta("1234567890", "Administrador", mensaje);
    }
}