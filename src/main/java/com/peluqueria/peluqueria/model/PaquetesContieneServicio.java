package com.peluqueria.peluqueria.model;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "paquetes_contiene_servicio")
public class PaquetesContieneServicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "paquete_id", nullable = false)
    private PaqueteServicio paquete;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "servicio_id", nullable = false)
    private com.peluqueria.peluqueria.model.Servicio servicio;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public PaqueteServicio getPaquete() {
        return paquete;
    }

    public void setPaquete(PaqueteServicio paquete) {
        this.paquete = paquete;
    }

    public com.peluqueria.peluqueria.model.Servicio getServicio() {
        return servicio;
    }

    public void setServicio(com.peluqueria.peluqueria.model.Servicio servicio) {
        this.servicio = servicio;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

}