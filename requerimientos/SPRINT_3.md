# Sprint 3: Desacoplamiento y Event-Driven (Semanas 5-6)

## Resumen
Introducir Kafka para desacoplar servicios mediante el patrón Saga en coreografía. Implementar el servicio de pagos simulado y configurar Dead Letter Queues para manejo de mensajes fallidos.

---

## Semana 5: Patrón Saga (Coreografía)

### 5.1 - Infraestructura Kafka
- [x] **Docker Compose**:
  - Agregar Kafka (puerto 9092)
  - Agregar Zookeeper/KRaft
  - Agregar Kafka UI (kafdrop o kafka-manager) para debugging
- [x] **Kafka Configuration**:
  - Crear topics: `order.created`, `payment.processed`, `payment.failed`, `order.confirmed`, `order.cancelled`
  - Configurar particiones por eventId (para ordenamiento)
  - Configurar retención apropiada (7 días)
- [ ] **Spring Kafka Dependencies**:
  - Agregar spring-kafka en event-service, order-service, payment-service
  - Configurar KafkaTemplate y KafkaListeners

### 5.2 - Event-service: Publicar Eventos
- [ ] **Eventos a Publicar**:
  - `TicketAvailabilityChanged` - Cuando cambia disponibilidad
  - `EventCreated` - Nuevo evento creado
  - `EventUpdated` - Evento modificado
- [ ] **Kafka Producer**:
  - Crear `EventPublisher` service
  - Configurar serialización JSON
  - Implementar retry con exponential backoff
  - Incluir correlationId para tracing

### 5.3 - Order-service: Saga Orchestrator (Coreografía)
- [ ] **Transiciones Basadas en Eventos**:
  - Escuchar `PaymentProcessedEvent` → Order(CONFIRMED)
  - Escuchar `PaymentFailedEvent` → Order(CANCELLED), liberar stock
  - Escuchar `OrderCreatedEvent` → Iniciar saga
- [ ] **Publicar Eventos**:
  - `OrderCreatedEvent` → Inicia saga (orderId, eventId, userId, quantity)
  - `OrderConfirmedEvent` → Saga completada
  - `OrderCancelledEvent` → Saga compensada
- [ ] **Compensaciones**:
  - Si pago falla → INCRBY en Redis para liberar tickets
  - Marcar orden como CANCELLED
  - Publicar evento de cancelación

### 5.4 - Payment-service: Procesamiento de Pagos
- [ ] **💳 Servicio Simulado**:
  - 80% probabilidad de éxito
  - 20% probabilidad de fallo
  - Delay de 2 segundos antes de responder
- [ ] **Escuchar Eventos**:
  - `@KafkaListener` en topic `order.created`
  - Procesar payment (lógica simulada)
- [ ] **Publicar Resultados**:
  - `PaymentProcessedEvent` → Éxito
  - `PaymentFailedEvent` → Fallo (con reason)
- [ ] **Idempotencia**:
  - Verificar si payment ya fue procesado (por orderId)
  - No procesar dos veces el mismo payment

### 5.5 - Order-service: Transiciones de Estado
- [ ] **Listeners para Resultados de Pago**:
  - `PaymentProcessedEvent` listener:
    - Cambiar Order → CONFIRMED
    - Eliminar clave reservation en Redis
    - Publicar OrderConfirmedEvent
  - `PaymentFailedEvent` listener:
    - Cambiar Order → CANCELLED
    - Liberar tickets en Redis (INCRBY)
    - Publicar OrderCancelledEvent
- [ ] **Dead Letter Queue (DLQ)**:
  - Topic: `order.created.DLQ`
  - Configurar retry (3 intentos con backoff)
  - Si falla definitivamente → DLQ
  - Alertar/monitorear mensajes en DLQ

---

## Semana 6: Manejo de Errores y Consistencia

### 6.1 - Dead Letter Queue (DLQ) Configuración
- [x] **DLQ Topics**:
  - Topics creados: `order.created.DLQ`, `payment.processed.DLQ`
- [ ] **DLQ Strategy - Retries**:
  - Retry attempts: 3
  - Retry backoff: 1s, 5s, 30s
  - Configurar en Spring Kafka
- [ ] **DLQ Consumer**:
  - Listener para procesar mensajes fallidos
  - Loguear para análisis
  - Almacenar en tabla `failed_events` para retry manual
- [ ] **Monitoring**:
  - Métricas de mensajes en DLQ
  - Alertar si DLQ crece

