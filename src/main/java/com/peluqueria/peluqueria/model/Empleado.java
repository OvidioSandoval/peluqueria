package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;

@Entity
@Table(name = "empleado")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Empleado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_empleado", nullable = false)
    private Integer id;

    @Column(name = "nombre_completo", nullable = false, length = 100)
    private String nombreCompleto;

    @Column(name = "correo", length = 100)
    private String correo;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(name = "sueldo_base", nullable = false)
    private Integer sueldoBase;

    @ColumnDefault("0")
    @Column(name = "comision_porcentaje")
    private Integer comisionPorcentaje;

    @ColumnDefault("1")
    @Column(name = "activo")
    private Boolean activo;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public Area getArea() {
        return area;
    }

    public void setArea(Area area) {
        this.area = area;
    }

    public Integer getSueldoBase() {
        return sueldoBase;
    }

    public void setSueldoBase(Integer sueldoBase) {
        this.sueldoBase = sueldoBase;
    }

    public Integer getComisionPorcentaje() {
        return comisionPorcentaje;
    }

    public void setComisionPorcentaje(Integer comisionPorcentaje) {
        this.comisionPorcentaje = comisionPorcentaje;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDate getFechaIngreso() {
        return fechaIngreso;
    }

    public void setFechaIngreso(LocalDate fechaIngreso) {
        this.fechaIngreso = fechaIngreso;
    }

}