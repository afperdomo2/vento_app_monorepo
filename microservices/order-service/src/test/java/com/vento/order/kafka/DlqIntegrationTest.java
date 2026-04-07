package com.vento.order.kafka;

import com.vento.order.core.model.FailedEvent;
import com.vento.order.infrastructure.persistence.repository.FailedEventRepository;
import com.vento.order.core.service.DlqService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de integración para validar el servicio DLQ.
 */
@SpringBootTest
@DisplayName("DLQ Integration Tests - Basic")
class DlqIntegrationTest {

    @Autowired
    private DlqService dlqService;

    @Autowired
    private FailedEventRepository failedEventRepository;

    @Test
    @DisplayName("DLQ Service: markAsProcessed funciona correctamente")
    void shouldMarkEventAsProcessed() {
        // Given
        FailedEvent failedEvent = FailedEvent.builder()
                .topic("payment.processed.DLQ")
                .key("test-order-789")
                .payload("{\"orderId\":\"test-order-789\"}")
                .exception("Test exception")
                .failedAt(Instant.now())
                .processed(false)
                .build();
        FailedEvent savedEvent = failedEventRepository.save(failedEvent);

        // When: Marcar como procesado
        dlqService.markAsProcessed(savedEvent.getId());

        // Then: Verificar que se marcó correctamente
        FailedEvent updatedEvent = failedEventRepository.findById(savedEvent.getId()).orElseThrow();
        assertThat(updatedEvent.getProcessed()).isTrue();
        assertThat(updatedEvent.getProcessedAt()).isNotNull();

        // Cleanup
        failedEventRepository.deleteAll();
    }

    @Test
    @DisplayName("DLQ Service: getUnprocessedEvents retorna solo eventos no procesados")
    void shouldReturnOnlyUnprocessedEvents() {
        // Given
        FailedEvent event1 = FailedEvent.builder()
                .topic("payment.processed.DLQ")
                .key("order-1")
                .payload("{\"orderId\":\"order-1\"}")
                .failedAt(Instant.now())
                .processed(false)
                .build();
        failedEventRepository.save(event1);

        FailedEvent event2 = FailedEvent.builder()
                .topic("payment.failed.DLQ")
                .key("order-2")
                .payload("{\"orderId\":\"order-2\"}")
                .failedAt(Instant.now())
                .processed(true)
                .build();
        failedEventRepository.save(event2);

        // When
        List<FailedEvent> unprocessedEvents = dlqService.getUnprocessedEvents();

        // Then
        assertThat(unprocessedEvents).hasSize(1);
        assertThat(unprocessedEvents.get(0).getKey()).isEqualTo("order-1");

        // Cleanup
        failedEventRepository.deleteAll();
    }
}
