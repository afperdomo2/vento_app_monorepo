# Sprint 4: Búsqueda Avanzada y Observabilidad (Semanas 7-8)

## Resumen
Hacer el sistema profesional y monitoreable: búsqueda avanzada con Elasticsearch, tracing distribuido con OpenTelemetry, y dashboards con Prometheus & Grafana.

---

## Semana 7: Búsqueda Avanzada con Elasticsearch

### 7.1 - Infraestructura Elasticsearch
- [x] **Docker Compose**:
  - [x] Agregar Elasticsearch (puerto 9200)
  - [x] Agregar Kibana (puerto 5601) para desarrollo
- [x] **Elasticsearch Configuration**:
  - [x] Crear índice `events` con init-elasticsearch.sh
  - [x] Configurar mappings apropiados (text, geo_point, date, etc.)
  - [x] Configurar analyzers para búsqueda de texto (autocomplete)
- [x] **Elasticsearch Client**:
  - [x] Agregar spring-data-elasticsearch en event-service
  - [x] Configurar client connection
  - [x] Configurar serializers

### 7.2 - Sincronización PostgreSQL → Elasticsearch
- [x] **Event Index Mapping**:
  - [x] Implementado en EventDocument.java con anotaciones @Field
  - [x] Campos: id, name, description, venue, location (geo_point), eventDate, price, etc.
- [x] **Sync Strategy (Event-Driven via Kafka)**:
  - [x] Implementado: Event-driven updates via Kafka
  - [x] Topics: event.created, event.updated, event.deleted
  - [x] EventPublisher publica eventos cuando hay cambios
  - [x] EventElasticsearchConsumer consume y actualiza Elasticsearch
  - [x] Manejo de fallos con retry exponencial y DLQ

### 7.3 - Búsqueda Avanzada API
- [x] **Endpoints de Búsqueda**:
  - [x] `GET /api/events/search` - Búsqueda de texto libre
  - [x] `GET /api/events/search/advanced` - Filtros combinados (precio, fecha, disponibilidad)
- [x] **Features de Búsqueda**:
  - [x] Búsqueda multi-campo (nombre, descripción, venue)
  - [x] Filtros por rango de precios, fechas y disponibilidad
  - [x] Paginación incluida
- [x] **EventSearchService**:
  - [x] Implementado con `CriteriaQuery` para compatibilidad y estabilidad
  - [x] Métodos: `searchByText()` y `searchAdvanced()`

### 7.4 - Búsqueda por Geolocalización
- [x] **Geo Point Support**:
  - [x] Agregados campos `latitude` y `longitude` en Event entity y DTOs
  - [x] Mapeado a `location` (String "lat,lon") con `@GeoPointField` en Elasticsearch
- [x] **Nearby Search**:
  - [x] Endpoint: `GET /api/events/search/nearby?lat=...&lon=...&distance=5km`
  - [x] Output: eventos ordenados por distancia
  - [x] Implementado con `GeoDistanceQuery` nativo de ES 8.x

---

## Semana 8: Observabilidad (Tracing + Métricas)

### 8.1 - OpenTelemetry: Tracing Distribuido
- [x] **Instrumentación**:
  - [x] Agregar `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp` en todos los servicios
  - [x] Configurar `management.tracing.sampling.probability: 1.0` (100% sampling en desarrollo)
  - [x] Configurar `management.otlp.tracing.endpoint` en cada servicio
  - [x] Custom spans en:
    - Order-service: `order.create` (con attributes: orderId, eventId, quantity, userId)
    - Payment-service: `payment.process` (con attributes: orderId, amount)
  - [x] Auto-instrumentación de HTTP requests (Spring MVC/WebFlux)
  - [x] Auto-instrumentación de Feign clients (via micrometer-tracing)
- [x] **Headers de Tracing**:
  - [x] Propagación automática de `traceparent` (W3C Trace Context) en HTTP
  - [x] Feign: auto-instrumentado por micrometer-tracing-bridge-otel
  - [x] Kafka: auto-instrumentación de KafkaTemplate y @KafkaListener
- [x] **Collector**:
  - [x] Agregar OTEL Collector (`otel/opentelemetry-collector-contrib:0.120.0`) en Docker
  - [x] Configurar `otel-collector-config.yaml` con receivers OTLP HTTP/gRPC
  - [x] Configurar exporter a Jaeger via OTLP gRPC
  - [x] Configurar batch processor para optimizar envío de spans
- [x] **Visualización**:
  - [x] Jaeger UI (`jaegertracing/all-in-one:1.64.0`) en puerto 16686
  - [x] Trace completo verificable: Gateway → Order → Event → Payment → Kafka

### 8.2 - Métricas con Micrometer + Prometheus
- [x] **Métricas por Servicio**:
  - [x] HTTP requests: count, latency (p50, p95, p99) — Automáticas via Micrometer
  - [x] Business metrics: órdenes creadas, pagos procesados — Counters custom
  - [x] Infrastructure: JVM memory, GC, connections — Automáticas via Micrometer
