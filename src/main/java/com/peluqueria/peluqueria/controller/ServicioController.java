package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.dto.ServicioDTO;
import com.peluqueria.peluqueria.model.Servicio;
import com.peluqueria.peluqueria.services.ServicioService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(ServicioController.class);

    @Autowired
    private ServicioService servicioService;

    @GetMapping
    public List<ServicioDTO> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return servicioService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Servicio> obtenerPorId(@PathVariable Integer id) {
        Optional<Servicio> servicio = servicioService.findById(id);
        if (servicio.isPresent()) {
            return ResponseEntity.ok(servicio.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_servicio/{id}")
    public ResponseEntity<ServicioDTO> actualizarServicio(@PathVariable Integer id, @RequestBody Servicio servicioActualizado) {
        return servicioService.actualizarServicio(id, servicioActualizado);
    }

    @PostMapping("/agregar_servicio")
    public ResponseEntity<ServicioDTO> crearServicio(@RequestBody Servicio servicio) {
        return servicioService.agregarServicio(servicio);
    }

    @DeleteMapping("/eliminar_servicio/{id}")
    public ResponseEntity<Void> eliminarServicio(@PathVariable Integer id) {
        try {
            servicioService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/buscar")
    public List<ServicioDTO> buscarPorDescripcion(@RequestParam String descripcion) {
        LOGGER.info("IN: Buscando servicios por descripción [{}]", descripcion);
        return servicioService.buscarPorDescripcion(descripcion);
    }
}