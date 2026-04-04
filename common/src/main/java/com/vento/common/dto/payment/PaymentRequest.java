package com.vento.common.dto.payment;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
@Schema(description = "Solicitud de procesamiento de pago")
public class PaymentRequest {

    @NotNull(message = "El orderId es requerido")
    @Schema(description = "ID de la orden a procesar", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID orderId;

    @NotNull(message = "El monto es requerido")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    @Schema(description = "Monto total a procesar", example = "150.00")
    private BigDecimal amount;
}
