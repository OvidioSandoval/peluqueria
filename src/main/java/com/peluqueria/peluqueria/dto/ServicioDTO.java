package com.peluqueria.peluqueria.dto;

import java.time.LocalDateTime;

public class ServicioDTO {
    private Integer id;
    private String nombre;
    private String descripcion;
    private Integer precioBase;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private Integer categoriaId;
    private String categoriaDescripcion;

    public ServicioDTO() {}

    public ServicioDTO(Integer id, String nombre, String descripcion, Integer precioBase, 
                      Boolean activo, LocalDateTime fechaCreacion, Integer categoriaId, String categoriaDescripcion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precioBase = precioBase;
        this.activo = activo;
        this.fechaCreacion = fechaCreacion;
        this.categoriaId = categoriaId;
        this.categoriaDescripcion = categoriaDescripcion;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getPrecioBase() { return precioBase; }
    public void setPrecioBase(Integer precioBase) { this.precioBase = precioBase; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Integer getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Integer categoriaId) { this.categoriaId = categoriaId; }

    public String getCategoriaDescripcion() { return categoriaDescripcion; }
    public void setCategoriaDescripcion(String categoriaDescripcion) { this.categoriaDescripcion = categoriaDescripcion; }
}