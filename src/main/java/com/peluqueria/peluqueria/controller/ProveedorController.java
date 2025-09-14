package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Proveedor;
import com.peluqueria.peluqueria.services.ProveedorService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(ProveedorController.class);

    @Autowired
    private ProveedorService proveedorService;

    @GetMapping
    public List<Proveedor> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return proveedorService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> obtenerPorId(@PathVariable Integer id) {
        Optional<Proveedor> proveedor = proveedorService.findById(id);
        if (proveedor.isPresent()) {
            return ResponseEntity.ok(proveedor.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_proveedor/{id}")
    public ResponseEntity<Proveedor> actualizarProveedor(@PathVariable Integer id, @RequestBody Proveedor proveedorActualizado) {
        return proveedorService.actualizarProveedor(id, proveedorActualizado);
    }

    @PostMapping("/agregar_proveedor")
    public ResponseEntity<Proveedor> crearProveedor(@RequestBody Proveedor proveedor) {
        return proveedorService.agregarProveedor(proveedor);
    }

    @DeleteMapping("/eliminar_proveedor/{id}")
    public ResponseEntity<Void> eliminarProveedor(@PathVariable Integer id) {
        try {
            proveedorService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}