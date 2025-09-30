package com.peluqueria.peluqueria.controller;

import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class FrontController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(FrontController.class);

    @GetMapping("/")
    public String mostrarIndex(Model model) {
        LOGGER.info("IN: [{}]");
        return "panel-control";
    }

    @GetMapping("/web/areas")
    public String mostrarAreas(Model model) {
        LOGGER.info("IN: mostrarAreas");
        return "areas";
    }
    @GetMapping("/web/pagina-principal")
    public String mostrarPaginaPrincipal(Model model) {
        LOGGER.info("IN: mostrarPaginaPrincipal");
        return "pagina-principal";
    }

    @GetMapping("/web/cajas")
    public String mostrarCajas(Model model) {
        LOGGER.info("IN: mostrarCajas");
        return "cajas";
    }



    @GetMapping("/web/categorias")
    public String mostrarCategorias(Model model) {
        LOGGER.info("IN: mostrarCategorias");
        return "categoria-servicios";
    }

    @GetMapping("/web/clientes")
    public String mostrarClientes(Model model) {
        LOGGER.info("IN: mostrarClientes");
        return "clientes";
    }

    @GetMapping("/web/compras")
    public String mostrarCompras(Model model) {
        LOGGER.info("IN: mostrarCompras");
        return "compras";
    }

    @GetMapping("/web/detalle-compras")
    public String mostrarDetalleCompras(Model model) {
        LOGGER.info("IN: mostrarDetalleCompras");
        return "detalle-compras";
    }

    @GetMapping("/web/detalle-ventas")
    public String mostrarDetalleVentas(Model model) {
        LOGGER.info("IN: mostrarDetalleVentas");
        return "detalle-ventas";
    }

    @GetMapping("/web/empleados")
    public String mostrarEmpleados(Model model) {
        LOGGER.info("IN: mostrarEmpleados");
        return "empleados";
    }

    @GetMapping("/web/gastos")
    public String mostrarGastos(Model model) {
        LOGGER.info("IN: mostrarGastos");
        return "gastos";
    }

    @GetMapping("/web/movimientos")
    public String mostrarMovimientos(Model model) {
        LOGGER.info("IN: mostrarMovimientos");
        return "movimientos";
    }

    @GetMapping("/web/paquetes-contiene-servicio")
    public String mostrarPaquetesContieneServicio(Model model) {
        LOGGER.info("IN: mostrarPaquetesContieneServicio");
        return "paquetes-contiene-servicio";
    }


    @GetMapping("/web/paquete-servicios")
    public String mostrarPaqueteServicios(Model model) {
        LOGGER.info("IN: mostrarPaqueteServicios");
        return "paquete-servicios";
    }

    @GetMapping("/web/productos")
    public String mostrarProductos(Model model) {
        LOGGER.info("IN: mostrarProductos");
        return "productos";
    }

    @GetMapping("/web/proveedores")
    public String mostrarProveedores(Model model) {
        LOGGER.info("IN: mostrarProveedores");
        return "proveedores";
    }

    @GetMapping("/web/servicios")
    public String mostrarServicios(Model model) {
        LOGGER.info("IN: mostrarServicios");
        return "servicios";
    }

    @GetMapping("/web/turnos")
    public String mostrarTurnos(Model model) {
        LOGGER.info("IN: mostrarTurnos");
        return "turnos";
    }

    @GetMapping("/web/ventas")
    public String mostrarVentas(Model model) {
        LOGGER.info("IN: mostrarVentas");
        return "ventas";
    }

    @GetMapping("/web/alertas-stock")
    public String mostrarAlertasStock(Model model) {
        LOGGER.info("IN: mostrarAlertasStock");
        return "alertas-stock";
    }

    @GetMapping("/web/reportes")
    public String mostrarReportes(Model model) {
        LOGGER.info("IN: mostrarReportes");
        return "reportes";
    }


    @GetMapping("/web/usuarios")
    public String mostrarUsuarios(Model model) {
        LOGGER.info("IN: mostrarUsuarios");
        return "usuarios";
    }

    @GetMapping("/web/panel-control")
    public String mostrarDashboard(Model model) {
        LOGGER.info("IN: mostrarDashboard");
        return "panel-control";
    }

    @GetMapping("/web/cliente-principal")
    public String mostrarClientePrincipal(Model model) {
        LOGGER.info("IN: mostrarClientePrincipal");
        return "cliente-principal";
    }

    @GetMapping("/web/calendario-turno")
    public String mostrarCalendarioTurno(Model model) {
        LOGGER.info("IN: mostrarCalendarioTurno");
        return "calendario-turno";
    }

    @GetMapping("/web/registro-venta")
    public String mostrarRegistroVenta(Model model) {
        LOGGER.info("IN: mostrarRegistroVenta");
        return "registro-venta";
    }

    @GetMapping("/web/registro-compra")
    public String mostrarRegistroCompra(Model model) {
        LOGGER.info("IN: mostrarRegistroCompra");
        return "registro-compra";
    }
    @GetMapping("/web/empleado-principal")
    public String mostrarEmpleado(Model model) {
        LOGGER.info("IN: mostrarCalendarioTurno");
        return "empleado-principal";
    }
}