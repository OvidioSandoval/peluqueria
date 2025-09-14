package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "compra")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Compra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_compra", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private com.peluqueria.peluqueria.model.Producto producto;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "total", nullable = false)
    private Integer total;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "proveedor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private com.peluqueria.peluqueria.model.Proveedor proveedor;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public com.peluqueria.peluqueria.model.Producto getProducto() {
        return producto;
    }

    public void setProducto(com.peluqueria.peluqueria.model.Producto producto) {
        this.producto = producto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }

    public LocalDate getFechaCompra() {
        return fechaCompra;
    }

    public void setFechaCompra(LocalDate fechaCompra) {
        this.fechaCompra = fechaCompra;
    }

    public com.peluqueria.peluqueria.model.Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(com.peluqueria.peluqueria.model.Proveedor proveedor) {
        this.proveedor = proveedor;
    }

}