package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Cliente;
import com.peluqueria.peluqueria.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClienteService.class);

    @Autowired
    private ClienteRepository clienteRepository;

    public List<Cliente> findAll() {
        try {
            List<Cliente> clientes = clienteRepository.findAll();
            LOGGER.info("OUT: Lista de clientes obtenida con éxito: [{}]", clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de clientes", e);
            throw e;
        }
    }

    public Optional<Cliente> findById(Integer id) {
        try {
            Optional<Cliente> cliente = clienteRepository.findById(id);
            LOGGER.info("OUT: Cliente encontrado: [{}]", cliente);
            return cliente;
        } catch (Exception e) {
            LOGGER.error("Error al buscar el cliente por ID", e);
            throw e;
        }
    }

    public Cliente save(Cliente cliente) {
        try {
            Cliente savedCliente = clienteRepository.save(cliente);
            LOGGER.info("OUT: Cliente guardado con éxito: [{}]", savedCliente);
            return savedCliente;
        } catch (Exception e) {
            LOGGER.error("Error al guardar el cliente", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (clienteRepository.existsById(id)) {
                clienteRepository.deleteById(id);
                LOGGER.info("Cliente con ID [{}] eliminado", id);
            } else {
                LOGGER.warn("No se encontró el cliente con ID [{}] para eliminar", id);
                throw new RuntimeException("Cliente no encontrado");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar el cliente", e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            boolean exists = clienteRepository.existsById(id);
            LOGGER.info("El cliente con ID [{}] existe: [{}]", id, exists);
            return exists;
        } catch (Exception e) {
            LOGGER.error("Error al verificar si existe el cliente", e);
            throw e;
        }
    }

    public ResponseEntity<Cliente> actualizarCliente(Integer id, Cliente cliente) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Cliente> clienteExistente = clienteRepository.findById(id);
            if (clienteExistente.isPresent()) {
                Cliente actualCliente = clienteExistente.get();
                actualCliente.setNombreCompleto(cliente.getNombreCompleto());
                actualCliente.setTelefono(cliente.getTelefono());
                actualCliente.setCorreo(cliente.getCorreo());
                actualCliente.setRedesSociales(cliente.getRedesSociales());
                actualCliente.setFechaNacimiento(cliente.getFechaNacimiento());
                Cliente actualClienteSalvo = clienteRepository.save(actualCliente);
                LOGGER.info("OUT:[{}]", actualClienteSalvo);
                return ResponseEntity.ok(actualClienteSalvo);
            } else {
                LOGGER.info("OUT: [{}] El cliente no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar el cliente", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Cliente> agregarCliente(@RequestBody Cliente cliente) {
        LOGGER.info("IN: [{}]", cliente);
        try {
            Cliente guardarCliente = new Cliente();
            guardarCliente.setNombreCompleto(cliente.getNombreCompleto());
            guardarCliente.setTelefono(cliente.getTelefono());
            guardarCliente.setCorreo(cliente.getCorreo());
            guardarCliente.setRedesSociales(cliente.getRedesSociales());
            guardarCliente.setFechaNacimiento(cliente.getFechaNacimiento());
            Cliente guardarClienteSalvo = clienteRepository.save(guardarCliente);
            LOGGER.info("OUT:[{}] Cliente guardado", guardarClienteSalvo);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarClienteSalvo);
        } catch (Exception e) {
            LOGGER.error("Error al guardar el cliente", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public List<Cliente> buscarPorNombre(String nombre) {
        try {
            List<Cliente> clientes = clienteRepository.findByNombreCompletoContainingIgnoreCase(nombre);
            LOGGER.info("OUT: Clientes encontrados por nombre [{}]: [{}]", nombre, clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al buscar clientes por nombre", e);
            throw e;
        }
    }

    public List<Cliente> buscarPorTelefono(String telefono) {
        try {
            List<Cliente> clientes = clienteRepository.findByTelefono(telefono);
            LOGGER.info("OUT: Clientes encontrados por teléfono [{}]: [{}]", telefono, clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al buscar clientes por teléfono", e);
            throw e;
        }
    }

    public List<Cliente> buscarPorNombreOTelefono(String criterio) {
        try {
            List<Cliente> clientes = clienteRepository.findByNombreCompletoContainingIgnoreCaseOrTelefono(criterio, criterio);
            LOGGER.info("OUT: Clientes encontrados por criterio [{}]: [{}]", criterio, clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al buscar clientes por nombre o teléfono", e);
            throw e;
        }
    }
}