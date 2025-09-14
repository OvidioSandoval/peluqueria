package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Integer> {
    List<Servicio> findByDescripcionContainingIgnoreCase(String descripcion);
}