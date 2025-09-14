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

    @Scheduled(fixedRate = 3600000) // Ejecuta cada hora
    public void enviarRecordatorios() {
        LOGGER.info("Iniciando proceso de envío de recordatorios");
        
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime en24Horas = ahora.plusHours(24);
        LocalDateTime en1Hora = ahora.plusHours(1);
        
        List<Turno> turnos = turnoRepository.findTurnosParaRecordatorio(
            en24Horas.toLocalDate(), en24Horas.toLocalTime(),
            en1Hora.toLocalDate(), en1Hora.toLocalTime()
        );
        
        for (Turno turno : turnos) {
            if (!turno.getRecordatorioEnviado()) {
                enviarRecordatorio(turno);
                turno.setRecordatorioEnviado(true);
                turnoRepository.save(turno);
            }
        }
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