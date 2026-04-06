package com.vento.order.kafka;

import com.vento.common.config.KafkaTopics;
import com.vento.common.dto.kafka.OrderCancelledEvent;
import com.vento.common.dto.kafka.OrderConfirmedEvent;
import com.vento.common.dto.kafka.PaymentFailedEvent;
import com.vento.common.dto.kafka.PaymentProcessedEvent;
import com.vento.common.dto.order.OrderStatus;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import com.vento.order.service.ReservationService;
import com.vento.order.service.TicketInventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Listener de resultados de pago desde payment-service via Kafka.
 *
 * Consume eventos de payment.processed y payment.failed para actualizar
 * el estado de las órdenes automáticamente.
 *
 * Tras cada transición de estado, publica un evento al topic correspondiente
 * (order.confirmed / order.cancelled). Estos eventos no son consumidos por
 * ningún servicio actualmente; están reservados para futuros consumidores
 * (notificaciones, facturación, analytics, etc.).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentResultListener {

    private final OrderRepository orderRepository;
    private final ReservationService reservationService;
    private final TicketInventoryService ticketInventoryService;
    private final KafkaTemplate<String, Object> orderKafkaTemplate;

    /**
     * Escucha pagos exitosos y confirma la orden.
     */
    @KafkaListener(
            topics = KafkaTopics.PAYMENT_PROCESSED,
            groupId = "${spring.kafka.consumer.group-id:order-service-group}",
            containerFactory = "paymentProcessedListenerFactory"
    )
    public void handlePaymentProcessed(PaymentProcessedEvent event) {
        log.info("📨 Recibido PaymentProcessedEvent para orden: {}, transacción: {}",
                event.orderId(), event.transactionId());

        Order order = orderRepository.findById(event.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", event.orderId()));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("⚠️ Evento duplicado para orden {} - ya procesada con estado: {}. Ignorando evento.",
                    event.orderId(), order.getStatus());
            return;
        }

        // Cambiar estado a CONFIRMED
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        log.info("✅ Orden {} confirmada tras pago exitoso.", event.orderId());

        // Eliminar reserva temporal en Redis
        reservationService.removeReservation(order.getId());

        log.info("✅ Reserva temporal eliminada para orden confirmada: {}", event.orderId());

        // Publicar evento de confirmación (sin consumidores actuales)
        var confirmedEvent = new OrderConfirmedEvent(
                order.getId(),
                order.getEventId(),
                order.getUserId(),
                order.getQuantity(),
                order.getTotalAmount(),
                Instant.now()
        );
        orderKafkaTemplate.send(KafkaTopics.ORDER_CONFIRMED, order.getId().toString(), confirmedEvent);
        log.info("📤 Evento order.confirmed publicado para orden: {}", event.orderId());
    }

    /**
     * Escucha pagos fallidos y cancela la orden, liberando tickets.
     */
    @KafkaListener(
            topics = KafkaTopics.PAYMENT_FAILED,
            groupId = "${spring.kafka.consumer.group-id:order-service-group}",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("📨 Recibido PaymentFailedEvent para orden: {}, razón: {}",
                event.orderId(), event.reason());

        Order order = orderRepository.findById(event.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", event.orderId()));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("⚠️ Evento duplicado para orden {} - ya procesada con estado: {}. Ignorando evento.",
                    event.orderId(), order.getStatus());
            return;
        }

        // Cambiar estado a CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        log.info("✅ Orden {} cancelada tras pago fallido.", event.orderId());

        // Liberar tickets en Redis
        ticketInventoryService.releaseTickets(order.getEventId(), order.getQuantity());

        // Eliminar reserva temporal en Redis
        reservationService.removeReservation(order.getId());

        log.info("✅ Tickets liberados y reserva eliminada para orden cancelada: {}", event.orderId());

        // Publicar evento de cancelación (sin consumidores actuales)
        var cancelledEvent = new OrderCancelledEvent(
                order.getId(),
                order.getEventId(),
                order.getUserId(),
                order.getQuantity(),
                event.reason(),
                Instant.now()
        );
        orderKafkaTemplate.send(KafkaTopics.ORDER_CANCELLED, order.getId().toString(), cancelledEvent);
        log.info("📤 Evento order.cancelled publicado para orden: {}", event.orderId());
    }
}
