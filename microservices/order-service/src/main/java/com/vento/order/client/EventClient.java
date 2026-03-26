package com.vento.order.client;

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
     * Obtiene la cantidad de tickets disponibles para un evento.
     *
     * @param eventId ID del evento
     * @return Cantidad de tickets disponibles
     */
    @GetMapping("/api/events/{eventId}/available-tickets")
    Integer getAvailableTickets(@PathVariable("eventId") UUID eventId);

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
