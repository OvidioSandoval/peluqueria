package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.dto.InformacionStockDTO;
import com.peluqueria.peluqueria.model.InformacionStock;
import com.peluqueria.peluqueria.services.InformacionStockService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/informacion-stock")
public class InformacionStockController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(InformacionStockController.class);

    @Autowired
    private InformacionStockService informacionStockService;

    @GetMapping
    public List<InformacionStockDTO> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return informacionStockService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<InformacionStock> obtenerPorId(@PathVariable Integer id) {
        Optional<InformacionStock> informacion = informacionStockService.findById(id);
        if (informacion.isPresent()) {
            return ResponseEntity.ok(informacion.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_informacion/{id}")
    public ResponseEntity<InformacionStockDTO> actualizarInformacion(@PathVariable Integer id, @RequestBody InformacionStock informacionActualizada) {
        return informacionStockService.actualizarInformacionStock(id, informacionActualizada);
    }

    @PostMapping("/agregar_informacion")
    public ResponseEntity<InformacionStockDTO> crearInformacion(@RequestBody InformacionStock informacion) {
        return informacionStockService.agregarInformacionStock(informacion);
    }

    @DeleteMapping("/eliminar_informacion/{id}")
    public ResponseEntity<Void> eliminarInformacion(@PathVariable Integer id) {
        try {
            informacionStockService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}