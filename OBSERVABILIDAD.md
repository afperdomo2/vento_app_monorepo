# Observabilidad — Vento App

## Visión General

El sistema de observabilidad de Vento App está compuesto por **Prometheus** para recolección de métricas, **Grafana** para visualización, y **OpenTelemetry + Jaeger** para tracing distribuido. Este stack permite monitorear el rendimiento de los microservicios, las ventas en tiempo real, la salud de la infraestructura y rastrear requests completos a través de todos los servicios.

### Arquitectura

```
┌─────────────────┐     scrape      ┌──────────────┐
│  Microservicios │ ──────────────> │  Prometheus  │
│  (4 servicios)  │  /actuator/     │  (puerto     │
│                 │   prometheus    │    9090)      │
└────────┬────────┘                 └──────┬───────┘
         │                                │
    scrape│                          scrape│
         ▼                                ▼
   ┌───────────┐                    ┌──────────────┐
   │  Grafana  │<───────────────────│  Prometheus  │
   │ (métricas)│  datasource        │  (puerto     │
   │ 3000      │                    │    9090)      │
   └───────────┘                    └──────────────┘

┌─────────────────┐    OTLP/HTTP    ┌──────────────┐   OTLP/gRPC   ┌──────────────┐
│  Microservicios │ ──────────────> │ OTEL         │ ────────────> │   Jaeger     │
│  (4 servicios)  │   :4318         │ Collector    │   :4317       │   (puerto    │
│                 │                 │ :4318/:4317  │               │    16686)    │
└─────────────────┘                 └──────────────┘               └──────┬───────┘
                                                                          │
                                                                    datasource│
                                                                          ▼
                                                                    ┌──────────────┐
                                                                    │   Grafana    │
                                                                    │  (traces)    │
                                                                    └──────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Puerto | Propósito |
|------------|------------|--------|-----------|
| **Micrometer** | Librería Java | — | Exponer métricas y traces en cada servicio |
| **Prometheus** | prom/prometheus:v2.51.0 | 9090 | Recolectar y almacenar métricas |
| **Grafana** | grafana/grafana-oss | 3000 | Visualizar dashboards + datasource Jaeger |
| **OTEL Collector** | otel/opentelemetry-collector-contrib:0.120.0 | 4318/4317 | Recibir traces OTLP y exportar a Jaeger |
| **Jaeger** | jaegertracing/all-in-one:1.64.0 | 16686 | Visualización de traces distribuidos |

---

## Métricas Disponibles

### 1. Métricas Automáticas (Spring Boot Actuator + Micrometer)

Estas métricas se generan automáticamente sin configuración adicional:

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `http_server_requests_seconds_bucket` | Histogram | Distribución de latencia de requests HTTP |
| `http_server_requests_seconds_sum` | Summary | Suma total del tiempo de respuesta |
| `http_server_requests_seconds_count` | Counter | Total de requests HTTP procesados |
| `jvm_memory_used_bytes` | Gauge | Uso de memoria JVM (heap y non-heap) |
| `jvm_gc_pause_seconds` | Histogram | Tiempo de pausa del garbage collector |

**Importante:** El histograma de latencia (`_bucket`) requiere configuración explícita. Sin ella, solo se generan `_sum` y `_count`. Ver [Configuración del Histograma](#configuración-del-histograma).

### 2. Métricas Custom de Negocio

Estas métricas fueron agregadas manualmente para monitorear el negocio:

| Métrica | Servicio | Tipo | Descripción |
|---------|----------|------|-------------|
| `vento_orders_count{type="created"}` | order-service | Counter | Total de órdenes creadas |
| `vento_orders_count{type="confirmed"}` | order-service | Counter | Total de órdenes confirmadas (pago exitoso vía Kafka) |
| `vento_orders_count{type="cancelled"}` | order-service | Counter | Total de órdenes canceladas |
| `vento_reservations_active` | order-service | Counter | Total de reservas temporales creadas en Redis |
| `vento_reservations_removed` | order-service | Counter | Total de reservas temporales eliminadas |
| `vento_payments_success` | payment-service | Counter | Total de pagos exitosos |
| `vento_payments_failed` | payment-service | Counter | Total de pagos fallidos |
| `vento_events_count{type="created"}` | event-service | Counter | Total de eventos creados |
| `vento_tickets_available` | event-service | Gauge | Tickets disponibles en total (todos los eventos) |

> **Nota:** Las métricas de tipo `Counter` con tags usan un solo nombre métrico con etiquetas diferenciadoras. Ejemplo: `vento_orders_count_total{type="created"}`.

### 3. Métricas de Infraestructura

Prometheus también recolecta métricas internas de sus propios componentes y de los health checks.

---

## Dashboards de Grafana

Grafana se provisiona automáticamente con 2 dashboards pre-configurados. Los dashboards están en `grafana/dashboards/` y se cargan al iniciar el contenedor.

### Dashboard 1: Ventas (`vento-sales`)

Monitorea métricas de negocio relacionadas con ventas y eventos.

| Panel | Métrica | Tipo | Descripción |
|-------|---------|------|-------------|
| **Tickets Vendidos/min** | `rate(vento_orders_count_total{type="confirmed"}[5m])` | Time Series | Tasa de órdenes confirmadas por minuto |
| **Órdenes por Estado** | `vento_orders_count_total{type="..."}` | Stat | Contadores de creadas, confirmadas y canceladas |
| **Tasa de Éxito de Pagos** | `(success / (success + failed)) * 100` | Gauge | Porcentaje de pagos exitosos (esperado ~80%) |
| **Reservas Activas** | `vento_reservations_active_total - vento_reservations_removed_total` | Time Series | Reservas temporales activas en Redis (TTL 5 min) |
| **Tickets Disponibles** | `vento_tickets_available` | Time Series | Gauge de inventario total de tickets |
| **Eventos Creados** | `vento_events_count_total{type="created"}` | Stat | Total de eventos creados desde el inicio del servicio |

### Dashboard 2: Rendimiento (`vento-performance`)

Monitorea el rendimiento técnico de los microservicios.

| Panel | Métrica | Tipo | Descripción |
|-------|---------|------|-------------|
| **Latencia de API (Percentiles)** | `histogram_quantile(0.50/0.95/0.99, ...)` | Time Series | Percentiles p50, p95, p99 de latencia |
| **Throughput por Servicio** | `rate(http_server_requests_seconds_count[1m])` | Time Series | Requests por segundo por servicio/endpoint |
| **Errores por Servicio** | `rate(...count{status=~"4..|5.."}[1m])` | Time Series | Tasa de errores HTTP 4xx y 5xx |
| **Uso de Memoria JVM** | `jvm_memory_used_bytes{area="heap\|nonheap"}` | Time Series | Memoria heap y non-heap por servicio |
| **Tiempo de Respuesta (p95)** | `histogram_quantile(0.95, ...)` | Stat | Latencia p95 por servicio en segundos |

---

## Cómo Acceder y Usar Grafana

### Acceso

```
URL: http://localhost:3000
Usuario: admin
Contraseña: admin
```

### Navegación

1. **Dashboards:** Menú lateral → Dashboards → "Vento - Ventas" o "Vento - Rendimiento"
2. **Explorar datos:** Menú lateral → Explore → escribir query PromQL
3. **Editar panel:** Hover sobre el título del panel → ícono de engranaje

### Actualizar Dashboards

Los dashboards se cargan automáticamente al iniciar Grafana. Si modificas los archivos JSON en `grafana/dashboards/`, los cambios se reflejan en ~10 segundos. También puedes:

- Recargar la página en Grafana (Ctrl+Shift+R)
- Reiniciar el contenedor: `docker compose restart grafana`

### Crear Dashboards Nuevos

1. En Grafana UI: **+** → **Dashboard** → **Add new panel**
2. Configurar queries usando el datasource `Prometheus`
3. Guardar el dashboard
4. Los cambios se persisten en el volumen Docker de Grafana

---

## Tracing Distribuido con Jaeger

### ¿Qué es el Tracing Distribuido?

Cuando un usuario hace una compra en Vento, la petición viaja a través de múltiples servicios:

```
Frontend → API Gateway → Order Service → Event Service (Feign)
                                      → Payment Service (HTTP)
                                      → Kafka (async)
                                      → Order Service (consumer)
