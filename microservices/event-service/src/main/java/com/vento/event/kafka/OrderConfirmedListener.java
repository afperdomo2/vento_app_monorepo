package com.vento.event.kafka;

import com.vento.common.config.KafkaTopics;
import com.vento.common.dto.kafka.OrderConfirmedEvent;
import com.vento.event.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listener de eventos de orden confirmada.
 *
 * Cuando una orden se confirma (pago exitoso), genera los tickets
 * correspondientes en la base de datos del event-service.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderConfirmedListener {

    private final TicketService ticketService;

    @KafkaListener(
            topics = KafkaTopics.ORDER_CONFIRMED,
            groupId = "${spring.kafka.consumer.group-id:event-service-group}",
            containerFactory = "orderConfirmedListenerFactory"
    )
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        log.info("📨 Recibido OrderConfirmedEvent para orden: {}, usuario: {}, cantidad: {}",
                event.orderId(), event.userId(), event.quantity());

        ticketService.generateTickets(event);

        log.info("✅ Tickets generados exitosamente para orden: {}", event.orderId());
    }
}
