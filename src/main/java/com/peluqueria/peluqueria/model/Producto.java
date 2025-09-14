package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "producto")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto", nullable = false)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    @Column(name = "descripcion", length = 50)
    private String descripcion;

    @Column(name = "precio_compra", nullable = false)
    private Integer precioCompra;

    @Column(name = "precio_venta", nullable = false)
    private Integer precioVenta;

    @Column(name = "cantidad_stock_inicial", nullable = false)
    private Integer cantidadStockInicial;

    @Column(name = "cantidad_optima_stock")
    private Integer cantidadOptimaStock;

    @Column(name = "minimo_stock")
    private Integer minimoStock;

    @ColumnDefault("1")
    @Column(name = "activo")
    private Boolean activo;

    @ColumnDefault("0")
    @Column(name = "en_promocion")
    private Boolean enPromocion;

    @Column(name = "precio_promocion")
    private Integer precioPromocion;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getPrecioCompra() {
        return precioCompra;
    }

    public void setPrecioCompra(Integer precioCompra) {
        this.precioCompra = precioCompra;
    }

    public Integer getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(Integer precioVenta) {
        this.precioVenta = precioVenta;
    }

    public Integer getCantidadStockInicial() {
        return cantidadStockInicial;
    }

    public void setCantidadStockInicial(Integer cantidadStockInicial) {
        this.cantidadStockInicial = cantidadStockInicial;
    }

    public Integer getCantidadOptimaStock() {
        return cantidadOptimaStock;
    }

    public void setCantidadOptimaStock(Integer cantidadOptimaStock) {
        this.cantidadOptimaStock = cantidadOptimaStock;
    }

    public Integer getMinimoStock() {
        return minimoStock;
    }

    public void setMinimoStock(Integer minimoStock) {
        this.minimoStock = minimoStock;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Boolean getEnPromocion() {
        return enPromocion;
    }

    public void setEnPromocion(Boolean enPromocion) {
        this.enPromocion = enPromocion;
    }

    public Integer getPrecioPromocion() {
        return precioPromocion;
    }

    public void setPrecioPromocion(Integer precioPromocion) {
        this.precioPromocion = precioPromocion;
    }

}