package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Producto;
import com.peluqueria.peluqueria.repository.ProductoRepository;
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
public class ProductoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProductoService.class);

    @Autowired
    private ProductoRepository productoRepository;

    public List<Producto> findAll() {
        try {
            List<Producto> productos = productoRepository.findAll();
            LOGGER.info("OUT: Lista de productos obtenida con éxito: [{}]", productos.size());
            return productos;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de productos", e);
            throw e;
        }
    }

    public Optional<Producto> findById(Integer id) {
        try {
            Optional<Producto> producto = productoRepository.findById(id);
            LOGGER.info("OUT: Producto encontrado: [{}]", producto);
            return producto;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el producto por ID", e);
            throw e;
        }
    }

    public Producto save(Producto producto) {
        try {
            Producto savedProducto = productoRepository.save(producto);
            LOGGER.info("OUT: Producto guardado con éxito: [{}]", savedProducto);
            return savedProducto;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el producto", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (productoRepository.existsById(id)) {
                productoRepository.deleteById(id);
                LOGGER.info("Producto con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el producto con ID [{}] para eliminar", id);
                throw new RuntimeException("Producto no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el producto", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = productoRepository.existsById(id);
            LOGGER.info("El producto con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el producto", e);
            throw e;
        }
    }

    public ResponseEntity<Producto> actualizarProducto(Integer id, Producto producto) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Producto> productoExistente = productoRepository.findById(id);
            if (productoExistente.isPresent()) {
                Producto actualProducto = productoExistente.get();
                actualProducto.setNombre(producto.getNombre());
                actualProducto.setDescripcion(producto.getDescripcion());
                actualProducto.setPrecioCompra(producto.getPrecioCompra());
                actualProducto.setPrecioVenta(producto.getPrecioVenta());
                actualProducto.setCantidadStockInicial(producto.getCantidadStockInicial());
                actualProducto.setCantidadOptimaStock(producto.getCantidadOptimaStock());
                actualProducto.setMinimoStock(producto.getMinimoStock());
                actualProducto.setActivo(producto.getActivo());
                actualProducto.setEnPromocion(producto.getEnPromocion());
                actualProducto.setPrecioPromocion(producto.getPrecioPromocion());
                Producto actualProductoSalvo = productoRepository.save(actualProducto);
                LOGGER.info("OUT:[{}]", actualProductoSalvo);
                return ResponseEntity.ok(actualProductoSalvo);
            } else {
                LOGGER.info("OUT: [{}] El producto no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el producto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Producto> agregarProducto(@RequestBody Producto producto) {
        LOGGER.info("IN: [{}]", producto);
        try {
            Producto guardarProducto = new Producto();
            guardarProducto.setNombre(producto.getNombre());
            guardarProducto.setDescripcion(producto.getDescripcion());
            guardarProducto.setPrecioCompra(producto.getPrecioCompra());
            guardarProducto.setPrecioVenta(producto.getPrecioVenta());
            guardarProducto.setCantidadStockInicial(producto.getCantidadStockInicial());
            guardarProducto.setCantidadOptimaStock(producto.getCantidadOptimaStock());
            guardarProducto.setMinimoStock(producto.getMinimoStock());
            guardarProducto.setActivo(producto.getActivo());
            guardarProducto.setEnPromocion(producto.getEnPromocion());
            guardarProducto.setPrecioPromocion(producto.getPrecioPromocion());
            Producto guardarProductoSalvo = productoRepository.save(guardarProducto);
            LOGGER.info("OUT:[{}] Producto guardado", guardarProductoSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarProductoSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el producto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}