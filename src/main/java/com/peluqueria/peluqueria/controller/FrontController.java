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

    // Encoded URLs
    @GetMapping("/app/a1")
    public String mostrarAreasEncoded(Model model) {
        return "areas";
    }

    @GetMapping("/app/p1")
    public String mostrarPaginaPrincipalEncoded(Model model) {
        return "pagina-principal";
    }

    @GetMapping("/app/c1")
    public String mostrarCajasEncoded(Model model) {
        return "cajas";
    }

    @GetMapping("/app/cs1")
    public String mostrarCategoriasEncoded(Model model) {
        return "categoria-servicios";
    }

    @GetMapping("/app/cl1")
    public String mostrarClientesEncoded(Model model) {
        return "clientes";
    }

    @GetMapping("/app/co1")
    public String mostrarComprasEncoded(Model model) {
        return "compras";
    }

    @GetMapping("/app/dc1")
    public String mostrarDetalleComprasEncoded(Model model) {
        return "detalle-compras";
    }

    @GetMapping("/app/dv1")
    public String mostrarDetalleVentasEncoded(Model model) {
        return "detalle-ventas";
    }

    @GetMapping("/app/e1")
    public String mostrarEmpleadosEncoded(Model model) {
        return "empleados";
    }

    @GetMapping("/app/g1")
    public String mostrarGastosEncoded(Model model) {
        return "gastos";
    }

    @GetMapping("/app/m1")
    public String mostrarMovimientosEncoded(Model model) {
        return "movimientos";
    }

    @GetMapping("/app/ps1")
    public String mostrarPaqueteServiciosEncoded(Model model) {
        return "paquete-servicios";
    }

    @GetMapping("/app/pr1")
    public String mostrarProductosEncoded(Model model) {
        return "productos";
    }

    @GetMapping("/app/pv1")
    public String mostrarProveedoresEncoded(Model model) {
        return "proveedores";
    }

    @GetMapping("/app/s1")
    public String mostrarServiciosEncoded(Model model) {
        return "servicios";
    }

    @GetMapping("/app/t1")
    public String mostrarTurnosEncoded(Model model) {
        return "turnos";
    }

    @GetMapping("/app/v1")
    public String mostrarVentasEncoded(Model model) {
        return "ventas";
    }

    @GetMapping("/app/as1")
    public String mostrarAlertasStockEncoded(Model model) {
        return "alertas-stock";
    }

    @GetMapping("/app/r1")
    public String mostrarReportesEncoded(Model model) {
        return "reportes";
    }

    @GetMapping("/app/u1")
    public String mostrarUsuariosEncoded(Model model) {
        return "usuarios";
    }

    @GetMapping("/app/ro1")
    public String mostrarRolesEncoded(Model model) {
        return "roles";
    }

    @GetMapping("/app/ru1")
    public String mostrarRegistroUsuarioEncoded(Model model) {
        return "registro-usuario";
    }

    @GetMapping("/app/rr1")
    public String mostrarRegistroRolEncoded(Model model) {
        return "registro-rol";
    }

    @GetMapping("/app/pc1")
    public String mostrarDashboardEncoded(Model model) {
        return "panel-control";
    }

    @GetMapping("/app/cp1")
    public String mostrarClientePrincipalEncoded(Model model) {
        return "cliente-principal";
    }

    @GetMapping("/app/ct1")
    public String mostrarCalendarioTurnoEncoded(Model model) {
        return "calendario-turno";
    }

    @GetMapping("/app/rv1")
    public String mostrarRegistroVentaEncoded(Model model) {
        return "registro-venta";
    }

    @GetMapping("/app/rc1")
    public String mostrarRegistroCompraEncoded(Model model) {
        return "registro-compra";
    }

    @GetMapping("/app/ep1")
    public String mostrarEmpleadoEncoded(Model model) {
        return "empleado-principal";
    }

    @GetMapping("/app/rcl1")
    public String mostrarRegistroClienteEncoded(Model model) {
        return "registro-cliente";
    }

    @GetMapping("/app/re1")
    public String mostrarRegistroEmpleadoEncoded(Model model) {
        return "registro-empleado";
    }

    @GetMapping("/app/rs1")
    public String mostrarRegistroServicioEncoded(Model model) {
        return "registro-servicio";
    }

    @GetMapping("/app/rp1")
    public String mostrarRegistroProductoEncoded(Model model) {
        return "registro-producto";
    }

    @GetMapping("/app/ra1")
    public String mostrarRegistroAreaEncoded(Model model) {
        return "registro-area";
    }

    @GetMapping("/app/rca1")
    public String mostrarRegistroCajaEncoded(Model model) {
        return "registro-caja";
    }

    @GetMapping("/app/rct1")
    public String mostrarRegistroCategoriaEncoded(Model model) {
        return "registro-categoria";
    }

    @GetMapping("/app/rg1")
    public String mostrarRegistroGastoEncoded(Model model) {
        return "registro-gasto";
    }

    @GetMapping("/app/rm1")
    public String mostrarRegistroMovimientoEncoded(Model model) {
        return "registro-movimiento";
    }

    @GetMapping("/app/rps1")
    public String mostrarRegistroPaquetesServicioEncoded(Model model) {
        return "registro-paquetes-servicio";
    }

    @GetMapping("/app/rpv1")
    public String mostrarRegistroProveedorEncoded(Model model) {
        return "registro-proveedor";
    }

    @GetMapping("/app/rt1")
    public String mostrarRegistroTurnoEncoded(Model model) {
        return "registro-turno";
    }

    @GetMapping("/app/rpr1")
    public String mostrarRegistroPromocionEncoded(Model model) {
        return "registro-promocion";
    }

    @GetMapping("/app/ap1")
    public String mostrarAdminPromocionesEncoded(Model model) {
        return "admin-promociones";
    }

    @GetMapping("/app/pcs1")
    public String mostrarPaquetesContieneServicioEncoded(Model model) {
        return "paquetes-contiene-servicio";
    }

    @GetMapping("/app/rpcs1")
    public String mostrarRegistroPaquetesContieneServiciosEncoded(Model model) {
        return "registro-paquetes-contiene-servicios";
    }

    @GetMapping("/app/au1")
    public String mostrarAuditoriaEncoded(Model model) {
        return "auditoria";
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

    @GetMapping("/web/roles")
    public String mostrarRoles(Model model) {
        LOGGER.info("IN: mostrarRoles");
        return "roles";
    }

    @GetMapping("/web/registro-usuario")
    public String mostrarRegistroUsuario(Model model) {
        LOGGER.info("IN: mostrarRegistroUsuario");
        return "registro-usuario";
    }

    @GetMapping("/web/registro-rol")
    public String mostrarRegistroRol(Model model) {
        LOGGER.info("IN: mostrarRegistroRol");
        return "registro-rol";
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

    @GetMapping("/web/registro-cliente")
    public String mostrarRegistroCliente(Model model) {
        LOGGER.info("IN: mostrarRegistroCliente");
        return "registro-cliente";
    }

    @GetMapping("/web/registro-empleado")
    public String mostrarRegistroEmpleado(Model model) {
        LOGGER.info("IN: mostrarRegistroEmpleado");
        return "registro-empleado";
    }

    @GetMapping("/web/registro-servicio")
    public String mostrarRegistroServicio(Model model) {
        LOGGER.info("IN: mostrarRegistroServicio");
        return "registro-servicio";
    }

    @GetMapping("/web/registro-producto")
    public String mostrarRegistroProducto(Model model) {
        LOGGER.info("IN: mostrarRegistroProducto");
        return "registro-producto";
    }

    @GetMapping("/web/registro-area")
    public String mostrarRegistroArea(Model model) {
        LOGGER.info("IN: mostrarRegistroArea");
        return "registro-area";
    }

    @GetMapping("/web/registro-caja")
    public String mostrarRegistroCaja(Model model) {
        LOGGER.info("IN: mostrarRegistroCaja");
        return "registro-caja";
    }

    @GetMapping("/web/registro-categoria")
    public String mostrarRegistroCategoria(Model model) {
        LOGGER.info("IN: mostrarRegistroCategoria");
        return "registro-categoria";
    }

    @GetMapping("/web/registro-gasto")
    public String mostrarRegistroGasto(Model model) {
        LOGGER.info("IN: mostrarRegistroGasto");
        return "registro-gasto";
    }

    @GetMapping("/web/registro-movimiento")
    public String mostrarRegistroMovimiento(Model model) {
        LOGGER.info("IN: mostrarRegistroMovimiento");
        return "registro-movimiento";
    }

    @GetMapping("/web/registro-paquetes-servicio")
    public String mostrarRegistroPaquetesServicio(Model model) {
        LOGGER.info("IN: mostrarRegistroPaquetesServicio");
        return "registro-paquetes-servicio";
    }

    @GetMapping("/web/registro-paquetes-contiene-servicios")
    public String mostrarRegistroPaquetesContieneServicios(Model model) {
        LOGGER.info("IN: mostrarRegistroPaquetesContieneServicios");
        return "registro-paquetes-contiene-servicios";
    }

    @GetMapping("/web/registro-proveedor")
    public String mostrarRegistroProveedor(Model model) {
        LOGGER.info("IN: mostrarRegistroProveedor");
        return "registro-proveedor";
    }

    @GetMapping("/web/registro-turno")
    public String mostrarRegistroTurno(Model model) {
        LOGGER.info("IN: mostrarRegistroTurno");
        return "registro-turno";
    }

    @GetMapping("/landing")
    public String mostrarLanding(Model model) {
        LOGGER.info("IN: mostrarLanding");
        return "landing";
    }

    @GetMapping("/web/landing")
    public String mostrarWebLanding(Model model) {
        LOGGER.info("IN: mostrarWebLanding");
        return "landing";
    }

    @GetMapping("/web/landing-servicios")
    public String mostrarLandingServicios(Model model) {
        LOGGER.info("IN: mostrarLandingServicios");
        return "landing-servicios";
    }

    @GetMapping("/web/landing-productos")
    public String mostrarLandingProductos(Model model) {
        LOGGER.info("IN: mostrarLandingProductos");
        return "landing-productos";
    }

    @GetMapping("/web/registro-promocion")
    public String mostrarRegistroPromocion(Model model) {
        LOGGER.info("IN: mostrarRegistroPromocion");
        return "registro-promocion";


    }

    @GetMapping("/web/landing-promociones")
    public String mostrarLandingPromociones(Model model) {
        LOGGER.info("IN: mostrarLandingPromociones");
        return "landing-promociones";
    }

    @GetMapping("/web/landing-contacto")
    public String mostrarLandingContacto(Model model) {
        LOGGER.info("IN: mostrarLandingContacto");
        return "landing-contacto";
    }

    @GetMapping("/web/admin-promociones")
    public String mostrarAdminPromociones(Model model) {
        LOGGER.info("IN: mostrarAdminPromociones");
        return "admin-promociones";
    }

    @GetMapping("/login")
    public String mostrarLogin(Model model) {
        LOGGER.info("IN: mostrarLogin");
        return "login";
    }

    @GetMapping("/auth/l1")
    public String mostrarLoginEncoded(Model model) {
        return "login";
    }

    @GetMapping("/web/auditoria")
    public String mostrarAuditoria(Model model) {
        LOGGER.info("IN: mostrarAuditoria");
        return "auditoria";
    }

}