```

Si algo falla, **¿cómo sabés exactamente dónde y por qué?** El tracing distribuido asigna un **Trace ID único** a cada petición del usuario. Ese ID viaja con la petición a través de TODOS los servicios, permitiendo ver el "camino completo" de una petición en un solo lugar.

### ¿Cómo funciona en Vento?

Vento usa **OpenTelemetry** (OTEL) con el bridge de **Micrometer Tracing**. La instrumentación es **automática** en la mayoría de los casos:

| Tecnología | Instrumentación | Qué hace |
|------------|----------------|----------|
| **HTTP (Spring MVC)** | Automática | Crea spans para cada request/response |
| **HTTP (WebFlux - Gateway)** | Automática | Crea spans para cada request/response |
| **Feign Clients** | Automática | Propaga `traceparent` headers en llamadas entre servicios |
| **Kafka (Producer/Consumer)** | Automática | Agrega trace headers en mensajes Kafka |
| **Custom Spans** | Manual | Spans de negocio para operaciones clave |

### Custom Spans Implementados

Además de los spans automáticos, agregamos spans manuales para operaciones de negocio:

| Span | Servicio | Attributes | Descripción |
|------|----------|------------|-------------|
| `order.create` | order-service | `order.eventId`, `order.quantity`, `order.userId` | Toda la lógica de creación de una orden (Redis + DB + Feign) |
| `payment.process` | payment-service | `payment.orderId`, `payment.amount` | Procesamiento de pago simulado (con 2s delay) |

### Flujo de un Trace Completo

```
POST /api/orders ─────────────────────────────────────── 2.5s
  ├─ order.create ──────────────────────────────────── 2.4s
  │   ├─ GET /api/events/{id} (Feign) ───── 0.3s
  │   ├─ Redis DECRBY ───────────────────── 0.05s
  │   ├─ DB INSERT order ────────────────── 0.1s
  │   └─ Feign decrementAvailableTickets ── 0.2s
  └─ payment.process ──────────────────────────────── 2.1s
      ├─ (simulated delay) ──────────────── 2.0s
      └─ Kafka publish payment.processed ── 0.05s
