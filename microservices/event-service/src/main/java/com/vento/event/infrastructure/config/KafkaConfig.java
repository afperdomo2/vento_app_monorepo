package com.vento.event.infrastructure.config;

import com.vento.common.dto.kafka.OrderConfirmedEvent;
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
import org.springframework.util.backoff.ExponentialBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuración de Kafka para Event Service.
 *
 * Producer: publica event.created, event.updated, event.deleted
 * Consumer: escucha eventos para sincronización con Elasticsearch
 */
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ==================== PRODUCER ====================

    @Bean
    public ProducerFactory<String, Object> eventProducerFactory() {
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
    public KafkaTemplate<String, Object> eventKafkaTemplate() {
        return new KafkaTemplate<>(eventProducerFactory());
    }

    // ==================== CONSUMER ====================

    @Bean
    public ConsumerFactory<String, Object> eventConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "event-service-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());

        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.vento.common.dto.kafka,com.vento.event.document");
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, "false");

        return new DefaultKafkaConsumerFactory<>(config);
    }

    // ==================== ERROR HANDLER ====================

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<String, Object> eventKafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(eventKafkaTemplate);
        ExponentialBackOff backOff = new ExponentialBackOff(1000L, 5);
        backOff.setMaxInterval(125000L);
        return new DefaultErrorHandler(recoverer, backOff);
    }

    // ==================== LISTENER CONTAINER FACTORY ====================

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> eventListenerContainerFactory(
            CommonErrorHandler errorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
        factory.setConsumerFactory(eventConsumerFactory());
        factory.setCommonErrorHandler(errorHandler);
        factory.setConcurrency(1);
        return factory;
    }

    // ==================== ORDER CONFIRMED LISTENER ====================

    /**
     * Consumer factory específico para OrderConfirmedEvent.
     * Usa ErrorHandlingDeserializer para capturar errores de serialización.
     */
    @Bean
    public ConsumerFactory<String, OrderConfirmedEvent> orderConfirmedConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "event-service-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());

        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.vento.common.dto.kafka,com.vento.event.document");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, OrderConfirmedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, "false");

        return new DefaultKafkaConsumerFactory<>(config);
    }

    /**
     * Listener container factory para OrderConfirmedListener.
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderConfirmedEvent> orderConfirmedListenerFactory(
            CommonErrorHandler errorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, OrderConfirmedEvent>();
        factory.setConsumerFactory(orderConfirmedConsumerFactory());
        factory.setCommonErrorHandler(errorHandler);
        factory.setConcurrency(1);
        return factory;
    }
}
