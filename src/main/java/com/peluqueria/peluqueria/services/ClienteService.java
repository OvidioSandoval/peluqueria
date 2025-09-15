package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Cliente;
import com.peluqueria.peluqueria.repository.ClienteRepository;
import com.peluqueria.peluqueria.repository.TurnoRepository;
import com.peluqueria.peluqueria.repository.VentaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.*;

@Service
public class ClienteService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClienteService.class);

    @Autowired
    private ClienteRepository clienteRepository;
    
    @Autowired
    private TurnoRepository turnoRepository;
    
    @Autowired
    private VentaRepository ventaRepository;

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
                actualCliente.setRuc(cliente.getRuc());
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
            guardarCliente.setRuc(cliente.getRuc());
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

    public List<Cliente> buscarPorRuc(String ruc) {
        try {
            List<Cliente> clientes = clienteRepository.findByRucContainingIgnoreCase(ruc);
            LOGGER.info("OUT: Clientes encontrados por RUC [{}]: [{}]", ruc, clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al buscar clientes por RUC", e);
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

    public List<Cliente> buscarPorNombreTelefonoORuc(String criterio) {
        try {
            List<Cliente> clientes = clienteRepository.findByNombreCompletoContainingIgnoreCaseOrTelefonoOrRucContainingIgnoreCase(criterio, criterio, criterio);
            LOGGER.info("OUT: Clientes encontrados por criterio completo [{}]: [{}]", criterio, clientes.size());
            return clientes;
        } catch (Exception e) {
            LOGGER.error("Error al buscar clientes por nombre, teléfono o RUC", e);
            throw e;
        }
    }

    public List<Map<String, Object>> getClientesMasFrecuentes() {
        try {
            List<Cliente> clientes = clienteRepository.findAll();
            return clientes.stream()
                .map(cliente -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", cliente.getId());
                    map.put("nombreCompleto", cliente.getNombreCompleto());
                    map.put("telefono", cliente.getTelefono());
                    map.put("correo", cliente.getCorreo());
                    map.put("fechaNacimiento", cliente.getFechaNacimiento());
                    
                    // Contar turnos del cliente
                    long visitas = turnoRepository.countByClienteId(cliente.getId());
                    map.put("visitas", visitas);
                    
                    // Calcular total gastado en ventas
                    Integer totalGastado = ventaRepository.findByClienteId(cliente.getId())
                        .stream()
                        .mapToInt(venta -> venta.getMontoTotal() != null ? venta.getMontoTotal() : 0)
                        .sum();
                    map.put("totalGastado", totalGastado);
                    
                    return map;
                })
                .filter(cliente -> (Long) cliente.get("visitas") > 0) // Solo clientes con visitas
                .sorted((c1, c2) -> Long.compare((Long) c2.get("visitas"), (Long) c1.get("visitas"))) // Ordenar por visitas desc
                .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            LOGGER.error("Error al obtener clientes más frecuentes", e);
            throw e;
        }
    }
}