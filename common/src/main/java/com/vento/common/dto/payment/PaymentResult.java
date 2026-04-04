package com.vento.common.dto.payment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resultado del procesamiento de pago")
public class PaymentResult {

    @Schema(description = "ID de la orden procesada", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID orderId;

    @Schema(description = "ID de transacción generado por el servicio de pagos",
            example = "txn_abc123def456")
    private String transactionId;

    @Schema(description = "Monto procesado", example = "150.00")
    private BigDecimal amount;
}
