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
 * Permite al Order Service verificar disponibilidad y sincronizar el conteo
 * de tickets disponibles en la base de datos del event-service.
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
     * Descuenta tickets en la base de datos del event-service.
     * Se llama después de que Redis ya confirmó la reserva atómica.
     *
     * @param eventId  ID del evento
     * @param quantity Cantidad de tickets a descontar
     */
    @PutMapping("/api/events/{eventId}/tickets")
    void decrementAvailableTickets(
            @PathVariable("eventId") UUID eventId,
            @RequestParam("quantity") int quantity
    );

    /**
     * Libera tickets en la base de datos del event-service.
     * Se llama al cancelar o expirar una orden.
     *
     * @param eventId  ID del evento
     * @param quantity Cantidad de tickets a liberar
     */
    @PutMapping("/api/events/{eventId}/tickets/release")
    void releaseAvailableTickets(
            @PathVariable("eventId") UUID eventId,
            @RequestParam("quantity") int quantity
    );
}
