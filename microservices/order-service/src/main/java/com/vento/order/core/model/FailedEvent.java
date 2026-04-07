package com.vento.order.core.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad para almacenar mensajes fallidos que fueron enviados a DLQ.
 * Permite análisis posterior y posible re-procesamiento manual.
 */
@Entity
@Table(name = "failed_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String topic;

    @Column(length = 500)
    private String key;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(columnDefinition = "TEXT")
    private String exception;

    @Column(name = "failed_at", nullable = false)
    private Instant failedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean processed = false;

    @Column(name = "processed_at")
    private Instant processedAt;
}
