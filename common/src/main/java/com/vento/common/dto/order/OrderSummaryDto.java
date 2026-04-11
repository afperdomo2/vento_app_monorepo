package com.vento.common.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resumen analítico de órdenes para dashboard")
public class OrderSummaryDto {

    @Schema(description = "Ingreso total de órdenes confirmadas", example = "42850.00")
    private BigDecimal totalRevenue;

    @Schema(description = "Cantidad total de órdenes confirmadas", example = "128")
    private Long totalOrders;

    @Schema(description = "Cantidad total de tickets vendidos", example = "256")
    private Long totalTickets;

    @Schema(description = "Cantidad de eventos con al menos una venta", example = "12")
    private Long totalEvents;
}
