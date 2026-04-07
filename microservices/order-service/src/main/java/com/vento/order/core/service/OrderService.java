package com.vento.order.core.service;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.event.EventAvailabilityDto;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.enums.OrderStatus;
import com.vento.common.exception.BusinessException;
import com.vento.common.exception.ConflictResolutionService;
import com.vento.common.exception.ExternalServiceException;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.order.infrastructure.client.EventClient;
import com.vento.order.core.model.Order;
import com.vento.order.infrastructure.persistence.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final EventClient eventClient;
    private final TicketInventoryService ticketInventoryService;
    private final ReservationService reservationService;

    @Value("${vento.reservation.max-retries:3}")
    private int maxRetries;

    /**
     * Crea una orden con reserva atómica de tickets.
     * <p>
     * Flujo:
     * 1. Obtener precio del evento via Feign (event-service)
     * 2. DECRBY atómico en Redis — guard contra sobreventa
     * 3. Persistir Order(PENDING) en PostgreSQL
     * 4. Actualizar DB del event-service via Feign (best-effort; si falla, Redis ya fue revertido antes)
     *
     * @param request datos de la orden
     * @param userId  ID del usuario autenticado
     * @return DTO de la orden creada
     */
    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, UUID userId) {
        log.info("✅ Creando nuevo pedido para el usuario: {}, evento: {}, cantidad: {}",
                userId, request.getEventId(), request.getQuantity());

        // 1. Obtener precio del evento (y verificar que existe)
        EventAvailabilityDto availability;
        try {
            ApiResponse<EventAvailabilityDto> response = eventClient.getEventAvailability(request.getEventId());
            availability = response.getData();
            log.info("✅ Disponibilidad del evento {}: tickets={}, precio={}",
                    request.getEventId(), availability.getAvailableTickets(), availability.getPrice());
        } catch (FeignException.NotFound e) {
            log.error("❌ Evento no encontrado: {}", request.getEventId());
            throw new ResourceNotFoundException("Evento", request.getEventId());
        } catch (FeignException e) {
            log.error("❌ Error al consultar disponibilidad del evento: {}", e.getMessage());
            throw new ExternalServiceException("Error al verificar disponibilidad del evento", e);
        }

        // 2. Reserva atómica en Redis con DECRBY
        // Lanza InsufficientTicketsException si no hay tickets — hace rollback automático en Redis
        ticketInventoryService.reserveTickets(request.getEventId(), request.getQuantity());

        // 3. Persistir Order(PENDING) en PostgreSQL
        var totalAmount = availability.getPrice().multiply(java.math.BigDecimal.valueOf(request.getQuantity()));

        Order order = Order.builder()
                .userId(userId)
                .eventId(request.getEventId())
                .quantity(request.getQuantity())
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);
        log.info("✅ Pedido creado con ID: {}", savedOrder.getId());

        // 4. Crear reserva temporal en Redis con TTL
        reservationService.createReservation(savedOrder.getId());

        // 5. Sincronizar DB del event-service (best-effort)
        // Si falla, Redis ya restará los tickets correctamente; la DB quedará desincronizada temporalmente
        try {
            eventClient.decrementAvailableTickets(request.getEventId(), request.getQuantity());
            log.info("✅ Tickets sincronizados en event-service DB. Evento: {}, Cantidad: {}",
                    request.getEventId(), request.getQuantity());
        } catch (FeignException e) {
            log.error("❌ Error al sincronizar tickets en event-service. Orden {} creada pero DB de event-service desincronizada: {}",
                    savedOrder.getId(), e.getMessage());
            // No revertimos: Redis es la fuente de verdad del inventario
        }

        return mapToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public Optional<OrderDto> getOrderById(UUID id) {
        log.info("✅ Obteniendo pedido por ID: {}", id);
        return orderRepository.findById(id)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getOrdersByUserId(UUID userId, int page, int size) {
        log.info("✅ Obteniendo pedidos paginados para el usuario: {} (page={}, size={})", userId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return orderRepository.findByUserId(userId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Cancela una orden y libera los tickets.
     * <p>
     * Flujo:
     * 1. Validar que la orden está en PENDING
     * 2. Cambiar estado a CANCELLED en DB
     * 3. INCRBY en Redis para liberar tickets
     * 4. Sincronizar DB del event-service (best-effort)
     *
     * @param id     ID de la orden
     * @param userId ID del usuario (para verificar propiedad)
     * @return Optional con el DTO de la orden cancelada
     */
    @Transactional
    public Optional<OrderDto> cancelOrder(UUID id, UUID userId) {
        log.info("✅ Cancelando pedido ID: {} por usuario: {}", id, userId);

        return orderRepository.findById(id)
                .map(order -> {
                    if (!order.getUserId().equals(userId)) {
                        throw new com.vento.common.exception.AccessDeniedException(
                                "No tienes permiso para cancelar este pedido");
                    }
                    if (order.getStatus() != OrderStatus.PENDING) {
                        log.warn("⚠️ El pedido {} no puede ser cancelado. Estado actual: {}", id, order.getStatus());
                        throw new BusinessException(
                                "Solo se pueden cancelar pedidos en estado PENDING. Estado actual: " + order.getStatus());
                    }

                    order.setStatus(OrderStatus.CANCELLED);
                    Order cancelledOrder = orderRepository.save(order);
                    log.info("✅ Pedido cancelado en DB: {}", cancelledOrder.getId());

                    // Liberar tickets en Redis
                    ticketInventoryService.releaseTickets(order.getEventId(), order.getQuantity());

                    // Eliminar reserva temporal en Redis
                    reservationService.removeReservation(order.getId());

                    // Sincronizar DB del event-service (best-effort)
                    try {
                        eventClient.releaseAvailableTickets(order.getEventId(), order.getQuantity());
                        log.info("✅ Tickets liberados en event-service DB. Evento: {}, Cantidad: {}",
                                order.getEventId(), order.getQuantity());
                    } catch (FeignException e) {
                        log.error("❌ Error al liberar tickets en event-service DB: {}", e.getMessage());
                    }

                    return mapToDto(cancelledOrder);
                });
    }

    /**
     * Confirma una orden (pago exitoso) y elimina la reserva temporal.
     * Solo se puede confirmar una orden en estado PENDING.
     *
     * @param id ID de la orden
     * @return Optional con el DTO de la orden confirmada
     */
    @Transactional
    public Optional<OrderDto> confirmOrder(UUID id) {
        log.info("✅ Confirmando pedido ID: {}", id);

        return orderRepository.findById(id)
                .map(order -> {
                    if (order.getStatus() != OrderStatus.PENDING) {
                        throw new BusinessException(
                                "Solo se pueden confirmar pedidos en estado PENDING. Estado actual: " + order.getStatus());
                    }

                    order.setStatus(OrderStatus.CONFIRMED);
                    Order confirmedOrder = orderRepository.save(order);
                    log.info("✅ Pedido confirmado: {}", confirmedOrder.getId());

                    // Eliminar reserva temporal en Redis
                    reservationService.removeReservation(order.getId());

                    return mapToDto(confirmedOrder);
                });
    }

    /**
     * Expira una orden PENDING por timeout y libera los tickets.
     * Llamado por el scheduled job de expiración.
     * Aplica retry con exponential backoff ante conflictos de Optimistic Locking.
     *
     * @param order orden a expirar
     */
    public void expireOrder(Order order) {
        ConflictResolutionService.executeWithRetry(() -> doExpireOrder(order), maxRetries);
    }

    @Transactional
    public void doExpireOrder(Order order) {
        // Re-cargar la orden para obtener la versión más reciente
        Order freshOrder = orderRepository.findById(order.getId()).orElse(null);
        if (freshOrder == null || freshOrder.getStatus() != OrderStatus.PENDING) {
            log.info("✅ Orden {} ya no está en PENDING al intentar expirar (estado: {}). Skipping.",
                    order.getId(), freshOrder != null ? freshOrder.getStatus() : "no encontrada");
            return;
        }

        log.info("✅ Expirando pedido ID: {}", freshOrder.getId());
        freshOrder.setStatus(OrderStatus.EXPIRED);
        orderRepository.save(freshOrder);

        // Liberar tickets en Redis
        ticketInventoryService.releaseTickets(freshOrder.getEventId(), freshOrder.getQuantity());

        // Eliminar reserva temporal en Redis
        reservationService.removeReservation(freshOrder.getId());

        // Sincronizar DB del event-service (best-effort)
        try {
            eventClient.releaseAvailableTickets(freshOrder.getEventId(), freshOrder.getQuantity());
            log.info("✅ Tickets liberados en event-service DB al expirar. Evento: {}, Cantidad: {}",
                    freshOrder.getEventId(), freshOrder.getQuantity());
        } catch (FeignException e) {
            log.error("❌ Error al liberar tickets en event-service al expirar orden {}: {}",
                    freshOrder.getId(), e.getMessage());
        }
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
