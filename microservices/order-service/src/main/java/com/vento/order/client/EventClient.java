package com.vento.order.client;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.EventAvailabilityDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

/**
 * Cliente Feign para comunicar con el Event Service.
 * <p>
 * Permite al Order Service verificar y descontar tickets disponibles
 * al crear una reserva.
 */
@FeignClient(name = "event-service", url = "${event.service.url}")
public interface EventClient {

    /**
     * Obtiene la disponibilidad de un evento (tickets disponibles y precio).
     *
     * @param eventId ID del evento
     * @return Respuesta con información de disponibilidad del evento
     */
    @GetMapping("/api/events/{eventId}/availability")
    ApiResponse<EventAvailabilityDto> getEventAvailability(@PathVariable("eventId") UUID eventId);

    /**
     * Descuenta la cantidad de tickets disponibles para un evento.
     *
     * @param eventId  ID del evento
     * @param quantity Cantidad de tickets a descontar
     */
    @PutMapping("/api/events/{eventId}/tickets")
    void decrementAvailableTickets(
            @PathVariable("eventId") UUID eventId,
            @RequestParam("quantity") int quantity
    );
}
