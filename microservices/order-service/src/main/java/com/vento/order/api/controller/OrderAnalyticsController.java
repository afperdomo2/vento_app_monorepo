package com.vento.order.api.controller;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.order.EventAnalyticsDto;
import com.vento.common.dto.order.OrderSummaryDto;
import com.vento.common.dto.order.SalesChartPointDto;
import com.vento.order.core.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders/analytics")
@RequiredArgsConstructor
@Tag(name = "Analíticas de Pedidos", description = "Endpoints de agregación para dashboard del organizador")
public class OrderAnalyticsController {

    private final OrderService orderService;

    @Operation(
            summary = "Resumen analítico global",
            description = "Retorna métricas agregadas de todas las órdenes CONFIRMED: " +
                    "revenue total, cantidad de órdenes, tickets vendidos y eventos únicos."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Resumen calculado exitosamente",
                    content = @Content(schema = @Schema(implementation = OrderSummaryDto.class))
            )
    })
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<OrderSummaryDto>> getOrderSummary() {
        OrderSummaryDto summary = orderService.getOrderSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @Operation(
            summary = "Serie temporal de ventas",
            description = "Retorna puntos de datos para gráfica de ventas. " +
                    "Agrega quantity y revenue por día. Rangos: 7d, 30d, all."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Serie temporal calculada exitosamente",
                    content = @Content(schema = @Schema(implementation = SalesChartPointDto.class))
            )
    })
    @GetMapping("/sales-chart")
    public ResponseEntity<ApiResponse<List<SalesChartPointDto>>> getSalesChart(
            @Parameter(description = "Rango de tiempo: 7d, 30d, o all", example = "7d")
            @RequestParam(defaultValue = "7d") String range) {
        List<SalesChartPointDto> chart = orderService.getSalesChart(range);
        return ResponseEntity.ok(ApiResponse.success(chart));
    }

    @Operation(
            summary = "Métricas por evento",
            description = "Retorna métricas analíticas agrupadas por evento: " +
                    "órdenes confirmadas, tickets vendidos y revenue total por evento. " +
                    "Ordenado por revenue descendente."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Métricas por evento calculadas exitosamente",
                    content = @Content(schema = @Schema(implementation = EventAnalyticsDto.class))
            )
    })
    @GetMapping("/by-event")
    public ResponseEntity<ApiResponse<List<EventAnalyticsDto>>> getEventsAnalytics() {
        List<EventAnalyticsDto> analytics = orderService.getEventsAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
