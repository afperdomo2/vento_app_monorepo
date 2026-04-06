package com.vento.common.dto.kafka;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Evento publicado por order-service cuando una orden se cancela (pago fallido).
 *
 * <p>Actualmente no es consumido por ningún servicio.
 * Reservado para futuros consumidores (notificaciones, analytics, etc.).
 */
public record OrderCancelledEvent(
        UUID orderId,
        UUID eventId,
        UUID userId,
        int quantity,
        String reason,
        Instant cancelledAt
) implements Serializable {
}
