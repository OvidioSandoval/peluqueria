package com.peluqueria.peluqueria.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "informacion_stock")
public class InformacionStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_informacion_stock", nullable = false)
    private Integer id;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    @Column(name = "stock_anterior", nullable = false)
    private Integer stockAnterior;

    @CreationTimestamp
    @Column(name = "fecha_registro_informacion_stock")
    private LocalDateTime fechaRegistroInformacionStock;

    @Column(name = "nombre_producto_actualizado", nullable = false, length = 100)
    private String nombreProductoActualizado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private com.peluqueria.peluqueria.model.Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private com.peluqueria.peluqueria.model.Proveedor proveedor;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getStockActual() {
        return stockActual;
    }

    public void setStockActual(Integer stockActual) {
        this.stockActual = stockActual;
    }

    public Integer getStockAnterior() {
        return stockAnterior;
    }

    public void setStockAnterior(Integer stockAnterior) {
        this.stockAnterior = stockAnterior;
    }

    public LocalDateTime getFechaRegistroInformacionStock() {
        return fechaRegistroInformacionStock;
    }

    public void setFechaRegistroInformacionStock(LocalDateTime fechaRegistroInformacionStock) {
        this.fechaRegistroInformacionStock = fechaRegistroInformacionStock;
    }

    public String getNombreProductoActualizado() {
        return nombreProductoActualizado;
    }

    public void setNombreProductoActualizado(String nombreProductoActualizado) {
        this.nombreProductoActualizado = nombreProductoActualizado;
    }

    public com.peluqueria.peluqueria.model.Producto getProducto() {
        return producto;
    }

    public void setProducto(com.peluqueria.peluqueria.model.Producto producto) {
        this.producto = producto;
    }

    public com.peluqueria.peluqueria.model.Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(com.peluqueria.peluqueria.model.Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    @PrePersist
    protected void onCreate() {
        if (fechaRegistroInformacionStock == null) {
            fechaRegistroInformacionStock = LocalDateTime.now().plusHours(1);
        }
    }

}