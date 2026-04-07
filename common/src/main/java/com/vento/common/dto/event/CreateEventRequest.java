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
@Schema(description = "Request para crear un nuevo evento")
public class CreateEventRequest {

    @NotBlank(message = "El nombre del evento es requerido")
    @Size(min = 3, message = "El nombre del evento debe tener al menos 3 caracteres")
    @Schema(description = "Nombre del evento", example = "Concierto de Rock 2026")
    private String name;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    @Schema(description = "Descripción del evento", example = "Un increíble concierto de rock")
    private String description;

    @NotNull(message = "La fecha del evento es requerida")
    @Future(message = "La fecha del evento debe ser futura")
    @Schema(description = "Fecha y hora del evento", example = "2026-12-31T20:00:00")
    private LocalDateTime eventDate;

    @NotBlank(message = "El lugar del evento es requerido")
    @Size(min = 3, max = 150, message = "El lugar del evento debe tener entre 3 y 150 caracteres")
    @Schema(description = "Lugar del evento", example = "Estadio Nacional")
    private String venue;

    @NotNull(message = "La capacidad total es requerida")
    @Positive(message = "La capacidad debe ser un número positivo")
    @Min(value = 1, message = "La capacidad debe ser al menos 1")
    @Max(value = 500000, message = "La capacidad no puede superar 500,000 personas")
    @Schema(description = "Capacidad total de tickets", example = "5000")
    private Integer totalCapacity;

    @NotNull(message = "El precio es requerido")
    @Positive(message = "El precio debe ser un valor positivo")
    @Digits(integer = 10, fraction = 2, message = "El precio debe tener hasta 10 dígitos enteros y 2 decimales")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    @Schema(description = "Precio por ticket", example = "150.00")
    private BigDecimal price;

    @Schema(description = "Latitud del lugar", example = "4.6097")
    private Double latitude;

    @Schema(description = "Longitud del lugar", example = "-74.0817")
    private Double longitude;
}
