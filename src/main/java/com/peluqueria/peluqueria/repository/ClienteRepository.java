package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    List<Cliente> findByNombreCompletoContainingIgnoreCase(String nombre);
    List<Cliente> findByTelefono(String telefono);
    List<Cliente> findByRucContainingIgnoreCase(String ruc);
    List<Cliente> findByNombreCompletoContainingIgnoreCaseOrTelefono(String nombre, String telefono);
    List<Cliente> findByNombreCompletoContainingIgnoreCaseOrTelefonoOrRucContainingIgnoreCase(String nombre, String telefono, String ruc);
}