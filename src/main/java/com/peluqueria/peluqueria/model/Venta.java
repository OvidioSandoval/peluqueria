package com.peluqueria.peluqueria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "venta")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Venta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta", nullable = false)
    private Integer id;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "fecha_venta")
    private Instant fechaVenta;

    @Column(name = "cantidad_articulos", nullable = false)
    private Integer cantidadArticulos;

    @Column(name = "monto_total", nullable = false)
    private Integer montoTotal;

    @ColumnDefault("0")
    @Column(name = "descuento_aplicado")
    private Integer descuentoAplicado;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "fecha_creacion_venta")
    private Instant fechaCreacionVenta;

    @ColumnDefault("0")
    @Column(name = "devolucion")
    private Boolean devolucion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "observaciones", length = 255)
    private String observaciones;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Instant getFechaVenta() {
        return fechaVenta;
    }

    public void setFechaVenta(Instant fechaVenta) {
        this.fechaVenta = fechaVenta;
    }

    public Integer getCantidadArticulos() {
        return cantidadArticulos;
    }

    public void setCantidadArticulos(Integer cantidadArticulos) {
        this.cantidadArticulos = cantidadArticulos;
    }

    public Integer getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(Integer montoTotal) {
        this.montoTotal = montoTotal;
    }

    public Integer getDescuentoAplicado() {
        return descuentoAplicado;
    }

    public void setDescuentoAplicado(Integer descuentoAplicado) {
        this.descuentoAplicado = descuentoAplicado;
    }

    public Instant getFechaCreacionVenta() {
        return fechaCreacionVenta;
    }

    public void setFechaCreacionVenta(Instant fechaCreacionVenta) {
        this.fechaCreacionVenta = fechaCreacionVenta;
    }

    public Boolean getDevolucion() {
        return devolucion;
    }

    public void setDevolucion(Boolean devolucion) {
        this.devolucion = devolucion;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    @PrePersist
    protected void onCreate() {
        if (fechaVenta == null) {
            fechaVenta = Instant.now();
        }
        if (fechaCreacionVenta == null) {
            fechaCreacionVenta = Instant.now();
        }
        if (descuentoAplicado == null) {
            descuentoAplicado = 0;
        }
        if (devolucion == null) {
            devolucion = false;
        }
    }

}