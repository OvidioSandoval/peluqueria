package com.peluqueria.peluqueria.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class PeluqueriaChatbotController{

    // Endpoint para el chat web
    @PostMapping("/chat-web")
    public ResponseEntity<Map<String, String>> recibirMensajeWeb(@RequestBody Map<String, String> payload) {
        try {
            String mensaje = payload.get("message").toLowerCase().trim();
            String respuesta = procesarMensaje(mensaje);
            return ResponseEntity.ok(Map.of("reply", respuesta));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("reply", "Lo siento, ocurrió un error."));
        }
    }

    private String procesarMensaje(String msg) {
        if (msg.contains("hola") || msg.contains("buenos") || msg.contains("buenas")) {
            return "¡Hola! Bienvenido/a a Peluquería Luna ✂️\n¿En qué puedo ayudarte?\n• servicios\n• horario\n• ubicación\n• reservar";
        } else if (msg.contains("servicio")) {
            return "📋 Nuestros servicios:\n• Cortes de cabello\n• Coloración y tintes\n• Peinados\n• Tratamientos capilares\n• Manicure y pedicure\n\nEscribe *reservar* para agendar tu cita.";
        } else if (msg.contains("horario")) {
            return "🕐 Horarios de atención:\n📅 Lunes a Viernes: 7:00 AM - 12:00 PM y 1:00 PM - 5:00 PM\n📅 Sábados: 7:00 AM - 12:00 PM\n❌ Domingos: Cerrado";
        } else if (msg.contains("ubicación") || msg.contains("ubicacion") || msg.contains("dirección") || msg.contains("direccion") || msg.contains("donde")) {
            return "📍 Ubicación:\nPeluquería Luna\nVillarrica, Paraguay\n\nVer en Google Maps: https://www.google.com/maps?q=-25.78422336248415,-56.43555306434461";
        } else if (msg.contains("reservar") || msg.contains("turno") || msg.contains("cita")) {
            return "📞 Para reservar tu turno:\n• Llámanos: +595 976 763 408\n• WhatsApp: +595 976 763 408\n• Ubicación: Villarrica, Paraguay\n\n¡Te esperamos!";
        } else if (msg.contains("precio") || msg.contains("costo") || msg.contains("cuanto")) {
            return "💰 Para consultar precios específicos, por favor contáctanos al +595 976 763 408 o visita nuestra sección de servicios en la web.";
        } else {
            return "No entendí tu mensaje. 🤔\nPuedes preguntar sobre:\n• servicios\n• horario\n• ubicación\n• reservar";
        }
    }

    // Webhook de verificación (por si usas API oficial en futuro)
    @GetMapping
    public ResponseEntity<String> verificar(@RequestParam Map<String, String> params) {
        String mode = params.get("hub.mode");
        String token = params.get("hub.verify_token");
        String challenge = params.get("hub.challenge");

        if ("subscribe".equals(mode) && "mi_verificacion_123".equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).body("Error");
    }
}