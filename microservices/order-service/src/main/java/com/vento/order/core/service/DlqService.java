package com.vento.order.core.service;

import com.vento.order.core.model.FailedEvent;
import com.vento.order.infrastructure.persistence.repository.FailedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para gestionar el almacenamiento y procesamiento de mensajes DLQ.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DlqService {

    private final FailedEventRepository failedEventRepository;

    /**
     * Almacena un mensaje fallido en la base de datos para análisis posterior.
     *
     * @param topic     Topic original del mensaje
     * @param key       Key del mensaje Kafka
     * @param payload   Contenido del mensaje
     * @param exception Excepción que causó el fallo
     */
    @Transactional
    public void storeFailedEvent(String topic, String key, String payload, String exception) {
        FailedEvent failedEvent = FailedEvent.builder()
                .topic(topic)
                .key(key)
                .payload(payload)
                .exception(exception)
                .failedAt(Instant.now())
                .processed(false)
                .build();

        failedEventRepository.save(failedEvent);
        log.info("📥 Mensaje DLQ almacenado: topic={}, key={}", topic, key);
    }

    /**
     * Obtener todos los eventos fallidos no procesados
     */
    @Transactional(readOnly = true)
    public List<FailedEvent> getUnprocessedEvents() {
        return failedEventRepository.findByProcessedFalse();
    }

    /**
     * Obtener todos los eventos fallidos ordenados por fecha
     */
    @Transactional(readOnly = true)
    public List<FailedEvent> getAllFailedEvents() {
        return failedEventRepository.findByOrderByFailedAtDesc();
    }

    /**
     * Contar eventos fallidos por topic
     */
    @Transactional(readOnly = true)
    public long countByTopic(String topic) {
        return failedEventRepository.countByTopic(topic);
    }

    /**
     * Marcar un evento como procesado (re-procesamiento manual)
     */
    @Transactional
    public void markAsProcessed(UUID eventId) {
        FailedEvent event = failedEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Evento no encontrado: " + eventId));

        event.setProcessed(true);
        event.setProcessedAt(Instant.now());
        failedEventRepository.save(event);

        log.info("✅ Evento DLQ marcado como procesado: id={}, topic={}", eventId, event.getTopic());
    }
}
