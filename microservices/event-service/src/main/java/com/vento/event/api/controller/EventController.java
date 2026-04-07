package com.vento.event.api.controller;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.CreateEventRequest;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.event.EventDto;
import com.vento.common.dto.event.UpdateEventRequest;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.event.core.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Eventos", description = "API para gestión de eventos")
public class EventController {

    private final EventService eventService;

    @Operation(summary = "Crear un nuevo evento", description = "Crea un nuevo evento con los datos proporcionados")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Evento creado exitosamente",
                    content = @Content(schema = @Schema(implementation = EventDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<ApiResponse<EventDto>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        EventDto event = eventService.createEvent(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evento creado exitosamente", event));
    }

    @Operation(summary = "Obtener evento por ID", description = "Retorna los detalles de un evento específico")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Evento encontrado",
                    content = @Content(schema = @Schema(implementation = EventDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDto>> getEventById(
            @Parameter(description = "ID del evento") @PathVariable UUID id) {
        EventDto event = eventService.getEventById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", id));
        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @Operation(summary = "Listar eventos", description = "Retorna una lista paginada de eventos")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Lista de eventos"
            )
    })
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventDto>>> listEvents(
            @Parameter(description = "Número de página (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo de ordenamiento")
            @RequestParam(defaultValue = "eventDate") String sortBy,
            @Parameter(description = "Dirección de ordenamiento")
            @RequestParam(defaultValue = "ASC") String sortDir,
            @Parameter(description = "Término de búsqueda (nombre, descripción o ubicación)")
            @RequestParam(required = false) String search) {

        Sort sort = sortDir.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        Page<EventDto> events = eventService.listEvents(search, pageRequest);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @Operation(
            summary = "Obtener eventos destacados",
            description = "Retorna una lista de eventos destacados: eventos futuros con tickets disponibles, " +
                    "ordenados por fecha (más próximos primero). " +
                    "El límite por defecto es 6 eventos, mínimo 6 y máximo 20."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Lista de eventos destacados obtenida exitosamente",
                    content = @Content(schema = @Schema(implementation = EventDto.class))
            )
    })
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<EventDto>>> getFeaturedEvents(
            @Parameter(description = "Cantidad máxima de eventos a retornar (mínimo 6, máximo 20, por defecto 6)")
            @RequestParam(required = false, defaultValue = "6") int limit) {

        List<EventDto> events = eventService.getFeaturedEvents(limit);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @Operation(summary = "Actualizar evento", description = "Actualiza los datos de un evento existente")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Evento actualizado exitosamente",
                    content = @Content(schema = @Schema(implementation = EventDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDto>> updateEvent(
            @Parameter(description = "ID del evento") @PathVariable UUID id,
            @Valid @RequestBody UpdateEventRequest request) {
        EventDto event = eventService.updateEvent(id, request)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", id));
        return ResponseEntity.ok(ApiResponse.success("Evento actualizado exitosamente", event));
    }

    @Operation(summary = "Obtener disponibilidad del evento", description = "Retorna la cantidad de tickets disponibles y el precio de un evento")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Disponibilidad obtenida exitosamente",
                    content = @Content(schema = @Schema(implementation = EventAvailabilityDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            )
    })
    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<EventAvailabilityDto>> getEventAvailability(
            @Parameter(description = "ID del evento") @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventAvailability(id)));
    }

    @Operation(summary = "Descontar tickets", description = "Desconta la cantidad de tickets disponibles para un evento (usado al crear una reserva)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tickets descontados exitosamente"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "No hay suficientes tickets disponibles"
            )
    })
    @PutMapping("/{id}/tickets")
    public ResponseEntity<Void> decrementAvailableTickets(
            @Parameter(description = "ID del evento") @PathVariable UUID id,
            @Parameter(description = "Cantidad de tickets a descontar") @RequestParam int quantity) {
        eventService.decrementAvailableTickets(id, quantity);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Liberar tickets", description = "Incrementa la cantidad de tickets disponibles (usado al cancelar o expirar una reserva)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tickets liberados exitosamente"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            )
    })
    @PutMapping("/{id}/tickets/release")
    public ResponseEntity<Void> releaseTickets(
            @Parameter(description = "ID del evento") @PathVariable UUID id,
            @Parameter(description = "Cantidad de tickets a liberar") @RequestParam int quantity) {
        eventService.incrementAvailableTickets(id, quantity);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Eliminar evento", description = "Elimina un evento y limpia su inventario en Redis")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "204",
                    description = "Evento eliminado exitosamente"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Evento no encontrado"
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "ID del evento") @PathVariable UUID id) {
        boolean deleted = eventService.deleteEvent(id);
        if (!deleted) {
            throw new ResourceNotFoundException("Evento", id);
        }
        return ResponseEntity.noContent().build();
    }
}

