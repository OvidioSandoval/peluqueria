package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Integer> {
    
    @Query("SELECT t FROM Turno t WHERE t.recordatorioEnviado = false AND " +
           "((t.fecha = :fecha24h AND t.hora = :hora24h) OR " +
           "(t.fecha = :fecha1h AND t.hora = :hora1h))")
    List<Turno> findTurnosParaRecordatorio(
        @Param("fecha24h") LocalDate fecha24h, @Param("hora24h") LocalTime hora24h,
        @Param("fecha1h") LocalDate fecha1h, @Param("hora1h") LocalTime hora1h);
    
    @Query("SELECT t FROM Turno t WHERE t.estado != 'cancelado' AND " +
           "((t.fecha = :fecha24h AND t.hora = :hora24h) OR " +
           "(t.fecha = :fecha1h AND t.hora = :hora1h) OR " +
           "(t.fecha = :fecha15m AND t.hora = :hora15m))")
    List<Turno> findTurnosParaRecordatorioAutomatico(
        @Param("fecha24h") LocalDate fecha24h, @Param("hora24h") LocalTime hora24h,
        @Param("fecha1h") LocalDate fecha1h, @Param("hora1h") LocalTime hora1h,
        @Param("fecha15m") LocalDate fecha15m, @Param("hora15m") LocalTime hora15m);
    
    long countByClienteId(Integer clienteId);
}