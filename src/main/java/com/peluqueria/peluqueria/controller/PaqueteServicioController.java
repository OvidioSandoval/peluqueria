package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.PaqueteServicio;
import com.peluqueria.peluqueria.services.PaqueteServicioService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/paquetes")
public class PaqueteServicioController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(PaqueteServicioController.class);

    @Autowired
    private PaqueteServicioService paqueteServicioService;

    @GetMapping
    public List<PaqueteServicio> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return paqueteServicioService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaqueteServicio> obtenerPorId(@PathVariable Integer id) {
        Optional<PaqueteServicio> paquete = paqueteServicioService.findById(id);
        if (paquete.isPresent()) {
            return ResponseEntity.ok(paquete.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_paquete/{id}")
    public ResponseEntity<PaqueteServicio> actualizarPaquete(@PathVariable Integer id, @RequestBody PaqueteServicio paqueteActualizado) {
        return paqueteServicioService.actualizarPaquete(id, paqueteActualizado);
    }

    @PostMapping("/agregar_paquete")
    public ResponseEntity<PaqueteServicio> crearPaquete(@RequestBody PaqueteServicio paquete) {
        return paqueteServicioService.agregarPaquete(paquete);
    }

    @DeleteMapping("/eliminar_paquete/{id}")
    public ResponseEntity<Void> eliminarPaquete(@PathVariable Integer id) {
        try {
            paqueteServicioService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}