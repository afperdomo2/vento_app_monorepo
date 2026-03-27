package com.vento.common.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request para crear un nuevo pedido")
public class CreateOrderRequest {

    @NotNull(message = "El ID del usuario es requerido")
    @Schema(description = "ID del usuario que realiza el pedido", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID userId;

    @NotNull(message = "El ID del evento es requerido")
    @Schema(description = "ID del evento a reservar", example = "123e4567-e89b-12d3-a456-426614174002")
    private UUID eventId;

    @NotNull(message = "La cantidad de tickets es requerida")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Positive(message = "La cantidad debe ser un número positivo")
    @Schema(description = "Cantidad de tickets a reservar", example = "2")
    private Integer quantity;
}