- [x] **Métricas Custom**:
  - [x] `vento.orders.created` - Contador de órdenes creadas
  - [x] `vento.orders.confirmed` - Órdenes confirmadas
  - [x] `vento.orders.cancelled` - Órdenes canceladas
  - [x] `vento.payments.success` - Pagos exitosos
  - [x] `vento.payments.failed` - Pagos fallidos
  - [x] `vento.events.created` - Eventos creados
  - [x] `vento.reservations.active` - Reservas activas (creadas - eliminadas)
  - [x] `vento.reservations.removed` - Reservas eliminadas (confirm/cancel/expire)
  - [x] `vento.tickets.available` - Gauge de tickets disponibles en total (todos los eventos)
- [x] **Prometheus Endpoint**:
  - [x] Exponer `/actuator/prometheus` en cada servicio
  - [ ] Proteger endpoint en producción (pendiente)
- [x] **Infraestructura Prometheus (Local)**:
  - [x] Contenedor Prometheus en docker-compose.local.yml (puerto 9090)
  - [x] Configuración prometheus.yml con scrape configs
  - [x] Targets: api-gateway:8080, event-service:8082, order-service:8083, payment-service:8084
  - [ ] Agregar Prometheus en docker-compose.dev.yml (pendiente)
  - [ ] Agregar Prometheus en docker-compose.prod.yml (pendiente)

### 8.3 - Grafana Dashboards
- [x] **Dashboard Principal - Ventas**:
  - [x] Tickets vendidos por minuto
  - [x] Órdenes creadas vs confirmadas vs canceladas
  - [x] Reservas activas (TTL 5 min)
  - [x] Tasa de éxito de pagos
  - [x] Tickets disponibles (todos los eventos)
  - [x] Eventos creados
- [x] **Dashboard - Performance**:
  - [x] Latencia de APIs (p50, p95, p99)
  - [x] Throughput por servicio
  - [x] Errores por endpoint (4xx, 5xx)
  - [x] Uso de memoria JVM (heap/non-heap)
  - [x] Tiempo promedio de respuesta por servicio (p95)
- [x] **Infraestructura de Aprovisionamiento**:
  - [x] Grafana en docker-compose.local.yml (puerto 3000)
  - [x] Prometheus configurado como datasource
  - [x] Dashboards auto-provisionados vía provisioning/
  - [x] Volúmenes Docker persistentes para datos
- [x] **Dashboard - Infraestructura**:
  - [x] Service Health Status (UP/DOWN por servicio)
  - [x] JVM Garbage Collection Activity (GC/sec)
  - [x] Database Connection Pool (HikariCP - active, idle, pending)
  - [x] JVM Thread Pool Usage (live threads, daemon threads)
  - [x] Kafka Consumer Lag (messages behind por topic)
  - [x] Service Uptime (tiempo de actividad)
- [x] **Alertas** (NO SE VAN A HACE, PRESENTAN MUCHOS PROBLEMAS):
  - DLQ growing
  - High error rate
  - Low available tickets

### 8.4 - Logging Centralizado
- [ ] **Structured Logging**:
  - Formato JSON
  - Incluir: timestamp, level, service, traceId, message
- [ ] **Log Aggregation**:
  - Agregar Loki o ELK stack (opcional)
  - O usar cloud-native solution (GCP Cloud Logging, AWS CloudWatch)
- [ ] **Correlation**:
  - Log every event with traceId
  - Facilitar búsqueda por traceId

### 8.5 - Health Checks y Readiness
- [x] **Documentación de Health Endpoints**:
  - [x] Health checks documentados en Postman Collection
  - [x] Descripciones detalladas de componentes por servicio
  - [x] Scripts de validación automática en Postman tests
  - [x] POSTMAN_ENDPOINTS.md actualizado con ejemplos de respuesta
  - [x] Tabla de troubleshooting de health checks
- [x] **Componentes Verificados**:
  - [x] PostgreSQL (events_db, orders_db, payments_db)
  - [x] Redis (event-service, order-service)
  - [x] Kafka (event-service, order-service, payment-service)
  - [x] Elasticsearch (event-service)
  - [x] DiskSpace y Ping (todos los servicios)
- [x] **Liveness vs Readiness** (no aplica para Docker Compose):
  - Docker Compose usa health checks genéricos, no separa liveness/readiness
  - Configuración disponible si se migra a Kubernetes en el futuro

---

## Dependencias Entre Tareas

```
Semana 7 ──────────────────────────────────────
  7.1 ES Infrastructure  ──> Depende de Sprint 1 (docker-compose)
  7.2 PostgreSQL→ES Sync ──> Depende de 7.1, Sprint 1 (Event entity)
  7.3 Search API         ──> Depende de 7.2
  7.4 Geo Search         ──> Depende de 7.3

Semana 8 ──────────────────────────────────────
  8.1 OpenTelemetry      ──> Depende de Sprint 3 (Kafka)
  8.2 Prometheus Metrics ──> Depende de Sprint 3
  8.3 Grafana Dashboards ──> Depende de 8.2
  8.4 Centralized Logs   ──> Depende de 8.1
  8.5 Health Checks      ──> Depende de 8.1, 8.2
```

