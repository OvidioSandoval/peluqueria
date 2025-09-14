package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.DetalleCompra;
import com.peluqueria.peluqueria.repository.DetalleCompraRepository;
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
public class DetalleCompraService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DetalleCompraService.class);

    @Autowired
    private DetalleCompraRepository detalleCompraRepository;

    public List<DetalleCompra> findAll() {
        try {
            List<DetalleCompra> detalles = detalleCompraRepository.findAll();
            LOGGER.info("OUT: Lista de detalles de compra obtenida con éxito: [{}]", detalles.size());
            return detalles;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de detalles de compra", e);
            throw e;
        }
    }

    public Optional<DetalleCompra> findById(Integer id) {
        try {
            Optional<DetalleCompra> detalle = detalleCompraRepository.findById(id);
            LOGGER.info("OUT: Detalle de compra encontrado: [{}]", detalle);
            return detalle;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el detalle de compra por ID", e);
            throw e;
        }
    }

    public DetalleCompra save(DetalleCompra detalleCompra) {
        try {
            DetalleCompra saved = detalleCompraRepository.save(detalleCompra);
            LOGGER.info("OUT: Detalle de compra guardado con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el detalle de compra", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (detalleCompraRepository.existsById(id)) {
                detalleCompraRepository.deleteById(id);
                LOGGER.info("Detalle de compra con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el detalle de compra con ID [{}] para eliminar", id);
                throw new RuntimeException("Detalle de compra no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el detalle de compra", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = detalleCompraRepository.existsById(id);
            LOGGER.info("El detalle de compra con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el detalle de compra", e);
            throw e;
        }
    }

    public ResponseEntity<DetalleCompra> actualizarDetalleCompra(Integer id, DetalleCompra detalleCompra) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<DetalleCompra> detalleExistente = detalleCompraRepository.findById(id);
            if (detalleExistente.isPresent()) {
                DetalleCompra actualDetalle = detalleExistente.get();
                actualDetalle.setCompra(detalleCompra.getCompra());
                actualDetalle.setCantidadComprada(detalleCompra.getCantidadComprada());
                actualDetalle.setPrecioUnitario(detalleCompra.getPrecioUnitario());
                actualDetalle.setPrecioTotal(detalleCompra.getPrecioTotal());
                actualDetalle.setProducto(detalleCompra.getProducto());
                DetalleCompra actualDetalleSalvo = detalleCompraRepository.save(actualDetalle);
                LOGGER.info("OUT:[{}]", actualDetalleSalvo);
                return ResponseEntity.ok(actualDetalleSalvo);
            } else {
                LOGGER.info("OUT: [{}] El detalle de compra no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el detalle de compra", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<DetalleCompra> agregarDetalleCompra(@RequestBody DetalleCompra detalleCompra) {
        LOGGER.info("IN: [{}]", detalleCompra);
        try {
            DetalleCompra guardarDetalle = new DetalleCompra();
            guardarDetalle.setCompra(detalleCompra.getCompra());
            guardarDetalle.setCantidadComprada(detalleCompra.getCantidadComprada());
            guardarDetalle.setPrecioUnitario(detalleCompra.getPrecioUnitario());
            guardarDetalle.setPrecioTotal(detalleCompra.getPrecioTotal());
            guardarDetalle.setProducto(detalleCompra.getProducto());
            DetalleCompra guardarDetalleSalvo = detalleCompraRepository.save(guardarDetalle);
            LOGGER.info("OUT:[{}] Detalle de compra guardado", guardarDetalleSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarDetalleSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el detalle de compra", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}