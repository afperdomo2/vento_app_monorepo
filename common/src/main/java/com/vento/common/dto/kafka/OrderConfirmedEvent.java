package com.vento.common.dto.kafka;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Evento publicado por order-service cuando una orden se confirma (pago exitoso).
 *
 * <p>Actualmente no es consumido por ningún servicio.
 * Reservado para futuros consumidores (notificaciones, facturación, analytics, etc.).
 */
public record OrderConfirmedEvent(
        UUID orderId,
        UUID eventId,
        UUID userId,
        int quantity,
        BigDecimal totalAmount,
        Instant confirmedAt
) implements Serializable {
}
