package com.vento.event.service;

import com.vento.common.dto.event.CreateEventRequest;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.event.EventDto;
import com.vento.common.dto.event.UpdateEventRequest;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.event.model.Event;
import com.vento.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;

    @Transactional
    public EventDto createEvent(CreateEventRequest request) {
        log.info("Creando nuevo evento: {}", request.getName());

        Event event = Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .venue(request.getVenue())
                .totalCapacity(request.getTotalCapacity())
                .availableTickets(request.getTotalCapacity())
                .price(request.getPrice())
                .build();

        Event savedEvent = eventRepository.save(event);
        log.info("Evento creado con ID: {}", savedEvent.getId());

        return mapToDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public Optional<EventDto> getEventById(UUID id) {
        log.info("Obteniendo evento por ID: {}", id);
        return eventRepository.findById(id)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<EventDto> listEvents(Pageable pageable) {
        log.info("Listando eventos - Página: {}, Tamaño: {}",
                pageable.getPageNumber(), pageable.getPageSize());
        return eventRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Transactional
    public Optional<EventDto> updateEvent(UUID id, UpdateEventRequest request) {
        log.info("Actualizando evento ID: {}", id);

        return eventRepository.findById(id)
                .map(event -> {
                    if (request.getDescription() != null) {
                        event.setDescription(request.getDescription());
                    }
                    if (request.getEventDate() != null) {
                        event.setEventDate(request.getEventDate());
                    }
                    if (request.getVenue() != null) {
                        event.setVenue(request.getVenue());
                    }
                    if (request.getTotalCapacity() != null) {
                        int diferencia = request.getTotalCapacity() - event.getTotalCapacity();
                        event.setTotalCapacity(request.getTotalCapacity());
                        event.setAvailableTickets(event.getAvailableTickets() + diferencia);
                    }
                    if (request.getPrice() != null) {
                        event.setPrice(request.getPrice());
                    }

                    Event updatedEvent = eventRepository.save(event);
                    log.info("Evento actualizado: {}", updatedEvent.getId());
                    return mapToDto(updatedEvent);
                });
    }

    @Transactional(readOnly = true)
    public EventAvailabilityDto getEventAvailability(UUID eventId) {
        log.info("Obteniendo disponibilidad del evento: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", eventId));
        return EventAvailabilityDto.builder()
                .availableTickets(event.getAvailableTickets())
                .price(event.getPrice())
                .build();
    }

    @Transactional
    public void decrementAvailableTickets(UUID eventId, int quantity) {
        log.info("Descontando {} tickets para el evento: {}", quantity, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", eventId));

        if (event.getAvailableTickets() < quantity) {
            log.error("No hay suficientes tickets. Disponibles: {}, Solicitados: {}",
                    event.getAvailableTickets(), quantity);
            throw new BusinessException(
                    "No hay suficientes tickets disponibles. Disponibles: " + event.getAvailableTickets() +
                            ", Solicitados: " + quantity);
        }

        event.setAvailableTickets(event.getAvailableTickets() - quantity);
        eventRepository.save(event);
        log.info("Tickets descontados exitosamente. Nuevos disponibles: {}", event.getAvailableTickets());
    }

    private EventDto mapToDto(Event event) {
        return EventDto.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .venue(event.getVenue())
                .totalCapacity(event.getTotalCapacity())
                .availableTickets(event.getAvailableTickets())
                .price(event.getPrice())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}

