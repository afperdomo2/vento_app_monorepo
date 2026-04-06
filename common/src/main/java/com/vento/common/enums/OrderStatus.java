package com.vento.common.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estado de un pedido")
public enum OrderStatus {

    @Schema(description = "Pedido pendiente de confirmación y pago")
    PENDING,

    @Schema(description = "Pago aprobado, ticket entregado")
    CONFIRMED,

    @Schema(description = "Cancelado por el usuario")
    CANCELLED,

    @Schema(description = "Expirado por timeout de pago (TTL Redis)")
    EXPIRED
}
