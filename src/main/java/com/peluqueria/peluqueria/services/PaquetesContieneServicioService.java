package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.dto.PaquetesContieneServicioDTO;
import com.peluqueria.peluqueria.model.PaquetesContieneServicio;
import com.peluqueria.peluqueria.repository.PaquetesContieneServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaquetesContieneServicioService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PaquetesContieneServicioService.class);

    @Autowired
    private PaquetesContieneServicioRepository paquetesContieneServicioRepository;

    public List<PaquetesContieneServicioDTO> findAll() {
        try {
            List<PaquetesContieneServicio> paquetesServicios = paquetesContieneServicioRepository.findAll();
            List<PaquetesContieneServicioDTO> dtos = paquetesServicios.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            LOGGER.info("OUT: Lista de paquetes-servicios obtenida con éxito: [{}]", dtos.size());
            return dtos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de paquetes-servicios", e);
            throw e;
        }
    }

    public Optional<PaquetesContieneServicio> findById(Integer id) {
        try {
            Optional<PaquetesContieneServicio> paqueteServicio = paquetesContieneServicioRepository.findById(id);
            LOGGER.info("OUT: Paquete-servicio encontrado: [{}]", paqueteServicio);
            return paqueteServicio;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el paquete-servicio por ID", e);
            throw e;
        }
    }

    public PaquetesContieneServicio save(PaquetesContieneServicio paqueteServicio) {
        try {
            PaquetesContieneServicio saved = paquetesContieneServicioRepository.save(paqueteServicio);
            LOGGER.info("OUT: Paquete-servicio guardado con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el paquete-servicio", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (paquetesContieneServicioRepository.existsById(id)) {
                paquetesContieneServicioRepository.deleteById(id);
                LOGGER.info("Paquete-servicio con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el paquete-servicio con ID [{}] para eliminar", id);
                throw new RuntimeException("Paquete-servicio no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el paquete-servicio", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = paquetesContieneServicioRepository.existsById(id);
            LOGGER.info("El paquete-servicio con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el paquete-servicio", e);
            throw e;
        }
    }

    public ResponseEntity<PaquetesContieneServicioDTO> actualizarPaqueteServicio(Integer id, PaquetesContieneServicio paqueteServicio) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<PaquetesContieneServicio> paqueteExistente = paquetesContieneServicioRepository.findById(id);
            if (paqueteExistente.isPresent()) {
                PaquetesContieneServicio actualPaquete = paqueteExistente.get();
                actualPaquete.setPaquete(paqueteServicio.getPaquete());
                actualPaquete.setServicio(paqueteServicio.getServicio());
                actualPaquete.setCantidad(paqueteServicio.getCantidad());
                PaquetesContieneServicio actualPaqueteSalvo = paquetesContieneServicioRepository.save(actualPaquete);
                PaquetesContieneServicioDTO dto = convertToDTO(actualPaqueteSalvo);
                LOGGER.info("OUT:[{}]", dto);
                return ResponseEntity.ok(dto);
            } else {
                LOGGER.info("OUT: [{}] El paquete-servicio no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el paquete-servicio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<PaquetesContieneServicioDTO> agregarPaqueteServicio(@RequestBody PaquetesContieneServicio paqueteServicio) {
        LOGGER.info("IN: [{}]", paqueteServicio);
        try {
            PaquetesContieneServicio guardarPaquete = new PaquetesContieneServicio();
            guardarPaquete.setPaquete(paqueteServicio.getPaquete());
            guardarPaquete.setServicio(paqueteServicio.getServicio());
            guardarPaquete.setCantidad(paqueteServicio.getCantidad());
            PaquetesContieneServicio guardarPaqueteSalvo = paquetesContieneServicioRepository.save(guardarPaquete);
            PaquetesContieneServicioDTO dto = convertToDTO(guardarPaqueteSalvo);
            LOGGER.info("OUT:[{}] Paquete-servicio guardado", dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el paquete-servicio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private PaquetesContieneServicioDTO convertToDTO(PaquetesContieneServicio entity) {
        return new PaquetesContieneServicioDTO(
            entity.getId(),
            entity.getPaquete() != null ? entity.getPaquete().getId() : null,
            entity.getPaquete() != null ? entity.getPaquete().getDescripcion() : null,
            entity.getServicio() != null ? entity.getServicio().getId() : null,
            entity.getServicio() != null ? entity.getServicio().getNombre() : null,
            entity.getCantidad()
        );
    }
}