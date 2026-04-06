package com.vento.order.kafka;

import com.vento.common.config.KafkaTopics;
import com.vento.order.service.DlqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer para Dead Letter Queue (DLQ) topics.
 * <p>
 * Escucha mensajes que fallaron después de los reintentos exponenciales
 * y los almacena en la tabla failed_events para análisis y posible
 * re-procesamiento manual.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DlqConsumer {

    private final DlqService dlqService;

    /**
     * Escucha mensajes fallidos del topic payment.processed.DLQ
     */
    @KafkaListener(
            topics = KafkaTopics.PAYMENT_PROCESSED_DLQ,
            groupId = "${spring.kafka.consumer.group-id:order-service-group}-dlq"
    )
    public void handlePaymentProcessedDlq(ConsumerRecord<String, String> record) {
        log.error("🚨 Mensaje en DLQ - payment.processed.DLQ: key={}, value={}",
                record.key(), record.value());

        dlqService.storeFailedEvent(
                KafkaTopics.PAYMENT_PROCESSED_DLQ,
                record.key(),
                record.value(),
                "Consumer processing failed after retries"
        );
    }

    /**
     * Escucha mensajes fallidos del topic payment.failed.DLQ
     */
    @KafkaListener(
            topics = KafkaTopics.PAYMENT_FAILED_DLQ,
            groupId = "${spring.kafka.consumer.group-id:order-service-group}-dlq"
    )
    public void handlePaymentFailedDlq(ConsumerRecord<String, String> record) {
        log.error("🚨 Mensaje en DLQ - payment.failed.DLQ: key={}, value={}",
                record.key(), record.value());

        dlqService.storeFailedEvent(
                KafkaTopics.PAYMENT_FAILED_DLQ,
                record.key(),
                record.value(),
                "Consumer processing failed after retries"
        );
    }
}
