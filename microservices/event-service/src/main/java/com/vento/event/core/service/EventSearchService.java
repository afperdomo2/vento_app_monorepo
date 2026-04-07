package com.vento.event.core.service;

import co.elastic.clients.elasticsearch._types.GeoDistanceType;
import co.elastic.clients.elasticsearch._types.GeoLine;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import co.elastic.clients.json.JsonData;
import com.vento.common.dto.event.EventSearchRequest;
import com.vento.event.core.model.Event;
import com.vento.event.infrastructure.elasticsearch.document.EventDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para búsqueda avanzada de eventos usando Elasticsearch.
 * Implementación basada en NativeQuery y API oficial de ES 8.x.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    /**
     * Búsqueda de texto libre con coincidencias en nombre, descripción y lugar.
     */
    public Page<Event> searchByText(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }

        log.info("🔍 Búsqueda de texto en ES (Native): '{}'", query);

        // Multi-match query oficial de ES
        var searchQuery = NativeQuery.builder()
                .withQuery(q -> q.multiMatch(mm -> mm
                        .query(query)
                        .fields(List.of("name", "description", "venue"))
                ))
                .withPageable(pageable)
                .build();

        SearchHits<EventDocument> hits = elasticsearchOperations.search(searchQuery, EventDocument.class);

        List<Event> events = hits.stream()
                .map(SearchHit::getContent)
                .map(this::mapToEntity)
                .collect(Collectors.toList());

        return new PageImpl<>(events, pageable, hits.getTotalHits());
    }

    /**
     * Búsqueda avanzada con filtros combinados usando BoolQuery.
     */
    public Page<Event> searchAdvanced(EventSearchRequest request) {
        Pageable pageable = request.toPageable();

        var boolBuilder = QueryBuilders.bool();

        // 1. Texto (si existe) -> va en 'must'
        if (request.getQ() != null && !request.getQ().isBlank()) {
            boolBuilder.must(m -> m.multiMatch(mm -> mm
                    .query(request.getQ())
                    .fields(List.of("name", "description", "venue"))
            ));
        }

        // 2. Filtros -> van en 'filter' (no afectan score, son cacheables)
        
        // Precio
        if (request.getMinPrice() != null) {
            boolBuilder.filter(f -> f.range(r -> r
                    .number(n -> n
                            .field("price")
                            .gte(request.getMinPrice().doubleValue())
                    )
            ));
        }
        if (request.getMaxPrice() != null) {
            boolBuilder.filter(f -> f.range(r -> r
                    .number(n -> n
                            .field("price")
                            .lte(request.getMaxPrice().doubleValue())
                    )
            ));
        }

        // Fecha
        if (request.getFromDate() != null) {
            boolBuilder.filter(f -> f.range(r -> r
                    .date(d -> d
                            .field("eventDate")
                            .gte(request.getFromDate().toString())
                    )
            ));
        }
        if (request.getToDate() != null) {
            boolBuilder.filter(f -> f.range(r -> r
                    .date(d -> d
                            .field("eventDate")
                            .lte(request.getToDate().toString())
                    )
            ));
        }

        // Disponibilidad
        if (Boolean.TRUE.equals(request.getOnlyAvailable())) {
            boolBuilder.filter(f -> f.range(r -> r
                    .number(n -> n
                            .field("availableTickets")
                            .gt(0.0)
                    )
            ));
        }

        // Construir NativeQuery
        var searchQuery = NativeQuery.builder()
                .withQuery(q -> q.bool(boolBuilder.build()))
                .withPageable(pageable)
                .build();

        SearchHits<EventDocument> hits = elasticsearchOperations.search(searchQuery, EventDocument.class);

        List<Event> events = hits.stream()
                .map(SearchHit::getContent)
                .map(this::mapToEntity)
                .collect(Collectors.toList());

        return new PageImpl<>(events, pageable, hits.getTotalHits());
    }

    /**
     * Búsqueda de eventos cercanos por geolocalización.
     */
    public Page<Event> searchNearby(Double lat, Double lon, String distance, Pageable pageable) {
        if (lat == null || lon == null || distance == null) {
            return Page.empty(pageable);
        }

        log.info("📍 Búsqueda nearby en ES: lat={}, lon={}, distance={}", lat, lon, distance);

        var searchQuery = NativeQuery.builder()
                .withQuery(q -> q.geoDistance(g -> g
                        .field("location")
                        .location(l -> l.latlon(ll -> ll.lat(lat).lon(lon)))
                        .distance(distance)
                ))
                .withPageable(pageable)
                .build();

        SearchHits<EventDocument> hits = elasticsearchOperations.search(searchQuery, EventDocument.class);

        List<Event> events = hits.stream()
                .map(SearchHit::getContent)
                .map(this::mapToEntity)
                .collect(Collectors.toList());

        return new PageImpl<>(events, pageable, hits.getTotalHits());
    }

    /**
     * Mapeo de Document -> Entity (JPA).
     */
    private Event mapToEntity(EventDocument doc) {
        Event.EventBuilder builder = Event.builder()
                .id(UUID.fromString(doc.getId()))
                .name(doc.getName())
                .description(doc.getDescription())
                .venue(doc.getVenue())
                .eventDate(LocalDateTime.ofInstant(doc.getEventDate(), ZoneId.systemDefault()))
                .price(BigDecimal.valueOf(doc.getPrice()))
                .totalCapacity(doc.getTotalCapacity())
                .availableTickets(doc.getAvailableTickets());

        if (doc.getLocation() != null && doc.getLocation().contains(",")) {
            String[] parts = doc.getLocation().split(",");
            builder.latitude(Double.parseDouble(parts[0])).longitude(Double.parseDouble(parts[1]));
        }

        return builder.build();
    }
}
