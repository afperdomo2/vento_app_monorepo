package com.vento.order.core.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Gestiona las reservas temporales en Redis con TTL.
 * <p>
 * Esquema de keys:
 * - {@code vento:reservation:{orderId}} — reserva temporal (valor: "1", TTL configurado)
 * <p>
 * El TTL se configura con {@code vento.reservation.ttl-minutes} (default: 5 minutos).
 * La expiración en Redis es informativa; el job {@link OrderExpirationJob} es quien
 * detecta órdenes PENDING vencidas y libera los tickets.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private static final String RESERVATION_KEY_PREFIX = "reservation:";

    private final RedisTemplate<String, String> redisTemplate;
    private final MeterRegistry meterRegistry;

    private Counter reservationsCreatedCounter;
    private Counter reservationsRemovedCounter;

    @PostConstruct
    public void init() {
        reservationsCreatedCounter = registerCounter("vento.reservations.active", "Total reservations created");
        reservationsRemovedCounter = registerCounter("vento.reservations.removed", "Total reservations removed");
    }

    private Counter registerCounter(String name, String description) {
        return Counter.builder(name)
                .description(description)
                .register(meterRegistry);
    }

    @Value("${vento.redis.key-prefix:vento:}")
    private String keyPrefix;

    @Value("${vento.reservation.ttl-minutes:5}")
    private int ttlMinutes;

    /**
     * Crea una clave de reserva temporal en Redis con TTL.
     * Se llama justo después de persistir la orden en PENDING.
     *
     * @param orderId ID de la orden creada
     */
    public void createReservation(UUID orderId) {
        String key = buildReservationKey(orderId);
        redisTemplate.opsForValue().set(key, "1", Duration.ofMinutes(ttlMinutes));
        reservationsCreatedCounter.increment();
        log.info("✅ Reserva temporal creada. Key: {}, TTL: {} minutos", key, ttlMinutes);
    }

    /**
     * Elimina la clave de reserva temporal (al confirmar o cancelar explícitamente).
     *
     * @param orderId ID de la orden
     */
    public void removeReservation(UUID orderId) {
        String key = buildReservationKey(orderId);
        Boolean deleted = redisTemplate.delete(key);
        reservationsRemovedCounter.increment();
        log.info("✅ Reserva temporal eliminada. Key: {}, Eliminada: {}", key, deleted);
    }

    /**
     * Verifica si existe una reserva temporal activa para la orden.
     *
     * @param orderId ID de la orden
     * @return true si la reserva aún está activa en Redis
     */
    public boolean hasActiveReservation(UUID orderId) {
        String key = buildReservationKey(orderId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Retorna el TTL en minutos configurado para las reservas.
     */
    public int getTtlMinutes() {
        return ttlMinutes;
    }

    private String buildReservationKey(UUID orderId) {
        return keyPrefix + RESERVATION_KEY_PREFIX + orderId;
    }
}
