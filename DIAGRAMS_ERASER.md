# 📊 Diagramas Vento App — Eraser.io

Complemento visual de [ARCHITECTURE.md](./ARCHITECTURE.md). Cada bloque de código está listo para copiar y pegar en [app.eraser.io](https://app.eraser.io) y generar el diagrama.

---

## Índice

1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Estructura de Módulos del Monorepo](#2-estructura-de-módulos-del-monorepo)
3. [ERD — Base de Datos](#3-erd--base-de-datos)
4. [Flujo de Autenticación JWT](#4-flujo-de-autenticación-jwt)
5. [Flujo de Compra de Ticket (Saga)](#5-flujo-de-compra-de-ticket-saga)
6. [Flujo de Expiración de Órdenes](#6-flujo-de-expiración-de-órdenes)
7. [Topics Kafka y Flujo de Mensajes](#7-topics-kafka-y-flujo-de-mensajes)
8. [Sincronización con Elasticsearch](#8-sincronización-con-elasticsearch)
9. [Stack de Observabilidad](#9-stack-de-observabilidad)

---

## 1. Arquitectura General del Sistema

Vista completa del sistema: todos los componentes, sus relaciones y tecnologías.

```
colorMode bold
styleMode plain
typeface clean
direction right

// ─── Cliente ───────────────────────────────────────────────
User [icon: user, color: gray]

// ─── Frontend ──────────────────────────────────────────────
Frontend [icon: angular, color: red, label: "Frontend\nAngular 21 · :4200"]

// ─── Identidad ─────────────────────────────────────────────
Keycloak [icon: lock, color: orange, label: "Keycloak 26\n:8180"]

// ─── API Gateway ───────────────────────────────────────────
Gateway [icon: cloud, color: blue, label: "API Gateway\nSpring Cloud Gateway · :8080"]

// ─── Microservicios ────────────────────────────────────────
Services {
  EventService [icon: java, color: green, label: "Event Service\n:8082"]
  OrderService [icon: java, color: green, label: "Order Service\n:8083"]
  PaymentService [icon: java, color: green, label: "Payment Service\n:8084"]
}

// ─── Bases de datos ────────────────────────────────────────
Databases {
  PGEvents [icon: postgresql, color: blue, label: "PostgreSQL\nevents · :5432"]
  PGOrders [icon: postgresql, color: blue, label: "PostgreSQL\norders · :5433"]
  PGPayments [icon: postgresql, color: blue, label: "PostgreSQL\npayments · :5434"]
}

// ─── Cache / Mensajería ────────────────────────────────────
Infra {
  Redis [icon: redis, color: red, label: "Redis 7\n:6379"]
  Kafka [icon: kafka, color: black, label: "Kafka 4.1\n:9092/9093"]
}

// ─── Búsqueda ──────────────────────────────────────────────
Search {
  ES [icon: elasticsearch, color: yellow, label: "Elasticsearch 8\n:9200"]
  Kibana [icon: kibana, color: yellow, label: "Kibana\n:5601"]
}

// ─── Observabilidad ────────────────────────────────────────
Observability {
  Prometheus [icon: prometheus, color: orange, label: "Prometheus\n:9090"]
  Grafana [icon: grafana, color: orange, label: "Grafana\n:3000"]
  Jaeger [icon: jaeger, color: purple, label: "Jaeger\n:16686"]
  Loki [icon: database, color: purple, label: "Loki\n:3100"]
  OTel [icon: monitor, color: gray, label: "OTel Collector\n:4317/4318"]
}

// ─── Conexiones ────────────────────────────────────────────
User > Frontend: HTTP
Frontend > Keycloak: Auth / Token
Frontend > Gateway: REST + Bearer JWT

Gateway > Keycloak: Valida JWT
Gateway > EventService: /api/events/**
Gateway > OrderService: /api/orders/**
Gateway > PaymentService: /api/payments/**

EventService > PGEvents
OrderService > PGOrders
PaymentService > PGPayments

OrderService > Redis: Reserva tickets\n(TTL 5 min)
EventService > Redis: Inventario atómico

OrderService > EventService: Feign\nverifica disponibilidad
OrderService --> Kafka: order.confirmed\norder.cancelled
PaymentService --> Kafka: payment.processed\npayment.failed
EventService --> Kafka: event.created/updated/deleted

EventService > ES: Indexa eventos
Kibana > ES

EventService --> OTel
OrderService --> OTel
PaymentService --> OTel
Gateway --> OTel
OTel > Prometheus
OTel > Loki
OTel > Jaeger
Grafana > Prometheus
Grafana > Loki
Grafana > Jaeger
```

---

## 2. Estructura de Módulos del Monorepo

Organización interna del monorepo, módulos Gradle y sus dependencias.

```
colorMode bold
styleMode plain
typeface clean
direction down

// ─── Módulo compartido ─────────────────────────────────────
Common [icon: package, color: gray, label: "common\njava-library"]

CommonContents [icon: file, color: gray, label: "DTOs · Enums\nExcepciones · KafkaTopics\nGlobalExceptionHandler\nAuditableEntity · UserContext"]

Common > CommonContents

// ─── Módulos Microservicio ──────────────────────────────────
Monorepo {
  Gateway [icon: cloud, color: blue, label: "api-gateway\nSpring Cloud Gateway\nWebFlux · OAuth2"]
  EventSvc [icon: java, color: green, label: "event-service\nSpring MVC\nJPA · Kafka · ES · Redis"]
  OrderSvc [icon: java, color: green, label: "order-service\nSpring MVC\nJPA · Kafka · Feign · Redis"]
  PaymentSvc [icon: java, color: green, label: "payment-service\nSpring MVC\nJPA · Kafka"]
}

// ─── Frontend ──────────────────────────────────────────────
Frontend [icon: angular, color: red, label: "frontend\nAngular 21\nTailwind v4 · pnpm"]

// ─── Dependencias ──────────────────────────────────────────
Common > Gateway: compileOnly
Common > EventSvc: implementation
Common > OrderSvc: implementation
Common > PaymentSvc: implementation

Gateway > EventSvc: routes
Gateway > OrderSvc: routes
Gateway > PaymentSvc: routes

OrderSvc > EventSvc: Feign HTTP

Frontend > Gateway: REST API
```

---

## 3. ERD — Base de Datos

Entidades JPA de los tres microservicios con campos y relaciones.

```
// ─── event-service (postgres-events :5432) ─────────────────
events {
  id UUID pk
  name varchar
  description text
  event_date timestamp
  venue varchar
  total_capacity int
  available_tickets int
  price decimal(10,2)
  latitude double
  longitude double
  created_at timestamp
  updated_at timestamp
  version bigint
}

tickets {
  id UUID pk
  event_id UUID
  order_id UUID
  user_id UUID
  access_code varchar(12) unique
  status varchar "ACTIVE | USED | CANCELLED"
  created_at timestamp
  updated_at timestamp
  version bigint
}

// ─── order-service (postgres-orders :5433) ─────────────────
orders {
  id UUID pk
  user_id UUID
  event_id UUID
  quantity int
  total_amount decimal(10,2)
  status varchar "PENDING | CONFIRMED | CANCELLED | EXPIRED"
  created_at timestamp
  updated_at timestamp
  version bigint
}

failed_events {
  id UUID pk
  topic varchar(200)
  key varchar(500)
  payload text
  exception text
  failed_at timestamp
  processed boolean
  processed_at timestamp
}

// ─── payment-service (postgres-payments :5434) ─────────────
processed_payments {
  id UUID pk
  order_id UUID unique
  user_id UUID
  amount decimal(10,2)
  currency varchar(3)
  status varchar "COMPLETED | FAILED"
  transaction_id varchar(100) unique
  failure_reason varchar(500)
  created_at timestamp
  updated_at timestamp
  version bigint
}

// ─── Relaciones lógicas (cross-service via UUID) ────────────
tickets.event_id > events.id
tickets.order_id > orders.id
processed_payments.order_id > orders.id
orders.event_id > events.id
```

---

## 4. Flujo de Autenticación JWT

Login del usuario, obtención del token y propagación de identidad a través del gateway.

```
typeface clean

// ─── Actores ───────────────────────────────────────────────
Browser [icon: monitor, color: gray]
Angular [icon: angular, color: red]
Keycloak [icon: lock, color: orange]
Gateway [icon: cloud, color: blue]
Microservice [icon: java, color: green]

// ─── Secuencia ─────────────────────────────────────────────
Browser > Angular: Introduce credenciales
Angular > Keycloak: POST /realms/vento/protocol/openid-connect/token\ngrant_type=password · client_id=vento-frontend
Keycloak > Angular: access_token + refresh_token (JWT)
Angular > Angular: Guarda tokens en localStorage\nExpiry = exp - 60s

Angular > Gateway: GET /api/events\nAuthorization: Bearer <access_token>
Gateway > Keycloak: Valida firma JWT\n(OAuth2 Resource Server)
Keycloak > Gateway: Token válido · claims

Gateway > Microservice: GET /api/events\nX-User-Id: <sub>\nX-User-Roles: <realm_access.roles>
Microservice > Gateway: 200 OK + datos
Gateway > Angular: 200 OK + datos

// ─── Flujo de refresh ──────────────────────────────────────
Angular > Gateway: GET /api/orders\nBearer <token expirado>
Gateway > Angular: 401 Unauthorized
Angular > Keycloak: POST /token\ngrant_type=refresh_token
alt Token de refresh válido
  Keycloak > Angular: Nuevo access_token
  Angular > Gateway: Reintenta petición original
  Gateway > Angular: 200 OK + datos
else Token de refresh expirado
  Angular > Browser: Logout + redirect /login
end
```

---

## 5. Flujo de Compra de Ticket (Saga)

Saga por coreografía completa: desde la solicitud del usuario hasta la confirmación o cancelación de la orden.

```
typeface clean

// ─── Actores ───────────────────────────────────────────────
User [icon: user, color: gray]
Gateway [icon: cloud, color: blue]
OrderSvc [icon: java, color: green, label: "Order Service"]
EventSvc [icon: java, color: green, label: "Event Service"]
Redis [icon: redis, color: red]
Kafka [icon: kafka, color: black]
PaymentSvc [icon: java, color: green, label: "Payment Service"]
PGOrders [icon: postgresql, color: blue, label: "DB Orders"]
PGEvents [icon: postgresql, color: blue, label: "DB Events"]
PGPayments [icon: postgresql, color: blue, label: "DB Payments"]

// ─── Paso 1: Crear Orden ────────────────────────────────────
User > Gateway: POST /api/orders\n{eventId, quantity}
Gateway > OrderSvc: POST /api/orders\nX-User-Id + X-User-Roles

OrderSvc > EventSvc: Feign: GET /api/events/{id}/availability\n¿Hay {quantity} tickets?
alt No hay suficientes tickets
  EventSvc > OrderSvc: 409 Insufficient tickets
  OrderSvc > Gateway: 409 Conflict
  Gateway > User: Error: Sin disponibilidad
end

EventSvc > Redis: DECRBY vento:event:{id}:available_tickets
Redis > EventSvc: OK (valor >= 0)
EventSvc > OrderSvc: 200 OK · precio unitario

OrderSvc > PGOrders: INSERT orders (status=PENDING)
OrderSvc > Redis: SET vento:reservation:{orderId}\n(TTL 300s)
OrderSvc > Kafka: Publica order.confirmed\n{orderId, userId, eventId, amount}
OrderSvc > Gateway: 201 Created · {orderId, status: PENDING}
Gateway > User: 201 Created

// ─── Paso 2: Procesar Pago ─────────────────────────────────
Kafka > PaymentSvc: Consume order.confirmed
PaymentSvc > PGPayments: INSERT processed_payments
PaymentSvc > PaymentSvc: Simula procesamiento de pago

alt Pago exitoso (90%)
  PaymentSvc > Kafka: Publica payment.processed\n{orderId, status: COMPLETED}
else Pago fallido (10%)
  PaymentSvc > Kafka: Publica payment.failed\n{orderId, reason}
end

// ─── Paso 3a: Confirmación ─────────────────────────────────
Kafka > OrderSvc: Consume payment.processed
OrderSvc > PGOrders: UPDATE orders SET status=CONFIRMED
OrderSvc > Redis: DEL vento:reservation:{orderId}
OrderSvc > Kafka: Publica order.confirmed (estado final)
Kafka > EventSvc: Consume order.confirmed (estado final)
EventSvc > PGEvents: INSERT tickets (status=ACTIVE)

// ─── Paso 3b: Cancelación por pago fallido ─────────────────
Kafka > OrderSvc: Consume payment.failed
OrderSvc > PGOrders: UPDATE orders SET status=CANCELLED
OrderSvc > Redis: DEL vento:reservation:{orderId}
OrderSvc > EventSvc: Feign: POST /api/events/{id}/release\n+{quantity} tickets
EventSvc > Redis: INCRBY vento:event:{id}:available_tickets
EventSvc > PGEvents: UPDATE available_tickets +{quantity}
```

---

## 6. Flujo de Expiración de Órdenes

Job periódico que expira órdenes PENDING que superaron el TTL de la reserva (5 minutos).

```
colorMode bold
styleMode plain
typeface clean
direction down

// ─── Nodos ─────────────────────────────────────────────────
Start [shape: oval, label: "OrderExpirationJob\ninicia (cada 60s, delay 30s)"]
Query [shape: rectangle, label: "Busca órdenes con\nstatus=PENDING\ncreatedAt < ahora - 5min"]
HasExpired [shape: diamond, label: "¿Hay órdenes\nexpiradas?"]
NoOp [shape: rectangle, label: "No hace nada\n(espera próximo ciclo)"]
ForEach [shape: rectangle, label: "Para cada orden expirada"]
UpdateStatus [shape: rectangle, label: "UPDATE orders\nstatus = EXPIRED"]
DeleteReservation [shape: rectangle, label: "DEL Redis\nvento:reservation:{orderId}"]
ReleaseTickets [shape: rectangle, label: "Feign → EventService\nPOST /api/events/{id}/release\n+quantity tickets"]
UpdateES [shape: rectangle, label: "EventService\nINCSRBY Redis\n+ UPDATE PostgreSQL\n+ Reindexar ES"]
End [shape: oval, label: "Fin del ciclo\n(espera 60s)"]

// ─── Flujo ─────────────────────────────────────────────────
Start > Query
Query > HasExpired
HasExpired > NoOp: No
HasExpired > ForEach: Sí
ForEach > UpdateStatus
UpdateStatus > DeleteReservation
DeleteReservation > ReleaseTickets
ReleaseTickets > UpdateES
UpdateES > ForEach: siguiente orden
ForEach > End: sin más órdenes
NoOp > End
End > Start
```

---

## 7. Topics Kafka y Flujo de Mensajes

Mapa completo de productores, topics y consumidores en el bus de eventos.

```
colorMode bold
styleMode plain
typeface clean
direction right

// ─── Productores ───────────────────────────────────────────
Producers {
  OrderProducer [icon: java, color: green, label: "Order Service\nProducer"]
  PaymentProducer [icon: java, color: green, label: "Payment Service\nProducer"]
  EventProducer [icon: java, color: green, label: "Event Service\nProducer"]
}

// ─── Broker ────────────────────────────────────────────────
Broker {
  T1 [icon: kafka, color: black, label: "order.confirmed\n3 particiones"]
  T2 [icon: kafka, color: black, label: "order.cancelled\n3 particiones"]
  T3 [icon: kafka, color: black, label: "payment.processed\n3 particiones"]
  T4 [icon: kafka, color: black, label: "payment.failed\n3 particiones"]
  T5 [icon: kafka, color: black, label: "event.created\n3 particiones"]
  T6 [icon: kafka, color: black, label: "event.updated\n3 particiones"]
  T7 [icon: kafka, color: black, label: "event.deleted\n3 particiones"]
  DLQ1 [icon: kafka, color: red, label: "payment.processed.DLQ\n1 partición"]
  DLQ2 [icon: kafka, color: red, label: "payment.failed.DLQ\n1 partición"]
}

// ─── Consumidores ──────────────────────────────────────────
Consumers {
  PaymentConsumer [icon: java, color: green, label: "Payment Service\nConsumer"]
  OrderConsumer [icon: java, color: green, label: "Order Service\nConsumer"]
  EventConsumer [icon: java, color: green, label: "Event Service\nConsumer"]
  DLQConsumer [icon: java, color: orange, label: "Order Service\nDLQ Consumer"]
}

// ─── Publicaciones ─────────────────────────────────────────
OrderProducer > T1
OrderProducer > T2
PaymentProducer > T3
PaymentProducer > T4
EventProducer > T5
EventProducer > T6
EventProducer > T7

// ─── Suscripciones ─────────────────────────────────────────
T1 > PaymentConsumer: Procesa pago
T3 > OrderConsumer: Confirma orden + crea tickets
T4 > OrderConsumer: Cancela orden + libera tickets
T5 > EventConsumer: Indexa en ES
T6 > EventConsumer: Actualiza índice ES
T7 > EventConsumer: Elimina de índice ES
T2 > EventConsumer: Libera inventario

// ─── Dead Letter Queues ────────────────────────────────────
T3 --> DLQ1: Error al consumir
T4 --> DLQ2: Error al consumir
DLQ1 > DLQConsumer: Análisis / reprocesamiento manual
DLQ2 > DLQConsumer: Análisis / reprocesamiento manual

legend {
  [connection: >, label: "Sincrónico (consume)"]
  [connection: -->, label: "DLQ (fallo)"]
}
```

---

## 8. Sincronización con Elasticsearch

Doble mecanismo de sincronización del índice `events`: tiempo real via Kafka + job periódico fallback.

```
colorMode bold
styleMode plain
typeface clean
direction down

// ─── Nodos ─────────────────────────────────────────────────
Admin [shape: oval, label: "Admin / API\nCRUD de eventos"]
EventSvc [shape: rectangle, icon: java, color: green, label: "Event Service"]
PGEvents [shape: rectangle, icon: postgresql, color: blue, label: "PostgreSQL\nevents"]
KafkaBroker [shape: rectangle, icon: kafka, color: black, label: "Kafka Broker\nevent.created / updated / deleted"]
ESListener [shape: rectangle, color: green, label: "EventChangeListener\n(Kafka Consumer)"]
ES [shape: rectangle, icon: elasticsearch, color: yellow, label: "Elasticsearch 8\níndice: events"]
SyncJob [shape: rectangle, color: orange, label: "ElasticsearchSyncJob\ncada 5 min (delay 1 min)"]
PGSource [shape: rectangle, icon: postgresql, color: blue, label: "PostgreSQL\n(fuente de verdad)"]
Kibana [shape: rectangle, icon: kibana, color: yellow, label: "Kibana\nbúsquedas / dashboards"]

// ─── Flujo tiempo real ─────────────────────────────────────
Admin > EventSvc: POST/PUT/DELETE /api/events
EventSvc > PGEvents: Persiste cambio
EventSvc > KafkaBroker: Publica evento de cambio
KafkaBroker > ESListener: Consume mensaje
ESListener > ES: Indexa / actualiza / elimina doc

// ─── Flujo periódico (fallback) ────────────────────────────
SyncJob > PGSource: SELECT * FROM events (full scan)
PGSource > SyncJob: Todos los eventos
SyncJob > ES: Bulk upsert (reconciliación completa)

// ─── Consultas ─────────────────────────────────────────────
EventSvc > ES: Búsqueda full-text\ngeo_point · autocomplete edge-ngram
Kibana > ES: Dashboards / consultas

legend {
  [connection: >, label: "Tiempo real"]
  [connection: -->, label: "Periódico (cada 5 min)"]
}
```

---

## 9. Stack de Observabilidad

Pipeline completo de métricas, logs y trazas distribuidas.

```
colorMode bold
styleMode plain
typeface clean
direction right

// ─── Fuentes ───────────────────────────────────────────────
Sources {
  GW [icon: cloud, color: blue, label: "API Gateway\n:8080"]
  ES2 [icon: java, color: green, label: "Event Service\n:8082"]
  OS [icon: java, color: green, label: "Order Service\n:8083"]
  PS [icon: java, color: green, label: "Payment Service\n:8084"]
}

// ─── Collector ─────────────────────────────────────────────
OTel [icon: monitor, color: gray, label: "OTel Collector\n:4317 (gRPC)\n:4318 (HTTP)"]

// ─── Backends ──────────────────────────────────────────────
Backends {
  Prometheus [icon: prometheus, color: orange, label: "Prometheus\n:9090\nmétrica scrape"]
  Loki [icon: database, color: purple, label: "Loki\n:3100\nlogs OTLP"]
  Jaeger [icon: jaeger, color: purple, label: "Jaeger\n:16686\ntraces OTLP"]
}

// ─── Visualización ─────────────────────────────────────────
Grafana [icon: grafana, color: orange, label: "Grafana\n:3000\ndashboards unificados"]

// ─── Pipeline ──────────────────────────────────────────────
GW --> OTel: OTLP (métricas + logs + trazas)
ES2 --> OTel: OTLP
OS --> OTel: OTLP
PS --> OTel: OTLP

OTel > Prometheus: Exporta métricas
OTel > Loki: Exporta logs
OTel > Jaeger: Exporta trazas

Grafana > Prometheus: Data source
Grafana > Loki: Data source
Grafana > Jaeger: Data source

legend {
  [connection: -->, label: "Push OTLP"]
  [connection: >, label: "Pull / Query"]
}
```

---

> **Nota:** Los iconos disponibles en eraser.io incluyen `angular`, `java`, `postgresql`, `redis`, `kafka`, `elasticsearch`, `kibana`, `prometheus`, `grafana`, `jaeger`, `cloud`, `lock`, `user`, `monitor`, `package`, `database`, `file`. Si algún icono no está disponible, eraser.io lo omite sin error.
