package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Movimiento;
import com.peluqueria.peluqueria.repository.MovimientoRepository;
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
public class MovimientoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(MovimientoService.class);

    @Autowired
    private MovimientoRepository movimientoRepository;

    public List<Movimiento> findAll() {
        try {
            List<Movimiento> movimientos = movimientoRepository.findAll();
            LOGGER.info("OUT: Lista de movimientos obtenida con éxito: [{}]", movimientos.size());
            return movimientos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de movimientos", e);
            throw e;
        }
    }

    public Optional<Movimiento> findById(Integer id) {
        try {
            Optional<Movimiento> movimiento = movimientoRepository.findById(id);
            LOGGER.info("OUT: Movimiento encontrado: [{}]", movimiento);
            return movimiento;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el movimiento por ID", e);
            throw e;
        }
    }

    public Movimiento save(Movimiento movimiento) {
        try {
            Movimiento savedMovimiento = movimientoRepository.save(movimiento);
            LOGGER.info("OUT: Movimiento guardado con éxito: [{}]", savedMovimiento);
            return savedMovimiento;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el movimiento", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (movimientoRepository.existsById(id)) {
                movimientoRepository.deleteById(id);
                LOGGER.info("Movimiento con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el movimiento con ID [{}] para eliminar", id);
                throw new RuntimeException("Movimiento no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el movimiento", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = movimientoRepository.existsById(id);
            LOGGER.info("El movimiento con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el movimiento", e);
            throw e;
        }
    }

    public ResponseEntity<Movimiento> actualizarMovimiento(Integer id, Movimiento movimiento) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Movimiento> movimientoExistente = movimientoRepository.findById(id);
            if (movimientoExistente.isPresent()) {
                Movimiento actualMovimiento = movimientoExistente.get();
                actualMovimiento.setMonto(movimiento.getMonto());
                actualMovimiento.setCaja(movimiento.getCaja());
                actualMovimiento.setIdAsociado(movimiento.getIdAsociado());
                actualMovimiento.setTipo(movimiento.getTipo());
                Movimiento actualMovimientoSalvo = movimientoRepository.save(actualMovimiento);
                LOGGER.info("OUT:[{}]", actualMovimientoSalvo);
                return ResponseEntity.ok(actualMovimientoSalvo);
            } else {
                LOGGER.info("OUT: [{}] El movimiento no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el movimiento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Movimiento> agregarMovimiento(@RequestBody Movimiento movimiento) {
        LOGGER.info("IN: [{}]", movimiento);
        try {
            Movimiento guardarMovimiento = new Movimiento();
            guardarMovimiento.setMonto(movimiento.getMonto());
            guardarMovimiento.setCaja(movimiento.getCaja());
            guardarMovimiento.setIdAsociado(movimiento.getIdAsociado());
            guardarMovimiento.setTipo(movimiento.getTipo());
            Movimiento guardarMovimientoSalvo = movimientoRepository.save(guardarMovimiento);
            LOGGER.info("OUT:[{}] Movimiento guardado", guardarMovimientoSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarMovimientoSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el movimiento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}