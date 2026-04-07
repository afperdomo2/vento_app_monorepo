package com.vento.common.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request para búsqueda avanzada de eventos")
public class EventSearchRequest {

    @Schema(description = "Texto libre para buscar por nombre, descripción o lugar", example = "concierto rock")
    private String q;

    @Schema(description = "Precio mínimo", example = "10.00")
    private BigDecimal minPrice;

    @Schema(description = "Precio máximo", example = "100.00")
    private BigDecimal maxPrice;

    @Schema(description = "Fecha desde", example = "2026-05-01T00:00:00")
    private LocalDateTime fromDate;

    @Schema(description = "Fecha hasta", example = "2026-12-31T23:59:59")
    private LocalDateTime toDate;

    @Schema(description = "Solo mostrar eventos con tickets disponibles", example = "true")
    private Boolean onlyAvailable;

    @Schema(description = "Página (0-based)", example = "0")
    private Integer page;

    @Schema(description = "Tamaño de página", example = "10")
    private Integer size;

    public Pageable toPageable() {
        return PageRequest.of(page != null ? page : 0, size != null ? size : 10);
    }
}
