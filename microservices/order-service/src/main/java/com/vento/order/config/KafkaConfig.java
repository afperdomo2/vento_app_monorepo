package com.vento.order.config;

import com.vento.common.config.KafkaTopics;
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

    // ==================== CONSUMER ====================

    @Bean
    public ConsumerFactory<String, Object> orderConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.vento.common.dto.kafka.*,com.vento.order.*");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, "java.lang.Object");
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<String, Object> orderKafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(orderKafkaTemplate);
        // 3 reintentos con intervalo de 1 segundo antes de enviar a DLQ
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> orderKafkaListenerContainerFactory(
            CommonErrorHandler errorHandler) {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderConsumerFactory());
        factory.setCommonErrorHandler(errorHandler);
        factory.setConcurrency(3);
        return factory;
    }
}
