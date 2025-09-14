package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.dto.InformacionStockDTO;
import com.peluqueria.peluqueria.model.InformacionStock;
import com.peluqueria.peluqueria.repository.InformacionStockRepository;
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
public class InformacionStockService {
    private static final Logger LOGGER = LoggerFactory.getLogger(InformacionStockService.class);

    @Autowired
    private InformacionStockRepository informacionStockRepository;
    
    @Autowired
    private AlertaStockService alertaStockService;

    public List<InformacionStockDTO> findAll() {
        try {
            List<InformacionStock> informaciones = informacionStockRepository.findAll();
            List<InformacionStockDTO> dtos = informaciones.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            LOGGER.info("OUT: Lista de información de stock obtenida con éxito: [{}]", dtos.size());
            return dtos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de información de stock", e);
            throw e;
        }
    }

    public Optional<InformacionStock> findById(Integer id) {
        try {
            Optional<InformacionStock> informacion = informacionStockRepository.findById(id);
            LOGGER.info("OUT: Información de stock encontrada: [{}]", informacion);
            return informacion;
        } catch (Exception e) {
            LOGGER.error("Error al buscar la información de stock por ID", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (informacionStockRepository.existsById(id)) {
                informacionStockRepository.deleteById(id);
                LOGGER.info("Información de stock con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró la información de stock con ID [{}] para eliminar", id);
                throw new RuntimeException("Información de stock no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar la información de stock", e);
            throw e;
        }
    }

    public ResponseEntity<InformacionStockDTO> actualizarInformacionStock(Integer id, InformacionStock informacionStock) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<InformacionStock> informacionExistente = informacionStockRepository.findById(id);
            if (informacionExistente.isPresent()) {
                InformacionStock actualInformacion = informacionExistente.get();
                actualInformacion.setStockActual(informacionStock.getStockActual());
                actualInformacion.setStockAnterior(informacionStock.getStockAnterior());
                actualInformacion.setFechaRegistroInformacionStock(informacionStock.getFechaRegistroInformacionStock());
                actualInformacion.setNombreProductoActualizado(informacionStock.getNombreProductoActualizado());
                actualInformacion.setProducto(informacionStock.getProducto());
                actualInformacion.setProveedor(informacionStock.getProveedor());
                InformacionStock actualInformacionSalva = informacionStockRepository.save(actualInformacion);
                
                verificarStockBajo(actualInformacionSalva);
                
                InformacionStockDTO dto = convertToDTO(actualInformacionSalva);
                LOGGER.info("OUT:[{}]", dto);
                return ResponseEntity.ok(dto);
            } else {
                LOGGER.info("OUT: [{}] La información de stock no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar la información de stock", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<InformacionStockDTO> agregarInformacionStock(@RequestBody InformacionStock informacionStock) {
        LOGGER.info("IN: [{}]", informacionStock);
        try {
            InformacionStock guardarInformacion = new InformacionStock();
            guardarInformacion.setStockActual(informacionStock.getStockActual());
            guardarInformacion.setStockAnterior(informacionStock.getStockAnterior());
            guardarInformacion.setFechaRegistroInformacionStock(informacionStock.getFechaRegistroInformacionStock());
            guardarInformacion.setNombreProductoActualizado(informacionStock.getNombreProductoActualizado());
            guardarInformacion.setProducto(informacionStock.getProducto());
            guardarInformacion.setProveedor(informacionStock.getProveedor());
            InformacionStock guardarInformacionSalva = informacionStockRepository.save(guardarInformacion);
            
            verificarStockBajo(guardarInformacionSalva);
            
            InformacionStockDTO dto = convertToDTO(guardarInformacionSalva);
            LOGGER.info("OUT:[{}] Información de stock guardada", dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            LOGGER.error("Error al guardar la información de stock", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void verificarStockBajo(InformacionStock informacionStock) {
        Integer minimoStock = informacionStock.getProducto().getMinimoStock();
        if (minimoStock != null && informacionStock.getStockActual() <= minimoStock) {
            LOGGER.warn("ALERTA: Producto '{}' con stock bajo. Actual: {}, Mínimo: {}",
                informacionStock.getProducto().getNombre(),
                informacionStock.getStockActual(),
                minimoStock);
        }
    }

    private InformacionStockDTO convertToDTO(InformacionStock entity) {
        return new InformacionStockDTO(
            entity.getId(),
            entity.getStockActual(),
            entity.getStockAnterior(),
            entity.getFechaRegistroInformacionStock(),
            entity.getNombreProductoActualizado(),
            entity.getProducto() != null ? entity.getProducto().getId() : null,
            entity.getProducto() != null ? entity.getProducto().getNombre() : null,
            entity.getProveedor() != null ? entity.getProveedor().getId() : null,
            entity.getProveedor() != null ? entity.getProveedor().getDescripcion() : null
        );
    }
}