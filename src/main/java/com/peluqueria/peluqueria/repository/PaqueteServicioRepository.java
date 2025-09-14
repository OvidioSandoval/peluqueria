package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.PaqueteServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaqueteServicioRepository extends JpaRepository<PaqueteServicio, Integer> {
}