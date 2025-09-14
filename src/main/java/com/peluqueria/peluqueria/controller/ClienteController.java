package com.peluqueria.peluqueria.controller;

import com.peluqueria.peluqueria.model.Cliente;
import com.peluqueria.peluqueria.services.ClienteService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(ClienteController.class);

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public List<Cliente> obtenerLista() {
        LOGGER.info("IN: [{}]");
        try {
            LOGGER.info("OUT: [{}]");
            return clienteService.findAll();
        } catch (Exception e) {
            LOGGER.error("", e);
            LOGGER.info("OUT: [{}]", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> obtenerPorId(@PathVariable Integer id) {
        Optional<Cliente> cliente = clienteService.findById(id);
        if (cliente.isPresent()) {
            return ResponseEntity.ok(cliente.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/actualizar_cliente/{id}")
    public ResponseEntity<Cliente> actualizarCliente(@PathVariable Integer id, @RequestBody Cliente clienteActualizado) {
        return clienteService.actualizarCliente(id, clienteActualizado);
    }

    @PostMapping("/agregar_cliente")
    public ResponseEntity<Cliente> crearCliente(@RequestBody Cliente cliente) {
        return clienteService.agregarCliente(cliente);
    }

    @DeleteMapping("/eliminar_cliente/{id}")
    public ResponseEntity<Void> eliminarCliente(@PathVariable Integer id) {
        try {
            clienteService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/buscar/nombre")
    public List<Cliente> buscarPorNombre(@RequestParam String nombre) {
        LOGGER.info("IN: Buscando clientes por nombre [{}]", nombre);
        return clienteService.buscarPorNombre(nombre);
    }

    @GetMapping("/buscar/telefono")
    public List<Cliente> buscarPorTelefono(@RequestParam String telefono) {
        LOGGER.info("IN: Buscando clientes por teléfono [{}]", telefono);
        return clienteService.buscarPorTelefono(telefono);
    }

    @GetMapping("/buscar")
    public List<Cliente> buscarPorNombreOTelefono(@RequestParam String criterio) {
        LOGGER.info("IN: Buscando clientes por criterio [{}]", criterio);
        return clienteService.buscarPorNombreOTelefono(criterio);
    }
}