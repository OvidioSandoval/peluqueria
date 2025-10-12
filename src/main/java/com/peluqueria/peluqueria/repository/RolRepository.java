package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {
}