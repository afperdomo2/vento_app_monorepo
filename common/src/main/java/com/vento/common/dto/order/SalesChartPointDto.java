package com.vento.common.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Punto de datos para gráfica de ventas")
public class SalesChartPointDto {

    @Schema(description = "Fecha del dato", example = "2026-04-01")
    private LocalDate date;

    @Schema(description = "Cantidad de tickets vendidos en esa fecha", example = "15")
    private Long quantity;

    @Schema(description = "Ingreso total en esa fecha", example = "1500.00")
    private BigDecimal revenue;
}
