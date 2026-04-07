package com.vento.event.core.job;

import com.vento.event.core.model.Event;
import com.vento.event.infrastructure.elasticsearch.document.EventDocument;
import com.vento.event.infrastructure.elasticsearch.repository.EventElasticsearchRepository;
import com.vento.event.infrastructure.persistence.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.List;

/**
 * Job programado que sincroniza los eventos de PostgreSQL hacia Elasticsearch.
 * <p>
 * Se ejecuta cada 5 minutos (configurable) y realiza un upsert de todos los
 * eventos existentes en la base de datos hacia el índice de Elasticsearch.
 * <p>
 * Este job solo está activo en entornos local y dev, donde la sincronización
 * vía Kafka puede no estar disponible o los datos pueden haberse insertado
 * directamente en PostgreSQL sin pasar por el flujo de eventos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "vento.elasticsearch.sync.enabled", havingValue = "true")
public class ElasticsearchSyncJob {

    private final EventRepository eventRepository;
    private final EventElasticsearchRepository eventElasticsearchRepository;

    /**
     * Sincroniza todos los eventos de PostgreSQL a Elasticsearch.
     * Se ejecuta cada 5 minutos (configurable vía vento.elasticsearch.sync-interval-ms).
     */
    @Scheduled(fixedDelayString = "${vento.elasticsearch.sync-interval-ms:300000}",
               initialDelayString = "${vento.elasticsearch.sync-initial-delay-ms:60000}")
    public void syncToElasticsearch() {
        log.info("🔄 Iniciando sincronización PostgreSQL → Elasticsearch");

        List<Event> events = eventRepository.findAll();

        if (events.isEmpty()) {
            log.debug("🐞 No hay eventos en PostgreSQL para sincronizar");
            return;
        }

        List<EventDocument> documents = events.stream()
                .map(this::mapToDocument)
                .toList();

        eventElasticsearchRepository.saveAll(documents);

        log.info("✅ Sincronización completada: {} eventos indexados en Elasticsearch", documents.size());
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
                .eventDate(event.getEventDate().atZone(ZoneId.systemDefault()).toInstant())
                .price(event.getPrice().doubleValue())
                .totalCapacity(event.getTotalCapacity())
                .availableTickets(event.getAvailableTickets())
                .status("ACTIVE")
                .createdAt(event.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant())
                .updatedAt(event.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant())
                .build();
    }
}
