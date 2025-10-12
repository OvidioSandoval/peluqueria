package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Turno;
import com.peluqueria.peluqueria.repository.TurnoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class RecordatorioScheduler {
    private static final Logger LOGGER = LoggerFactory.getLogger(RecordatorioScheduler.class);

    @Autowired
    private TurnoRepository turnoRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private WhatsAppService whatsAppService;

    @Scheduled(fixedRate = 900000) // Ejecuta cada 15 minutos
    public void enviarRecordatorios() {
        LOGGER.info("Iniciando proceso de envío de recordatorios");
        
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime en24Horas = ahora.plusHours(24);
        LocalDateTime en1Hora = ahora.plusHours(1);
        LocalDateTime en15Minutos = ahora.plusMinutes(15);
        
        List<Turno> turnos = turnoRepository.findTurnosParaRecordatorioAutomatico(
            en24Horas.toLocalDate(), en24Horas.toLocalTime(),
            en1Hora.toLocalDate(), en1Hora.toLocalTime(),
            en15Minutos.toLocalDate(), en15Minutos.toLocalTime()
        );
        
        for (Turno turno : turnos) {
            enviarRecordatorioAutomatico(turno);
        }
    }

    private void enviarRecordatorioAutomatico(Turno turno) {
        String fechaHora = turno.getFecha() + " " + turno.getHora();
        String servicio = turno.getServicio().getNombre();
        String nombreCliente = turno.getCliente().getNombreCompleto();
        String correo = turno.getCliente().getCorreo();
        String telefono = turno.getCliente().getTelefono();
        
        LocalDateTime turnoDateTime = LocalDateTime.of(turno.getFecha(), turno.getHora());
        LocalDateTime ahora = LocalDateTime.now();
        long minutosRestantes = java.time.Duration.between(ahora, turnoDateTime).toMinutes();
        
        String tipoRecordatorio;
        if (minutosRestantes > 1200) { // 24 horas
            tipoRecordatorio = "24 horas";
        } else if (minutosRestantes > 30) { // 1 hora
            tipoRecordatorio = "1 hora";
        } else { // 15 minutos
            tipoRecordatorio = "15 minutos";
        }
        
        if (correo != null && !correo.isEmpty()) {
            emailService.enviarRecordatorioAutomatico(correo, nombreCliente, fechaHora, servicio, tipoRecordatorio);
        }
        
        if (telefono != null && !telefono.isEmpty()) {
            whatsAppService.enviarRecordatorioAutomatico(telefono, nombreCliente, fechaHora, servicio, tipoRecordatorio);
        }
        
        LOGGER.info("Recordatorio enviado para turno de {} - {} antes", nombreCliente, tipoRecordatorio);
    }
    
    private void enviarRecordatorio(Turno turno) {
        String fechaHora = turno.getFecha() + " " + turno.getHora();
        String servicio = turno.getServicio().getNombre();
        String nombreCliente = turno.getCliente().getNombreCompleto();
        
        if (turno.getCliente().getCorreo() != null) {
            emailService.enviarRecordatorio(turno.getCliente().getCorreo(), nombreCliente, fechaHora, servicio);
        }
        
        if (turno.getCliente().getTelefono() != null) {
            whatsAppService.enviarRecordatorio(turno.getCliente().getTelefono(), nombreCliente, fechaHora, servicio);
        }
    }
}