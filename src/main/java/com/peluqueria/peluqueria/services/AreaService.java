package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Area;
import com.peluqueria.peluqueria.repository.AreaRepository;
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
public class AreaService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AreaService.class);

    @Autowired
    private AreaRepository areaRepository;

    public List<Area> findAll() {
        try {
            List<Area> areas = areaRepository.findAll();
            LOGGER.info("OUT: Lista de areas obtenida con éxito: [{}]", areas.size());
            return areas;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de areas", e);
            throw e;
        }
    }

    public Optional<Area> findById(Integer id) {
        try {
            Optional<Area> area = areaRepository.findById(id);
            LOGGER.info("OUT: Area encontrada: [{}]", area);
            return area;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el area por ID", e);
            throw e;
        }
    }

    public Area save(Area area) {
        try {
            Area savedArea = areaRepository.save(area);
            LOGGER.info("OUT: Area guardada con éxito: [{}]", savedArea);
            return savedArea;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el area", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (areaRepository.existsById(id)) {
                areaRepository.deleteById(id);
                LOGGER.info("Area con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró el area con ID [{}] para eliminar", id);
                throw new RuntimeException("Area no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el area", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = areaRepository.existsById(id);
            LOGGER.info("El area con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el area", e);
            throw e;
        }
    }

    public ResponseEntity<Area> actualizarArea(Integer id, Area area) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Area> areaExistente = areaRepository.findById(id);
            if (areaExistente.isPresent()) {
                Area actualArea = areaExistente.get();
                actualArea.setNombre(area.getNombre());
                Area actualAreaSalva = areaRepository.save(actualArea);
                LOGGER.info("OUT:[{}]", actualAreaSalva);
                return ResponseEntity.ok(actualAreaSalva);
            } else {
                LOGGER.info("OUT: [{}] El area no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el area", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Area> agregarArea(@RequestBody Area area) {
        LOGGER.info("IN: [{}]", area);
        try {
            Area guardarArea = new Area();
            guardarArea.setNombre(area.getNombre());
            Area guardarAreaSalva = areaRepository.save(guardarArea);
            LOGGER.info("OUT:[{}] Area guardada", guardarAreaSalva);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarAreaSalva);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el area", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}