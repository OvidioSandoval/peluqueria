package com.peluqueria.peluqueria.repository;

import com.peluqueria.peluqueria.model.InformacionStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InformacionStockRepository extends JpaRepository<InformacionStock, Integer> {
    
    @Query("SELECT i FROM InformacionStock i WHERE i.stockActual <= i.producto.minimoStock")
    List<InformacionStock> findProductosConStockBajo();
    
    InformacionStock findTopByProductoIdOrderByFechaRegistroInformacionStockDesc(Integer productoId);
}