### 6.2 - Idempotencia en Todos los Servicios
- [ ] **Order-service**:
  - Verificar orderId no existe antes de crear
  - Usar evento correlationId para deduplicar
- [ ] **Payment-service**:
  - Tabla processed_payments con orderId
  - Check antes de procesar
- [ ] **Event-service**:
  - Verificar eventId no duplicado en sincronización

### 6.3 - Consistencia Eventual
- [ ] **Outbox Pattern (Opcional)**:
  - Escribir evento en tabla outbox
  - Scheduled job publica a Kafka
  - Más confiable que publicar directo
- [ ] **Reconciliation Job**:
  - Job periódico que verifica:
    - Órdenes PENDING con TTL vencido
    - Tickets en Redis vs Orders en DB
    - Consistency check
  - Corregir inconsistencias automáticamente

### 6.4 - Flujo Completo con Kafka
- [ ] **Happy Path con Saga**:
  ```
  Cliente → POST /orders
       ↓
  Order-service: DECRBY Redis, crea PENDING
       ↓
  Order-service: Publica OrderCreatedEvent
       ↓
  Payment-service: Recibe, procesa (2s delay)
       ↓
  Payment-service: Publica PaymentProcessedEvent (80%)
       ↓
  Order-service: Recibe, cambia CONFIRMED, libera Redis reservation
  ```
- [ ] **Failure Path**:
  ```
  Payment-service: Publica PaymentFailedEvent (20%)
       ↓
  Order-service: Recibe, CANCELLED, INCRBY Redis
  ```
- [ ] **Timeout Path** (sin Kafka, solo Redis TTL):
  ```
  Redis TTL expira
       ↓
  Scheduled job: detecta PENDING vencidas
       ↓
  CANCELLED + INCRBY Redis
  ```

### 6.5 - Tests de Integración
- [ ] **Test Saga Completo**:
  - Crear orden → esperar PaymentProcessedEvent → verificar CONFIRMED
- [ ] **Test Compensación**:
  - Forzar PaymentFailed → verificar CANCELLED y tickets liberados
- [ ] **Test DLQ**:
  - Simular consumer failure → verificar mensaje en DLQ

---

## Dependencias Entre Tareas

```
Semana 5 ──────────────────────────────────────
  5.1 Kafka Setup         ──> Depende de Sprint 1 (docker-compose)
  5.2 Event Publishers   ──> Depende de 5.1
  5.3 Order Saga         ──> Depende de 5.1, 5.2
  5.4 Payment Service    ──> Depende de 5.1
  5.5 DLQ Listeners      ──> Depende de 5.3, 5.4

Semana 6 ──────────────────────────────────────
  6.1 DLQ Configuration  ──> Depende de 5.5
  6.2 Idempotency        ──> Depende de 5.3, 5.4
  6.3 Consistency        ──> Depende de 6.2
  6.4 Complete Flow      ──> Depende de 5.3, 5.4, 5.5, 6.1
  6.5 Integration Tests  ──> Depende de 6.4
```

---

## Criterios de Aceptación

- [ ] Kafka topics creados y accesibles
- [ ] OrderCreatedEvent publicado al crear orden
- [ ] Payment-service responde (80% success, 20% fail, 2s delay)
- [ ] Pago exitoso → orden CONFIRMED
- [ ] Pago fallido → orden CANCELLED, tickets liberados
- [ ] Mensaje fallido 3 veces → va a DLQ
- [ ] Idempotencia funciona (mismo evento no procesa 2 veces)
- [ ] Tests de integración pasan
- [ ] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Publicar eventos de disponibilidad |
| order-service | 8083 | Saga orchestrator, estados |
| payment-service | 8084 | Procesar pagos simulados |
| kafka | 9092 | Message broker |
| kafdrop | 9000 | Kafka UI (opcional) |

---

## Estructura de Eventos Kafka

| Topic | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| order.created | order-service | payment-service | orderId, userId, eventId, quantity, amount |
| payment.processed | payment-service | order-service | orderId, transactionId, status |
| payment.failed | payment-service | order-service | orderId, reason |
| order.confirmed | order-service | notifications | orderId, userId |
| order.cancelled | order-service | notifications | orderId, userId, reason |

---

## Siguiente Sprint (Semana 7-8)

- Elasticsearch para búsqueda avanzada de eventos
- OpenTelemetry para tracing distribuido
- Prometheus & Grafana para métricas
- Dashboard de ventas por segundo
