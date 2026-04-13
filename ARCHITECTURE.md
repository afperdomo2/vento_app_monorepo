# 🏛️ Arquitectura — Vento App

Documentación técnica de la arquitectura del sistema de venta de tickets para eventos.

---

## 📋 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Diagrama del Sistema](#-diagrama-del-sistema)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Módulo Common](#-módulo-common)
5. [API Gateway](#️-api-gateway)
6. [Event Service](#-event-service)
7. [Order Service](#-order-service)
8. [Payment Service](#-payment-service)
9. [Frontend Angular](#-frontend-angular)
10. [Mensajería — Kafka](#-mensajería--kafka)
11. [Caché — Redis](#️-caché--redis)
12. [Búsqueda — Elasticsearch](#-búsqueda--elasticsearch)
13. [Autenticación — Keycloak](#-autenticación--keycloak)
14. [Observabilidad](#-observabilidad)
15. [Infraestructura Docker](#-infraestructura-docker)
16. [Decisiones de Diseño](#-decisiones-de-diseño)

---

## 🌐 Visión General

Vento App es una plataforma de venta de tickets para eventos construida con **arquitectura de microservicios**. Cada servicio tiene su propia base de datos (patrón Database-per-Service), se comunica asíncronamente a través de Kafka para operaciones críticas de negocio, y se expone al exterior a través de un API Gateway centralizado.

**Flujo principal del sistema:**

```
Usuario → Frontend Angular → API Gateway → Microservicios
                                      ↓
                               Keycloak (JWT)
                                      ↓
                    ┌─────────────────────────────────┐
                    │         Apache Kafka             │
                    └─────────────────────────────────┘
                                      ↓
              Saga: Order → Payment → Confirm/Cancel
```

---

## 🗺️ Diagrama del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE / NAVEGADOR                            │
│                     Angular 21 SPA (localhost:4200)                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP / REST
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY :8080                               │
│              Spring Cloud Gateway + OAuth2 Resource Server              │
│  • Valida JWT contra Keycloak                                           │
│  • Propaga X-User-Id y X-User-Roles como headers                        │
│  • Enruta peticiones a microservicios downstream                        │
└──────────────┬────────────────┬──────────────────┬──────────────────────┘
               │                │                  │
    /api/events/**    /api/orders/**    /api/payments/**
               │                │                  │
               ▼                ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  EVENT SERVICE   │  │  ORDER SERVICE   │  │   PAYMENT SERVICE    │
│    :8082         │  │    :8083         │  │     :8084            │
│                  │  │                  │  │                      │
│ • CRUD eventos   │  │ • Crear pedidos  │  │ • Simular pago       │
│ • Inventario de  │  │ • Gestión saga   │  │ • Idempotencia       │
│   tickets        │  │ • Expiración     │  │ • Publicar resultado │
│ • Búsqueda ES    │  │   automática     │  │                      │
│ • Sincroniza ES  │  │                  │  │                      │
└────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘
         │                     │                        │
         ▼                     ▼                        ▼
┌──────────────┐     ┌──────────────────┐    ┌──────────────────────┐
│ PostgreSQL   │     │ PostgreSQL       │    │ PostgreSQL           │
│ events_db    │     │ orders_db        │    │ payments_db          │
│ :5432        │     │ :5433            │    │ :5434                │
└──────────────┘     └────────┬─────────┘    └──────────────────────┘
                              │
                     ┌────────▼─────────┐
                     │     Redis :6379  │
                     │ Inventario TTL   │
                     └──────────────────┘

                    ┌───────────────────────────┐
                    │      Apache Kafka :9093    │
                    │  (9 topics, 3 particiones) │
                    └───────────────────────────┘

          ┌──────────────┐   ┌───────────┐   ┌──────────────────┐
          │ Keycloak     │   │   Elastic │   │    Grafana       │
          │ :8180        │   │   :9200   │   │    :3000         │
          │ OAuth2/OIDC  │   │  Índice   │   │ + Prometheus     │
          │ Realm: vento │   │  events   │   │ + Loki + Jaeger  │
          └──────────────┘   └───────────┘   └──────────────────┘
```

---

## 🔧 Stack Tecnológico

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Java | 25 | Runtime de todos los microservicios |
| Spring Boot | 3.5.0 | Framework base |
| Spring Cloud | 2025.0.0 | Gateway, Feign, LoadBalancer |
| Spring Cloud Gateway | — | API Gateway (WebFlux reactivo) |
| Spring Security | — | OAuth2 Resource Server |
| Spring Data JPA | — | Persistencia con Hibernate |
| Spring Data Elasticsearch | — | Integración con Elasticsearch |
| Spring Data Redis | — | Caché e inventario de tickets |
| Spring Kafka | — | Productor/Consumidor Kafka |
| OpenFeign | — | Cliente HTTP declarativo (order→event) |
| Micrometer + OTLP | — | Trazas distribuidas (100% sampling) |
| Springdoc OpenAPI | 2.8.9 | Swagger UI automático |
| Lombok | 1.18.38 | Reducción de boilerplate |
| Gradle | 9.4.0 | Build system |

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | ^21.2.0 | Framework SPA |
| TypeScript | ~5.9.2 | Lenguaje de tipado estático |
| Tailwind CSS | v4 | Estilos (CSS-first, `@theme {}`) |
| pnpm | 10.30.3 | Gestor de paquetes |
| Leaflet / ngx-leaflet | — | Mapas interactivos |
| qrcode | — | Generación de QR para tickets |

### Infraestructura

| Servicio | Versión | Rol |
|---|---|---|
| Apache Kafka | 4.1.1 | Mensajería asíncrona |
| PostgreSQL | 16 (alpine) | Base de datos relacional |
| Redis | 7 (alpine) | Caché e inventario |
| Keycloak | 26.0 | Identity Provider OAuth2/OIDC |
| Elasticsearch | 8.18.0 | Búsqueda full-text + geo |
| Kibana | 8.18.0 | UI de Elasticsearch |
| Prometheus | v2.51.0 | Recolección de métricas |
| Grafana OSS | — | Dashboards de observabilidad |
| Loki | — | Agregación de logs |
| Promtail | — | Agente de colección de logs |
| Jaeger | 1.64.0 | Trazas distribuidas |
| OpenTelemetry Collector | — | Pipelines de telemetría |

---

## 📦 Módulo `common/`

Librería Java compartida (`java-library` en Gradle) consumida como `implementation project(':common')` por todos los microservicios. Declarada con starters `compileOnly` para no propagar dependencias de runtime innecesarias.

### Estructura

```
common/src/main/java/com/vento/common/
├── config/
│   └── ExceptionHandlerAutoConfiguration.java  # Auto-registra GlobalExceptionHandler
├── context/
│   └── UserContext.java                         # Thread-local para userId del Gateway
├── dto/
│   ├── ApiResponse.java                         # Wrapper de respuesta estándar
│   ├── event/                                   # DTOs de eventos
│   ├── kafka/                                   # Eventos de dominio Kafka
│   │   ├── OrderConfirmedEvent.java
│   │   ├── OrderCancelledEvent.java
│   │   ├── PaymentProcessedEvent.java
│   │   └── PaymentFailedEvent.java
│   ├── order/                                   # DTOs de pedidos
│   └── payment/                                 # DTOs de pagos
├── enums/
│   ├── OrderStatus.java     # PENDING, CONFIRMED, CANCELLED, EXPIRED
│   ├── PaymentStatus.java   # SUCCESS, FAILED
│   └── TicketStatus.java
├── exception/
│   ├── GlobalExceptionHandler.java        # Manejador RFC 9457 (Problem Details)
│   ├── ResourceNotFoundException.java     # → 404
│   ├── InsufficientTicketsException.java  # → 409
│   ├── BusinessException.java             # Base para errores de negocio
│   ├── AccessDeniedException.java         # → 403
│   ├── PaymentFailedException.java        # → 402
│   ├── OptimisticLockConflictException.java # → 409
│   ├── ExternalServiceException.java      # → 502
│   └── ConflictResolutionService.java     # Resolución de conflictos de concurrencia
└── model/
    └── AuditableEntity.java  # @MappedSuperclass con createdAt, updatedAt, @Version
```

### `AuditableEntity`

Base para todas las entidades JPA del sistema. Proporciona:

- `createdAt` — timestamp de creación (auto-asignado en `@PrePersist`)
- `updatedAt` — timestamp de última modificación (auto-asignado en `@PreUpdate`)
- `@Version Long version` — control de concurrencia optimista (Hibernate)

### `GlobalExceptionHandler`

Implementa el estándar **RFC 9457** (Problem Details for HTTP APIs). Registrado automáticamente en cada microservicio mediante Spring Boot auto-configuration (`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`).

**Formato de respuesta de error:**
```json
{
  "type": "https://vento.app/errors/not-found",
  "title": "Recurso no encontrado",
  "status": 404,
  "detail": "Evento con id 'abc-123' no encontrado",
  "instance": "/api/events/abc-123",
  "service": "event-service",
  "timestamp": "2026-04-12T10:30:00.000"
}
```

### `KafkaTopics`

Clase de constantes que centraliza todos los nombres de topics Kafka:

```java
public final class KafkaTopics {
  public static final String PAYMENT_PROCESSED = "payment.processed";
  public static final String PAYMENT_FAILED = "payment.failed";
  public static final String ORDER_CONFIRMED = "order.confirmed";
  public static final String ORDER_CANCELLED = "order.cancelled";
  public static final String EVENT_CREATED = "event.created";
  public static final String EVENT_UPDATED = "event.updated";
  public static final String EVENT_DELETED = "event.deleted";
  // DLQs...
}
```

---

## 🛡️ API Gateway

**Puerto:** 8080 | **Stack:** Spring Cloud Gateway (WebFlux reactivo)

El único punto de entrada para todo el tráfico externo. Valida autenticación, aplica autorización por ruta, y propaga contexto de usuario a los microservicios downstream.

### Estructura de Paquetes

```
com.vento.gateway/
├── ApiGatewayApplication.java
├── config/
│   ├── SecurityConfig.java     # OAuth2 Resource Server + reglas de autorización
│   └── CorsConfig.java         # CORS externalizado via variables de entorno
├── filter/
│   └── JwtHeaderFilter.java    # Extrae claims JWT → X-User-Id, X-User-Roles
└── exception/
    └── GatewayExceptionHandler.java  # Manejo de errores WebFlux (no usa GlobalExceptionHandler)
```

> ⚠️ El API Gateway usa **WebFlux** (reactivo). No puede compartir el `GlobalExceptionHandler` de `common/` porque ese usa Spring MVC. Tiene su propio handler para errores.

### Reglas de Autorización

| Ruta | Método | Autorización |
|---|---|---|
| `/api/events/**` | `GET` | Pública (sin token) |
| `/api/events/**` | `POST`, `PUT`, `PATCH`, `DELETE` | `ROLE_ADMIN` |
| `/api/orders/**` | Todos | Autenticado (`ROLE_USER` o `ROLE_ADMIN`) |
| `/api/payments/**` | Todos | Autenticado (`ROLE_USER` o `ROLE_ADMIN`) |

### Enrutamiento por Perfil

**Perfil `local`** — microservicios corren en `localhost` con Gradle:
```yaml
routes:
  - id: event-service
    uri: http://localhost:8082
    predicates: [Path=/api/events/**]
  - id: order-service
    uri: http://localhost:8083
    predicates: [Path=/api/orders/**]
  - id: payment-service
    uri: http://localhost:8084
    predicates: [Path=/api/payments/**]
```

**Perfiles `dev`/`prod`** — microservicios en Docker por nombre de contenedor:
```yaml
routes:
  - id: event-service
    uri: http://event-service:8082
    ...
```

### `JwtHeaderFilter`

Filter de Spring Cloud Gateway que se ejecuta en cada request autenticado. Extrae información del JWT y la inyecta como headers HTTP para los microservicios:

| Header | Claim JWT | Descripción |
|---|---|---|
| `X-User-Id` | `sub` | UUID del usuario |
| `X-User-Roles` | `realm_access.roles` | Roles (comma-separated) |

Los microservicios confían directamente en estos headers sin re-validar el JWT.

### Observabilidad del Gateway

- **Métricas:** `/actuator/prometheus` — histogramas de latencia HTTP
- **Trazas:** OTLP al collector en puerto 4318, sampling 100%
- **Health:** `/actuator/health` con detalles completos

---

## 📅 Event Service

**Puerto:** 8082 | **Base de datos:** PostgreSQL `events_db` (:5432) | **Stack:** Spring Boot MVC

Gestiona el ciclo de vida completo de eventos: creación, actualización, eliminación, búsqueda y control de inventario de tickets.

### Estructura de Paquetes (Arquitectura Hexagonal)

```
com.vento.event/
├── EventServiceApplication.java
├── api/
│   └── controller/
│       ├── EventController.java    # CRUD de eventos + disponibilidad
│       └── TicketController.java   # Operaciones de tickets
├── core/
│   ├── model/
│   │   ├── Event.java    # Entidad JPA principal
│   │   └── Ticket.java   # Entidad JPA de tickets
│   ├── service/
│   │   ├── EventService.java        # Lógica de negocio de eventos
│   │   ├── EventSearchService.java  # Búsqueda en Elasticsearch
│   │   ├── InventoryService.java    # Gestión de inventario Redis
│   │   └── TicketService.java       # Gestión de tickets
│   └── job/
│       └── ElasticsearchSyncJob.java  # Sincronización periódica PG → ES
├── infrastructure/
│   ├── config/
│   │   ├── RedisConfig.java
│   │   └── ElasticsearchConfig.java
│   ├── elasticsearch/
│   │   ├── document/
│   │   │   └── EventDocument.java   # Documento ES (índice "events")
│   │   └── repository/
│   │       └── EventSearchRepository.java
│   ├── kafka/
│   │   ├── producer/
│   │   │   └── EventKafkaProducer.java   # Publica event.created/updated/deleted
│   │   ├── consumer/
│   │   │   └── OrderConfirmedConsumer.java  # Marca tickets como confirmados
│   │   └── listener/
│   │       └── EventChangeListener.java    # Sincroniza ES en cambios
│   └── persistence/
│       ├── EventRepository.java
│       └── TicketRepository.java
└── filter/
    └── UserContextFilter.java   # Extrae X-User-Id → UserContext thread-local
```

### Entidades JPA

**`Event`** (tabla `events`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria (auto-generada) |
| `name` | String | Nombre del evento |
| `description` | TEXT | Descripción larga |
| `eventDate` | LocalDateTime | Fecha y hora del evento |
| `venue` | String | Lugar del evento |
| `totalCapacity` | Integer | Capacidad total de tickets |
| `availableTickets` | Integer | Tickets disponibles (decrementado en Redis y PG) |
| `price` | BigDecimal(10,2) | Precio por ticket |
| `latitude` | Double | Coordenada geográfica |
| `longitude` | Double | Coordenada geográfica |
| heredado | — | `createdAt`, `updatedAt`, `version` (AuditableEntity) |

**`Ticket`** (tabla `tickets`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `eventId` | UUID | FK al evento |
| `orderId` | UUID | FK a la orden |
| `userId` | UUID | ID del comprador |
| `accessCode` | String(12) | Código único de acceso |
| `status` | TicketStatus | Estado del ticket |

### Elasticsearch — `EventDocument`

Documento indexado en `events` (creado con `scripts/init-elasticsearch.sh`):

| Campo | Tipo ES | Descripción |
|---|---|---|
| `name` | `text` (analyzer `standard`) | Búsqueda de texto |
| `description` | `text` (analyzer `standard`) | Búsqueda de texto |
| `venue` | `text` (analyzer `standard`) | Búsqueda de texto |
| `location` | `geo_point` | Búsquedas geoespaciales (formato `"lat,lon"`) |
| `eventDate` | `date` | Filtrado por fecha |
| `price` | `double` | Filtrado por precio |
| `availableTickets` | `integer` | Filtrado por disponibilidad |
| `status` | `keyword` | Filtrado exacto |

> El índice incluye el analyzer `autocomplete` (edge-ngram, min=2, max=20) para sugerencias de búsqueda en tiempo real.

### Job de Sincronización ES

`ElasticsearchSyncJob` realiza una sincronización completa PostgreSQL → Elasticsearch:

- **Delay inicial:** 1 minuto tras el arranque
- **Intervalo:** cada 5 minutos (configurable con `vento.elasticsearch.sync.sync-interval-ms`)
- **Activación:** `vento.elasticsearch.sync.enabled=true`

### Flujo de Kafka

| Dirección | Topic | Trigger |
|---|---|---|
| **Produce** | `event.created` | Al crear un evento |
| **Produce** | `event.updated` | Al actualizar un evento |
| **Produce** | `event.deleted` | Al eliminar un evento |
| **Consume** | `order.confirmed` | Marca tickets de la orden como CONFIRMED |

---

## 🛒 Order Service

**Puerto:** 8083 | **Base de datos:** PostgreSQL `orders_db` (:5433) | **Stack:** Spring Boot MVC

Orquesta el ciclo de vida de un pedido usando el **patrón Saga** basado en eventos de Kafka. Coordina la reserva de inventario en Redis, la creación de la orden en PostgreSQL, y la saga de pago.

### Estructura de Paquetes

```
com.vento.order/
├── OrderServiceApplication.java
├── api/
│   └── controller/
│       └── OrderController.java     # REST API de pedidos
├── core/
│   ├── model/
│   │   ├── Order.java          # Entidad JPA de pedidos
│   │   └── FailedEvent.java    # Almacén de mensajes DLQ fallidos
│   ├── service/
│   │   ├── OrderService.java           # Lógica principal del ciclo de vida
│   │   ├── TicketInventoryService.java  # Gestión atómica de inventario Redis
│   │   ├── ReservationService.java      # TTL de reservas en Redis
│   │   └── DlqService.java             # Procesamiento de mensajes DLQ
│   └── job/
│       └── OrderExpirationJob.java     # Expira órdenes PENDING > 5 min
├── infrastructure/
│   ├── client/
│   │   └── EventClient.java   # Feign client → event-service
│   ├── config/
│   │   ├── FeignConfig.java
│   │   ├── KafkaConfig.java
│   │   └── RedisConfig.java
│   ├── kafka/
│   │   ├── consumer/
│   │   │   ├── PaymentResultConsumer.java  # Consume payment.processed/failed
│   │   │   └── DlqConsumer.java           # Consume DLQ topics
│   │   └── listener/
│   │       └── PaymentResultListener.java  # Lógica de la saga de pago
│   └── persistence/
│       ├── OrderRepository.java
│       └── FailedEventRepository.java
└── filter/
    └── UserContextFilter.java
```

### Entidades JPA

**`Order`** (tabla `orders`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `userId` | UUID | ID del usuario (del header `X-User-Id`) |
| `eventId` | UUID | ID del evento |
| `quantity` | Integer | Cantidad de tickets |
| `totalAmount` | BigDecimal(10,2) | Precio total |
| `status` | OrderStatus | Estado: `PENDING` / `CONFIRMED` / `CANCELLED` / `EXPIRED` |
| heredado | — | `createdAt`, `updatedAt`, `version` (AuditableEntity) |

**`FailedEvent`** (tabla `failed_events`):

Almacena mensajes DLQ que no pudieron procesarse, para auditoría y reprocesamiento manual.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `topic` | String | Topic Kafka de origen |
| `key` | String | Clave del mensaje |
| `payload` | TEXT | Contenido del mensaje (JSON) |
| `exception` | TEXT | Causa del fallo |
| `failedAt` | LocalDateTime | Timestamp del fallo |
| `processed` | Boolean | Flag de reprocesamiento |

### Saga de Pago — Flujo Completo

```
Usuario
  │
  ▼
POST /api/orders
  │
  ▼
1. Verificar disponibilidad (Feign → event-service)
  │
  ▼
2. Reservar tickets en Redis (DECRBY atómico)
   └─ Key: vento:event:{eventId}:available_tickets
   └─ Si falla → 409 InsufficientTicketsException
  │
  ▼
3. Crear Order en PostgreSQL (status=PENDING)
  │
  ▼
4. Guardar reserva en Redis con TTL 5 min
   └─ Key: vento:reservation:{orderId}
  │
  ▼
5. Decrementar tickets en event-service DB (Feign)
  │
  ▼
Response: 201 Created (orden PENDING)

  ─ ─ ─ ─ (usuario confirma) ─ ─ ─ ─

PUT /api/orders/{id}/confirm
  │
  ▼
POST /api/payments/process → payment-service
  │
  ├── Éxito (80%) → Publica payment.processed
  │     │
  │     ▼
  │   order-service consume payment.processed
  │     │
  │     ▼
  │   Order.status = CONFIRMED
  │   Publica order.confirmed
  │   event-service consume → marca tickets CONFIRMED
  │
  └── Fallo (20%) → Publica payment.failed
        │
        ▼
      order-service consume payment.failed
        │
        ▼
      Order.status = CANCELLED
      Libera inventario Redis
      Libera inventario en event-service (Feign)
      Publica order.cancelled

  ─ ─ ─ ─ (expiración automática) ─ ─ ─ ─

OrderExpirationJob (cada 60s)
  │
  ▼
Busca órdenes PENDING con createdAt > 5 min
  │
  ▼
Order.status = EXPIRED
Libera inventario Redis
Libera inventario en event-service (Feign)
```

### Jobs en Background

| Job | Intervalo | Delay inicial | Función |
|---|---|---|---|
| `OrderExpirationJob` | 60 segundos | 30 segundos | Expira órdenes PENDING > 5 min y libera inventario |

### Métricas Personalizadas

`vento.orders.count` (Micrometer Counter) con tags:
- `type=confirmed` — órdenes confirmadas exitosamente
- `type=cancelled` — órdenes canceladas

### Configuración de Reservas

```yaml
vento:
  reservation:
    ttl-minutes: 5          # TTL de la reserva en Redis
    max-retries: 3          # Reintentos en caso de conflicto Redis
  expiration:
    check-interval-ms: 60000   # Frecuencia del job de expiración
    initial-delay-ms: 30000    # Delay inicial del job
```

---

## 💳 Payment Service

**Puerto:** 8084 | **Base de datos:** PostgreSQL `payments_db` (:5434) | **Stack:** Spring Boot MVC

Simula un gateway de pagos real con idempotencia por `orderId`. No usa Redis ni llama a otros servicios por HTTP; toda su comunicación downstream es a través de Kafka.

### Estructura de Paquetes

```
com.vento.payment/
├── PaymentServiceApplication.java
├── controller/
│   └── PaymentController.java    # POST /api/payments/process
├── service/
│   ├── PaymentService.java             # Lógica de procesamiento simulado
│   └── PaymentIdempotencyService.java  # Deduplicación por orderId
├── model/
│   └── ProcessedPayment.java    # Entidad JPA
├── repository/
│   └── ProcessedPaymentRepository.java
├── config/
│   └── KafkaConfig.java
└── filter/
    └── UserContextFilter.java
```

### Entidad JPA

**`ProcessedPayment`** (tabla `processed_payments`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `orderId` | UUID | **Unique** — garantiza idempotencia |
| `userId` | UUID | ID del usuario |
| `amount` | BigDecimal | Monto procesado |
| `currency` | String | Moneda (default: `USD`) |
| `status` | PaymentStatus | `SUCCESS` o `FAILED` |
| `transactionId` | String | **Unique** — ID de transacción auto-generado |
| `failureReason` | String | Motivo del fallo (si aplica) |

### Flujo de Procesamiento

```
POST /api/payments/process
  │
  ▼
1. Verificar idempotencia (buscar orderId en DB)
   └─ Si ya existe → devolver resultado anterior (sin reprocesar)
  │
  ▼
2. Delay artificial ~2 segundos (simula latencia de gateway real)
  │
  ▼
3. Decisión aleatoria: 80% SUCCESS / 20% FAILED
  │
  ├── SUCCESS
  │   └─ Persiste ProcessedPayment(status=SUCCESS)
  │   └─ Publica PaymentProcessedEvent → topic payment.processed
  │   └─ Response: 200 OK
  │
  └── FAILED
      └─ Persiste ProcessedPayment(status=FAILED)
      └─ Publica PaymentFailedEvent → topic payment.failed
      └─ Response: 402 Payment Required (RFC 9457)
```

### Idempotencia

Si el mismo `orderId` se envía dos veces (ej. por reintento del cliente), el servicio devuelve el resultado original almacenado sin volver a procesar ni re-publicar eventos Kafka. Esto evita cobros duplicados.

### Trazas Manuales

El servicio crea un span Micrometer manual `payment.process` que wrappea la lógica de procesamiento, visible en Jaeger con todos los atributos del pago.

---

## 🎨 Frontend Angular

**Puerto:** 4200 (dev) / 3000 (prod Nginx) | **Stack:** Angular 21, TypeScript 5.9, Tailwind v4

SPA (Single Page Application) que permite a los usuarios explorar eventos, comprar tickets, gestionar sus pedidos, y a organizadores administrar eventos y ver analíticas.

### Estructura de la Aplicación

```
frontend/src/app/
├── app.ts                 # Componente raíz
├── app.routes.ts          # Configuración de rutas
├── app.config.ts          # Configuración de la aplicación
├── core/
│   ├── auth/
│   │   └── auth.service.ts         # Autenticación Keycloak (Direct Access Grant)
│   ├── guards/
│   │   ├── auth.guard.ts           # Protege rutas autenticadas
│   │   ├── public.guard.ts         # Redirige si ya está autenticado
│   │   └── organizer.guard.ts      # Requiere rol ADMIN
│   ├── interceptors/
│   │   └── auth.interceptor.ts     # Gestión automática de tokens JWT
│   ├── services/
│   │   ├── event.service.ts        # Llamadas al Event Service
│   │   ├── order.service.ts        # Llamadas al Order Service
│   │   ├── payment.service.ts      # Llamadas al Payment Service
│   │   ├── ticket.service.ts       # Llamadas a tickets
│   │   ├── geolocation.service.ts  # Geolocalización del navegador
│   │   └── notification.service.ts # Notificaciones toast globales
│   ├── models/                     # Interfaces TypeScript del dominio
│   ├── mappers/                    # Transformación de respuestas API → modelos
│   ├── format/                     # Pipes y formatters
│   └── handlers/                   # Error handlers
├── features/
│   ├── home/                  # Landing principal con hero, featured events
│   ├── events-list/           # Listado paginado con filtros y búsqueda
│   ├── event-detail/          # Vista completa de un evento
│   ├── nearby/                # Mapa con eventos cercanos (Leaflet)
│   ├── checkout/              # Flujo de compra y pago
│   ├── my-orders/             # Listado de pedidos del usuario
│   │   └── my-orders-detail/  # Detalle con QR code del ticket
│   ├── organizer/             # Panel de organización (protegido)
│   │   ├── dashboard/         # Resumen y KPIs
│   │   ├── analytics/         # Gráficas y estadísticas
│   │   └── events/            # CRUD de eventos
│   ├── profile/               # Perfil del usuario
│   └── login/                 # Formulario de login Keycloak
└── shared/
    ├── components/
    │   ├── event-card/          # Tarjeta de evento reutilizable
    │   ├── speaker-card/        # Tarjeta de ponente
    │   ├── event-form-dialog/   # Dialog CRUD de eventos (organizer)
    │   ├── confirm-dialog/      # Dialog de confirmación genérico
    │   └── toast-notification/  # Notificaciones toast
    ├── ui/
    │   ├── top-nav-bar/         # Barra de navegación superior
    │   ├── bottom-nav-bar/      # Barra de navegación inferior (mobile)
    │   └── location-picker/     # Selector de ubicación en mapa
    ├── directives/
    │   └── click-outside.directive.ts  # Detecta clics fuera de un elemento
    └── pipes/                   # Pipes de transformación
```

### Rutas de la Aplicación

| Ruta | Componente | Guard | Descripción |
|---|---|---|---|
| `/home` | `HomePage` | — | Landing con eventos destacados |
| `/events` | `EventsListPage` | — | Catálogo paginado de eventos |
| `/events/:id` | `EventDetailPage` | — | Detalle de un evento |
| `/nearby` | `NearbyEventsPage` | — | Eventos cercanos en mapa |
| `/login` | `LoginPage` | `publicGuard` | Login (solo si no autenticado) |
| `/checkout` | `CheckoutPage` | `authGuard` | Flujo de compra |
| `/organizer` | `OrganizerLayoutPage` | `authGuard` + `organizerGuard` | Panel de organización |
| `/organizer/dashboard` | `DashboardPage` | — | Resumen de KPIs |
| `/organizer/analytics` | `AnalyticsPage` | — | Estadísticas detalladas |
| `/organizer/events` | `EventsPage` | — | CRUD de eventos |
| `/profile` | `ProfilePage` | `authGuard` | Perfil del usuario |
| `/my-orders` | `MyOrdersPage` | `authGuard` | Historial de pedidos |
| `/my-orders/:id` | `MyOrdersDetailPage` | `authGuard` | Detalle con QR ticket |

> ⚠️ Las rutas **no son lazy-loaded** — todos los componentes están importados estáticamente en `app.routes.ts`.

### Autenticación — `AuthService`

Implementa el flujo **Direct Access Grant** (Resource Owner Password Credentials) de Keycloak. Los tokens se almacenan en `localStorage`.

```
Login
  │
  ▼
POST /realms/vento-realm/protocol/openid-connect/token
  { grant_type: "password", client_id: "vento-frontend", username, password }
  │
  ▼
Almacena access_token + refresh_token en localStorage
  │
  ▼
Decodifica JWT manualmente (sin librería externa)
Verifica expiración con buffer de 60 segundos
```

**Refresh de token** (en `authInterceptor`):

```
Request HTTP
  │
  ▼
¿Token expirado?
  ├── Sí → refreshSession() [shareReplay(1) — requests concurrentes comparten el mismo refresh]
  │     ├── Éxito → actualiza tokens → reintenta request original
  │     └── Fallo → logout() → redirect /login
  └── No → continúa con el token actual

¿Respuesta 401?
  └── refreshSession() → reintenta una vez
```

### Convenciones de Código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Páginas | `*.page.ts` | `home.page.ts` |
| Componentes | `*.component.ts` | `event-card.component.ts` |
| Servicios | `*.service.ts` | `event.service.ts` |
| Guards | `*.guard.ts` | `auth.guard.ts` |
| Selector de componentes | `app-*` kebab-case | `app-event-card` |
| Selector de directivas | `app*` camelCase | `appClickOutside` |
| Estado reactivo | `signal()`, `computed()`, `effect()` | — |
| Inyección de dependencias | `inject()` (no constructores) | — |
| Control de flujo | `@if`, `@for`, `@switch` nativo | — |

### Estilos — Tailwind CSS v4

Configuración CSS-first en `src/tailwind.css`. El tema usa `@theme {}` con paleta Material Design 3. No existe `tailwind.config.js`.

**Orden de estilos en `angular.json`** (el orden importa):
1. `src/tailwind.css`
2. `src/styles.scss`
3. `node_modules/leaflet/dist/leaflet.css`

---

## 📨 Mensajería — Kafka

**Versión:** 4.1.1 | **Auto-creación de topics:** deshabilitada

### Topics y Particiones

| Topic | Particiones | Productor | Consumidor |
|---|---|---|---|
| `payment.processed` | 3 | payment-service | order-service |
| `payment.failed` | 3 | payment-service | order-service |
| `order.confirmed` | 3 | order-service | event-service |
| `order.cancelled` | 3 | order-service | — |
| `event.created` | 3 | event-service | event-service (ES sync) |
| `event.updated` | 3 | event-service | event-service (ES sync) |
| `event.deleted` | 3 | event-service | event-service (ES sync) |
| `payment.processed.DLQ` | 1 | Kafka (auto) | order-service (DlqConsumer) |
| `payment.failed.DLQ` | 1 | Kafka (auto) | order-service (DlqConsumer) |

### Configuración del Productor

```yaml
spring.kafka:
  producer:
    acks: all                    # Confirmación de todos los réplicas
    retries: 3
    properties:
      enable.idempotence: true   # Exactamente-una-vez semántica
```

### Configuración del Consumidor

```yaml
spring.kafka:
  consumer:
    group-id: event-service-group   # o order-service-group
    properties:
      spring.json.trusted.packages: com.vento.common.dto.kafka
  listener:
    ack-mode: record   # ACK por mensaje individual
```

### Dead Letter Queue (DLQ)

Los mensajes de `payment.processed` y `payment.failed` que fallan al procesarse son redirigidos automáticamente a sus DLQ respectivas. El `DlqConsumer` del order-service los consume y los almacena en la tabla `failed_events` para auditoría y reprocesamiento manual.

### Conexión por Entorno

| Entorno | Bootstrap Servers | Nota |
|---|---|---|
| Local (Gradle) | `localhost:9093` | Puerto `EXTERNAL` del broker |
| Dev/Prod (Docker) | `kafka:9092` | Puerto `INTERNAL` del contenedor |

---

## 🗃️ Caché — Redis

**Versión:** 7 (alpine) | **Puerto:** 6379

Redis se usa exclusivamente en **event-service** y **order-service** para control de inventario y reservas temporales. El payment-service no usa Redis.

### Keys y Estructura

| Key | Tipo | TTL | Servicio | Descripción |
|---|---|---|---|---|
| `vento:event:{eventId}:available_tickets` | String (entero) | Sin TTL | event-service / order-service | Contador atómico de tickets disponibles |
| `vento:reservation:{orderId}` | String | 5 minutos | order-service | Reserva temporal asociada a un pedido PENDING |

### Operaciones Clave

```
Crear orden:
  DECRBY vento:event:{eventId}:available_tickets {quantity}
  SET vento:reservation:{orderId} {payload} EX 300

Confirmar orden:
  DEL vento:reservation:{orderId}

Cancelar / Expirar orden:
  INCRBY vento:event:{eventId}:available_tickets {quantity}
  DEL vento:reservation:{orderId}
```

### Consistencia Redis ↔ PostgreSQL

El inventario se mantiene en **dos lugares**: Redis (fuente de verdad para reservas en tiempo real) y PostgreSQL del event-service (estado persistente). El flujo de sincronización es:

1. **Reserva atómica en Redis** (DECRBY) — garantiza que no haya overselling concurrente
2. **Decremento en PostgreSQL** vía Feign al event-service — actualiza el estado persistente
3. En cancelación/expiración, ambos son liberados en orden inverso

---

## 🔍 Búsqueda — Elasticsearch

**Versión:** 8.18.0 | **Puerto:** 9200

Utilizado exclusivamente por el **event-service** para búsqueda full-text y consultas geoespaciales de eventos. La seguridad de Elasticsearch (`xpack.security`) está deshabilitada para simplificar el setup en desarrollo.

### Índice `events`

Creado manualmente con `scripts/init-elasticsearch.sh`. Configuración destacada:

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "location": { "type": "geo_point" }
    }
  }
}
```

### Sincronización de Datos

Los eventos se sincronizan con Elasticsearch de dos formas:

1. **En tiempo real:** Cuando un evento se crea, actualiza o elimina en PostgreSQL, el `EventKafkaProducer` publica un evento en Kafka, y el `EventChangeListener` del mismo servicio lo consume para actualizar Elasticsearch inmediatamente.

2. **Periódica (fallback):** El `ElasticsearchSyncJob` realiza una sincronización completa PG → ES cada 5 minutos para garantizar consistencia eventual.

---

## 🔐 Autenticación — Keycloak

**Versión:** 26.0 | **Puerto:** 8180

Proveedor de identidad centralizado usando el protocolo OAuth2/OIDC.

### Configuración del Realm `vento-realm`

| Elemento | Valor | Descripción |
|---|---|---|
| Realm | `vento-realm` | Realm de la aplicación |
| Cliente backend | `vento-api` | Confidential, para validación JWT en Gateway |
| Cliente frontend | `vento-frontend` | Direct Access Grants habilitado |
| Roles | `USER`, `ADMIN` | Roles de aplicación en `realm_access` |

### Flujo de Autenticación

```
Frontend                    Keycloak                  API Gateway
   │                           │                          │
   ├─ POST /token ─────────────►│                          │
   │  (grant_type=password)     │                          │
   │◄─ access_token + refresh ──┤                          │
   │                            │                          │
   ├─ GET /api/events ──────────────────────────────────►  │
   │  Authorization: Bearer {token}                        │
   │                            │◄─ GET /certs ────────────┤
   │                            │   (JWK Set URI)          │
   │                            ├─ JWT válido ─────────────►
   │                                                       │
   │                                              Propaga X-User-Id
   │                                              Propaga X-User-Roles
```

### Flujo de Refresh

El `authInterceptor` del frontend gestiona automáticamente el ciclo de vida del token:

```
Token expirado detectado (buffer de 60s antes del exp)
  │
  ▼
Múltiples requests concurrentes?
  └─ shareReplay(1) → todos esperan el mismo refresh en vuelo
  │
  ▼
POST /realms/vento-realm/protocol/openid-connect/token
  { grant_type: "refresh_token", refresh_token: "..." }
  │
  ├── Éxito → nuevos tokens en localStorage → reintentar request
  └── Fallo → logout() → navigate('/login')
```

---

## 📊 Observabilidad

El sistema cuenta con un stack completo de observabilidad: métricas, logs y trazas distribuidas.

### Arquitectura de Observabilidad

```
Microservicios (Spring Boot Actuator)
          │
          ├── /actuator/prometheus  ──────────► Prometheus ──────► Grafana
          │                                     (scrape 15s)
          │
          └── OTLP traces (HTTP :4318) ────► OTel Collector ──► Jaeger
                                                     │
                                              (batch 5s/1024)

Docker container logs ──► Promtail ──────────────────────────► Loki ──► Grafana
                          (docker.sock)
```

### Métricas — Prometheus + Grafana

**Scraping:** `/actuator/prometheus` en los 4 servicios, cada 15 segundos.

**Dashboards de Grafana** (en `grafana/dashboards/`):

| Dashboard | Descripción |
|---|---|
| `infrastructure-dashboard.json` | CPU, memoria, JVM heap, GC, conexiones DB |
| `logs-dashboard.json` | Explorador de logs estructurados (Loki) |
| `performance-dashboard.json` | Latencia HTTP, percentiles p50/p95/p99, tasa de errores |
| `sales-dashboard.json` | Métricas de negocio: órdenes confirmadas, pagos, ingresos |

**Métricas personalizadas:**
- `vento.orders.count{type=confirmed}` — órdenes confirmadas
- `vento.orders.count{type=cancelled}` — órdenes canceladas
- `payment.process` — span de trazas para procesamiento de pagos

### Trazas — OpenTelemetry + Jaeger

**Configuración del OTel Collector** (`otel-collector-config.yaml`):

```yaml
receivers:
  otlp:
    protocols:
      http: { endpoint: 0.0.0.0:4318 }
      grpc: { endpoint: 0.0.0.0:4317 }
processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
exporters:
  otlp:
    endpoint: jaeger:4317
    tls: { insecure: true }
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug, otlp]
```

Todos los microservicios usan `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp` con **100% de sampling** (`probability: 1.0`).

### Logs — Loki + Promtail

- **Perfil `local`:** Logs en consola estándar
- **Perfiles `dev`/`prod`:** Logs JSON estructurados (`logstash-logback-encoder`) → Promtail lee desde `docker.sock` → Loki

**Labels de Promtail:** `container`, `log_stream`, `service`, `env`

### URLs de Observabilidad

| Herramienta | URL | Credenciales |
|---|---|---|
| Grafana | http://localhost:3000 | admin / admin |
| Jaeger | http://localhost:16686 | — |
| Prometheus | http://localhost:9090 | — |
| Kibana | http://localhost:5601 | — |
| Kafka UI | http://localhost:8089 | — |

---

## 🐳 Infraestructura Docker

### Perfiles de Compose

El sistema usa una arquitectura de **compose overlay** con un archivo base y overrides por entorno:

```
docker-compose.yml              # Definiciones base (redes, volúmenes compartidos)
docker-compose.local.yml        # Solo infraestructura (PG, Redis, Kafka, Keycloak, ES, Grafana...)
docker-compose.dev.yml          # Agrega microservicios en Docker con JDWP debug
docker-compose.prod.yml         # Produce: sin puertos internos expuestos, Nginx, retención 30d
```

### Servicios por Perfil

| Servicio | Local | Dev | Prod |
|---|---|---|---|
| postgres-events | ✅ | ✅ | ✅ |
| postgres-orders | ✅ | ✅ | ✅ |
| postgres-payments | ✅ | ✅ | ✅ |
| redis | ✅ | ✅ | ✅ |
| keycloak | ✅ | ✅ | ✅ |
| kafka | ✅ | ✅ | ✅ |
| kafka-init | ✅ | ✅ | ✅ |
| kafka-ui | ✅ | ✅ | ❌ |
| elasticsearch | ✅ | ✅ | ✅ |
| kibana | ✅ | ✅ | ✅ |
| prometheus | ✅ | ✅ | ✅ |
| grafana | ✅ | ✅ | ✅ |
| otel-collector | ✅ | ✅ | ✅ |
| jaeger | ✅ | ✅ | ✅ |
| loki | ❌ | ✅ | ✅ |
| promtail | ❌ | ✅ | ✅ |
| api-gateway | ❌ | ✅ | ✅ |
| event-service | ❌ | ✅ | ✅ |
| order-service | ❌ | ✅ | ✅ |
| payment-service | ❌ | ✅ | ✅ |
| frontend (Nginx) | ❌ | ❌ | ✅ |

### Estrategia de Build de Microservicios (Multi-Stage)

Los Dockerfiles usan build multi-stage con `context: .` (raíz del monorepo):

```dockerfile
# Stage 1: Builder
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app
COPY . .
RUN ./gradlew :microservices:event-service:bootJar -x test

# Stage 2: Runtime
FROM eclipse-temurin:25-jre
RUN addgroup --system vento && adduser --system --ingroup vento vento
USER vento
COPY --from=builder /app/microservices/event-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Redes Docker

Todos los servicios están en la red `vento-network` (bridge). Los microservicios en Docker se comunican por nombre de servicio (ej. `kafka:9092`, `postgres-events:5432`).

---

## 🧩 Decisiones de Diseño

### 1. Database-per-Service

Cada microservicio tiene su propia base de datos PostgreSQL:
- **Por qué:** Desacoplamiento completo, cada servicio puede evolucionar su esquema independientemente, sin riesgo de que cambios en un servicio afecten otros.
- **Compensación:** La consistencia entre servicios es eventual (no ACID cross-service).

### 2. Saga Pattern (Choreography)

La transacción de pago usa una Saga basada en eventos (coreografía), no orquestación:
- **Por qué:** Evita un orquestador centralizado que se convierte en punto de fallo. Cada servicio reacciona a eventos y publica sus propios eventos resultantes.
- **Compensación:** Mayor complejidad para debuggear el flujo completo; requiere DLQ para mensajes fallidos.

### 3. Redis como fuente de verdad para inventario en tiempo real

El inventario de tickets se gestiona en Redis con operaciones atómicas (DECRBY) antes de persistir en PostgreSQL:
- **Por qué:** Previene overselling en escenarios de alta concurrencia. Redis garantiza atomicidad sin necesidad de locks de base de datos.
- **Compensación:** Redis puede perder datos si no se configura persistencia. La sincronización PG↔Redis debe mantenerse consistente.

### 4. API Gateway como único validador de JWT

Solo el Gateway valida tokens JWT. Los microservicios confían ciegamente en los headers `X-User-Id` y `X-User-Roles`:
- **Por qué:** Simplifica los microservicios (no necesitan Keycloak SDK), centraliza la política de seguridad, reduce latencia.
- **Compensación:** Una llamada directa que bypasee el Gateway es no autenticada. Requiere que la red interna sea confiable (no exponer puertos de microservicios en producción).

### 5. Módulo `common/` como librería compartida

DTOs de dominio, excepciones y el `GlobalExceptionHandler` viven en un módulo Java compartido:
- **Por qué:** Garantiza consistencia en las respuestas de error (RFC 9457) en todos los servicios, evita duplicación de código.
- **Compensación:** Acoplamiento entre servicios al nivel de librería. Cambios en `common/` requieren recompilar todos los servicios.

### 6. Spring Cloud Gateway con WebFlux (no Spring MVC)

El API Gateway usa programación reactiva:
- **Por qué:** Spring Cloud Gateway requiere WebFlux. Es más eficiente para proxy/routing que MVC bloqueante.
- **Compensación:** No puede compartir el `GlobalExceptionHandler` del módulo `common/` (que es MVC). Tiene su propio handler.

### 7. Direct Access Grant en Frontend (no Authorization Code Flow)

El frontend usa Resource Owner Password Credentials en lugar del flujo estándar de OAuth2:
- **Por qué:** Simplifica la implementación para una aplicación demo/educativa sin redirect del navegador.
- **Compensación:** Expone credenciales al cliente. En producción real se debería usar Authorization Code Flow + PKCE.

### 8. Tailwind CSS v4 con configuración CSS-first

No hay `tailwind.config.js`. La configuración está en `src/tailwind.css` con `@theme {}`:
- **Por qué:** Tailwind v4 adopta un enfoque CSS-nativo más moderno, con mejor rendimiento de build.
- **Compensación:** No compatible con documentación y plugins de Tailwind v3.

---

## 📋 Convenciones de Código

### Backend (Java)

| Elemento | Convención |
|---|---|
| Paquetes | `com.vento.<modulo>/{api,core,infrastructure,filter}` |
| Inyección de dependencias | Constructor injection o `@RequiredArgsConstructor` |
| Transacciones | `@Transactional` en métodos que modifican datos |
| DTOs | Records inmutables o Lombok `@Value` + `@Builder` |
| Entidades JPA | `@Data`, `@Entity`, extienden `AuditableEntity` |
| Logging | `@Slf4j`, nunca loggear datos sensibles |
| Errores | Extender excepciones de `common/`, usar `GlobalExceptionHandler` |

### Frontend (Angular)

| Elemento | Convención |
|---|---|
| Componentes | Standalone (`imports: []`, sin NgModules) |
| Inyección | `inject()` (no constructor injection) |
| Estado | `signal()`, `computed()`, `effect()` |
| Control de flujo | `@if`, `@for`, `@switch` nativo (nunca `*ngIf/ngFor`) |
| `any` | Prohibido por ESLint (`no-explicit-any: error`) |
| Path aliases | `@app/*`, `@core/*`, `@shared/*`, `@features/*`, `@env/*` |
| Prettier | `printWidth: 100`, single quotes, parser angular para HTML |