```

Todos estos spans comparten el **mismo Trace ID**, así en Jaeger ves todo el camino en una sola vista.

### Cómo Acceder y Usar Jaeger

**Acceso:**

```
URL: http://localhost:16686
```

No requiere autenticación.

### Buscar Traces

1. En **Service**, seleccioná un servicio (ej: `order-service`)
2. En **Operation**, dejá en `all` o filtrá por endpoint específico
3. Click en **Find Traces**

### Leer un Trace (Waterfall View)

Hacé click en un trace de la lista para ver el detalle:

```
POST /api/orders ──────────────────────────── 1.2s
  └─ order.create ────────────────────────── 1.1s
      ├─ GET /api/events/{id} ───── 0.3s     ← Llamada Feign a event-service
      ├─ Redis DECRBY ──────────── 0.05s     ← Reserva atómica en Redis
      └─ DB INSERT order ───────── 0.1s      ← Persistir en PostgreSQL
```

| Elemento | Significado |
|----------|-------------|
| **Indentación** | Relación padre-hijo (quién llamó a quién) |
| **Barra horizontal** | Duración proporcional del span |
| **🟢 Verde** | Span exitoso |
| **🔴 Rojo** | Span con error (click para ver stack trace) |
| **Tags** | Metadata del span (orderId, eventId, http.status_code, etc.) |

### Cómo verificar que todo funciona

| Verificación | Qué buscar |
|-------------|------------|
| **Ves traces de múltiples servicios** | Trace ID se propaga correctamente entre servicios |
| **Mismo Trace ID en todos los spans** | Propagación W3C TraceContext funciona |
| **Spans `order.create` y `payment.process` aparecen** | Custom spans configurados correctamente |
| **No hay spans rojos** | No hay errores en el flujo |
| **Duraciones razonables** | HTTP < 500ms, Redis < 50ms, Payment ~2s (delay simulado) |

### System Architecture View

En Jaeger, andá a **Monitor → System Architecture** para ver el grafo de servicios:

```
api-gateway ──> order-service ──> event-service
                                    │
                                ──> payment-service
                                    │
                                ──> Kafka (topics)
