package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Empleado;
import com.peluqueria.peluqueria.repository.EmpleadoRepository;
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
public class EmpleadoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmpleadoService.class);

    @Autowired
    private EmpleadoRepository empleadoRepository;

    public List<Empleado> findAll() {
        try {
            List<Empleado> empleados = empleadoRepository.findAll();
            LOGGER.info("OUT: Lista de empleados obtenida con éxito: [{}]", empleados.size());
            return empleados;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de empleados", e);
            throw e;
        }
    }

    public Optional<Empleado> findById(Integer id) {
        try {
            Optional<Empleado> empleado = empleadoRepository.findById(id);
            LOGGER.info("OUT: Empleado encontrado: [{}]", empleado);
            return empleado;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el empleado por ID", e);
            throw e;
        }
    }

    public Empleado save(Empleado empleado) {
        try {
            Empleado savedEmpleado = empleadoRepository.save(empleado);
            LOGGER.info("OUT: Empleado guardado con éxito: [{}]", savedEmpleado);
            return savedEmpleado;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el empleado", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (empleadoRepository.existsById(id)) {
                empleadoRepository.deleteById(id);
                LOGGER.info("Empleado con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el empleado con ID [{}] para eliminar", id);
                throw new RuntimeException("Empleado no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el empleado", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = empleadoRepository.existsById(id);
            LOGGER.info("El empleado con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el empleado", e);
            throw e;
        }
    }

    public ResponseEntity<Empleado> actualizarEmpleado(Integer id, Empleado empleado) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Empleado> empleadoExistente = empleadoRepository.findById(id);
            if (empleadoExistente.isPresent()) {
                Empleado actualEmpleado = empleadoExistente.get();
                actualEmpleado.setNombreCompleto(empleado.getNombreCompleto());
                actualEmpleado.setCorreo(empleado.getCorreo());
                actualEmpleado.setTelefono(empleado.getTelefono());
                actualEmpleado.setArea(empleado.getArea());
                actualEmpleado.setSueldoBase(empleado.getSueldoBase());
                actualEmpleado.setComisionPorcentaje(empleado.getComisionPorcentaje());
                actualEmpleado.setActivo(empleado.getActivo());
                actualEmpleado.setFechaIngreso(empleado.getFechaIngreso());
                Empleado actualEmpleadoSalvo = empleadoRepository.save(actualEmpleado);
                LOGGER.info("OUT:[{}]", actualEmpleadoSalvo);
                return ResponseEntity.ok(actualEmpleadoSalvo);
            } else {
                LOGGER.info("OUT: [{}] El empleado no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el empleado", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Empleado> agregarEmpleado(@RequestBody Empleado empleado) {
        LOGGER.info("IN: [{}]", empleado);
        try {
            Empleado guardarEmpleado = new Empleado();
            guardarEmpleado.setNombreCompleto(empleado.getNombreCompleto());
            guardarEmpleado.setCorreo(empleado.getCorreo());
            guardarEmpleado.setTelefono(empleado.getTelefono());
            guardarEmpleado.setArea(empleado.getArea());
            guardarEmpleado.setSueldoBase(empleado.getSueldoBase());
            guardarEmpleado.setComisionPorcentaje(empleado.getComisionPorcentaje());
            guardarEmpleado.setActivo(empleado.getActivo());
            guardarEmpleado.setFechaIngreso(empleado.getFechaIngreso());
            Empleado guardarEmpleadoSalvo = empleadoRepository.save(guardarEmpleado);
            LOGGER.info("OUT:[{}] Empleado guardado", guardarEmpleadoSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarEmpleadoSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el empleado", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}