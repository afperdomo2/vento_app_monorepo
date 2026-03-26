package com.vento.order.service;

import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.dto.order.OrderStatus;
import com.vento.order.client.EventClient;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import feign.FeignException;
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
    private final EventClient eventClient;

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        log.info("Creando nuevo pedido para el usuario: {}, evento: {}, cantidad: {}",
                request.getUserId(), request.getEventId(), request.getQuantity());

        // Verificar disponibilidad de tickets en el Event Service
        int availableTickets;
        try {
            availableTickets = eventClient.getAvailableTickets(request.getEventId());
            log.info("Tickets disponibles para el evento {}: {}", request.getEventId(), availableTickets);
        } catch (FeignException.NotFound e) {
            log.error("Evento no encontrado: {}", request.getEventId());
            throw new IllegalArgumentException("Evento no encontrado: " + request.getEventId());
        } catch (FeignException e) {
            log.error("Error al consultar disponibilidad del evento: {}", e.getMessage());
            throw new RuntimeException("Error al verificar disponibilidad del evento", e);
        }

        // Validar que hay suficientes tickets
        if (availableTickets < request.getQuantity()) {
            log.warn("No hay suficientes tickets. Disponibles: {}, Solicitados: {}",
                    availableTickets, request.getQuantity());
            throw new IllegalStateException(
                    "No hay suficientes tickets disponibles. Disponibles: " + availableTickets +
                            ", Solicitados: " + request.getQuantity());
        }

        // Obtener precio del evento para calcular el total
        // Nota: En una implementación más completa, podríamos tener un endpoint para obtener el precio
        // Por ahora, usamos un precio base de 0 y se puede mejorar en el futuro
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Crear la orden
        Order order = Order.builder()
                .userId(request.getUserId())
                .eventId(request.getEventId())
                .quantity(request.getQuantity())
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);
        log.info("Pedido creado con ID: {}", savedOrder.getId());

        // Descontar tickets en el Event Service
        try {
            eventClient.decrementAvailableTickets(request.getEventId(), request.getQuantity());
            log.info("Tickets descontados exitosamente. Evento: {}, Cantidad: {}",
                    request.getEventId(), request.getQuantity());
        } catch (FeignException e) {
            log.error("Error al descontar tickets: {}", e.getMessage());
            // Rollback: eliminar la orden creada
            orderRepository.delete(savedOrder);
            throw new RuntimeException("Error al descontar tickets del evento", e);
        }

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
