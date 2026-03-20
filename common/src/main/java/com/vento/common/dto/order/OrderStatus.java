package com.vento.common.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estado de un pedido")
public enum OrderStatus {

    @Schema(description = "Pedido pendiente de confirmación")
    PENDING,

    @Schema(description = "Pedido confirmado")
    CONFIRMED,

    @Schema(description = "Pedido cancelado")
    CANCELLED
}
