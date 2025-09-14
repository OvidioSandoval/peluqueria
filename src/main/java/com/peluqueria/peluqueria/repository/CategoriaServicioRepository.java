package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.CategoriaServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaServicioRepository extends JpaRepository<CategoriaServicio, Integer> {
}