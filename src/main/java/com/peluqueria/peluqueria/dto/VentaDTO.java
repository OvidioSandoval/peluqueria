package com.peluqueria.peluqueria.dto;

import java.time.Instant;

public class VentaDTO {
    private Integer id;
    private Instant fechaVenta;
    private Integer cantidadArticulos;
    private Integer montoTotal;
    private Integer descuentoAplicado;
    private String metodoPago;
    private String observaciones;
    private String clienteNombre;
    private String empleadoNombre;
    private Boolean devolucion;

    public VentaDTO() {}

    public VentaDTO(Integer id, Instant fechaVenta, Integer cantidadArticulos, 
                   Integer montoTotal, Integer descuentoAplicado, String metodoPago,
                   String observaciones, String clienteNombre, String empleadoNombre, Boolean devolucion) {
        this.id = id;
        this.fechaVenta = fechaVenta;
        this.cantidadArticulos = cantidadArticulos;
        this.montoTotal = montoTotal;
        this.descuentoAplicado = descuentoAplicado;
        this.metodoPago = metodoPago;
        this.observaciones = observaciones;
        this.clienteNombre = clienteNombre;
        this.empleadoNombre = empleadoNombre;
        this.devolucion = devolucion;
    }

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Instant getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(Instant fechaVenta) { this.fechaVenta = fechaVenta; }

    public Integer getCantidadArticulos() { return cantidadArticulos; }
    public void setCantidadArticulos(Integer cantidadArticulos) { this.cantidadArticulos = cantidadArticulos; }

    public Integer getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Integer montoTotal) { this.montoTotal = montoTotal; }

    public Integer getDescuentoAplicado() { return descuentoAplicado; }
    public void setDescuentoAplicado(Integer descuentoAplicado) { this.descuentoAplicado = descuentoAplicado; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getEmpleadoNombre() { return empleadoNombre; }
    public void setEmpleadoNombre(String empleadoNombre) { this.empleadoNombre = empleadoNombre; }

    public Boolean getDevolucion() { return devolucion; }
    public void setDevolucion(Boolean devolucion) { this.devolucion = devolucion; }
}