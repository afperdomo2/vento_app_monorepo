package com.vento.common.dto.event;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO para representar un ticket de evento.
 */
public record TicketDto(
        UUID id,
        UUID eventId,
        UUID orderId,
        UUID userId,
        String accessCode,
        String status,
        Instant createdAt
) implements Serializable {
}
