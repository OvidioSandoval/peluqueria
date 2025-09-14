package com.peluqueria.peluqueria.model;

import jakarta.persistence.*;

@Entity
@Table(name = "movimiento")
public class Movimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento", nullable = false)
    private Integer id;

    @Column(name = "monto", nullable = false)
    private Integer monto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caja_id", nullable = false)
    private Caja caja;

    @Column(name = "id_asociado", nullable = false)
    private Integer idAsociado;

    @Column(name = "tipo", nullable = false, length = 100)
    private String tipo;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getMonto() {
        return monto;
    }

    public void setMonto(Integer monto) {
        this.monto = monto;
    }

    public Caja getCaja() {
        return caja;
    }

    public void setCaja(Caja caja) {
        this.caja = caja;
    }

    public Integer getIdAsociado() {
        return idAsociado;
    }

    public void setIdAsociado(Integer idAsociado) {
        this.idAsociado = idAsociado;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

}