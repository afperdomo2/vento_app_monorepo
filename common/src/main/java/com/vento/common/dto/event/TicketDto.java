package com.vento.common.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO de un ticket de evento")
public class TicketDto {

    @Schema(description = "ID único del ticket", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "ID del evento asociado", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID eventId;

    @Schema(description = "ID de la orden asociada", example = "123e4567-e89b-12d3-a456-426614174002")
    private UUID orderId;

    @Schema(description = "ID del usuario propietario", example = "123e4567-e89b-12d3-a456-426614174003")
    private UUID userId;

    @Schema(description = "Código de acceso único para el ticket", example = "TKT-ABC123")
    private String accessCode;

    @Schema(description = "Estado del ticket", example = "ACTIVE")
    private String status;

    @Schema(description = "Fecha de creación del ticket", example = "2026-04-06T10:30:00")
    private Instant createdAt;
}
