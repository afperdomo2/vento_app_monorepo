package com.vento.common.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request para actualizar un evento existente")
public class UpdateEventRequest {

    @Schema(description = "Nombre del evento", example = "Concierto de Rock 2026 - VIP")
    private String name;

    @Schema(description = "Descripción del evento", example = "Un increíble concierto de rock con zona VIP")
    private String description;

    @Schema(description = "Fecha y hora del evento", example = "2026-12-31T20:00:00")
    private LocalDateTime eventDate;

    @Schema(description = "Lugar del evento", example = "Estadio Nacional - Sala VIP")
    private String venue;

    @Min(value = 1, message = "La capacidad debe ser al menos 1")
    @Schema(description = "Capacidad total de tickets", example = "6000")
    private Integer totalCapacity;

    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    @Schema(description = "Precio por ticket", example = "250.00")
    private BigDecimal price;
}
