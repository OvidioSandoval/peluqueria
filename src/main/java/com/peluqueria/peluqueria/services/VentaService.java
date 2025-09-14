package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Venta;
import com.peluqueria.peluqueria.repository.VentaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;

@Service
public class VentaService {
    private static final Logger LOGGER = LoggerFactory.getLogger(VentaService.class);

    @Autowired
    private VentaRepository ventaRepository;

    public List<Venta> findAll() {
        try {
            List<Venta> ventas = ventaRepository.findAll();
            LOGGER.info("OUT: Lista de ventas obtenida con éxito: [{}]", ventas.size());
            return ventas;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de ventas", e);
            throw e;
        }
    }

    public Optional<Venta> findById(Integer id) {
        try {
            Optional<Venta> venta = ventaRepository.findById(id);
            LOGGER.info("OUT: Venta encontrada: [{}]", venta);
            return venta;
        } catch (Exception e) {
            LOGGER.error("Error al buscar la venta por ID", e);
            throw e;
        }
    }

    @Transactional
    public Venta save(Venta venta) {
        try {
            Venta saved = ventaRepository.save(venta);
            LOGGER.info("OUT: Venta guardada con éxito: [{}]", saved);
            return saved;
        } catch (Exception e) {
            LOGGER.error("Error al guardar la venta", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (ventaRepository.existsById(id)) {
                ventaRepository.deleteById(id);
                LOGGER.info("Venta con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró la venta con ID [{}] para eliminar", id);
                throw new RuntimeException("Venta no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar la venta", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = ventaRepository.existsById(id);
            LOGGER.info("La venta con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe la venta", e);
            throw e;
        }
    }

    public ResponseEntity<Venta> actualizarVenta(Integer id, Venta venta) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Venta> ventaExistente = ventaRepository.findById(id);
            if (ventaExistente.isPresent()) {
                Venta actualVenta = ventaExistente.get();
                actualVenta.setFechaVenta(venta.getFechaVenta());
                actualVenta.setCantidadArticulos(venta.getCantidadArticulos());
                actualVenta.setMontoTotal(venta.getMontoTotal());
                actualVenta.setDescuentoAplicado(venta.getDescuentoAplicado());
                actualVenta.setFechaCreacionVenta(venta.getFechaCreacionVenta());
                actualVenta.setDevolucion(venta.getDevolucion());
                actualVenta.setCliente(venta.getCliente());
                actualVenta.setEmpleado(venta.getEmpleado());
                actualVenta.setMetodoPago(venta.getMetodoPago());
                actualVenta.setObservaciones(venta.getObservaciones());
                Venta actualVentaSalva = ventaRepository.save(actualVenta);
                LOGGER.info("OUT:[{}]", actualVentaSalva);
                return ResponseEntity.ok(actualVentaSalva);
            } else {
                LOGGER.info("OUT: [{}] La venta no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar la venta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Transactional
    public ResponseEntity<Venta> agregarVenta(@RequestBody Venta venta) {
        LOGGER.info("IN: [{}]", venta);
        try {
            Venta guardarVenta = new Venta();
            guardarVenta.setFechaVenta(venta.getFechaVenta());
            guardarVenta.setCantidadArticulos(venta.getCantidadArticulos());
            guardarVenta.setMontoTotal(venta.getMontoTotal());
            guardarVenta.setDescuentoAplicado(venta.getDescuentoAplicado());
            guardarVenta.setFechaCreacionVenta(venta.getFechaCreacionVenta());
            guardarVenta.setDevolucion(venta.getDevolucion());
            guardarVenta.setCliente(venta.getCliente());
            guardarVenta.setEmpleado(venta.getEmpleado());
            guardarVenta.setMetodoPago(venta.getMetodoPago());
            guardarVenta.setObservaciones(venta.getObservaciones());
            Venta guardarVentaSalva = ventaRepository.save(guardarVenta);
            LOGGER.info("OUT:[{}] Venta guardada", guardarVentaSalva);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarVentaSalva);
        } catch (Exception e) {
            LOGGER.error("Error al guardar la venta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}