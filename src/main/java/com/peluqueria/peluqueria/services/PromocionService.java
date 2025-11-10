package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Promocion;
import com.peluqueria.peluqueria.repository.PromocionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PromocionService {

    @Autowired
    private PromocionRepository promocionRepository;

    public List<Promocion> findAll() {
        return promocionRepository.findAll();
    }

    public List<Promocion> findActivas() {
        return promocionRepository.findByActivoTrue();
    }

    public Optional<Promocion> findById(Integer id) {
        return promocionRepository.findById(id);
    }

    @Transactional
    public Promocion save(Promocion promocion) {
        return promocionRepository.save(promocion);
    }

    @Transactional
    public void deleteById(Integer id) {
        promocionRepository.deleteById(id);
    }
}