```

Esto te muestra visualmente cómo se comunican los servicios.

---

## Cómo Funciona el Histograma de Latencia

### ¿Qué es un histograma?

Un histograma divide las mediciones en "buckets" (rangos). Por ejemplo:

```
http_server_requests_seconds_bucket{le="0.05"}  100   ← 100 requests tardaron ≤50ms
http_server_requests_seconds_bucket{le="0.1"}   250   ← 250 requests tardaron ≤100ms
http_server_requests_seconds_bucket{le="0.5"}   480   ← 480 requests tardaron ≤500ms
http_server_requests_seconds_bucket{le="+Inf"}  500   ← 500 requests en total
```

Con estos buckets, Prometheus puede calcular percentiles reales (p50, p95, p99) usando `histogram_quantile()`.

### Configuración del Histograma

Por defecto, Spring Boot **NO genera buckets de histograma**. Solo genera `_sum` y `_count`. Para activarlos, se agrega en cada `application.yml`:

```yaml
management:
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
```

Esto está configurado en los 4 servicios: `api-gateway`, `event-service`, `order-service`, `payment-service`.

### Ejemplo de query con histograma

```promql
# Percentil 95 de latencia, agrupado por servicio
histogram_quantile(0.95, sum by(le, service) (rate(http_server_requests_seconds_bucket[5m])))
```

- `histogram_quantile(0.95, ...)` — calcula el percentil 95
- `sum by(le, service)` — agrupa buckets por servicio
- `rate(...[5m])` — tasa de cambio en los últimos 5 minutos

---

## Cómo Agregar Métricas Custom a un Servicio

### Paso 1: Inyectar `MeterRegistry`

```java
@Service
@RequiredArgsConstructor
public class MiServicio {
    private final MeterRegistry meterRegistry;
    private Counter miCounter;

    @PostConstruct
    public void init() {
        miCounter = Counter.builder("vento.mi.servicio.contador")
                .tag("tipo", "mi_tipo")
                .description("Descripción del contador")
                .register(meterRegistry);
    }
}
```

### Paso 2: Incrementar el counter donde corresponda

```java
public void hacerAlgo() {
    // lógica...
    miCounter.increment();
}
```

### Paso 3: Verificar en Prometheus

Abre `http://localhost:{puerto}/actuator/prometheus` y busca tu métrica:

```
# HELP vento_mi_servicio_contador_total Descripción del contador
# TYPE vento_mi_servicio_contador_total counter
vento_mi_servicio_contador_total{tipo="mi_tipo"}  5.0
```

### Paso 4: Agregar al dashboard de Grafana

Editar el JSON del dashboard en `grafana/dashboards/` y agregar un panel con la query correspondiente.

> **Convención de nombres:** Usar el patrón `vento.{dominio}.count` con tag `type` para métricas relacionadas. Ejemplo: `vento.orders.count{type="created"}`.

---

## Troubleshooting Común

### Panel muestra "No Data"

1. **Verificar que el servicio está corriendo:**
   ```bash
   curl http://localhost:{puerto}/actuator/health
   ```

