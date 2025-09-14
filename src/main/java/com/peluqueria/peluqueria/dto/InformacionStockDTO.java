package com.peluqueria.peluqueria.dto;

import java.time.LocalDateTime;

public class InformacionStockDTO {
    private Integer id;
    private Integer stockActual;
    private Integer stockAnterior;
    private LocalDateTime fechaRegistroInformacionStock;
    private String nombreProductoActualizado;
    private Integer productoId;
    private String productoNombre;
    private Integer proveedorId;
    private String proveedorNombre;

    public InformacionStockDTO() {}

    public InformacionStockDTO(Integer id, Integer stockActual, Integer stockAnterior, 
                              LocalDateTime fechaRegistroInformacionStock, String nombreProductoActualizado,
                              Integer productoId, String productoNombre, Integer proveedorId, String proveedorNombre) {
        this.id = id;
        this.stockActual = stockActual;
        this.stockAnterior = stockAnterior;
        this.fechaRegistroInformacionStock = fechaRegistroInformacionStock;
        this.nombreProductoActualizado = nombreProductoActualizado;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.proveedorId = proveedorId;
        this.proveedorNombre = proveedorNombre;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getStockActual() { return stockActual; }
    public void setStockActual(Integer stockActual) { this.stockActual = stockActual; }

    public Integer getStockAnterior() { return stockAnterior; }
    public void setStockAnterior(Integer stockAnterior) { this.stockAnterior = stockAnterior; }

    public LocalDateTime getFechaRegistroInformacionStock() { return fechaRegistroInformacionStock; }
    public void setFechaRegistroInformacionStock(LocalDateTime fechaRegistroInformacionStock) { this.fechaRegistroInformacionStock = fechaRegistroInformacionStock; }

    public String getNombreProductoActualizado() { return nombreProductoActualizado; }
    public void setNombreProductoActualizado(String nombreProductoActualizado) { this.nombreProductoActualizado = nombreProductoActualizado; }

    public Integer getProductoId() { return productoId; }
    public void setProductoId(Integer productoId) { this.productoId = productoId; }

    public String getProductoNombre() { return productoNombre; }
    public void setProductoNombre(String productoNombre) { this.productoNombre = productoNombre; }

    public Integer getProveedorId() { return proveedorId; }
    public void setProveedorId(Integer proveedorId) { this.proveedorId = proveedorId; }

    public String getProveedorNombre() { return proveedorNombre; }
    public void setProveedorNombre(String proveedorNombre) { this.proveedorNombre = proveedorNombre; }
}