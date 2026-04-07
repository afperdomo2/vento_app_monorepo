package com.vento.order.service;

import com.vento.common.dto.kafka.PaymentFailedEvent;
import com.vento.common.dto.kafka.PaymentProcessedEvent;
import com.vento.common.enums.OrderStatus;
import com.vento.order.infrastructure.kafka.listener.PaymentResultListener;
import com.vento.order.core.model.Order;
import com.vento.order.core.service.ReservationService;
import com.vento.order.core.service.TicketInventoryService;
import com.vento.order.infrastructure.persistence.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentResultListener Idempotency Tests")
class PaymentResultListenerIdempotencyTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ReservationService reservationService;

    @Mock
    private TicketInventoryService ticketInventoryService;

    @Mock
    private org.springframework.kafka.core.KafkaTemplate<String, Object> orderKafkaTemplate;

    @InjectMocks
    private PaymentResultListener listener;

    private UUID orderId;
    private UUID eventId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        eventId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("shouldIgnoreDuplicatePaymentProcessedEvent")
    void shouldIgnoreDuplicatePaymentProcessedEvent() {
        // Given
        PaymentProcessedEvent event = new PaymentProcessedEvent(
                orderId,
                UUID.randomUUID().toString(),
                new BigDecimal("150.00")
        );

        Order order = Order.builder()
                .id(orderId)
                .eventId(eventId)
                .userId(userId)
                .quantity(2)
                .totalAmount(new BigDecimal("150.00"))
                .status(OrderStatus.CONFIRMED) // Ya confirmada
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // When
        listener.handlePaymentProcessed(event);

        // Then
        verify(orderRepository).findById(orderId);
        verify(orderRepository, never()).save(any());
        verify(reservationService, never()).removeReservation(any());
        verify(orderKafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    @DisplayName("shouldIgnoreDuplicatePaymentFailedEvent")
    void shouldIgnoreDuplicatePaymentFailedEvent() {
        // Given
        PaymentFailedEvent event = new PaymentFailedEvent(
                orderId,
                "Insufficient funds"
        );

        Order order = Order.builder()
                .id(orderId)
                .eventId(eventId)
                .userId(userId)
                .quantity(2)
                .totalAmount(new BigDecimal("150.00"))
                .status(OrderStatus.CANCELLED) // Ya cancelada
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // When
        listener.handlePaymentFailed(event);

        // Then
        verify(orderRepository).findById(orderId);
        verify(orderRepository, never()).save(any());
        verify(ticketInventoryService, never()).releaseTickets(any(), anyInt());
        verify(reservationService, never()).removeReservation(any());
        verify(orderKafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    @DisplayName("shouldProcessPaymentProcessedEventWhenOrderIsPending")
    void shouldProcessPaymentProcessedEventWhenOrderIsPending() {
        // Given
        PaymentProcessedEvent event = new PaymentProcessedEvent(
                orderId,
                UUID.randomUUID().toString(),
                new BigDecimal("150.00")
        );

        Order order = Order.builder()
                .id(orderId)
                .eventId(eventId)
                .userId(userId)
                .quantity(2)
                .totalAmount(new BigDecimal("150.00"))
                .status(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        // When
        listener.handlePaymentProcessed(event);

        // Then
        verify(orderRepository).findById(orderId);
        verify(orderRepository).save(order);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(reservationService).removeReservation(orderId);
        verify(orderKafkaTemplate).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("shouldProcessPaymentFailedEventWhenOrderIsPending")
    void shouldProcessPaymentFailedEventWhenOrderIsPending() {
        // Given
        PaymentFailedEvent event = new PaymentFailedEvent(
                orderId,
                "Insufficient funds"
        );

        Order order = Order.builder()
                .id(orderId)
                .eventId(eventId)
                .userId(userId)
                .quantity(2)
                .totalAmount(new BigDecimal("150.00"))
                .status(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        // When
        listener.handlePaymentFailed(event);

        // Then
        verify(orderRepository).findById(orderId);
        verify(orderRepository).save(order);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(ticketInventoryService).releaseTickets(eventId, 2);
        verify(reservationService).removeReservation(orderId);
        verify(orderKafkaTemplate).send(anyString(), anyString(), any());
    }
}
