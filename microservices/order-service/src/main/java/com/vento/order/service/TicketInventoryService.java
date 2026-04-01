package com.vento.order.service;

import com.vento.common.exception.InsufficientTicketsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Gestiona las operaciones atómicas de inventario de tickets en Redis desde el order-service.
 * <p>
 * Esquema de keys compartido con el event-service:
 * - {@code vento:event:{eventId}:available_tickets} — contador de tickets disponibles
 * <p>
 * Las operaciones DECRBY/INCRBY son atómicas en Redis, lo que garantiza que no hay sobreventa
 * incluso con múltiples requests concurrentes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketInventoryService {

    private static final String TICKETS_KEY_SUFFIX = ":available_tickets";

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${vento.redis.key-prefix:vento:}")
    private String keyPrefix;

    /**
     * Construye la key Redis para tickets disponibles de un evento.
     * Debe ser consistente con la key que usa el event-service.
     * Ejemplo: {@code vento:event:550e8400-e29b-41d4-a716-446655440000:available_tickets}
     */
    private String buildTicketsKey(UUID eventId) {
        return keyPrefix + "event:" + eventId + TICKETS_KEY_SUFFIX;
    }

    /**
     * Reserva tickets de forma atómica usando DECRBY en Redis.
     * <p>
     * Algoritmo:
     * 1. DECRBY key quantity → resultado
     * 2. Si resultado < 0 → INCRBY key quantity (rollback) + lanzar InsufficientTicketsException
     * 3. Si resultado >= 0 → reserva exitosa
     * <p>
     * Esta operación es thread-safe: Redis garantiza atomicidad de DECRBY.
     *
     * @param eventId  ID del evento
     * @param quantity cantidad de tickets a reservar
     * @throws InsufficientTicketsException si no hay suficientes tickets disponibles
     */
    public void reserveTickets(UUID eventId, int quantity) {
        String key = buildTicketsKey(eventId);
        log.info("Reservando {} tickets para evento {} usando DECRBY atómico. Key: {}", quantity, eventId, key);

        Long result = redisTemplate.opsForValue().decrement(key, quantity);

        if (result == null) {
            // La key no existe en Redis — no podemos operar de forma segura sin inicializar
            log.error("Key {} no encontrada en Redis. El event-service debe inicializar el inventario primero.", key);
            throw new InsufficientTicketsException(0, quantity);
        }

        if (result < 0) {
            // Rollback atómico: revertir el DECRBY que nos dejó en negativo
            Long restored = redisTemplate.opsForValue().increment(key, quantity);
            int currentAvailable = (int) Math.max(0, result + quantity); // disponible antes del decr
            log.warn("Tickets insuficientes para evento {}. Resultado tras DECRBY: {}, restaurando a: {}",
                    eventId, result, restored);
            throw new InsufficientTicketsException(currentAvailable, quantity);
        }

        log.info("Tickets reservados exitosamente para evento {}. Restantes en Redis: {}", eventId, result);
    }

    /**
     * Libera tickets de forma atómica usando INCRBY en Redis.
     * Usado al cancelar o expirar una orden.
     *
     * @param eventId  ID del evento
     * @param quantity cantidad de tickets a liberar
     */
    public void releaseTickets(UUID eventId, int quantity) {
        String key = buildTicketsKey(eventId);
        Long newValue = redisTemplate.opsForValue().increment(key, quantity);
        log.info("Tickets liberados para evento {}. Cantidad: {}, Nuevo total Redis: {}", eventId, quantity, newValue);
    }
}
