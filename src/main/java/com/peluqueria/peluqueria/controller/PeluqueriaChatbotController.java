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
        if (msg.contains("hola") || msg.contains("buenos días")) {
            return "¡Hola! Bienvenido/a a Peluquería Luna ✂️\n¿En qué puedo ayudarte?\n• servicios\n• horario\n• ubicación\n• reservar";
        } else if (msg.contains("servicio")) {
            return "📋 Nuestros servicios:\n• Corte: $25\n• Tinte: $40\n• Peinado: $30\n• Barba: $15\nEscribe *reservar*.";
        } else if (msg.contains("horario")) {
            return "🕐 Lunes a Sábado: 9:00 AM - 7:00 PM\n❌ Domingo cerrado";
        } else if (msg.contains("ubicación")) {
            return "📍 Av. Siempre Viva 123, Ciudad Moderna\n👉 https://maps.example.com";
        } else if (msg.contains("reservar")) {
            return "📞 Llama al *0976763408* o escríbenos aquí tu nombre y hora preferida.";
        } else {
            return "No entendí. Usa: hola, servicios, horario, ubicación, reservar.";
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