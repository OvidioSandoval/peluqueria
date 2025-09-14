package com.peluqueria.peluqueria.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

    public void enviarRecordatorio(String email, String nombreCliente, String fechaHora, String servicio) {
        try {
            // Implementar lógica de envío de email
            LOGGER.info("Enviando recordatorio por email a: {} para turno: {}", email, fechaHora);
            // Aquí iría la implementación real del envío de email
        } catch (Exception e) {
            LOGGER.error("Error al enviar recordatorio por email", e);
        }
    }

    public void enviarAlerta(String email, String asunto, String mensaje) {
        try {
            LOGGER.info("Enviando alerta por email a: {} - Asunto: {}", email, asunto);
            // Aquí iría la implementación real del envío de alerta
        } catch (Exception e) {
            LOGGER.error("Error al enviar alerta por email", e);
        }
    }
}