2. **Verificar que la métrica existe:**
   ```bash
   curl http://localhost:{puerto}/actuator/prometheus | grep "nombre_de_metrica"
   ```

3. **Verificar que Prometheus está scrapeando:**
   - Abrir `http://localhost:9090/targets`
   - Todos los servicios deben aparecer como **UP**

4. **Verificar la query en Prometheus:**
   - Abrir `http://localhost:9090/graph`
   - Escribir la query manualmente y verificar que devuelve datos

### Métricas custom en 0

- **Los counters son en memoria.** Se resetean a 0 cada vez que reinicias el servicio.
- Necesitas generar actividad **después** de que el servicio esté corriendo.
- Para counters de Kafka (ej. `confirmed`), asegúrate de completar el flujo completo (crear orden → procesar pago → Kafka confirma).

### Métrica con nombre incorrecto

Si registras `vento.orders.created` pero en Prometheus aparece `vento_orders_total` (sin `created`), usa el patrón de **counter con tags**:

```java
Counter.builder("vento.orders.count")
    .tag("type", "created")
    .register(meterRegistry);
```

Esto genera: `vento_orders_count_total{type="created"}` (nombre correcto con tag).

### `histogram_quantile` no devuelve datos

- Asegúrate de que `percentiles-histogram` está configurado en `application.yml`.
- Reinicia el servicio después de agregar la configuración.
- Necesitas al menos **varias requests HTTP** en los últimos 5 minutos para que el histograma tenga datos.
- Verifica que existe `http_server_requests_seconds_bucket` en `/actuator/prometheus`.

### Grafana no carga los dashboards

- Verificar que los archivos JSON son válidos: `python3 -m json.tool grafana/dashboards/archivo.json`
- Verificar los volumes en `docker-compose.local.yml`
- Reiniciar: `docker compose restart grafana`

---

## Relación con SPRINT_4.md

Este sistema de observabilidad corresponde al **Sprint 4, Semana 8** del roadmap del proyecto.

### Sprint 4 Estado

| Tarea | Estado |
|-------|--------|
| **7.1** Infraestructura Elasticsearch | ✅ Completado |
| **7.2** Sync PostgreSQL → Elasticsearch | ✅ Completado |
| **7.3** Búsqueda avanzada API | ✅ Completado |
| **7.4** Búsqueda por geolocalización | ✅ Completado |
| **8.1** OpenTelemetry (Tracing) | ✅ Completado |
| **8.2** Métricas con Prometheus | ✅ Completado |
| **8.3** Dashboards de Grafana | ✅ Completado |
| **8.4** Logging centralizado | ⏳ Pendiente |
| **8.5** Health checks avanzados | ✅ Completado (documentación Postman) |

### Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Métricas de eventos + Elasticsearch sync + tracing |
| order-service | 8083 | Métricas de órdenes y reservas + tracing (custom spans + Feign) |
| payment-service | 8084 | Métricas de pagos + tracing (custom spans) |
| api-gateway | 8080 | Métricas de gateway + tracing (WebFlux auto-instrumented) |
| prometheus | 9090 | Recolección de métricas |
| grafana | 3000 | Visualización de dashboards + datasource Jaeger |
| otel-collector | 4318/4317 | Recolector de traces (OTLP HTTP/gRPC) |
| jaeger | 16686 | Visualización de traces distribuidos |

---

## Referencias

- [Micrometer Docs](https://micrometer.io/docs)
- [Micrometer Tracing](https://micrometer.io/docs/tracing)
- [OpenTelemetry Java](https://opentelemetry.io/docs/languages/java/)
- [Jaeger Docs](https://www.jaegertracing.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/latest/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [SPRINT_4.md](requerimientos/SPRINT_4.md) — Plan completo del sprint
- [REQUERIMIENTOS.md](requerimientos/REQUERIMIENTOS.md) — Roadmap del proyecto
