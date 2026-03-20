package com.vento.order.service;

import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.dto.order.OrderStatus;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        log.info("Creando nuevo pedido para el usuario: {}, evento: {}, cantidad: {}",
                request.getUserId(), request.getEventId(), request.getQuantity());

        // TODO: En el sprint 2.3/2.4, verificar disponibilidad con event-service via Feign Client
        // Por ahora, creamos la orden sin validar disponibilidad

        BigDecimal totalAmount = BigDecimal.ZERO; // TODO: Calcular basado en el precio del evento

        Order order = Order.builder()
                .userId(request.getUserId())
                .eventId(request.getEventId())
                .quantity(request.getQuantity())
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);
        log.info("Pedido creado con ID: {}", savedOrder.getId());

        return mapToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public Optional<OrderDto> getOrderById(UUID id) {
        log.info("Obteniendo pedido por ID: {}", id);
        return orderRepository.findById(id)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUserId(UUID userId) {
        log.info("Obteniendo pedidos para el usuario: {}", userId);
        return orderRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public Optional<OrderDto> cancelOrder(UUID id) {
        log.info("Cancelando pedido ID: {}", id);

        return orderRepository.findById(id)
                .map(order -> {
                    if (order.getStatus() != OrderStatus.PENDING) {
                        log.warn("El pedido {} no puede ser cancelado. Estado actual: {}",
                                id, order.getStatus());
                        throw new IllegalStateException(
                                "Solo se pueden cancelar pedidos en estado PENDING. Estado actual: " + order.getStatus());
                    }

                    order.setStatus(OrderStatus.CANCELLED);
                    Order cancelledOrder = orderRepository.save(order);
                    log.info("Pedido cancelado: {}", cancelledOrder.getId());
                    return mapToDto(cancelledOrder);
                });
    }

    private OrderDto mapToDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .eventId(order.getEventId())
                .quantity(order.getQuantity())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
