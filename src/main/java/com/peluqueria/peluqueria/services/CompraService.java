package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Compra;
import com.peluqueria.peluqueria.repository.CompraRepository;
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
public class CompraService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CompraService.class);

    @Autowired
    private CompraRepository compraRepository;

    public List<Compra> findAll() {
        try {
            List<Compra> compras = compraRepository.findAll();
            LOGGER.info("OUT: Lista de compras obtenida con éxito: [{}]", compras.size());
            return compras;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de compras", e);
            throw e;
        }
    }

    public Optional<Compra> findById(Integer id) {
        try {
            Optional<Compra> compra = compraRepository.findById(id);
            LOGGER.info("OUT: Compra encontrada: [{}]", compra);
            return compra;
        } catch (Exception e) {
            LOGGER.error("Error al buscar la compra por ID", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (compraRepository.existsById(id)) {
                compraRepository.deleteById(id);
                LOGGER.info("Compra con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró la compra con ID [{}] para eliminar", id);
                throw new RuntimeException("Compra no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar la compra", e);
            throw e;
        }
    }

    public ResponseEntity<Compra> actualizarCompra(Integer id, Compra compra) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Compra> compraExistente = compraRepository.findById(id);
            if (compraExistente.isPresent()) {
                Compra actualCompra = compraExistente.get();
                actualCompra.setProducto(compra.getProducto());
                actualCompra.setCantidad(compra.getCantidad());
                actualCompra.setTotal(compra.getTotal());
                actualCompra.setFechaCompra(compra.getFechaCompra());
                actualCompra.setProveedor(compra.getProveedor());
                Compra actualCompraSalva = compraRepository.save(actualCompra);
                LOGGER.info("OUT:[{}]", actualCompraSalva);
                return ResponseEntity.ok(actualCompraSalva);
            } else {
                LOGGER.info("OUT: [{}] La compra no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar la compra", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Compra> agregarCompra(@RequestBody Compra compra) {
        LOGGER.info("IN: [{}]", compra);
        try {
            Compra guardarCompra = new Compra();
            guardarCompra.setProducto(compra.getProducto());
            guardarCompra.setCantidad(compra.getCantidad());
            guardarCompra.setTotal(compra.getTotal());
            guardarCompra.setFechaCompra(compra.getFechaCompra());
            guardarCompra.setProveedor(compra.getProveedor());
            Compra guardarCompraSalva = compraRepository.save(guardarCompra);
            LOGGER.info("OUT:[{}] Compra guardada", guardarCompraSalva);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarCompraSalva);
        } catch (Exception e) {
            LOGGER.error("Error al guardar la compra", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}