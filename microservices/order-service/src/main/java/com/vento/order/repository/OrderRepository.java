package com.vento.order.repository;

import com.vento.common.enums.OrderStatus;
import com.vento.order.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findByUserId(UUID userId, Pageable pageable);

    /**
     * Encuentra órdenes en estado PENDING creadas antes de un momento dado.
     * Usado por el job de expiración para detectar reservas vencidas.
     *
     * @param status    estado a buscar (PENDING)
     * @param createdBefore umbral de tiempo
     * @return lista de órdenes expiradas candidatas
     */
    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.createdAt <= :createdBefore")
    List<Order> findByStatusAndCreatedAtBefore(
            @Param("status") OrderStatus status,
            @Param("createdBefore") LocalDateTime createdBefore
    );
}
