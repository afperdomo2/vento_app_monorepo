package com.vento.event.service;

import com.vento.common.dto.event.CreateEventRequest;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.event.EventDto;
import com.vento.common.dto.event.UpdateEventRequest;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.event.core.model.Event;
import com.vento.event.infrastructure.persistence.repository.EventRepository;
import com.vento.event.infrastructure.kafka.producer.EventPublisher;
import com.vento.event.core.service.InventoryService;
import com.vento.event.core.service.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("EventService Tests")
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private EventService eventService;

    private UUID eventId;
    private Event event;
    private CreateEventRequest createRequest;
    private UpdateEventRequest updateRequest;

    @BeforeEach
    void setUp() {
        reset(eventRepository);
        eventId = UUID.randomUUID();
        LocalDateTime eventDate = LocalDateTime.of(2026, 12, 25, 20, 0);
        LocalDateTime now = LocalDateTime.now();

        event = Event.builder()
                .name("Concierto de Rock")
                .description("Gran concierto de rock")
                .eventDate(eventDate)
                .venue("Estadio Nacional")
                .totalCapacity(1000)
                .availableTickets(1000)
                .price(BigDecimal.valueOf(50.00))
                .build();
        event.setId(eventId);
        event.setCreatedAt(now);
        event.setUpdatedAt(now);

        createRequest = new CreateEventRequest(
                "Concierto de Rock",
                "Gran concierto de rock",
                eventDate,
                "Estadio Nacional",
                1000,
                BigDecimal.valueOf(50.00)
        );

        updateRequest = new UpdateEventRequest();
        updateRequest.setName("Concierto de Rock Actualizado");
    }

    @Test
    @DisplayName("Should create event successfully")
    void createEvent_ShouldReturnEventDto() {
        // Given
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        EventDto result = eventService.createEvent(createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Concierto de Rock");
        assertThat(result.getAvailableTickets()).isEqualTo(1000);
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    @DisplayName("Should get event by ID successfully")
    void getEventById_ShouldReturnEventDto() {
        // Given
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // When
        Optional<EventDto> result = eventService.getEventById(eventId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Concierto de Rock");
        assertThat(result.get().getId()).isEqualTo(eventId);
    }

    @Test
    @DisplayName("Should get event availability successfully")
    void getEventAvailability_ShouldReturnEventAvailabilityDto() {
        // Given
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // When
        EventAvailabilityDto result = eventService.getEventAvailability(eventId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAvailableTickets()).isEqualTo(1000);
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
    }

    @Test
    @DisplayName("Should decrement available tickets successfully")
    void decrementAvailableTickets_ShouldUpdateTickets() {
        // Given
        int quantityToDecrement = 100;
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        eventService.decrementAvailableTickets(eventId, quantityToDecrement);

        // Then
        verify(eventRepository).save(any(Event.class));
        assertThat(event.getAvailableTickets()).isEqualTo(900);
    }

    @Test
    @DisplayName("Should throw BusinessException when not enough tickets")
    void decrementAvailableTickets_ShouldThrowException_WhenNotEnoughTickets() {
        // Given
        int quantityToDecrement = 1500;
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // When & Then
        assertThatThrownBy(() -> eventService.decrementAvailableTickets(eventId, quantityToDecrement))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hay suficientes tickets disponibles");
    }

    @Test
    @DisplayName("Should update event successfully")
    void updateEvent_ShouldReturnUpdatedEvent() {
        // Given
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Optional<EventDto> result = eventService.updateEvent(eventId, updateRequest);

        // Then
        assertThat(result).isPresent();
        verify(eventRepository).save(any(Event.class));
    }
}
