package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Integer> {
    List<Venta> findByClienteId(Integer clienteId);
}