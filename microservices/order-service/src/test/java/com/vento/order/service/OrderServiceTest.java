package com.vento.order.service;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.dto.order.OrderStatus;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.InsufficientTicketsException;
import com.vento.order.client.EventClient;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Tests")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EventClient eventClient;

    @Mock
    private TicketInventoryService ticketInventoryService;

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private OrderService orderService;

    private UUID orderId;
    private UUID userId;
    private UUID eventId;
    private EventAvailabilityDto eventAvailability;
    private CreateOrderRequest createOrderRequest;
    private Order order;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        userId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        ReflectionTestUtils.setField(orderService, "maxRetries", 3);

        eventAvailability = EventAvailabilityDto.builder()
                .availableTickets(100)
                .price(BigDecimal.valueOf(50.00))
                .build();

        createOrderRequest = new CreateOrderRequest(
                eventId,
                2
        );

        order = Order.builder()
                .id(orderId)
                .userId(userId)
                .eventId(eventId)
                .quantity(2)
                .totalAmount(BigDecimal.valueOf(100.00))
                .status(OrderStatus.PENDING)
                .build();
    }

    // =========================================================================
    // createOrder
    // =========================================================================

    @Nested
    @DisplayName("createOrder")
    class CreateOrder {

        @Test
        @DisplayName("Crea orden exitosamente cuando Redis tiene tickets disponibles")
        void shouldCreateOrder_WhenTicketsAvailable() {
            // Given
            when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(eventAvailability));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(orderId);
                return o;
            });

            // When
            OrderDto result = orderService.createOrder(createOrderRequest, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(userId);
            assertThat(result.getEventId()).isEqualTo(eventId);
            assertThat(result.getQuantity()).isEqualTo(2);
            assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
            assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
            verify(ticketInventoryService).reserveTickets(eq(eventId), eq(2));
            verify(reservationService).createReservation(any(UUID.class));
            verify(eventClient).decrementAvailableTickets(eq(eventId), eq(2));
        }

        @Test
        @DisplayName("Calcula totalAmount correctamente como precio × cantidad")
        void shouldCalculateTotalAmount() {
            // Given
            EventAvailabilityDto availability = EventAvailabilityDto.builder()
                    .availableTickets(50)
                    .price(BigDecimal.valueOf(75.50))
                    .build();
            CreateOrderRequest request = new CreateOrderRequest(eventId, 3);
            when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(availability));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(orderId);
                return o;
            });

            // When
            OrderDto result = orderService.createOrder(request, userId);

            // Then
            BigDecimal expectedTotal = BigDecimal.valueOf(75.50).multiply(BigDecimal.valueOf(3));
            assertThat(result.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }

        @Test
        @DisplayName("Lanza InsufficientTicketsException cuando Redis no tiene tickets suficientes")
        void shouldThrowInsufficientTicketsException_WhenRedisRejectsReservation() {
            // Given
            when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(eventAvailability));
            doThrow(new InsufficientTicketsException(0, 2))
                    .when(ticketInventoryService).reserveTickets(eq(eventId), eq(2));

            // When & Then
            assertThatThrownBy(() -> orderService.createOrder(createOrderRequest, userId))
                    .isInstanceOf(InsufficientTicketsException.class)
                    .hasMessageContaining("No hay suficientes tickets disponibles");
            verify(orderRepository, never()).save(any(Order.class));
            verify(reservationService, never()).createReservation(any(UUID.class));
            verify(eventClient, never()).decrementAvailableTickets(any(), anyInt());
        }
    }

    // =========================================================================
    // cancelOrder
    // =========================================================================

    @Nested
    @DisplayName("cancelOrder")
    class CancelOrder {

        @Test
        @DisplayName("Cancela orden PENDING y libera tickets en Redis")
        void shouldCancelPendingOrder_AndReleaseTickets() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            Optional<OrderDto> result = orderService.cancelOrder(orderId, userId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(OrderStatus.CANCELLED);
            verify(ticketInventoryService).releaseTickets(eq(eventId), eq(2));
            verify(reservationService).removeReservation(eq(orderId));
        }

        @Test
        @DisplayName("Lanza BusinessException al cancelar orden no PENDING")
        void shouldThrowException_WhenCancellingNonPendingOrder() {
            // Given
            Order confirmedOrder = Order.builder()
                    .id(orderId).userId(userId).eventId(eventId)
                    .quantity(2).totalAmount(BigDecimal.valueOf(100.00))
                    .status(OrderStatus.CONFIRMED).build();
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(confirmedOrder));

            // When & Then
            assertThatThrownBy(() -> orderService.cancelOrder(orderId, userId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Solo se pueden cancelar pedidos en estado PENDING");
            verify(ticketInventoryService, never()).releaseTickets(any(), anyInt());
        }

        @Test
        @DisplayName("Retorna vacío si la orden no existe")
        void shouldReturnEmpty_WhenOrderNotFound() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            // When
            Optional<OrderDto> result = orderService.cancelOrder(orderId, userId);

            // Then
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // confirmOrder
    // =========================================================================

    @Nested
    @DisplayName("confirmOrder")
    class ConfirmOrder {

        @Test
        @DisplayName("Confirma orden PENDING y elimina reserva temporal")
        void shouldConfirmPendingOrder_AndRemoveReservation() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            Optional<OrderDto> result = orderService.confirmOrder(orderId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(OrderStatus.CONFIRMED);
            verify(reservationService).removeReservation(eq(orderId));
        }

        @Test
        @DisplayName("Lanza BusinessException al confirmar orden no PENDING")
        void shouldThrowException_WhenConfirmingNonPendingOrder() {
            // Given
            Order cancelledOrder = Order.builder()
                    .id(orderId).userId(userId).eventId(eventId)
                    .quantity(2).totalAmount(BigDecimal.valueOf(100.00))
                    .status(OrderStatus.CANCELLED).build();
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(cancelledOrder));

            // When & Then
            assertThatThrownBy(() -> orderService.confirmOrder(orderId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Solo se pueden confirmar pedidos en estado PENDING");
        }
    }

    // =========================================================================
    // Tests de concurrencia (TicketInventoryService)
    // =========================================================================

    @Nested
    @DisplayName("Concurrencia - TicketInventoryService")
    class ConcurrencyTests {

        /**
         * Simula 100 requests concurrentes para 50 tickets.
         * Exactamente 50 deben tener éxito (Redis DECRBY atómico).
         * <p>
         * Nota: este es un test unitario que simula el comportamiento esperado
         * de la lógica de rechazo cuando Redis devuelve negativo.
         */
        @Test
        @DisplayName("100 requests concurrentes para 50 tickets → exactamente 50 succeed")
        void concurrentReservations_ExactlyHalfShouldSucceed() throws InterruptedException {
            int totalTickets = 50;
            int totalRequests = 100;
            AtomicInteger ticketCounter = new AtomicInteger(totalTickets);
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger failureCount = new AtomicInteger(0);

            // Simular el comportamiento de DECRBY atómico en Redis
            // Cada llamada a reserveTickets decrementa el contador o lanza excepción
            org.mockito.Mockito.doAnswer(inv -> {
                int remaining = ticketCounter.decrementAndGet();
                if (remaining < 0) {
                    ticketCounter.incrementAndGet(); // rollback
                    throw new InsufficientTicketsException(0, 1);
                }
                return null;
            }).when(ticketInventoryService).reserveTickets(any(UUID.class), eq(1));

            when(eventClient.getEventAvailability(any(UUID.class)))
                    .thenReturn(ApiResponse.success(EventAvailabilityDto.builder()
                            .availableTickets(totalTickets)
                            .price(BigDecimal.ONE)
                            .build()));
            when(orderRepository.save(any(Order.class)))
                    .thenAnswer(inv -> {
                        Order o = inv.getArgument(0);
                        o.setId(UUID.randomUUID());
                        return o;
                    });

            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(totalRequests);
            ExecutorService executor = Executors.newFixedThreadPool(totalRequests);

            for (int i = 0; i < totalRequests; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        CreateOrderRequest req = new CreateOrderRequest(eventId, 1);
                        orderService.createOrder(req, UUID.randomUUID());
                        successCount.incrementAndGet();
                    } catch (InsufficientTicketsException e) {
                        failureCount.incrementAndGet();
                    } catch (Exception e) {
                        // Otros errores se ignoran en este test
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown(); // Todos arrancan al mismo tiempo
            doneLatch.await();
            executor.shutdown();

            assertThat(successCount.get()).isEqualTo(totalTickets);
            assertThat(failureCount.get()).isEqualTo(totalRequests - totalTickets);
            assertThat(ticketCounter.get()).isEqualTo(0);
        }
    }

    // Helper para usar en lambdas — Mockito no lo tiene directamente en esta versión
    private static int anyInt() {
        return org.mockito.ArgumentMatchers.anyInt();
    }
}
