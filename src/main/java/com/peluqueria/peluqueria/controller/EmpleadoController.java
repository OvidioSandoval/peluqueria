package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Empleado;
import com.peluqueria.peluqueria.services.EmpleadoService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(EmpleadoController.class);

    @Autowired
    private EmpleadoService empleadoService;

    @GetMapping
    public List<Empleado> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return empleadoService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empleado> obtenerPorId(@PathVariable Integer id) {
        Optional<Empleado> empleado = empleadoService.findById(id);
        if (empleado.isPresent()) {
            return ResponseEntity.ok(empleado.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_empleado/{id}")
    public ResponseEntity<Empleado> actualizarEmpleado(@PathVariable Integer id, @RequestBody Empleado empleadoActualizado) {
        return empleadoService.actualizarEmpleado(id, empleadoActualizado);
    }

    @PostMapping("/agregar_empleado")
    public ResponseEntity<Empleado> crearEmpleado(@RequestBody Empleado empleado) {
        return empleadoService.agregarEmpleado(empleado);
    }

    @DeleteMapping("/eliminar_empleado/{id}")
    public ResponseEntity<Void> eliminarEmpleado(@PathVariable Integer id) {
        try {
            empleadoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}