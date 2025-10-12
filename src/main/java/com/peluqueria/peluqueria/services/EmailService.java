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
    
    public void enviarRecordatorioAutomatico(String email, String nombreCliente, String fechaHora, String servicio, String tipoRecordatorio) {
        try {
            String asunto = "Recordatorio de Turno - Peluquería LUNA";
            String mensaje = String.format(
                "Hola %s,\n\n" +
                "Te recordamos que tienes un turno programado en %s.\n\n" +
                "Detalles del turno:\n" +
                "- Servicio: %s\n" +
                "- Fecha y Hora: %s\n\n" +
                "Este recordatorio se envía %s antes de tu cita.\n\n" +
                "Si necesitas cancelar o reprogramar, contáctanos lo antes posible.\n\n" +
                "Gracias,\n" +
                "Peluquería LUNA",
                nombreCliente, tipoRecordatorio, servicio, fechaHora, tipoRecordatorio
            );
            
            LOGGER.info("Enviando recordatorio automático por email a: {} - {} antes del turno: {}", email, tipoRecordatorio, fechaHora);
            // Aquí iría la implementación real del envío de email con el mensaje personalizado
        } catch (Exception e) {
            LOGGER.error("Error al enviar recordatorio automático por email", e);
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