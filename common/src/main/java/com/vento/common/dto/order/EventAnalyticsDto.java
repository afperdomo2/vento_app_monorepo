package com.vento.common.dto.order;

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
@Schema(description = "Métricas analíticas por evento")
public class EventAnalyticsDto {

    @Schema(description = "ID del evento", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID eventId;

    @Schema(description = "Cantidad total de órdenes confirmadas para este evento", example = "25")
    private Long totalOrders;

    @Schema(description = "Cantidad total de tickets vendidos para este evento", example = "50")
    private Long totalTickets;

    @Schema(description = "Ingreso total generado por este evento", example = "5000.00")
    private BigDecimal totalRevenue;
}
