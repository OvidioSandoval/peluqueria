package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Turno;
import com.peluqueria.peluqueria.repository.TurnoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;

@Service
public class TurnoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(TurnoService.class);

    @Autowired
    private TurnoRepository turnoRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private WhatsAppService whatsAppService;

    public List<Turno> findAll() {
        try {
            List<Turno> turnos = turnoRepository.findAll();
            LOGGER.info("OUT: Lista de turnos obtenida con éxito: [{}]", turnos.size());
            return turnos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de turnos", e);
            throw e;
        }
    }

    public Optional<Turno> findById(Integer id) {
        try {
            Optional<Turno> turno = turnoRepository.findById(id);
            LOGGER.info("OUT: Turno encontrado: [{}]", turno);
            return turno;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el turno por ID", e);
            throw e;
        }
    }

    public Turno save(Turno turno) {
        try {
            Turno savedTurno = turnoRepository.save(turno);
            LOGGER.info("OUT: Turno guardado con éxito: [{}]", savedTurno);
            return savedTurno;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el turno", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (turnoRepository.existsById(id)) {
                turnoRepository.deleteById(id);
                LOGGER.info("Turno con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el turno con ID [{}] para eliminar", id);
                throw new RuntimeException("Turno no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el turno", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = turnoRepository.existsById(id);
            LOGGER.info("El turno con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el turno", e);
            throw e;
        }
    }

    public ResponseEntity<Turno> actualizarTurno(Integer id, Turno turno) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Turno> turnoExistente = turnoRepository.findById(id);
            if (turnoExistente.isPresent()) {
                Turno actualTurno = turnoExistente.get();
                actualTurno.setCliente(turno.getCliente());
                actualTurno.setServicio(turno.getServicio());
                actualTurno.setEmpleado(turno.getEmpleado());
                actualTurno.setFecha(turno.getFecha());
                actualTurno.setHora(turno.getHora());
                actualTurno.setEstado(turno.getEstado());
                actualTurno.setMotivoCancelacion(turno.getMotivoCancelacion());
                actualTurno.setRecordatorioEnviado(turno.getRecordatorioEnviado());
                Turno actualTurnoSalvo = turnoRepository.save(actualTurno);
                LOGGER.info("OUT:[{}]", actualTurnoSalvo);
                return ResponseEntity.ok(actualTurnoSalvo);
            } else {
                LOGGER.info("OUT: [{}] El turno no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el turno", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Turno> agregarTurno(@RequestBody Turno turno) {
        LOGGER.info("IN: [{}]", turno);
        try {
            Turno guardarTurno = new Turno();
            guardarTurno.setCliente(turno.getCliente());
            guardarTurno.setServicio(turno.getServicio());
            guardarTurno.setEmpleado(turno.getEmpleado());
            guardarTurno.setFecha(turno.getFecha());
            guardarTurno.setHora(turno.getHora());
            guardarTurno.setEstado(turno.getEstado());
            guardarTurno.setMotivoCancelacion(turno.getMotivoCancelacion());
            guardarTurno.setRecordatorioEnviado(turno.getRecordatorioEnviado());
            Turno guardarTurnoSalvo = turnoRepository.save(guardarTurno);
            LOGGER.info("OUT:[{}] Turno guardado", guardarTurnoSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarTurnoSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el turno", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public void enviarRecordatorioManual(Integer turnoId) {
        try {
            Optional<Turno> turnoOpt = turnoRepository.findById(turnoId);
            if (turnoOpt.isPresent()) {
                Turno turno = turnoOpt.get();
                enviarRecordatorio(turno);
                turno.setRecordatorioEnviado(true);
                turnoRepository.save(turno);
                LOGGER.info("Recordatorio enviado manualmente para turno ID: {}", turnoId);
            }
        } catch (Exception e) {
            LOGGER.error("Error al enviar recordatorio manual", e);
            throw e;
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