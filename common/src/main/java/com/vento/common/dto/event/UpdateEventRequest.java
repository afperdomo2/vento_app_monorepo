package com.vento.common.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
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

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    @Schema(description = "Descripción del evento", example = "Un increíble concierto de rock con zona VIP")
    private String description;

    @Schema(description = "Fecha y hora del evento", example = "2026-12-31T20:00:00")
    private LocalDateTime eventDate;

    @Size(min = 3, max = 150, message = "El lugar del evento debe tener entre 3 y 150 caracteres")
    @Schema(description = "Lugar del evento", example = "Estadio Nacional - Sala VIP")
    private String venue;

    @Positive(message = "El precio debe ser un valor positivo")
    @Digits(integer = 10, fraction = 2, message = "El precio debe tener hasta 10 dígitos enteros y 2 decimales")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    @Schema(description = "Precio por ticket", example = "250.00")
    private BigDecimal price;
}
