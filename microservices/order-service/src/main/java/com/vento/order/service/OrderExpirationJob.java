package com.vento.order.service;

import com.vento.common.enums.OrderStatus;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Job programado que expira las órdenes PENDING cuyo TTL de reserva ha vencido.
 * <p>
 * Se ejecuta cada minuto (configurable). Busca órdenes PENDING creadas hace más de
 * {@code vento.reservation.ttl-minutes} minutos y las marca como EXPIRED,
 * liberando los tickets en Redis y en la DB del event-service.
 * <p>
 * Este enfoque (scheduled job polling DB) es más robusto que Redis Keyspace Notifications
 * en entornos con múltiples instancias, ya que no requiere configuración adicional de Redis.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderExpirationJob {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${vento.reservation.ttl-minutes:5}")
    private int ttlMinutes;

    /**
     * Revisa y expira órdenes vencidas cada 60 segundos.
     * El initialDelay evita ejecuciones en arranque anticipado del contexto.
     */
    @Scheduled(fixedDelayString = "${vento.expiration.check-interval-ms:60000}",
               initialDelayString = "${vento.expiration.initial-delay-ms:30000}")
    public void expireStaleReservations() {
        LocalDateTime expirationThreshold = LocalDateTime.now().minusMinutes(ttlMinutes);
        log.debug("🐞 Buscando órdenes PENDING vencidas antes de: {}", expirationThreshold);

        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(
                OrderStatus.PENDING, expirationThreshold);

        if (expiredOrders.isEmpty()) {
            log.debug("🐞 No hay órdenes expiradas en esta revisión.");
            return;
        }

        log.info("✅ Expirando {} órdenes vencidas.", expiredOrders.size());
        for (Order order : expiredOrders) {
            try {
                orderService.expireOrder(order);
                log.info("✅ Orden {} expirada exitosamente.", order.getId());
            } catch (Exception e) {
                log.error("❌ Error al expirar la orden {}: {}", order.getId(), e.getMessage(), e);
            }
        }
    }
}
