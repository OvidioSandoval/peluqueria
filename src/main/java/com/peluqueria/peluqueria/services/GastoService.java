package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Gasto;
import com.peluqueria.peluqueria.repository.GastoRepository;
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
public class GastoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(GastoService.class);

    @Autowired
    private GastoRepository gastoRepository;

    public List<Gasto> findAll() {
        try {
            List<Gasto> gastos = gastoRepository.findAll();
            LOGGER.info("OUT: Lista de gastos obtenida con éxito: [{}]", gastos.size());
            return gastos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de gastos", e);
            throw e;
        }
    }

    public Optional<Gasto> findById(Integer id) {
        try {
            Optional<Gasto> gasto = gastoRepository.findById(id);
            LOGGER.info("OUT: Gasto encontrado: [{}]", gasto);
            return gasto;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el gasto por ID", e);
            throw e;
        }
    }

    public Gasto save(Gasto gasto) {
        try {
            Gasto saved = gastoRepository.save(gasto);
            LOGGER.info("OUT: Gasto guardado con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el gasto", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (gastoRepository.existsById(id)) {
                gastoRepository.deleteById(id);
                LOGGER.info("Gasto con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el gasto con ID [{}] para eliminar", id);
                throw new RuntimeException("Gasto no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el gasto", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = gastoRepository.existsById(id);
            LOGGER.info("El gasto con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el gasto", e);
            throw e;
        }
    }

    public ResponseEntity<Gasto> actualizarGasto(Integer id, Gasto gasto) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Gasto> gastoExistente = gastoRepository.findById(id);
            if (gastoExistente.isPresent()) {
                Gasto actualGasto = gastoExistente.get();
                actualGasto.setDescripcion(gasto.getDescripcion());
                actualGasto.setMonto(gasto.getMonto());
                actualGasto.setFechaGasto(gasto.getFechaGasto());
                actualGasto.setCategoriaGasto(gasto.getCategoriaGasto());
                actualGasto.setEmpleado(gasto.getEmpleado());
                Gasto actualGastoSalvo = gastoRepository.save(actualGasto);
                LOGGER.info("OUT:[{}]", actualGastoSalvo);
                return ResponseEntity.ok(actualGastoSalvo);
            } else {
                LOGGER.info("OUT: [{}] El gasto no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el gasto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Gasto> agregarGasto(@RequestBody Gasto gasto) {
        LOGGER.info("IN: [{}]", gasto);
        try {
            Gasto guardarGasto = new Gasto();
            guardarGasto.setDescripcion(gasto.getDescripcion());
            guardarGasto.setMonto(gasto.getMonto());
            guardarGasto.setFechaGasto(gasto.getFechaGasto());
            guardarGasto.setCategoriaGasto(gasto.getCategoriaGasto());
            guardarGasto.setEmpleado(gasto.getEmpleado());
            Gasto guardarGastoSalvo = gastoRepository.save(guardarGasto);
            LOGGER.info("OUT:[{}] Gasto guardado", guardarGastoSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarGastoSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el gasto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}