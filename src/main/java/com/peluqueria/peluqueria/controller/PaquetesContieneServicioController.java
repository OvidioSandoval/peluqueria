package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.dto.PaquetesContieneServicioDTO;
import com.peluqueria.peluqueria.model.PaquetesContieneServicio;
import com.peluqueria.peluqueria.services.PaquetesContieneServicioService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/paquetes-servicios")
public class PaquetesContieneServicioController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(PaquetesContieneServicioController.class);

    @Autowired
    private PaquetesContieneServicioService paquetesContieneServicioService;

    @GetMapping
    public List<PaquetesContieneServicioDTO> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return paquetesContieneServicioService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaquetesContieneServicio> obtenerPorId(@PathVariable Integer id) {
        Optional<PaquetesContieneServicio> paqueteServicio = paquetesContieneServicioService.findById(id);
        if (paqueteServicio.isPresent()) {
            return ResponseEntity.ok(paqueteServicio.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_paquete_servicio/{id}")
    public ResponseEntity<PaquetesContieneServicioDTO> actualizarPaqueteServicio(@PathVariable Integer id, @RequestBody PaquetesContieneServicio paqueteActualizado) {
        return paquetesContieneServicioService.actualizarPaqueteServicio(id, paqueteActualizado);
    }

    @PostMapping("/agregar_paquete_servicio")
    public ResponseEntity<PaquetesContieneServicioDTO> crearPaqueteServicio(@RequestBody PaquetesContieneServicio paqueteServicio) {
        return paquetesContieneServicioService.agregarPaqueteServicio(paqueteServicio);
    }

    @DeleteMapping("/eliminar_paquete/{id}")
    public ResponseEntity<Void> eliminarPaqueteServicio(@PathVariable Integer id) {
        try {
            paquetesContieneServicioService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}