---

## Criterios de Aceptación

- [x] Elasticsearch accesible y con índice `events`
- [x] Búsqueda de texto funciona con fuzzy matching
- [x] Búsqueda por geolocalización retorna eventos cercanos
- [x] TraceId visible en Jaeger desde Gateway hasta Payment
- [x] Custom spans para order.create y payment.process con attributes
- [x] Métricas visibles en Prometheus endpoint
- [x] Dashboard de ventas en Grafana muestra tickets/segundo
- [x] Health checks documentados en Postman con detalles de componentes
- [x] Dashboard de infraestructura en Grafana (health, GC, DB pool, threads, Kafka lag)
- [ ] Alertas configuradas para DLQ y error rate
- [ ] Logs incluyen traceId para correlación
- [ ] Health checks funcionan para todos los componentes
- [x] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Elasticsearch sync, search, tracing |
| order-service | 8083 | Métricas, tracing (custom spans + Feign) |
| payment-service | 8084 | Métricas, tracing (custom spans) |
| api-gateway | 8080 | Tracing (WebFlux auto-instrumented) |
| elasticsearch | 9200 | Índice de eventos |
| kibana | 5601 | Dev (opcional) |
| otel-collector | 4318/4317 | Recolector de traces (OTLP HTTP/gRPC) |
| jaeger | 16686 | Visualización de traces |
| prometheus | 9090 | Métricas |
| grafana | 3000 | Dashboards de métricas |

---

## Elasticsearc h Index Configuration

```json
PUT /events
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "autocomplete",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "autocomplete": {
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
      "name": { "type": "text", "analyzer": "standard", "fields": { "autocomplete": { "type": "text", "analyzer": "autocomplete" } } },
      "description": { "type": "text" },
      "venue": { "type": "text" },
      "location": { "type": "geo_point" },
      "eventDate": { "type": "date" },
      "price": { "type": "float" },
      "availableTickets": { "type": "integer" },
      "status": { "type": "keyword" }
    }
  }
}
```

---

## Grafana Dashboard Panels Sugeridos

| Panel | Métrica | Tipo |
|-------|---------|------|
| Tickets Vendidos/min | `rate(vento_orders_confirmed[1m])` | Time Series |
| Órdenes por Estado | `vento_orders{status}` | Stat |
| Latencia API p99 | `histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))` | Time Series |
| Tasa de Error | `rate(http_server_requests_seconds_count{status=~"5.."}[5m])` | Time Series |
| DLQ Messages | `kafka_consumer_records_lag_max{topic=~".*DLQ"}` | Stat |
| Tickets Disponibles | `vento_tickets_available` | Gauge |

---

## Estado del Sprint 4

### ✅ Completado:
- **Semana 7**: Búsqueda Avanzada con Elasticsearch (100%)
- **Semana 8.1**: OpenTelemetry (Tracing Distribuido) (100%)
  - ✅ Instrumentación automática de HTTP, Feign, Kafka
  - ✅ Custom spans: order.create, payment.process
  - ✅ OTEL Collector en Docker con batch processor
  - ✅ Jaeger UI corriendo en puerto 16686
- **Semana 8.2**: Métricas con Micrometer + Prometheus (95%)
  - ✅ Métricas HTTP y JVM automáticas
  - ✅ 9 métricas custom implementadas
  - ✅ Prometheus corriendo en entorno local
  - ⏳ Pendiente: protección de endpoints en producción
- **Semana 8.3**: Grafana Dashboards (100%)
  - ✅ Dashboard de Ventas (6 paneles funcionales)
  - ✅ Dashboard de Performance (5 paneles funcionales)
  - ✅ Dashboard de Infraestructura (7 paneles funcionales)
  - ✅ Aprovisionamiento automático configurado
- **Semana 8.5**: Health Checks y Readiness (90%)
  - ✅ Health endpoints documentados en Postman Collection
  - ✅ POSTMAN_ENDPOINTS.md actualizado con ejemplos y troubleshooting
  - ✅ Componentes verificados: PostgreSQL, Redis, Kafka, Elasticsearch
  - ⏳ Liveness/Readiness (no aplica para Docker Compose, disponible para K8s futuro)

### ⏳ Pendiente:
- **Semana 8.4**: Logging Centralizado (Loki/ELK)

---

**Stack Implementado hasta ahora:**
- Spring Cloud Gateway + Keycloak (Auth) ✅
- Event-service + PostgreSQL + Redis ✅
- Order-service + PostgreSQL + Redis ✅
- Payment-service (Simulado) ✅
- Kafka + DLQ (Event-Driven) ✅
- Elasticsearch (Búsqueda) ✅
- Micrometer + Prometheus (9 métricas custom + HTTP/JVM automáticas) ✅
- Grafana (Dashboards de Ventas + Performance + Infraestructura) ✅
- Health Checks documentados en Postman ✅
- **OpenTelemetry + Jaeger (Tracing Distribuido)** ✅

**Stack Pendiente:**
- Logging Centralizado (Loki/ELK)
