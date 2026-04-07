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
- [ ] **Geo Point Support**:
  - Agregar campo `latitude` y `longitude` en Event entity
  - Mapear a `geo_point` en Elasticsearch
- [ ] **Nearby Search**:
  - Input: lat, lon, radius (km)
  - Output: eventos ordenados por distancia
  - Usar geo_distance query

---

## Semana 8: Observabilidad (Tracing + Métricas)

### 8.1 - OpenTelemetry: Tracing Distribuido
- [ ] **Instrumentación**:
  - Agregar OpenTelemetry SDK en todos los servicios
  - Configurar W3C Trace Context propagation
  - Crear Spans en:
    - Gateway: incoming request
    - Order-service: reserva, validación Redis, persistencia
    - Event-service: verificación disponibilidad
    - Payment-service: procesamiento
- [ ] **Headers de Tracing**:
  - Propagar `traceparent` y `tracestate` entre servicios
  - Kafka: incluir traceId en message headers
- [ ] **Collector**:
  - Agregar OTEL Collector (Docker)
  - Configurar exportadores: Jaeger, Zipkin, o Tempo
  - Recibe spans de todos los servicios
- [ ] **Visualización**:
  - Jaeger UI o Tempo + Grafana
  - Ver trace completo: Gateway → Order → Event → Payment → Kafka

### 8.2 - Métricas con Micrometer + Prometheus
- [ ] **Métricas por Servicio**:
  - HTTP requests: count, latency (p50, p95, p99)
  - Business metrics: órdenes creadas, pagos procesados
  - Infrastructure: JVM memory, GC, connections
- [ ] **Métricas Custom**:
  - `vento.orders.created` - Contador de órdenes creadas
  - `vento.orders.confirmed` - Órdenes confirmadas
  - `vento.orders.cancelled` - Órdenes canceladas
  - `vento.reservations.active` - Reservas activas
  - `vento.tickets.available` - Gauge de tickets por evento
- [ ] **Prometheus Endpoint**:
  - Exponer `/actuator/prometheus` en cada servicio
  - Proteger endpoint en producción

### 8.3 - Grafana Dashboards
- [ ] **Dashboard Principal - Ventas**:
  - Tickets vendidos por minuto
  - Órdenes creadas vs confirmadas vs canceladas
  - Tiempo promedio de reserva a confirmación
  - Tasa de éxito de pagos (80%)
- [ ] **Dashboard - Performance**:
  - Latencia de APIs (p50, p95, p99)
  - Throughput por servicio
  - Errores por endpoint
- [ ] **Dashboard - Infraestructura**:
  - Uso de memoria y CPU
  - Conexiones Redis/Kafka/PostgreSQL
  - Health checks
- [ ] **Alertas**:
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
- [ ] **Spring Actuator**:
  - `/actuator/health` - Health check aggregate
  - `/actuator/health/db` - PostgreSQL
  - `/actuator/health/redis` - Redis
  - `/actuator/health/kafka` - Kafka (custom)
- [ ] **Liveness vs Readiness**:
  - Liveness: ¿El servicio está vivo?
  - Readiness: ¿Puede recibir tráfico?
  - Kubernetes probes

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

- [ ] Elasticsearch accesible y con índice `events`
- [ ] Búsqueda de texto funciona con fuzzy matching
- [ ] Búsqueda por geolocalización retorna eventos cercanos
- [ ] TraceId visible en Jaeger/Grafana desde Gateway hasta Payment
- [ ] Métricas visibles en Prometheus endpoint
- [ ] Dashboard de ventas en Grafana muestra tickets/segundo
- [ ] Alertas configuradas para DLQ y error rate
- [ ] Logs incluyen traceId para correlación
- [ ] Health checks funcionan para todos los componentes
- [ ] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Elasticsearch sync, search |
| order-service | 8083 | Métricas, tracing |
| payment-service | 8084 | Métricas, tracing |
| elasticsearch | 9200 | Índice de eventos |
| kibana | 5601 | Dev (opcional) |
| otel-collector | 4317 | Recolector de traces |
| jaeger | 16686 | Visualización de traces |
| prometheus | 9090 | Métricas |
| grafana | 3000 | Dashboards |

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

## Proyecto Completado

Este Sprint 4 marca la finalización del proyecto según los REQUERIMIENTOS.md.

**Stack Completo:**
- Spring Cloud Gateway + Keycloak (Auth)
- Event-service + PostgreSQL + Redis
- Order-service + PostgreSQL + Redis
- Payment-service (Simulado)
- Kafka + DLQ (Event-Driven)
- Elasticsearch (Búsqueda)
- OpenTelemetry (Tracing)
- Prometheus + Grafana (Métricas)
