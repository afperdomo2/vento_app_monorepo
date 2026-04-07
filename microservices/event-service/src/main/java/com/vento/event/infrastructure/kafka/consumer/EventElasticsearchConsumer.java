package com.vento.event.infrastructure.kafka.consumer;

import com.vento.event.infrastructure.elasticsearch.document.EventDocument;
import com.vento.event.core.model.Event;
import com.vento.event.infrastructure.elasticsearch.repository.EventElasticsearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;

/**
 * Consumer que escucha eventos de Kafka y sincroniza con Elasticsearch.
 *
 * Topics:
 * - event.created: Indexa nuevo evento en Elasticsearch
 * - event.updated: Actualiza evento existente en Elasticsearch
 * - event.deleted: Elimina evento de Elasticsearch
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventElasticsearchConsumer {

    private final EventElasticsearchRepository eventElasticsearchRepository;

    /**
     * Escucha eventos de creación y los indexa en Elasticsearch
     */
    @KafkaListener(
            topics = "event.created",
            groupId = "${spring.kafka.consumer.group-id:event-service-group}",
            containerFactory = "eventListenerContainerFactory"
    )
    public void handleEventCreated(Event event) {
        log.info("📥 Recibido evento creado para evento: {}", event.getId());

        try {
            EventDocument doc = mapToDocument(event);
            eventElasticsearchRepository.save(doc);
            log.info("✅ Evento indexado en Elasticsearch: {}", event.getId());
        } catch (Exception e) {
            log.error("❌ Error al indexar evento en Elasticsearch: {}", event.getId(), e);
            throw e; // Para que el error handler lo capture y reintente
        }
    }

    /**
     * Escucha eventos de actualización y los actualiza en Elasticsearch
     */
    @KafkaListener(
            topics = "event.updated",
            groupId = "${spring.kafka.consumer.group-id:event-service-group}",
            containerFactory = "eventListenerContainerFactory"
    )
    public void handleEventUpdated(Event event) {
        log.info("📥 Recibido evento actualizado para evento: {}", event.getId());

        try {
            EventDocument doc = mapToDocument(event);
            eventElasticsearchRepository.save(doc);
            log.info("✅ Evento actualizado en Elasticsearch: {}", event.getId());
        } catch (Exception e) {
            log.error("❌ Error al actualizar evento en Elasticsearch: {}", event.getId(), e);
            throw e;
        }
    }

    /**
     * Escucha eventos de eliminación y los elimina de Elasticsearch
     */
    @KafkaListener(
            topics = "event.deleted",
            groupId = "${spring.kafka.consumer.group-id:event-service-group}",
            containerFactory = "eventListenerContainerFactory"
    )
    public void handleEventDeleted(Event event) {
        log.info("📥 Recibido evento eliminado para evento: {}", event.getId());

        try {
            eventElasticsearchRepository.deleteById(event.getId().toString());
            log.info("✅ Evento eliminado de Elasticsearch: {}", event.getId());
        } catch (Exception e) {
            log.error("❌ Error al eliminar evento de Elasticsearch: {}", event.getId(), e);
            throw e;
        }
    }

    /**
     * Mapear de Event (JPA) a EventDocument (Elasticsearch)
     */
    private EventDocument mapToDocument(Event event) {
        return EventDocument.builder()
                .id(event.getId().toString())
                .name(event.getName())
                .description(event.getDescription())
                .venue(event.getVenue())
                .location(event.getLatitude() != null && event.getLongitude() != null 
                        ? event.getLatitude() + "," + event.getLongitude() 
                        : null)
                .eventDate(event.getEventDate().atZone(java.time.ZoneId.systemDefault()).toInstant())
                .price(event.getPrice().doubleValue())
                .totalCapacity(event.getTotalCapacity())
                .availableTickets(event.getAvailableTickets())
                .status("ACTIVE")
                .createdAt(event.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant())
                .updatedAt(event.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant())
                .build();
    }
}
