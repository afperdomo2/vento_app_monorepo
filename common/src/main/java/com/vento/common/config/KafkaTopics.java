package com.vento.common.config;

/**
 * Constantes de topics de Kafka para todos los microservicios.
 */
public final class KafkaTopics {

    private KafkaTopics() {
        // Utility class
    }

    // Topics principales
    public static final String PAYMENT_PROCESSED = "payment.processed";
    public static final String PAYMENT_FAILED = "payment.failed";
    public static final String ORDER_CONFIRMED = "order.confirmed";
    public static final String ORDER_CANCELLED = "order.cancelled";

    // Dead Letter Queues
    public static final String PAYMENT_PROCESSED_DLQ = "payment.processed.DLQ";
    public static final String PAYMENT_FAILED_DLQ = "payment.failed.DLQ";
}
