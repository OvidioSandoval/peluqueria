package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "detalle_venta")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DetalleVenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_venta", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "venta_id", nullable = false)
    private com.peluqueria.peluqueria.model.Venta venta;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "servicio_id")
    private com.peluqueria.peluqueria.model.Servicio servicio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id")
    private com.peluqueria.peluqueria.model.Producto producto;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario_bruto", nullable = false)
    private Integer precioUnitarioBruto;

    @Column(name = "precio_total", nullable = false)
    private Integer precioTotal;

    @ColumnDefault("0")
    @Column(name = "descuento")
    private Integer descuento;

    @Column(name = "precio_unitario_neto", nullable = false)
    private Integer precioUnitarioNeto;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public com.peluqueria.peluqueria.model.Venta getVenta() {
        return venta;
    }

    public void setVenta(com.peluqueria.peluqueria.model.Venta venta) {
        this.venta = venta;
    }

    public com.peluqueria.peluqueria.model.Servicio getServicio() {
        return servicio;
    }

    public void setServicio(com.peluqueria.peluqueria.model.Servicio servicio) {
        this.servicio = servicio;
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

    public Integer getPrecioUnitarioBruto() {
        return precioUnitarioBruto;
    }

    public void setPrecioUnitarioBruto(Integer precioUnitarioBruto) {
        this.precioUnitarioBruto = precioUnitarioBruto;
    }

    public Integer getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(Integer precioTotal) {
        this.precioTotal = precioTotal;
    }

    public Integer getDescuento() {
        return descuento;
    }

    public void setDescuento(Integer descuento) {
        this.descuento = descuento;
    }

    public Integer getPrecioUnitarioNeto() {
        return precioUnitarioNeto;
    }

    public void setPrecioUnitarioNeto(Integer precioUnitarioNeto) {
        this.precioUnitarioNeto = precioUnitarioNeto;
    }

}