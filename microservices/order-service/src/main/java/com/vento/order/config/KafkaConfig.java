package com.vento.order.config;

import com.vento.common.dto.kafka.PaymentFailedEvent;
import com.vento.common.dto.kafka.PaymentProcessedEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuración de Kafka para Order Service.
 *
 * Producer: publica order.confirmed y order.cancelled
 * Consumer: escucha payment.processed y payment.failed
 */
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ==================== PRODUCER ====================

    @Bean
    public ProducerFactory<String, Object> orderProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> orderKafkaTemplate() {
        return new KafkaTemplate<>(orderProducerFactory());
    }

    // ==================== CONSUMER FACTORIES ====================

    /**
     * Consumer factory para PaymentProcessedEvent.
     * Usa ErrorHandlingDeserializer para capturar errores de serialización sin reintentar infinitamente.
     */
    @Bean
    public ConsumerFactory<String, PaymentProcessedEvent> paymentProcessedConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        // ErrorHandlingDeserializer envuelve al JsonDeserializer para capturar errores
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());

        // Config del JsonDeserializer interno
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.vento.common.dto.kafka");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PaymentProcessedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, "false");

        return new DefaultKafkaConsumerFactory<>(config);
    }

    /**
     * Consumer factory para PaymentFailedEvent.
     */
    @Bean
    public ConsumerFactory<String, PaymentFailedEvent> paymentFailedConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());

        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.vento.common.dto.kafka");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PaymentFailedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, "false");

        return new DefaultKafkaConsumerFactory<>(config);
    }

    // ==================== ERROR HANDLER ====================

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<String, Object> orderKafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(orderKafkaTemplate);
        // 3 reintentos con intervalo de 1 segundo antes de enviar a DLQ
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    }

    // ==================== LISTENER CONTAINER FACTORIES ====================

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentProcessedEvent> paymentProcessedListenerFactory(
            CommonErrorHandler errorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, PaymentProcessedEvent>();
        factory.setConsumerFactory(paymentProcessedConsumerFactory());
        factory.setCommonErrorHandler(errorHandler);
        factory.setConcurrency(1);
        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> paymentFailedListenerFactory(
            CommonErrorHandler errorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent>();
        factory.setConsumerFactory(paymentFailedConsumerFactory());
        factory.setCommonErrorHandler(errorHandler);
        factory.setConcurrency(1);
        return factory;
    }
}
