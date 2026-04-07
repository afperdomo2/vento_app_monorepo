package com.vento.order.service;

import com.vento.common.exception.InsufficientTicketsException;
import com.vento.order.core.service.TicketInventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketInventoryService Tests")
class TicketInventoryServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private TicketInventoryService ticketInventoryService;

    private UUID eventId;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        ReflectionTestUtils.setField(ticketInventoryService, "keyPrefix", "vento:");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Nested
    @DisplayName("reserveTickets - DECRBY atómico")
    class ReserveTickets {

        @Test
        @DisplayName("Reserva tickets exitosamente cuando hay suficientes disponibles")
        void shouldReserveTickets_WhenSufficient() {
            // Given — DECRBY retorna 48 (quedaron 48 después de reservar 2)
            when(valueOps.decrement(anyString(), anyLong())).thenReturn(48L);

            // When — no debe lanzar excepción
            ticketInventoryService.reserveTickets(eventId, 2);

            // Then
            String expectedKey = "vento:event:" + eventId + ":available_tickets";
            verify(valueOps).decrement(expectedKey, 2L);
        }

        @Test
        @DisplayName("Reserva el último ticket disponible (resultado = 0)")
        void shouldReserveLastTicket_WhenResultIsZero() {
            // Given — DECRBY retorna 0 (exactamente el último ticket)
            when(valueOps.decrement(anyString(), anyLong())).thenReturn(0L);

            // When — no debe lanzar excepción
            ticketInventoryService.reserveTickets(eventId, 1);

            // Then
            verify(valueOps).decrement(anyString(), anyLong());
        }

        @Test
        @DisplayName("Lanza InsufficientTicketsException y revierte cuando resultado < 0 (sobreventa)")
        void shouldThrowAndRollback_WhenResultNegative() {
            // Given — DECRBY retorna -1 (sobreventa detectada)
            when(valueOps.decrement(anyString(), anyLong())).thenReturn(-1L);
            when(valueOps.increment(anyString(), anyLong())).thenReturn(0L); // rollback

            // When & Then
            assertThatThrownBy(() -> ticketInventoryService.reserveTickets(eventId, 1))
                    .isInstanceOf(InsufficientTicketsException.class)
                    .hasMessageContaining("No hay suficientes tickets disponibles");

            // Verificar que se hizo rollback (INCRBY para revertir)
            verify(valueOps).increment(anyString(), anyLong());
        }

        @Test
        @DisplayName("Lanza InsufficientTicketsException cuando la key no existe en Redis (null)")
        void shouldThrowException_WhenKeyNotFound() {
            // Given — Redis retorna null (key no existe)
            when(valueOps.decrement(anyString(), anyLong())).thenReturn(null);

            // When & Then
            assertThatThrownBy(() -> ticketInventoryService.reserveTickets(eventId, 1))
                    .isInstanceOf(InsufficientTicketsException.class);
        }

        @Test
        @DisplayName("Usa la key correcta con prefijo configurado")
        void shouldUseCorrectRedisKey() {
            // Given
            when(valueOps.decrement(anyString(), anyLong())).thenReturn(10L);

            // When
            ticketInventoryService.reserveTickets(eventId, 5);

            // Then — verificar el formato exacto de la key
            String expectedKey = "vento:event:" + eventId + ":available_tickets";
            verify(valueOps).decrement(expectedKey, 5L);
        }
    }

    @Nested
    @DisplayName("releaseTickets - INCRBY atómico")
    class ReleaseTickets {

        @Test
        @DisplayName("Libera tickets correctamente usando INCRBY")
        void shouldReleaseTickets() {
            // Given
            when(valueOps.increment(anyString(), anyLong())).thenReturn(52L);

            // When
            ticketInventoryService.releaseTickets(eventId, 2);

            // Then
            String expectedKey = "vento:event:" + eventId + ":available_tickets";
            verify(valueOps).increment(expectedKey, 2L);
        }
    }
}
