package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Auditoria;
import com.peluqueria.peluqueria.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @GetMapping
    public List<Auditoria> obtenerAuditoria() {
        return auditoriaRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaHora"));
    }
}