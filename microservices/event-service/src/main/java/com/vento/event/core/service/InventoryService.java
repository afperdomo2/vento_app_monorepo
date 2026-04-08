package com.vento.event.core.service;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import com.vento.event.infrastructure.persistence.repository.EventRepository;

/**
 * Gestiona el inventario de tickets en Redis.
 * <p>
 * Esquema de keys:
 * - {@code vento:event:{eventId}:available_tickets} — contador de tickets disponibles (String/integer)
 * <p>
 * Todas las operaciones de INCR/DECR son atómicas en Redis.
 * En caso de que la key no exista, se hace fallback a PostgreSQL para inicializarla.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private static final String TICKETS_KEY_SUFFIX = ":available_tickets";

    private final RedisTemplate<String, String> redisTemplate;
    private final EventRepository eventRepository;
    private final MeterRegistry meterRegistry;

    // Rastrear total de tickets disponibles en todos los eventos para reportes de métricas
    private final AtomicLong totalAvailableTickets = new AtomicLong(0);

    @Value("${vento.redis.key-prefix:vento:}")
    private String keyPrefix;

    @PostConstruct
    public void init() {
        Gauge.builder("vento.tickets.available", totalAvailableTickets, AtomicLong::get)
                .description("Total available tickets across all events")
                .register(meterRegistry);
    }

    // -----------------------------------------------------------------------
    // Key builders
    // -----------------------------------------------------------------------

    /**
     * Construye la key Redis para tickets disponibles de un evento.
     * Ejemplo: {@code vento:event:550e8400-e29b-41d4-a716-446655440000:available_tickets}
     */
    public String buildTicketsKey(UUID eventId) {
        return keyPrefix + "event:" + eventId + TICKETS_KEY_SUFFIX;
    }

    // -----------------------------------------------------------------------
    // Sincronización evento → Redis
    // -----------------------------------------------------------------------

    /**
     * Inicializa la key de tickets disponibles en Redis cuando se crea un evento.
     *
     * @param eventId         ID del evento recién creado
     * @param availableTickets cantidad inicial de tickets disponibles
     */
    public void initializeInventory(UUID eventId, int availableTickets) {
        String key = buildTicketsKey(eventId);
        redisTemplate.opsForValue().set(key, String.valueOf(availableTickets));
        totalAvailableTickets.addAndGet(availableTickets);
        log.info("✅ Inventario inicializado en Redis. Key: {}, Tickets: {}", key, availableTickets);
    }

    /**
     * Actualiza la key de tickets disponibles cuando cambia la capacidad del evento.
     * Calcula el delta y aplica INCRBY/DECRBY para mantener consistencia con reservas en vuelo.
     *
     * @param eventId       ID del evento
     * @param delta         diferencia de tickets (positivo = más tickets, negativo = menos)
     */
    public void adjustInventory(UUID eventId, int delta) {
        String key = buildTicketsKey(eventId);
        ensureKeyExists(eventId, key);
        if (delta > 0) {
            redisTemplate.opsForValue().increment(key, delta);
        } else if (delta < 0) {
            redisTemplate.opsForValue().decrement(key, Math.abs(delta));
        }
        totalAvailableTickets.addAndGet(delta);
        log.info("✅ Inventario ajustado en Redis. Key: {}, Delta: {}", key, delta);
    }

    /**
     * Elimina la key de tickets disponibles cuando se elimina un evento.
     *
     * @param eventId ID del evento eliminado
     */
    public void removeInventory(UUID eventId) {
        String key = buildTicketsKey(eventId);
        // Obtener tickets actuales para este evento antes de eliminar
        int currentTickets = ensureKeyExists(eventId, key);
        Boolean deleted = redisTemplate.delete(key);
        totalAvailableTickets.addAndGet(-currentTickets);
        log.info("✅ Inventario eliminado de Redis. Key: {}, Eliminado: {}", key, deleted);
    }

    // -----------------------------------------------------------------------
    // Operaciones atómicas de inventario (usadas desde order-service también)
    // -----------------------------------------------------------------------

    /**
     * Obtiene los tickets disponibles actuales desde Redis.
     * Si la key no existe, hace fallback a PostgreSQL e inicializa la key.
     *
     * @param eventId ID del evento
     * @return cantidad de tickets disponibles
     */
    public int getAvailableTickets(UUID eventId) {
        String key = buildTicketsKey(eventId);
        return ensureKeyExists(eventId, key);
    }

    /**
     * Incrementa el contador de tickets disponibles (usado al cancelar/expirar una orden).
     *
     * @param eventId  ID del evento
     * @param quantity cantidad de tickets a liberar
     */
    public void releaseTickets(UUID eventId, int quantity) {
        String key = buildTicketsKey(eventId);
        ensureKeyExists(eventId, key);
        Long newValue = redisTemplate.opsForValue().increment(key, quantity);
        totalAvailableTickets.addAndGet(quantity);
        log.info("✅ Tickets liberados en Redis. Key: {}, Cantidad: {}, Nuevo total: {}", key, quantity, newValue);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Verifica que la key exista en Redis. Si no existe, la inicializa desde PostgreSQL.
     *
     * @param eventId ID del evento
     * @param key     key de Redis
     * @return valor actual de tickets disponibles
     */
    private int ensureKeyExists(UUID eventId, String key) {
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            log.warn("⚠️ Key {} no encontrada en Redis. Cargando desde PostgreSQL.", key);
            int availableTickets = eventRepository.findById(eventId)
                    .map(event -> event.getAvailableTickets())
                    .orElse(0);
            redisTemplate.opsForValue().set(key, String.valueOf(availableTickets));
            log.info("✅ Inventario recargado desde PostgreSQL. Key: {}, Tickets: {}", key, availableTickets);
            return availableTickets;
        }
        return Integer.parseInt(value);
    }
}
