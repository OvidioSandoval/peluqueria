package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Caja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CajaRepository extends JpaRepository<Caja, Integer> {
}