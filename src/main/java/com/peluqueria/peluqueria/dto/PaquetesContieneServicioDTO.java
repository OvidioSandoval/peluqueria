package com.peluqueria.peluqueria.dto;

public class PaquetesContieneServicioDTO {
    private Integer id;
    private Integer paqueteId;
    private String paqueteDescripcion;
    private Integer servicioId;
    private String servicioNombre;
    private Integer cantidad;

    public PaquetesContieneServicioDTO() {}

    public PaquetesContieneServicioDTO(Integer id, Integer paqueteId, String paqueteDescripcion, 
                                      Integer servicioId, String servicioNombre, Integer cantidad) {
        this.id = id;
        this.paqueteId = paqueteId;
        this.paqueteDescripcion = paqueteDescripcion;
        this.servicioId = servicioId;
        this.servicioNombre = servicioNombre;
        this.cantidad = cantidad;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPaqueteId() { return paqueteId; }
    public void setPaqueteId(Integer paqueteId) { this.paqueteId = paqueteId; }

    public String getPaqueteDescripcion() { return paqueteDescripcion; }
    public void setPaqueteDescripcion(String paqueteDescripcion) { this.paqueteDescripcion = paqueteDescripcion; }

    public Integer getServicioId() { return servicioId; }
    public void setServicioId(Integer servicioId) { this.servicioId = servicioId; }

    public String getServicioNombre() { return servicioNombre; }
    public void setServicioNombre(String servicioNombre) { this.servicioNombre = servicioNombre; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}