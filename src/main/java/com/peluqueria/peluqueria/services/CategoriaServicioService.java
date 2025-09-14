package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.CategoriaServicio;
import com.peluqueria.peluqueria.repository.CategoriaServicioRepository;
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
public class CategoriaServicioService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CategoriaServicioService.class);

    @Autowired
    private CategoriaServicioRepository categoriaServicioRepository;

    public List<CategoriaServicio> findAll() {
        try {
            List<CategoriaServicio> categorias = categoriaServicioRepository.findAll();
            LOGGER.info("OUT: Lista de categorías obtenida con éxito: [{}]", categorias.size());
            return categorias;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de categorías", e);
            throw e;
        }
    }

    public Optional<CategoriaServicio> findById(Integer id) {
        try {
            Optional<CategoriaServicio> categoria = categoriaServicioRepository.findById(id);
            LOGGER.info("OUT: Categoría encontrada: [{}]", categoria);
            return categoria;
        } catch (Exception e) {
            LOGGER.error("Error al buscar la categoría por ID", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (categoriaServicioRepository.existsById(id)) {
                categoriaServicioRepository.deleteById(id);
                LOGGER.info("Categoría con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró la categoría con ID [{}] para eliminar", id);
                throw new RuntimeException("Categoría no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar la categoría", e);
            throw e;
        }
    }

    public ResponseEntity<CategoriaServicio> actualizarCategoria(Integer id, CategoriaServicio categoria) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<CategoriaServicio> categoriaExistente = categoriaServicioRepository.findById(id);
            if (categoriaExistente.isPresent()) {
                CategoriaServicio actualCategoria = categoriaExistente.get();
                actualCategoria.setDescripcion(categoria.getDescripcion());
                CategoriaServicio actualCategoriaSalva = categoriaServicioRepository.save(actualCategoria);
                LOGGER.info("OUT:[{}]", actualCategoriaSalva);
                return ResponseEntity.ok(actualCategoriaSalva);
            } else {
                LOGGER.info("OUT: [{}] La categoría no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar la categoría", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<CategoriaServicio> agregarCategoria(@RequestBody CategoriaServicio categoria) {
        LOGGER.info("IN: [{}]", categoria);
        try {
            CategoriaServicio guardarCategoria = new CategoriaServicio();
            guardarCategoria.setDescripcion(categoria.getDescripcion());
            CategoriaServicio guardarCategoriaSalva = categoriaServicioRepository.save(guardarCategoria);
            LOGGER.info("OUT:[{}] Categoría guardada", guardarCategoriaSalva);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarCategoriaSalva);
        } catch (Exception e) {
            LOGGER.error("Error al guardar la categoría", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}