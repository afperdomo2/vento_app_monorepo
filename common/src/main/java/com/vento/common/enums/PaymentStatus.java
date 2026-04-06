package com.vento.common.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estado de un pago")
public enum PaymentStatus {

    @Schema(description = "Pago completado exitosamente")
    COMPLETED,

    @Schema(description = "Pago fallido")
    FAILED
}
