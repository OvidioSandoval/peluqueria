package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "caja")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Caja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja", nullable = false)
    private Integer id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_apertura")
    private LocalTime horaApertura;

    @Column(name = "hora_cierre")
    private LocalTime horaCierre;

    @Column(name = "monto_inicial", nullable = false)
    private Integer montoInicial;

    @Column(name = "monto_final")
    private Integer montoFinal;

    @ColumnDefault("0")
    @Column(name = "total_servicios")
    private Integer totalServicios;

    @ColumnDefault("0")
    @Column(name = "total_productos")
    private Integer totalProductos;

    @ColumnDefault("0")
    @Column(name = "total_descuentos")
    private Integer totalDescuentos;

    @Column(name = "estado", length = 20)
    private String estado;

    @Column(name = "nombre", length = 100)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empleado_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Empleado empleado;

    public Caja() {
        this.estado = "abierto";
        this.totalServicios = 0;
        this.totalProductos = 0;
        this.totalDescuentos = 0;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHoraApertura() {
        return horaApertura;
    }

    public void setHoraApertura(LocalTime horaApertura) {
        this.horaApertura = horaApertura;
    }

    public LocalTime getHoraCierre() {
        return horaCierre;
    }

    public void setHoraCierre(LocalTime horaCierre) {
        this.horaCierre = horaCierre;
    }

    public Integer getMontoInicial() {
        return montoInicial;
    }

    public void setMontoInicial(Integer montoInicial) {
        this.montoInicial = montoInicial;
    }

    public Integer getMontoFinal() {
        return montoFinal;
    }

    public void setMontoFinal(Integer montoFinal) {
        this.montoFinal = montoFinal;
    }

    public Integer getTotalServicios() {
        return totalServicios;
    }

    public void setTotalServicios(Integer totalServicios) {
        this.totalServicios = totalServicios;
    }

    public Integer getTotalProductos() {
        return totalProductos;
    }

    public void setTotalProductos(Integer totalProductos) {
        this.totalProductos = totalProductos;
    }

    public Integer getTotalDescuentos() {
        return totalDescuentos;
    }

    public void setTotalDescuentos(Integer totalDescuentos) {
        this.totalDescuentos = totalDescuentos;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

}