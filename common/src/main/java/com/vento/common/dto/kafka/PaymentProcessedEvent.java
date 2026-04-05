package com.vento.common.dto.kafka;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Evento publicado por payment-service cuando un pago se procesa exitosamente.
 * Consumido por order-service para confirmar la orden.
 */
public record PaymentProcessedEvent(
        UUID orderId,
        String transactionId,
        BigDecimal amount
) implements Serializable {
}
