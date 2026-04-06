# Sprint 3: Desacoplamiento y Event-Driven (Semanas 5-6)

## Resumen
Introducir Kafka para desacoplar servicios mediante el patrón Saga en coreografía. Implementar el servicio de pagos simulado y configurar Dead Letter Queues para manejo de mensajes fallidos.

---

## Semana 5: Patrón Saga (Coreografía)

### 5.1 - Infraestructura Kafka
- [x] **Docker Compose**:
  - [x] Agregar Kafka (puerto 9092)
  - [x] Agregar Zookeeper/KRaft
  - [x] Agregar Kafka UI (kafdrop o kafka-manager) para debugging
- [x] **Kafka Configuration**:
  - [x] Crear topics: `payment.processed`, `payment.failed`, `order.confirmed`, `order.cancelled`
  - [x] ~~Crear topic `order.created`~~ → eliminado (no aplica en flujo de pago manual)
  - [x] Configurar particiones por eventId (3 particiones)
  - [x] Configurar retención apropiada (7 días prod / 14 días local+dev)
- [ ] **Spring Kafka Dependencies**:
  - [ ] Agregar spring-kafka en event-service → ❌ pendiente (Fase 4)
  - [x] Agregar spring-kafka en order-service
  - [x] Agregar spring-kafka en payment-service
  - [x] Configurar KafkaTemplate en order-service y payment-service
  - [x] Configurar KafkaListeners en order-service (con ErrorHandlingDeserializer)

### 5.2 - Event-service: Publicar Eventos
- [ ] **Eventos a Publicar**:
  - [ ] `TicketAvailabilityChanged` - Cuando cambia disponibilidad
  - [ ] `EventCreated` - Nuevo evento creado
  - [ ] `EventUpdated` - Evento modificado
- [ ] **Kafka Producer**:
  - [ ] Crear `EventPublisher` service
  - [ ] Configurar serialización JSON
  - [ ] Implementar retry con exponential backoff
  - [ ] Incluir correlationId para tracing

### 5.3 - Order-service: Saga Orchestrator (Coreografía)
- [x] **Transiciones Basadas en Eventos**:
  - [x] Escuchar `PaymentProcessedEvent` → Order(CONFIRMED)
  - [x] Escuchar `PaymentFailedEvent` → Order(CANCELLED), liberar stock
  - [x] ~~Escuchar `OrderCreatedEvent` → Iniciar saga~~ → eliminado (no aplica)
- [x] **Publicar Eventos**:
  - [x] ~~`OrderCreatedEvent` → Inicia saga~~ → eliminado
  - [x] `OrderConfirmedEvent` → Saga completada
  - [x] `OrderCancelledEvent` → Saga compensada
- [x] **Compensaciones**:
  - [x] Si pago falla → INCRBY en Redis para liberar tickets
  - [x] Marcar orden como CANCELLED
  - [x] Publicar evento de cancelación

### 5.4 - Payment-service: Procesamiento de Pagos
- [x] **💳 Servicio Simulado**:
  - [x] 80% probabilidad de éxito
  - [x] 20% probabilidad de fallo
  - [x] Delay de 2 segundos antes de responder
- [x] ~~**Escuchar Eventos**:~~
  - [x] ~~`@KafkaListener` en topic `order.created`~~ → eliminado
  - [x] ~~Procesar payment (lógica simulada)~~ → el pago se dispara por HTTP, no por Kafka
- [x] **Publicar Resultados**:
  - [x] `PaymentProcessedEvent` → Éxito
  - [x] `PaymentFailedEvent` → Fallo (con reason)
- [x] **Idempotencia**:
  - [x] Verificar si payment ya fue procesado (por orderId)
  - [x] No procesar dos veces el mismo payment
  - [x] Tabla `processed_payments` con orderId único
  - [x] Retorna resultado cacheado si ya fue procesado

### 5.5 - Order-service: Transiciones de Estado
- [ ] **Listeners para Resultados de Pago**:
  - [x] `PaymentProcessedEvent` listener:
    - [x] Cambiar Order → CONFIRMED
    - [x] Eliminar clave reservation en Redis
    - [x] Publicar OrderConfirmedEvent
  - [x] `PaymentFailedEvent` listener:
    - [x] Cambiar Order → CANCELLED
    - [x] Liberar tickets en Redis (INCRBY)
    - [x] Publicar OrderCancelledEvent
- [ ] **Dead Letter Queue (DLQ)**:
  - [x] ~~Topic: `order.created.DLQ`~~ → eliminado
  - [x] Configurar retry (3 intentos con backoff de 1s)
  - [x] Si falla definitivamente → DLQ (con ErrorHandlingDeserializer)
  - [ ] Alertar/monitorear mensajes en DLQ

---

## Semana 6: Manejo de Errores y Consistencia

### 6.1 - Dead Letter Queue (DLQ) Configuración
- [ ] **DLQ Topics**:
  - [ ] ~~`order.created.DLQ`~~ → eliminado
  - [x] `payment.processed.DLQ`
- [ ] **DLQ Strategy - Retries**:
  - [x] Retry attempts: 3
  - [ ] Retry backoff: 1s, 5s, 30s → actualmente 1s fijo (no exponencial)
  - [x] Configurar en Spring Kafka
