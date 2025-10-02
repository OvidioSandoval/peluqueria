package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Caja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CajaRepository extends JpaRepository<Caja, Integer> {
    @Query("SELECT COUNT(c) > 0 FROM Caja c WHERE c.estado = 'abierto'")
    boolean existeCajaAbierta();
}