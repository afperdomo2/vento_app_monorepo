package com.vento.event.controller;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.TicketDto;
import com.vento.event.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tickets", description = "Gestión de tickets de eventos")
public class TicketController {

    private final TicketService ticketService;

    @Operation(summary = "Obtener tickets por orden", description = "Devuelve todos los tickets asociados a una orden específica")
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getTicketsByOrder(
            @Parameter(description = "ID de la orden") @PathVariable UUID orderId) {
        log.info("📋 Obteniendo tickets para la orden: {}", orderId);
        List<TicketDto> tickets = ticketService.getTicketsByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success("Tickets obtenados exitosamente", tickets));
    }

    @Operation(summary = "Obtener mis tickets", description = "Devuelve todos los tickets del usuario autenticado")
    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getMyTickets(
            @RequestHeader("X-User-Id") String userIdHeader) {
        UUID userId = UUID.fromString(userIdHeader);
        log.info("📋 Obteniendo tickets para el usuario: {}", userId);
        List<TicketDto> tickets = ticketService.getTicketsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Tickets obtenados exitosamente", tickets));
    }
}
