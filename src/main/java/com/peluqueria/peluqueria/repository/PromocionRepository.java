package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromocionRepository extends JpaRepository<Promocion, Integer> {
    List<Promocion> findByActivoTrue();
}
