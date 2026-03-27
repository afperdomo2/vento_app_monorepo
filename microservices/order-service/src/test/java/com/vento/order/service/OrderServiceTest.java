package com.vento.order.service;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.dto.order.OrderStatus;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.order.client.EventClient;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

        eventAvailability = EventAvailabilityDto.builder()
                .availableTickets(100)
                .price(BigDecimal.valueOf(50.00))
                .build();

        createOrderRequest = new CreateOrderRequest(
                userId,
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

    @Test
    @DisplayName("Should create order successfully when tickets are available")
    void createOrder_ShouldReturnOrderDto_WhenTicketsAvailable() {
        // Given
        when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(eventAvailability));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        OrderDto result = orderService.createOrder(createOrderRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getEventId()).isEqualTo(eventId);
        assertThat(result.getQuantity()).isEqualTo(2);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        verify(eventClient).getEventAvailability(eventId);
        verify(eventClient).decrementAvailableTickets(eq(eventId), eq(2));
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Should calculate totalAmount correctly as price × quantity")
    void createOrder_ShouldCalculateTotalAmount() {
        // Given
        EventAvailabilityDto availability = EventAvailabilityDto.builder()
                .availableTickets(50)
                .price(BigDecimal.valueOf(75.50))
                .build();
        CreateOrderRequest request = new CreateOrderRequest(userId, eventId, 3);

        when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(availability));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        OrderDto result = orderService.createOrder(request);

        // Then
        BigDecimal expectedTotal = BigDecimal.valueOf(75.50).multiply(BigDecimal.valueOf(3));
        assertThat(result.getTotalAmount()).isEqualByComparingTo(expectedTotal);
    }

    @Test
    @DisplayName("Should throw BusinessException when not enough tickets")
    void createOrder_ShouldThrowException_WhenNotEnoughTickets() {
        // Given
        EventAvailabilityDto lowAvailability = EventAvailabilityDto.builder()
                .availableTickets(1)
                .price(BigDecimal.valueOf(50.00))
                .build();
        CreateOrderRequest largeRequest = new CreateOrderRequest(userId, eventId, 5);

        when(eventClient.getEventAvailability(eventId)).thenReturn(ApiResponse.success(lowAvailability));

        // When & Then
        assertThatThrownBy(() -> orderService.createOrder(largeRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hay suficientes tickets disponibles");
        verify(orderRepository, never()).save(any(Order.class));
        verify(eventClient, never()).decrementAvailableTickets(eq(eventId), eq(5));
    }

    @Test
    @DisplayName("Should get order by ID successfully")
    void getOrderById_ShouldReturnOrderDto() {
        // Given
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // When
        Optional<OrderDto> result = orderService.getOrderById(orderId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(orderId);
        assertThat(result.get().getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("Should return empty when order not found")
    void getOrderById_ShouldReturnEmpty_WhenOrderNotFound() {
        // Given
        UUID nonExistentId = UUID.randomUUID();
        when(orderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When
        Optional<OrderDto> result = orderService.getOrderById(nonExistentId);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should get orders by user ID successfully")
    void getOrdersByUserId_ShouldReturnOrderList() {
        // Given
        Order order2 = Order.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .eventId(eventId)
                .quantity(1)
                .totalAmount(BigDecimal.valueOf(50.00))
                .status(OrderStatus.CONFIRMED)
                .build();

        when(orderRepository.findByUserId(userId)).thenReturn(List.of(order, order2));

        // When
        List<OrderDto> result = orderService.getOrdersByUserId(userId);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.stream().allMatch(o -> o.getUserId().equals(userId))).isTrue();
    }

    @Test
    @DisplayName("Should cancel order successfully")
    void cancelOrder_ShouldReturnCancelledOrder() {
        // Given
        Order pendingOrder = Order.builder()
                .id(orderId)
                .userId(userId)
                .eventId(eventId)
                .quantity(2)
                .totalAmount(BigDecimal.valueOf(100.00))
                .status(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(pendingOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Optional<OrderDto> result = orderService.cancelOrder(orderId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Should throw BusinessException when cancelling non-PENDING order")
    void cancelOrder_ShouldThrowException_WhenOrderNotPending() {
        // Given
        Order confirmedOrder = Order.builder()
                .id(orderId)
                .userId(userId)
                .eventId(eventId)
                .quantity(2)
                .totalAmount(BigDecimal.valueOf(100.00))
                .status(OrderStatus.CONFIRMED)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(confirmedOrder));

        // When & Then
        assertThatThrownBy(() -> orderService.cancelOrder(orderId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Solo se pueden cancelar pedidos en estado PENDING");
    }

    @Test
    @DisplayName("Should return empty when cancelling non-existent order")
    void cancelOrder_ShouldReturnEmpty_WhenOrderNotFound() {
        // Given
        UUID nonExistentId = UUID.randomUUID();
        when(orderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When
        Optional<OrderDto> result = orderService.cancelOrder(nonExistentId);

        // Then
        assertThat(result).isEmpty();
    }
}
