package com.peluqueria.peluqueria.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "paquete_servicio")
public class PaqueteServicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paquete", nullable = false)
    private Integer id;

    @Column(name = "descripcion", nullable = false, length = 50)
    private String descripcion;

    @Column(name = "precio_total", nullable = false)
    private Integer precioTotal;

    @ColumnDefault("0")
    @Column(name = "descuento_aplicado")
    private Integer descuentoAplicado;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(Integer precioTotal) {
        this.precioTotal = precioTotal;
    }

    public Integer getDescuentoAplicado() {
        return descuentoAplicado;
    }

    public void setDescuentoAplicado(Integer descuentoAplicado) {
        this.descuentoAplicado = descuentoAplicado;
    }

}