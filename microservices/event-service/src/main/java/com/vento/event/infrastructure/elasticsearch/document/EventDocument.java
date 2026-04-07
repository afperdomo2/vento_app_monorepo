package com.vento.event.infrastructure.elasticsearch.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.GeoPointField;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Documento Elasticsearch para eventos.
 * Mapeado al índice 'events' creado en init-elasticsearch.sh
 */
@Document(indexName = "events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String venue;

    @GeoPointField
    private String location;

    @Field(type = FieldType.Date)
    private LocalDateTime eventDate;

    @Field(type = FieldType.Float)
    private BigDecimal price;

    @Field(type = FieldType.Integer)
    private Integer totalCapacity;

    @Field(type = FieldType.Integer)
    private Integer availableTickets;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;

    @Field(type = FieldType.Date)
    private LocalDateTime updatedAt;
}
