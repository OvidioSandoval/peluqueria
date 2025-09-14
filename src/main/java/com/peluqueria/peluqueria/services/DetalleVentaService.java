package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.DetalleVenta;
import com.peluqueria.peluqueria.repository.DetalleVentaRepository;
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
public class DetalleVentaService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DetalleVentaService.class);

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    public List<DetalleVenta> findAll() {
        try {
            List<DetalleVenta> detalles = detalleVentaRepository.findAll();
            LOGGER.info("OUT: Lista de detalles de venta obtenida con éxito: [{}]", detalles.size());
            return detalles;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de detalles de venta", e);
            throw e;
        }
    }

    public Optional<DetalleVenta> findById(Integer id) {
        try {
            Optional<DetalleVenta> detalle = detalleVentaRepository.findById(id);
            LOGGER.info("OUT: Detalle de venta encontrado: [{}]", detalle);
            return detalle;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el detalle de venta por ID", e);
            throw e;
        }
    }

    public DetalleVenta save(DetalleVenta detalleVenta) {
        try {
            DetalleVenta saved = detalleVentaRepository.save(detalleVenta);
            LOGGER.info("OUT: Detalle de venta guardado con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el detalle de venta", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (detalleVentaRepository.existsById(id)) {
                detalleVentaRepository.deleteById(id);
                LOGGER.info("Detalle de venta con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el detalle de venta con ID [{}] para eliminar", id);
                throw new RuntimeException("Detalle de venta no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el detalle de venta", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = detalleVentaRepository.existsById(id);
            LOGGER.info("El detalle de venta con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el detalle de venta", e);
            throw e;
        }
    }

    public ResponseEntity<DetalleVenta> actualizarDetalleVenta(Integer id, DetalleVenta detalleVenta) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<DetalleVenta> detalleExistente = detalleVentaRepository.findById(id);
            if (detalleExistente.isPresent()) {
                DetalleVenta actualDetalle = detalleExistente.get();
                actualDetalle.setVenta(detalleVenta.getVenta());
                actualDetalle.setServicio(detalleVenta.getServicio());
                actualDetalle.setProducto(detalleVenta.getProducto());
                actualDetalle.setCantidad(detalleVenta.getCantidad());
                actualDetalle.setPrecioUnitarioBruto(detalleVenta.getPrecioUnitarioBruto());
                actualDetalle.setPrecioTotal(detalleVenta.getPrecioTotal());
                actualDetalle.setDescuento(detalleVenta.getDescuento());
                actualDetalle.setPrecioUnitarioNeto(detalleVenta.getPrecioUnitarioNeto());
                DetalleVenta actualDetalleSalvo = detalleVentaRepository.save(actualDetalle);
                LOGGER.info("OUT:[{}]", actualDetalleSalvo);
                return ResponseEntity.ok(actualDetalleSalvo);
            } else {
                LOGGER.info("OUT: [{}] El detalle de venta no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el detalle de venta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<DetalleVenta> agregarDetalleVenta(@RequestBody DetalleVenta detalleVenta) {
        LOGGER.info("IN: [{}]", detalleVenta);
        try {
            DetalleVenta guardarDetalle = new DetalleVenta();
            guardarDetalle.setVenta(detalleVenta.getVenta());
            guardarDetalle.setServicio(detalleVenta.getServicio());
            guardarDetalle.setProducto(detalleVenta.getProducto());
            guardarDetalle.setCantidad(detalleVenta.getCantidad());
            guardarDetalle.setPrecioUnitarioBruto(detalleVenta.getPrecioUnitarioBruto());
            guardarDetalle.setPrecioTotal(detalleVenta.getPrecioTotal());
            guardarDetalle.setDescuento(detalleVenta.getDescuento());
            guardarDetalle.setPrecioUnitarioNeto(detalleVenta.getPrecioUnitarioNeto());
            DetalleVenta guardarDetalleSalvo = detalleVentaRepository.save(guardarDetalle);
            LOGGER.info("OUT:[{}] Detalle de venta guardado", guardarDetalleSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarDetalleSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el detalle de venta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}