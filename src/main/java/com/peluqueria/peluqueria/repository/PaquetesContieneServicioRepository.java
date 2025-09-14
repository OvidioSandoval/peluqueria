package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.PaquetesContieneServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaquetesContieneServicioRepository extends JpaRepository<PaquetesContieneServicio, Integer> {
}