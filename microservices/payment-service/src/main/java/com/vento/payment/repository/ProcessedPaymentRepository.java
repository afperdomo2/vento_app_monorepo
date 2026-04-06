package com.vento.payment.repository;

import com.vento.payment.model.ProcessedPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcessedPaymentRepository extends JpaRepository<ProcessedPayment, UUID> {

    /**
     * Verificar si un pago ya fue procesado para una orden (idempotencia)
     */
    boolean existsByOrderId(UUID orderId);

    /**
     * Obtener pago procesado por orderId (para retornar resultado idempotente)
     */
    Optional<ProcessedPayment> findByOrderId(UUID orderId);

    /**
     * Verificar por transactionId (doble verificación)
     */
    boolean existsByTransactionId(String transactionId);
}