- [ ] **DLQ Consumer**:
  - [ ] Listener para procesar mensajes fallidos
  - [ ] Loguear para análisis
  - [ ] Almacenar en tabla `failed_events` para retry manual
- [ ] **Monitoring**:
  - [ ] Métricas de mensajes en DLQ
  - [ ] Alertar si DLQ crece

### 6.2 - Idempotencia en Todos los Servicios
- [x] **Order-service**:
  - [x] Validación de eventos duplicados en PaymentResultListener (verifica estado != PENDING)
  - [x] Log explícito cuando se detecta evento duplicado
- [x] **Payment-service**:
  - [x] Tabla processed_payments con orderId único
  - [x] Check antes de procesar
  - [x] Retorna resultado cacheado sin re-procesar
- [ ] **Event-service**:
  - [ ] Verificar eventId no duplicado en sincronización

### 6.3 - Consistencia Eventual
- [ ] **Outbox Pattern (Opcional)**:
  - [ ] Escribir evento en tabla outbox
  - [ ] Scheduled job publica a Kafka
  - [ ] Más confiable que publicar directo
- [ ] **Reconciliation Job**:
  - [ ] Job periódico que verifica:
    - [ ] Órdenes PENDING con TTL vencido
    - [ ] Tickets en Redis vs Orders en DB
    - [ ] Consistency check
  - [ ] Corregir inconsistencias automáticamente

### 6.4 - Flujo Completo con Kafka
- [ ] **Happy Path con Saga** (adaptado a pago manual):
  ```
  Cliente → POST /orders
       ↓
  Order-service: DECRBY Redis, crea PENDING
       ↓
  Cliente → POST /payments/process (manual desde checkout UI)
       ↓
  Payment-service: Recibe, procesa (2s delay)
       ↓
  Payment-service: Publica PaymentProcessedEvent (80%)
       ↓
  Order-service: Recibe, cambia CONFIRMED, libera Redis reservation
  ```
  - [x] Cliente → POST /orders → PENDING + Redis reservation
  - [x] Order-service: DECRBY Redis, crea PENDING
  - [x] Cliente → POST /payments/process (manual desde checkout UI)
  - [x] Payment-service: procesa (2s delay, 80% éxito)
  - [x] Payment-service: Publica PaymentProcessedEvent
  - [x] Order-service: Recibe, cambia CONFIRMED, libera Redis reservation
- [x] **Failure Path**:
  ```
  Payment-service: Publica PaymentFailedEvent (20%)
       ↓
  Order-service: Recibe, CANCELLED, INCRBY Redis
  ```
  - [x] Payment-service: Publica PaymentFailedEvent
  - [x] Order-service: Recibe, CANCELLED, INCRBY Redis
- [x] **Timeout Path** (sin Kafka, solo Redis TTL):
  ```
  Redis TTL expira
       ↓
  Scheduled job: detecta PENDING vencidas
       ↓
  CANCELLED + INCRBY Redis
  ```
  - [x] Redis TTL expira
  - [x] Scheduled job detecta PENDING vencidas
  - [x] CANCELLED + INCRBY Redis

### 6.5 - Tests de Integración
- [ ] **Test Saga Completo**:
  - [ ] Crear orden → esperar PaymentProcessedEvent → verificar CONFIRMED
- [ ] **Test Compensación**:
  - [ ] Forzar PaymentFailed → verificar CANCELLED y tickets liberados
- [ ] **Test DLQ**:
  - [ ] Simular consumer failure → verificar mensaje en DLQ

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

- [x] Kafka topics creados y accesibles (excepto order.created)
- [ ] ~~OrderCreatedEvent publicado al crear orden~~ → eliminado (flujo manual)
- [x] Payment-service responde (80% success, 20% fail, 2s delay)
- [x] Pago exitoso → orden CONFIRMED
- [x] Pago fallido → orden CANCELLED, tickets liberados
- [x] Mensaje fallido 3 veces → va a DLQ
- [x] Idempotencia funciona (mismo evento no procesa 2 veces)
  - [x] Payment-service: Tabla `processed_payments` evita doble procesamiento
  - [x] Order-service: PaymentResultListener ignora eventos duplicados
  - [x] Tests unitarios de idempotencia pasan
- [ ] Tests de integración pasan
- [x] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Publicar eventos de disponibilidad (pendiente) |
| order-service | 8083 | Saga orchestrator, estados |
| payment-service | 8084 | Procesar pagos simulados |
| kafka | 9092 | Message broker |
| kafdrop | 8089 | Kafka UI (opcional) |

---

## Estructura de Eventos Kafka

| Topic | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| ~~order.created~~ | ~~order-service~~ | ~~payment-service~~ | **Eliminado** - no aplica en flujo manual |
| payment.processed | payment-service | order-service | orderId, transactionId, amount |
| payment.failed | payment-service | order-service | orderId, reason |
| order.confirmed | order-service | notifications (futuro) | pendiente |
| order.cancelled | order-service | notifications (futuro) | pendiente |

---

## Siguiente Sprint (Semana 7-8)

- Elasticsearch para búsqueda avanzada de eventos
- OpenTelemetry para tracing distribuido
- Prometheus & Grafana para métricas
- Dashboard de ventas por segundo
