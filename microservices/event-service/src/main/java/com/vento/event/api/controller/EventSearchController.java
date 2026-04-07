package com.vento.event.api.controller;

import com.vento.common.dto.event.EventDto;
import com.vento.common.dto.event.EventSearchRequest;
import com.vento.event.core.service.EventSearchService;
import com.vento.event.core.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para búsqueda avanzada de eventos usando Elasticsearch.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Event Search", description = "Endpoints para búsqueda avanzada de eventos")
public class EventSearchController {

    private final EventSearchService searchService;
    private final EventService eventService;

    @GetMapping("/search")
    @Operation(summary = "Búsqueda de texto libre", description = "Busca eventos por nombre, descripción o lugar con tolerancia a errores.")
    public ResponseEntity<Page<EventDto>> searchByText(
            @Parameter(description = "Texto a buscar") @RequestParam(required = false, defaultValue = "") String q,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<EventDto> result = searchService.searchByText(q, pageable)
                .map(eventService::mapToDto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/search/advanced")
    @Operation(summary = "Búsqueda avanzada con filtros", description = "Busca eventos con filtros de precio, fecha y disponibilidad.")
    public ResponseEntity<Page<EventDto>> searchAdvanced(
            @ModelAttribute EventSearchRequest request,
            @PageableDefault(size = 10) Pageable pageable) {
        
        // Si no se pasan filtros, delegar a searchByText para consistencia
        if (request.getQ() != null && !request.getQ().isBlank()) {
            return searchByText(request.getQ(), pageable);
        }

        Page<EventDto> result = searchService.searchAdvanced(request)
                .map(eventService::mapToDto);
        return ResponseEntity.ok(result);
    }
}
