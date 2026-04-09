# Observabilidad — Vento App

## Visión General

El sistema de observabilidad de Vento App está compuesto por **Prometheus** para recolección de métricas y **Grafana** para visualización. Este stack permite monitorear el rendimiento de los microservicios, las ventas en tiempo real y la salud de la infraestructura.

### Arquitectura

```
┌─────────────────┐     scrape      ┌──────────────┐
│  Microservicios │ ──────────────> │  Prometheus  │
│  (4 servicios)  │  /actuator/     │  (puerto     │
│                 │   prometheus    │    9090)      │
└─────────────────┘                 └──────┬───────┘
                                          │
                                     scrape│
                                          ▼
                                   ┌──────────────┐
                                   │   Grafana    │
                                   │  (puerto     │
                                   │    3000)     │
                                   └──────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Puerto | Propósito |
|------------|------------|--------|-----------|
| **Micrometer** | Librería Java | — | Exponer métricas en cada servicio |
| **Prometheus** | prom/prometheus:v2.51.0 | 9090 | Recolectar y almacenar métricas |
| **Grafana** | grafana/grafana-oss | 3000 | Visualizar dashboards |

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
| **8.1** OpenTelemetry (Tracing) | ⏳ Pendiente |
| **8.2** Métricas con Prometheus | ✅ Completado |
| **8.3** Dashboards de Grafana | ✅ Completado |
| **8.4** Logging centralizado | ⏳ Pendiente |
| **8.5** Health checks avanzados | ⏳ Pendiente |

### Servicios Involucrados

| Servicio | Puerto | Responsabilidad |
|----------|--------|------------------|
| event-service | 8082 | Métricas de eventos + Elasticsearch sync |
| order-service | 8083 | Métricas de órdenes y reservas |
| payment-service | 8084 | Métricas de pagos |
| api-gateway | 8080 | Métricas de gateway + propagación de tracing |
| prometheus | 9090 | Recolección de métricas |
| grafana | 3000 | Visualización de dashboards |

---

## Referencias

- [Micrometer Docs](https://micrometer.io/docs)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/latest/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [SPRINT_4.md](./SPRINT_4.md) — Plan completo del sprint
- [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) — Roadmap del proyecto
