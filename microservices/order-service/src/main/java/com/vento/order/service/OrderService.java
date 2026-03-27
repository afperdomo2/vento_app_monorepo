package com.vento.order.service;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.dto.order.OrderStatus;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.ExternalServiceException;
import com.vento.common.exception.ResourceNotFoundException;
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

        // Verificar disponibilidad y obtener precio del evento
        EventAvailabilityDto availability;
        try {
            ApiResponse<EventAvailabilityDto> response = eventClient.getEventAvailability(request.getEventId());
            availability = response.getData();
            log.info("Disponibilidad del evento {}: tickets={}, precio={}",
                    request.getEventId(), availability.getAvailableTickets(), availability.getPrice());
        } catch (FeignException.NotFound e) {
            log.error("Evento no encontrado: {}", request.getEventId());
            throw new ResourceNotFoundException("Evento", request.getEventId());
        } catch (FeignException e) {
            log.error("Error al consultar disponibilidad del evento: {}", e.getMessage());
            throw new ExternalServiceException("Error al verificar disponibilidad del evento", e);
        }

        // Validar que hay suficientes tickets
        if (availability.getAvailableTickets() < request.getQuantity()) {
            log.warn("No hay suficientes tickets. Disponibles: {}, Solicitados: {}",
                    availability.getAvailableTickets(), request.getQuantity());
            throw new BusinessException(
                    "No hay suficientes tickets disponibles. Disponibles: " + availability.getAvailableTickets() +
                            ", Solicitados: " + request.getQuantity());
        }

        // Calcular el total: precio × cantidad
        var totalAmount = availability.getPrice().multiply(java.math.BigDecimal.valueOf(request.getQuantity()));

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
            orderRepository.delete(savedOrder);
            throw new ExternalServiceException("Error al descontar tickets del evento", e);
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
                        throw new BusinessException(
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

