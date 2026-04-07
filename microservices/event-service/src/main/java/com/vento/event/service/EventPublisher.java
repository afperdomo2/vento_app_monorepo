package com.vento.event.service;

import com.vento.event.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Servicio para publicar eventos de cambio a Kafka.
 * Estos eventos son consumidos por Elasticsearch para mantener el índice sincronizado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private static final String TOPIC_EVENT_CREATED = "event.created";
    private static final String TOPIC_EVENT_UPDATED = "event.updated";
    private static final String TOPIC_EVENT_DELETED = "event.deleted";

    private final KafkaTemplate<String, Object> eventKafkaTemplate;

    /**
     * Publicar evento de creación de evento
     */
    public void publishEventCreated(Event event) {
        log.info("📤 Publicando evento creado a Kafka: {}", event.getId());
        eventKafkaTemplate.send(TOPIC_EVENT_CREATED, event.getId().toString(), event);
    }

    /**
     * Publicar evento de actualización de evento
     */
    public void publishEventUpdated(Event event) {
        log.info("📤 Publicando evento actualizado a Kafka: {}", event.getId());
        eventKafkaTemplate.send(TOPIC_EVENT_UPDATED, event.getId().toString(), event);
    }

    /**
     * Publicar evento de eliminación de evento
     */
    public void publishEventDeleted(Event event) {
        log.info("📤 Publicando evento eliminado a Kafka: {}", event.getId());
        eventKafkaTemplate.send(TOPIC_EVENT_DELETED, event.getId().toString(), event);
    }
}
