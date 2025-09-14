package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.dto.ServicioDTO;
import com.peluqueria.peluqueria.model.Servicio;
import com.peluqueria.peluqueria.repository.ServicioRepository;
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
public class ServicioService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ServicioService.class);

    @Autowired
    private ServicioRepository servicioRepository;

    public List<ServicioDTO> findAll() {
        try {
            List<Servicio> servicios = servicioRepository.findAll();
            List<ServicioDTO> serviciosDTO = servicios.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            LOGGER.info("OUT: Lista de servicios obtenida con éxito: [{}]", serviciosDTO.size());
            return serviciosDTO;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de servicios", e);
            throw e;
        }
    }

    public Optional<Servicio> findById(Integer id) {
        try {
            Optional<Servicio> servicio = servicioRepository.findById(id);
            LOGGER.info("OUT: Servicio encontrado: [{}]", servicio);
            return servicio;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el servicio por ID", e);
            throw e;
        }
    }

    public Servicio save(Servicio servicio) {
        try {
            Servicio savedServicio = servicioRepository.save(servicio);
            LOGGER.info("OUT: Servicio guardado con éxito: [{}]", savedServicio);
            return savedServicio;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el servicio", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (servicioRepository.existsById(id)) {
                servicioRepository.deleteById(id);
                LOGGER.info("Servicio con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el servicio con ID [{}] para eliminar", id);
                throw new RuntimeException("Servicio no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el servicio", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = servicioRepository.existsById(id);
            LOGGER.info("El servicio con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el servicio", e);
            throw e;
        }
    }

    public ResponseEntity<ServicioDTO> actualizarServicio(Integer id, Servicio servicio) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Servicio> servicioExistente = servicioRepository.findById(id);
            if (servicioExistente.isPresent()) {
                Servicio actualServicio = servicioExistente.get();
                actualServicio.setNombre(servicio.getNombre());
                actualServicio.setDescripcion(servicio.getDescripcion());
                actualServicio.setPrecioBase(servicio.getPrecioBase());
                actualServicio.setActivo(servicio.getActivo());
                actualServicio.setCategoria(servicio.getCategoria());
                Servicio actualServicioSalvo = servicioRepository.save(actualServicio);
                ServicioDTO servicioDTO = convertToDTO(actualServicioSalvo);
                LOGGER.info("OUT:[{}]", servicioDTO);
                return ResponseEntity.ok(servicioDTO);
            } else {
                LOGGER.info("OUT: [{}] El servicio no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el servicio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<ServicioDTO> agregarServicio(@RequestBody Servicio servicio) {
        LOGGER.info("IN: [{}]", servicio);
        try {
            Servicio guardarServicio = new Servicio();
            guardarServicio.setNombre(servicio.getNombre());
            guardarServicio.setDescripcion(servicio.getDescripcion());
            guardarServicio.setPrecioBase(servicio.getPrecioBase());
            guardarServicio.setActivo(servicio.getActivo());
            guardarServicio.setCategoria(servicio.getCategoria());
            Servicio guardarServicioSalvo = servicioRepository.save(guardarServicio);
            ServicioDTO servicioDTO = convertToDTO(guardarServicioSalvo);
            LOGGER.info("OUT:[{}] Servicio guardado", servicioDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(servicioDTO);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el servicio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public List<ServicioDTO> buscarPorDescripcion(String descripcion) {
        try {
            List<Servicio> servicios = servicioRepository.findByDescripcionContainingIgnoreCase(descripcion);
            List<ServicioDTO> serviciosDTO = servicios.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            LOGGER.info("OUT: Servicios encontrados por descripción [{}]: [{}]", descripcion, serviciosDTO.size());
            return serviciosDTO;
        } catch (Exception e) {
            LOGGER.error("Error al buscar servicios por descripción", e);
            throw e;
        }
    }

    private ServicioDTO convertToDTO(Servicio servicio) {
        return new ServicioDTO(
            servicio.getId(),
            servicio.getNombre(),
            servicio.getDescripcion(),
            servicio.getPrecioBase(),
            servicio.getActivo(),
            servicio.getFechaCreacion(),
            servicio.getCategoria() != null ? servicio.getCategoria().getId() : null,
            servicio.getCategoria() != null ? servicio.getCategoria().getDescripcion() : null
        );
    }
}