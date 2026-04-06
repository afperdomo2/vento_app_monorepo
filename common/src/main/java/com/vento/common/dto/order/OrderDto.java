package com.vento.common.dto.order;

import com.vento.common.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO de un pedido")
public class OrderDto {

    @Schema(description = "ID único del pedido", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "ID del usuario que realizó el pedido", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID userId;

    @Schema(description = "ID del evento reservado", example = "123e4567-e89b-12d3-a456-426614174002")
    private UUID eventId;

    @Schema(description = "Cantidad de tickets reservados", example = "2")
    private Integer quantity;

    @Schema(description = "Monto total del pedido", example = "300.00")
    private BigDecimal totalAmount;

    @Schema(description = "Estado del pedido", example = "PENDING")
    private OrderStatus status;

    @Schema(description = "Fecha y hora de creación del pedido")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha y hora de última actualización")
    private LocalDateTime updatedAt;
}
