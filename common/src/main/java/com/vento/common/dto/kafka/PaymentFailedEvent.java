package com.vento.common.dto.kafka;

import java.io.Serializable;
import java.util.UUID;

/**
 * Evento publicado por payment-service cuando un pago falla.
 * Consumido por order-service para cancelar la orden y liberar tickets.
 */
public record PaymentFailedEvent(
        UUID orderId,
        String reason
) implements Serializable {
}
