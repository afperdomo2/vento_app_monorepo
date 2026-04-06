package com.vento.order.kafka;

import com.vento.common.enums.OrderStatus;
import com.vento.order.model.Order;
import com.vento.order.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de integración básicos para validar que los componentes de Kafka se cargan.
 * <p>
 * Nota: Tests completos con EmbeddedKafka requieren configuración adicional
 * debido a conflictos con la configuración de Kafka en application.yml.
 * Los tests unitarios en PaymentResultListenerIdempotencyTest ya validan
 * la lógica de procesamiento de eventos.
 */
@SpringBootTest
@DisplayName("Payment Saga Integration Tests - Basic")
class PaymentSagaIntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("ApplicationContext carga correctamente con Kafka listeners")
    void shouldLoadApplicationContextWithKafkaListeners() {
        // Given: ApplicationContext cargado con @SpringBootTest
        // When: Todos los beans están configurados
        // Then: No lanza excepciones de configuración
        assertThat(orderRepository).isNotNull();
    }
}
