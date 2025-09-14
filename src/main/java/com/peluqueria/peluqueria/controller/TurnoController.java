package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Turno;
import com.peluqueria.peluqueria.services.TurnoService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(TurnoController.class);

    @Autowired
    private TurnoService turnoService;

    @GetMapping
    public List<Turno> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return turnoService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turno> obtenerPorId(@PathVariable Integer id) {
        Optional<Turno> turno = turnoService.findById(id);
        if (turno.isPresent()) {
            return ResponseEntity.ok(turno.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_turno/{id}")
    public ResponseEntity<Turno> actualizarTurno(@PathVariable Integer id, @RequestBody Turno turnoActualizado) {
        return turnoService.actualizarTurno(id, turnoActualizado);
    }

    @PostMapping("/agregar_turno")
    public ResponseEntity<Turno> crearTurno(@RequestBody Turno turno) {
        return turnoService.agregarTurno(turno);
    }

    @DeleteMapping("/eliminar_turno/{id}")
    public ResponseEntity<Void> eliminarTurno(@PathVariable Integer id) {
        try {
            turnoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/recordatorio/{id}")
    public ResponseEntity<Void> enviarRecordatorio(@PathVariable Integer id) {
        try {
            turnoService.enviarRecordatorioManual(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            LOGGER.error("Error al enviar recordatorio", e);
            return ResponseEntity.status(500).build();
        }
    }
}