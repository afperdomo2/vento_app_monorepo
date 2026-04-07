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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final InventoryService inventoryService;
    private final EventPublisher eventPublisher;

    @Transactional
    public EventDto createEvent(CreateEventRequest request) {
        log.info("✅ Creando nuevo evento: {}", request.getName());

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
        log.info("✅ Evento creado con ID: {}", savedEvent.getId());

        inventoryService.initializeInventory(savedEvent.getId(), savedEvent.getAvailableTickets());
        
        // Publicar evento a Kafka para sincronización con Elasticsearch
        eventPublisher.publishEventCreated(savedEvent);

        return mapToDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public Optional<EventDto> getEventById(UUID id) {
        log.info("✅ Obteniendo evento por ID: {}", id);
        return eventRepository.findById(id)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<EventDto> listEvents(String searchTerm, Pageable pageable) {
        log.info("✅ Listando eventos - Página: {}, Tamaño: {}, Búsqueda: {}",
                pageable.getPageNumber(), pageable.getPageSize(), searchTerm != null ? searchTerm : "sin filtro");
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return eventRepository.searchEvents(searchTerm.trim(), pageable)
                    .map(this::mapToDto);
        }
        
        return eventRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    /**
     * Obtiene eventos destacados: eventos futuros con tickets disponibles,
     * ordenados por fecha (más próximos primero).
     *
     * @param limit cantidad máxima de eventos a retornar (mínimo 6, máximo 20)
     * @return lista de eventos destacados
     */
    @Transactional(readOnly = true)
    public List<EventDto> getFeaturedEvents(int limit) {
        // Validar límites: mínimo 6, máximo 20
        int effectiveLimit = Math.max(6, Math.min(20, limit));
        log.info("✅ Obteniendo eventos destacados - Límite: {}", effectiveLimit);

        LocalDateTime now = LocalDateTime.now();
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        return eventRepository.findFeaturedEvents(now, pageable)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public Optional<EventDto> updateEvent(UUID id, UpdateEventRequest request) {
        log.info("✅ Actualizando evento ID: {}", id);

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
                        inventoryService.adjustInventory(event.getId(), diferencia);
                    }
                    if (request.getPrice() != null) {
                        event.setPrice(request.getPrice());
                    }

                    Event updatedEvent = eventRepository.save(event);
                    log.info("✅ Evento actualizado: {}", updatedEvent.getId());
                    
                    // Publicar evento a Kafka para sincronización con Elasticsearch
                    eventPublisher.publishEventUpdated(updatedEvent);
                    
                    return mapToDto(updatedEvent);
                });
    }

    @Transactional(readOnly = true)
    public EventAvailabilityDto getEventAvailability(UUID eventId) {
        log.info("✅ Obteniendo disponibilidad del evento: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", eventId));
        return EventAvailabilityDto.builder()
                .availableTickets(event.getAvailableTickets())
                .price(event.getPrice())
                .build();
    }

    @Transactional
    public void decrementAvailableTickets(UUID eventId, int quantity) {
        log.info("✅ Descontando {} tickets en DB para el evento: {}", quantity, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", eventId));

        if (event.getAvailableTickets() < quantity) {
            log.error("❌ No hay suficientes tickets. Disponibles: {}, Solicitados: {}",
                    event.getAvailableTickets(), quantity);
            throw new BusinessException(
                    "No hay suficientes tickets disponibles. Disponibles: " + event.getAvailableTickets() +
                            ", Solicitados: " + quantity);
        }

        event.setAvailableTickets(event.getAvailableTickets() - quantity);
        eventRepository.save(event);
        log.info("✅ Tickets descontados en DB. Nuevos disponibles: {}", event.getAvailableTickets());
    }

    @Transactional
    public void incrementAvailableTickets(UUID eventId, int quantity) {
        log.info("✅ Incrementando {} tickets en DB para el evento: {}", quantity, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", eventId));

        event.setAvailableTickets(event.getAvailableTickets() + quantity);
        eventRepository.save(event);
        log.info("✅ Tickets incrementados en DB. Nuevos disponibles: {}", event.getAvailableTickets());
    }

    @Transactional
    public boolean deleteEvent(UUID id) {
        return eventRepository.findById(id)
                .map(event -> {
                    // Publicar evento a Kafka antes de eliminar (para que ES pueda eliminar el documento)
                    eventPublisher.publishEventDeleted(event);
                    
                    eventRepository.delete(event);
                    inventoryService.removeInventory(id);
                    log.info("✅ Evento eliminado: {}", id);
                    return true;
                })
                .orElse(false);
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

