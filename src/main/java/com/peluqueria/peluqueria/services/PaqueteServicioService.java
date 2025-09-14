package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.PaqueteServicio;
import com.peluqueria.peluqueria.repository.PaqueteServicioRepository;
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
public class PaqueteServicioService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PaqueteServicioService.class);

    @Autowired
    private PaqueteServicioRepository paqueteServicioRepository;

    public List<PaqueteServicio> findAll() {
        try {
            List<PaqueteServicio> paquetes = paqueteServicioRepository.findAll();
            LOGGER.info("OUT: Lista de paquetes obtenida con éxito: [{}]", paquetes.size());
            return paquetes;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de paquetes", e);
            throw e;
        }
    }

    public Optional<PaqueteServicio> findById(Integer id) {
        try {
            Optional<PaqueteServicio> paquete = paqueteServicioRepository.findById(id);
            LOGGER.info("OUT: Paquete encontrado: [{}]", paquete);
            return paquete;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el paquete por ID", e);
            throw e;
        }
    }

    public PaqueteServicio save(PaqueteServicio paquete) {
        try {
            PaqueteServicio saved = paqueteServicioRepository.save(paquete);
            LOGGER.info("OUT: Paquete guardado con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el paquete", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (paqueteServicioRepository.existsById(id)) {
                paqueteServicioRepository.deleteById(id);
                LOGGER.info("Paquete con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el paquete con ID [{}] para eliminar", id);
                throw new RuntimeException("Paquete no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el paquete", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = paqueteServicioRepository.existsById(id);
            LOGGER.info("El paquete con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el paquete", e);
            throw e;
        }
    }

    public ResponseEntity<PaqueteServicio> actualizarPaquete(Integer id, PaqueteServicio paquete) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<PaqueteServicio> paqueteExistente = paqueteServicioRepository.findById(id);
            if (paqueteExistente.isPresent()) {
                PaqueteServicio actualPaquete = paqueteExistente.get();
                actualPaquete.setDescripcion(paquete.getDescripcion());
                actualPaquete.setPrecioTotal(paquete.getPrecioTotal());
                actualPaquete.setDescuentoAplicado(paquete.getDescuentoAplicado());
                PaqueteServicio actualPaqueteSalvo = paqueteServicioRepository.save(actualPaquete);
                LOGGER.info("OUT:[{}]", actualPaqueteSalvo);
                return ResponseEntity.ok(actualPaqueteSalvo);
            } else {
                LOGGER.info("OUT: [{}] El paquete no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el paquete", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<PaqueteServicio> agregarPaquete(@RequestBody PaqueteServicio paquete) {
        LOGGER.info("IN: [{}]", paquete);
        try {
            PaqueteServicio guardarPaquete = new PaqueteServicio();
            guardarPaquete.setDescripcion(paquete.getDescripcion());
            guardarPaquete.setPrecioTotal(paquete.getPrecioTotal());
            guardarPaquete.setDescuentoAplicado(paquete.getDescuentoAplicado());
            PaqueteServicio guardarPaqueteSalvo = paqueteServicioRepository.save(guardarPaquete);
            LOGGER.info("OUT:[{}] Paquete guardado", guardarPaqueteSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarPaqueteSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el paquete", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}