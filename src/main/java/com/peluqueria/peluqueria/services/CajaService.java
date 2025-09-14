package com.peluqueria.peluqueria.services;

import com.peluqueria.peluqueria.model.Caja;
import com.peluqueria.peluqueria.repository.CajaRepository;
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
public class CajaService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CajaService.class);

    @Autowired
    private CajaRepository cajaRepository;

    public List<Caja> findAll() {
        try {
            List<Caja> cajas = cajaRepository.findAll();
            LOGGER.info("OUT: Lista de cajas obtenida con éxito: [{}]", cajas.size());
            return cajas;
        } catch (Exception e) {
            LOGGER.error("Error al obtener la lista de cajas", e);
            throw e;
        }
    }

    public Optional<Caja> findById(Integer id) {
        try {
            Optional<Caja> caja = cajaRepository.findById(id);
            LOGGER.info("OUT: Caja encontrada: [{}]", caja);
            return caja;
        } catch (Exception e) {
            LOGGER.error("Error al buscar la caja por ID", e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            if (cajaRepository.existsById(id)) {
                cajaRepository.deleteById(id);
                LOGGER.info("Caja con ID [{}] eliminada", id);
            } else {
                LOGGER.warn("No se encontró la caja con ID [{}] para eliminar", id);
                throw new RuntimeException("Caja no encontrada");
            }
        } catch (Exception e) {
            LOGGER.error("Error al eliminar la caja", e);
            throw e;
        }
    }

    public ResponseEntity<Caja> actualizarCaja(Integer id, Caja caja) {
        LOGGER.info("IN: [{}], id", id);
        try {
            Optional<Caja> cajaExistente = cajaRepository.findById(id);
            if (cajaExistente.isPresent()) {
                Caja actualCaja = cajaExistente.get();
                actualCaja.setNombre(caja.getNombre());
                actualCaja.setFecha(caja.getFecha());
                actualCaja.setHoraApertura(caja.getHoraApertura());
                actualCaja.setHoraCierre(caja.getHoraCierre());
                actualCaja.setMontoInicial(caja.getMontoInicial());
                actualCaja.setMontoFinal(caja.getMontoFinal());
                actualCaja.setTotalServicios(caja.getTotalServicios());
                actualCaja.setTotalProductos(caja.getTotalProductos());
                actualCaja.setTotalDescuentos(caja.getTotalDescuentos());
                actualCaja.setEstado(caja.getEstado());
                actualCaja.setEmpleado(caja.getEmpleado());
                Caja actualCajaSalva = cajaRepository.save(actualCaja);
                LOGGER.info("OUT:[{}]", actualCajaSalva);
                return ResponseEntity.ok(actualCajaSalva);
            } else {
                LOGGER.info("OUT: [{}] La caja no existe", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            LOGGER.error("Error al actualizar la caja", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<Caja> agregarCaja(@RequestBody Caja caja) {
        LOGGER.info("IN: [{}]", caja);
        try {
            Caja guardarCaja = new Caja();
            guardarCaja.setNombre(caja.getNombre());
            guardarCaja.setFecha(caja.getFecha());
            guardarCaja.setHoraApertura(caja.getHoraApertura());
            guardarCaja.setHoraCierre(caja.getHoraCierre());
            guardarCaja.setMontoInicial(caja.getMontoInicial());
            guardarCaja.setMontoFinal(caja.getMontoFinal());
            guardarCaja.setTotalServicios(caja.getTotalServicios());
            guardarCaja.setTotalProductos(caja.getTotalProductos());
            guardarCaja.setTotalDescuentos(caja.getTotalDescuentos());
            guardarCaja.setEstado(caja.getEstado());
            guardarCaja.setEmpleado(caja.getEmpleado());
            Caja guardarCajaSalva = cajaRepository.save(guardarCaja);
            LOGGER.info("OUT:[{}] Caja guardada", guardarCajaSalva);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardarCajaSalva);
        } catch (Exception e) {
            LOGGER.error("Error al guardar la caja", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}