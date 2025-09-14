package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Proveedor;
import com.peluqueria.peluqueria.repository.ProveedorRepository;
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
public class ProveedorService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProveedorService.class);

    @Autowired
    private ProveedorRepository proveedorRepository;

    public List<Proveedor> findAll() {
        try {
            List<Proveedor> proveedores = proveedorRepository.findAll();
            LOGGER.info("OUT: Lista de proveedores obtenida con éxito: [{}]", proveedores.size());
            return proveedores;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de proveedores", e);
            throw e;
        }
    }

    public Optional<Proveedor> findById(Integer id) {
        try {
            Optional<Proveedor> proveedor = proveedorRepository.findById(id);
            LOGGER.info("OUT: Proveedor encontrado: [{}]", proveedor);
            return proveedor;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el proveedor por ID", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (proveedorRepository.existsById(id)) {
                proveedorRepository.deleteById(id);
                LOGGER.info("Proveedor con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el proveedor con ID [{}] para eliminar", id);
                throw new RuntimeException("Proveedor no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el proveedor", e);
            throw e;
        }
    }

    public ResponseEntity<Proveedor> actualizarProveedor(Integer id, Proveedor proveedor) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Proveedor> proveedorExistente = proveedorRepository.findById(id);
            if (proveedorExistente.isPresent()) {
                Proveedor actualProveedor = proveedorExistente.get();
                actualProveedor.setDescripcion(proveedor.getDescripcion());
                Proveedor actualProveedorSalvo = proveedorRepository.save(actualProveedor);
                LOGGER.info("OUT:[{}]", actualProveedorSalvo);
                return ResponseEntity.ok(actualProveedorSalvo);
            } else {
                LOGGER.info("OUT: [{}] El proveedor no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el proveedor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Proveedor> agregarProveedor(@RequestBody Proveedor proveedor) {
        LOGGER.info("IN: [{}]", proveedor);
        try {
            Proveedor guardarProveedor = new Proveedor();
            guardarProveedor.setDescripcion(proveedor.getDescripcion());
            Proveedor guardarProveedorSalvo = proveedorRepository.save(guardarProveedor);
            LOGGER.info("OUT:[{}] Proveedor guardado", guardarProveedorSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarProveedorSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el proveedor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}