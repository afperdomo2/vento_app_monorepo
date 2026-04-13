# 🎟️ Vento App — Monorepo de Microservicios

Plataforma de venta de tickets para eventos construida con arquitectura de microservicios. El backend usa Java 25 + Spring Boot 3.5, el frontend Angular 21, y toda la infraestructura está contenedorizada con Docker Compose.

> **Documentación adicional:**
> - [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura detallada del sistema
> - [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) — Configuración de autenticación
> - [OBSERVABILIDAD.md](./OBSERVABILIDAD.md) — Stack de observabilidad
> - [POSTMAN_ENDPOINTS.md](./POSTMAN_ENDPOINTS.md) — Catálogo de endpoints para pruebas

---

## 📁 Estructura del Proyecto

```
vento_app_monorepo/
├── common/                          # Módulo compartido (DTOs, excepciones, utilerías)
│   └── src/main/java/com/vento/common/
│       ├── dto/                     # DTOs compartidos y eventos Kafka
│       │   ├── ApiResponse.java
│       │   ├── event/               # DTOs de eventos
│       │   ├── kafka/               # Eventos Kafka (OrderConfirmedEvent, etc.)
│       │   ├── order/               # DTOs de pedidos
│       │   └── payment/             # DTOs de pagos
│       ├── entity/                  # AuditableEntity (base JPA)
│       ├── exception/               # Excepciones de dominio y GlobalExceptionHandler
│       └── util/                    # KafkaTopics, UserContext
├── microservices/
│   ├── api-gateway/                 # Spring Cloud Gateway — puerto 8080
│   ├── event-service/               # Gestión de eventos — puerto 8082
│   ├── order-service/               # Gestión de pedidos — puerto 8083
│   └── payment-service/             # Simulación de pagos — puerto 8084
├── frontend/                        # Angular 21 SPA — puerto 4200
├── grafana/                         # Dashboards y datasources de Grafana
├── scripts/                         # Scripts de inicialización (Kafka, Elasticsearch)
├── docker-compose.yml               # Servicios base compartidos
├── docker-compose.local.yml         # Solo infraestructura (microservicios en Gradle)
├── docker-compose.dev.yml           # Stack completo en Docker con debug
├── docker-compose.prod.yml          # Stack completo optimizado para producción
└── prometheus.yml                   # Configuración de scraping de Prometheus
```

---

## ⚙️ Versiones del Stack

| Componente | Versión |
|---|---|
| Java | 25 (`eclipse-temurin:25`) |
| Gradle | 9.4.0 (full distribution) |
| Spring Boot | 3.5.0 |
| Spring Cloud | 2025.0.0 |
| Angular | ^21.2.0 |
| TypeScript | ~5.9.2 |
| Node.js | 22+ |
| pnpm | 10.30.3 |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| Kafka | 4.1.1 |
| Elasticsearch | 8.18.0 |
| Keycloak | 26.0 |

---

## ⚡ Requisitos Previos

### Backend

- **Java 25** (usar [SDKMAN](https://sdkman.io/) para gestionar versiones)
- **Gradle 9.4** (incluido via wrapper — no necesitas instalarlo)
- **Docker & Docker Compose** (para infraestructura)

```bash
# Instalar Java 25 con SDKMAN
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 25-tem
sdk use java 25-tem
```

### Frontend

- **Node.js 22+** (recomendado [nvm](https://github.com/nvm-sh/nvm) o [fnm](https://github.com/Schniz/fnm))
- **pnpm 10.30.3** (gestor de paquetes)

```bash
# Instalar pnpm
npm install -g pnpm@10.30.3
```

---

## 🌍 Entornos de Ejecución

El proyecto soporta tres entornos:

| Entorno | Microservicios | Infraestructura | Uso |
|---|---|---|---|
| **Local** | Gradle (hot reload) | Docker | Desarrollo diario |
| **Dev** | Docker (con debug) | Docker | Testing de integración |
| **Prod** | Docker (optimizado) | Docker | Producción |

---

### 🏠 Entorno Local (Recomendado para desarrollo)

Solo la infraestructura corre en Docker. Los microservicios corren con Gradle para aprovechar hot reload y debugging directo desde el IDE.

```bash
# 1. Compilar (primera vez o tras cambios en dependencias)
./gradlew build -x test

# 2. Levantar infraestructura (PostgreSQL x3, Redis, Kafka, Keycloak, Elasticsearch, etc.)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# 3. Ejecutar microservicios (en terminales separadas)
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:payment-service:bootRun
./gradlew :microservices:api-gateway:bootRun

# 4. (Opcional) Hot reload automático al cambiar código
./gradlew classes --continuous
```

**Ventajas:**
- ✅ Hot reload automático al cambiar código
- ✅ Debugging directo desde el IDE
- ✅ Iteración rápida en desarrollo

---

### 🎨 Frontend (Angular 21)

```bash
# Navegar a la carpeta frontend
cd frontend

# Configurar variables de entorno (solo la primera vez)
pnpm run setup:env

# Instalar dependencias (primera vez)
pnpm install

# Iniciar servidor de desarrollo
pnpm start
```

La aplicación estará disponible en: **http://localhost:4200**

**Comandos disponibles:**

| Comando | Descripción |
|---|---|
| `pnpm start` | Servidor de desarrollo en localhost:4200 |
| `pnpm build` | Build de **producción** (por defecto) |
| `pnpm build -- --configuration development` | Build de desarrollo |
| `pnpm test` | Ejecutar tests unitarios |
| `pnpm lint` | Analizar código con ESLint |
| `pnpm lint:fix` | Corregir errores de lint automáticamente |
| `pnpm watch` | Build en modo watch (development) |

> ⚠️ `pnpm build` compila en modo **producción** por defecto (`defaultConfiguration: "production"` en `angular.json`).

**Documentación completa:** Ver [frontend/README.md](./frontend/README.md)

---

### 🔧 Entorno Dev (Testing de integración)

Todos los servicios, incluidos los microservicios, corren en contenedores Docker. Los puertos JDWP quedan expuestos para debug remoto.

```bash
# Levantar todo el stack (usa la última imagen construida)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Reconstruir todas las imágenes y desplegar
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Reconstruir solo un servicio
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d event-service

# Apagar y limpiar contenedores
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Ver logs en tiempo real
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Si Kafka se reinicia, recrear los topics manualmente
docker exec vento-app-local-kafka-init-1 sh /init-kafka.sh
```

**Puertos de debug remoto (JDWP):**

| Servicio | Puerto debug |
|---|---|
| event-service | 5005 |
| order-service | 5006 |
| api-gateway | 5007 |
| payment-service | 5009 |

**Ventajas:**
- ✅ Entorno consistente y reproducible
- ✅ Testing de integración real
- ✅ Debug remoto habilitado

---

### 🚀 Entorno Prod (Producción)

```bash
# Configurar variables de entorno (una sola vez)
cp .env.example .env
# Editar .env con contraseñas seguras

# Desplegar en producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# O usando variables de entorno exportadas
export POSTGRES_EVENTS_PASSWORD=password_seguro
export POSTGRES_ORDERS_PASSWORD=password_seguro
export POSTGRES_PAYMENTS_PASSWORD=password_seguro
export KEYCLOAK_ADMIN_PASSWORD=password_seguro
export GRAFANA_ADMIN_PASSWORD=password_seguro
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Características de producción:**
- ✅ Imágenes optimizadas (multi-stage build con `eclipse-temurin:25`)
- ✅ Volúmenes persistentes para todos los datos
- ✅ Health checks configurados en todos los servicios
- ✅ Políticas de restart automático (`unless-stopped`)
- ✅ Usuario no-root por seguridad en contenedores Java
- ✅ Frontend Angular servido por Nginx
- ✅ Puertos internos no expuestos al host
- ✅ Retención de 30 días en Prometheus
- ✅ Grafana + Loki + Jaeger para observabilidad completa

---

## 🐳 Docker — Referencia de Comandos

### Por Entorno

#### LOCAL (solo infraestructura)
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose -f docker-compose.yml -f docker-compose.local.yml down
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
```

#### DEV (stack completo)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

#### PROD
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f event-service
docker compose logs -f postgres-events

# Detener un servicio
docker compose stop event-service

# Reiniciar un servicio
docker compose restart event-service

# Ver estado de los contenedores
docker compose ps
```

---

## 🗺️ Servicios e Infraestructura

### Puertos Expuestos (entorno local/dev)

| Servicio | Puerto | Descripción |
|---|---|---|
| **api-gateway** | 8080 | Única entrada al backend |
| **event-service** | 8082 | Solo acceso directo en desarrollo |
| **order-service** | 8083 | Solo acceso directo en desarrollo |
| **payment-service** | 8084 | Solo acceso directo en desarrollo |
| **frontend** | 4200 | Angular dev server |
| **keycloak** | 8180 | Dashboard de administración |
| **postgres-events** | 5432 | Base de datos de eventos |
| **postgres-orders** | 5433 | Base de datos de pedidos |
| **postgres-payments** | 5434 | Base de datos de pagos |
| **redis** | 6379 | Caché e inventario de tickets |
| **kafka (host)** | 9093 | Solo dev (`EXTERNAL://localhost:9093`) |
| **kafka-ui** | 8089 | UI de Kafka (Provectus) |
| **elasticsearch** | 9200 | Motor de búsqueda |
| **kibana** | 5601 | UI de Elasticsearch |
| **grafana** | 3000 | Dashboards de observabilidad |
| **prometheus** | 9090 | Métricas (acceso interno) |
| **jaeger** | 16686 | UI de trazas distribuidas |
| **otel-collector** | 4317, 4318 | OpenTelemetry (OTLP gRPC / HTTP) |

---

## 🌐 API Gateway — Rutas

| Endpoint | Destino | Autenticación |
|---|---|---|
| `GET /api/events/**` | event-service:8082 | Pública |
| `POST/PUT/DELETE /api/events/**` | event-service:8082 | `ROLE_ADMIN` |
| `/api/orders/**` | order-service:8083 | `ROLE_USER` o `ROLE_ADMIN` |
| `/api/payments/**` | payment-service:8084 | `ROLE_USER` o `ROLE_ADMIN` |

---

## 🔌 Referencia de Endpoints

### Event Service (Puerto 8082)

**Swagger UI:** http://localhost:8082/swagger-ui.html

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/events` | Crear evento |
| `GET` | `/api/events/{id}` | Obtener evento por ID (UUID) |
| `GET` | `/api/events` | Listar eventos (paginación) |
| `GET` | `/api/events/featured` | Eventos destacados |
| `PUT` | `/api/events/{id}` | Actualizar evento |
| `DELETE` | `/api/events/{id}` | Eliminar evento |
| `PUT` | `/api/events/{id}/tickets/release` | Liberar tickets en Redis |

### Order Service (Puerto 8083)

**Swagger UI:** http://localhost:8083/swagger-ui.html

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/orders` | Crear reserva (TTL 5 min en Redis) |
| `GET` | `/api/orders/{id}` | Obtener pedido por ID |
| `GET` | `/api/orders/my-orders` | Pedidos del usuario autenticado |
| `PUT` | `/api/orders/{id}/cancel` | Cancelar pedido (libera tickets) |
| `PUT` | `/api/orders/{id}/confirm` | Confirmar pedido manualmente |
| `GET` | `/api/orders/analytics` | Estadísticas de pedidos |

> **Reserva temporal:** Al crear una orden queda en estado `PENDING` con una reserva en Redis que expira en **5 minutos** (configurable con `vento.reservation.ttl-minutes`). Si no se confirma antes, la orden pasa a `EXPIRED` automáticamente.

### Payment Service (Puerto 8084)

**Swagger UI:** http://localhost:8084/swagger-ui.html

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/payments/process` | Procesar pago simulado (80% éxito, ~2s delay) |

> **Simulación de pago:** 80% de tasa de éxito, 20% de fallo. Delay artificial de ~2 segundos. Los fallos devuelven HTTP 402 en formato RFC 9457. Incluye deduplicación por `orderId` para idempotencia.

---

## 🔐 Seguridad (Keycloak)

La autenticación está centralizada en el **API Gateway** usando **Keycloak 26.0** como proveedor OAuth2/OIDC.

### Credenciales por Defecto (Solo Desarrollo Local)

| Servicio | URL | Usuario | Contraseña |
|---|---|---|---|
| Keycloak Dashboard | http://localhost:8180 | `admin` | `admin` |

> ⚠️ **Cambiar estas credenciales en producción** mediante el archivo `.env`.

### Configuración Requerida en Keycloak

1. **Realm:** `vento-realm`
2. **Cliente backend:** `vento-api` (OpenID Connect, confidential) — para validación de JWT en el Gateway
3. **Cliente frontend:** `vento-frontend` — con **Direct Access Grants** habilitado
4. **Roles:** `USER`, `ADMIN`
5. **Usuarios:** Crear y asignar roles según necesidad

**Guía completa paso a paso:** [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)

### Obtener Token JWT (curl)

```bash
TOKEN=$(curl -s -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123" | jq -r '.access_token')

# Usar el token
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
```

### Headers Propagados a Microservicios

El API Gateway extrae información del JWT y la reenvía como headers HTTP:

| Header | Origen JWT | Descripción |
|---|---|---|
| `X-User-Id` | Claim `sub` | ID único del usuario |
| `X-User-Roles` | Claim `realm_access.roles` | Roles (comma-separated) |

> Los microservicios **no validan JWT**. Confían directamente en los headers propagados por el Gateway. Una llamada directa que bypasee el Gateway es efectivamente no autenticada.

### Comportamiento de Seguridad

| Escenario | Respuesta |
|---|---|
| Request sin token | `401 Unauthorized` |
| Token inválido o expirado | `401 Unauthorized` |
| Token válido sin rol requerido | `403 Forbidden` |
| Token válido con rol correcto | Pasa al microservicio |

---

## 📦 Módulo `common/`

Módulo compartido (`java-library`) disponible para todos los microservicios.

| Componente | Descripción |
|---|---|
| `AuditableEntity` | `@MappedSuperclass` con `createdAt`, `updatedAt`, `@Version` (optimistic locking) |
| `GlobalExceptionHandler` | RFC 9457 Problem Details — auto-registrado via Spring auto-configuration |
| `KafkaTopics` | Constantes centralizadas de nombres de topics |
| `UserContext` | Thread-local para el `userId` propagado por el Gateway |
| `OrderStatus` | Enum: `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| `PaymentStatus` | Enum: `SUCCESS`, `FAILED` |
| `TicketStatus` | Enum de estado de tickets |

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
./gradlew test

# Tests de un módulo específico
./gradlew :microservices:event-service:test
./gradlew :microservices:order-service:test
./gradlew :common:test

# Test específico
./gradlew :microservices:event-service:test --tests "com.vento.event.service.EventServiceTest"
./gradlew :microservices:order-service:test --tests "*OrderServiceTest.testCreate*"

# Con output detallado
./gradlew test --info
```

### Cobertura Actual

| Módulo | Suite de Tests | Estado |
|---|---|---|
| event-service | `EventServiceTest` | ✅ |
| order-service | `OrderServiceTest` (CreateOrder, CancelOrder, ConfirmOrder, ConcurrencyTests) | ✅ |
| order-service | `PaymentSagaIntegrationTest` | ✅ |
| order-service | `DlqIntegrationTest` | ✅ |
| order-service | `PaymentResultListenerIdempotencyTest` | ✅ |
| order-service | `TicketInventoryServiceTest` | ✅ |
| payment-service | `KafkaEventPublishingTest` | ✅ |
| payment-service | `PaymentIdempotencyServiceTest` | ✅ |
| api-gateway | — | ❌ Sin tests |

> **Nota:** Los tests de integración de Kafka usan `EmbeddedKafka` de `spring-kafka-test`, no Testcontainers.

### Reportes HTML

```
microservices/*/build/reports/tests/test/index.html
```

---

## 🛠️ Desarrollo

### Arrancar el Stack Completo (Desarrollo Local)

```bash
# Terminal 1 — Infraestructura
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminal 2 — Event Service
./gradlew :microservices:event-service:bootRun

# Terminal 3 — Order Service
./gradlew :microservices:order-service:bootRun

# Terminal 4 — Payment Service
./gradlew :microservices:payment-service:bootRun

# Terminal 5 — API Gateway
./gradlew :microservices:api-gateway:bootRun

# Terminal 6 — Frontend
cd frontend && pnpm start
```

### URLs de Acceso

| Servicio | URL |
|---|---|
| 🌐 Frontend | http://localhost:4200 |
| 🔌 API Gateway | http://localhost:8080 |
| 📖 Swagger — Event Service | http://localhost:8082/swagger-ui.html |
| 📖 Swagger — Order Service | http://localhost:8083/swagger-ui.html |
| 📖 Swagger — Payment Service | http://localhost:8084/swagger-ui.html |
| 🔐 Keycloak | http://localhost:8180 |
| 🔍 Elasticsearch | http://localhost:9200 |
| 📊 Kibana | http://localhost:5601 |
| 📈 Grafana | http://localhost:3000 |
| 🔎 Jaeger | http://localhost:16686 |
| 📨 Kafka UI | http://localhost:8089 |

### Comandos de Build

```bash
# Compilar todo (con tests)
./gradlew build

# Compilar sin tests
./gradlew build -x test

# Compilar módulo específico
./gradlew :microservices:event-service:build

# Limpiar build
./gradlew clean

# Ver dependencias de un módulo
./gradlew :microservices:event-service:dependencies
```

---

## 🔧 Configuración por Perfiles de Spring Boot

Cada microservicio carga su configuración según `SPRING_PROFILES_ACTIVE` (por defecto: `local`).

```
microservices/event-service/src/main/resources/
├── application.yml           # Configuración base (activa perfil local por defecto)
├── application-local.yml     # Credenciales hardcodeadas para localhost
├── application-dev.yml       # Variables de entorno (Docker dev)
└── application-prod.yml      # Validación de schema, sin credenciales hardcodeadas
```

```bash
# Cambiar perfil manualmente
export SPRING_PROFILES_ACTIVE=dev
./gradlew :microservices:event-service:bootRun

# O como argumento
./gradlew :microservices:event-service:bootRun --args='--spring.profiles.active=prod'
```

---

## 🔐 Variables de Entorno

| Archivo | Propósito | En git |
|---|---|---|
| `.env.example` | Plantilla con todas las variables | ✅ Sí |
| `.env` | Valores para desarrollo local | ❌ No |
| `.env.prod` | Valores para producción | ❌ No |

### Variables Principales

```bash
# PostgreSQL — Event Service
POSTGRES_EVENTS_DB=events_db
POSTGRES_EVENTS_USER=postgres
POSTGRES_EVENTS_PASSWORD=postgres          # ⚠️ Cambiar en producción

# PostgreSQL — Order Service
POSTGRES_ORDERS_DB=orders_db
POSTGRES_ORDERS_USER=postgres
POSTGRES_ORDERS_PASSWORD=postgres          # ⚠️ Cambiar en producción

# PostgreSQL — Payment Service
POSTGRES_PAYMENTS_DB=payments_db
POSTGRES_PAYMENTS_USER=postgres
POSTGRES_PAYMENTS_PASSWORD=postgres        # ⚠️ Cambiar en producción

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin              # ⚠️ Cambiar en producción

# Frontend (build args para Dockerfile.prod)
API_URL=http://localhost:8080
KEYCLOAK_URL=http://localhost:8180
KEYCLOAK_REALM=vento-realm
KEYCLOAK_CLIENT_ID=vento-frontend

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin               # ⚠️ Cambiar en producción
GRAFANA_ROOT_URL=http://localhost:3001

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,Accept
CORS_EXPOSED_HEADERS=X-User-Id,X-User-Roles
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=3600

# Opcionales (tienen defaults)
ELASTICSEARCH_URIS=http://localhost:9200
KEYCLOAK_JWK_SET_URI=http://localhost:8180/realms/vento-realm/protocol/openid-connect/certs
```

---

## 📐 Estándar de Errores (RFC 9457)

Todas las respuestas de error siguen el estándar **[RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457)** (Problem Details for HTTP APIs):

```json
{
  "type": "https://vento.app/errors/validation-error",
  "title": "Errores de validación",
  "status": 400,
  "detail": "Se encontraron 2 errores de validación en la solicitud",
  "instance": "/api/orders",
  "service": "order-service",
  "timestamp": "2026-04-12T12:00:00.000"
}
```

| Tipo de error | HTTP | Descripción |
|---|---|---|
| `validation-error` | 400 | Datos de entrada inválidos |
| `unauthorized` | 401 | Error de autenticación |
| `forbidden` | 403 | Sin permisos suficientes |
| `not-found` | 404 | Recurso no encontrado |
| `payment-failed` | 402 | Pago fallido |
| `conflict` | 409 | Conflicto de negocio (ej. tickets agotados) |
| `internal-error` | 500 | Error interno del servidor |
| `bad-gateway` | 502 | Error en servicio externo |

---

## 🔄 Scripts de Inicialización

### Kafka (automático en Docker)

El contenedor `kafka-init` ejecuta `scripts/init-kafka.sh` automáticamente al primer `up`. Si se recrea el contenedor de Kafka, ejecutar manualmente:

```bash
docker exec vento-app-local-kafka-init-1 sh /init-kafka.sh
```

Topics creados (3 particiones, excepto DLQs con 1):
`payment.processed`, `payment.failed`, `order.confirmed`, `order.cancelled`, `event.created`, `event.updated`, `event.deleted`, `payment.processed.DLQ`, `payment.failed.DLQ`

### Elasticsearch (manual requerido)

El índice `events` **no se crea automáticamente**. Ejecutar una sola vez después de que Elasticsearch esté disponible:

```bash
bash scripts/init-elasticsearch.sh
```

Crea el índice con analyzer `autocomplete` (edge-ngram, min=2, max=20) y el campo `location` como `geo_point`. Sin esto, las búsquedas de eventos fallarán.

---

## 📂 Agregar un Nuevo Microservicio

1. Crear carpeta `microservices/<nombre-servicio>/` con estructura de paquetes estándar
2. Copiar `build.gradle` de `event-service` y ajustar dependencias
3. Registrar en `settings.gradle`:
   ```groovy
   include 'microservices:<nombre-servicio>'
   ```
4. Configurar ruta en `api-gateway/src/main/resources/application.yml`
5. Crear `application.yml` con perfiles `local`, `dev` y `prod`
6. Agregar servicio en `docker-compose.local.yml` si necesita infraestructura propia
7. Los Dockerfiles usan `context: .` (raíz del repo) — el build copia todo el monorepo

---

## 🐛 Troubleshooting

### Los microservicios no se conectan a la base de datos (Local)

```bash
# Verificar que la infraestructura esté corriendo
docker compose -f docker-compose.yml -f docker-compose.local.yml ps

# Verificar logs de PostgreSQL
docker compose logs postgres-events
docker compose logs postgres-orders

# Verificar puertos expuestos (5432, 5433, 5434)
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
```

### Error "Connection refused" en el API Gateway

El Gateway en perfil `local` apunta a `localhost:808X`. Verificar que los microservicios estén corriendo:

```bash
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8084/actuator/health
```

### Búsquedas de Elasticsearch no funcionan

El índice `events` debe crearse manualmente (no es automático):

```bash
# Verificar que ES esté healthy
curl http://localhost:9200/_cluster/health

# Crear el índice
bash scripts/init-elasticsearch.sh

# Verificar que se creó
curl http://localhost:9200/events
```

### Kafka: topics no existen al arrancar

```bash
# Re-ejecutar el script de inicialización
docker exec vento-app-local-kafka-init-1 sh /init-kafka.sh

# Verificar topics en Kafka UI
# http://localhost:8089
```

### Debug remoto en Docker (Dev)

1. En el IDE, crear configuración "Remote JVM Debug"
2. Host: `localhost`, Puerto según servicio (ver tabla de puertos de debug)
3. El servicio debe estar corriendo en modo dev:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d event-service
   ```

### Resetear bases de datos (Local)

```bash
# Detener y eliminar volúmenes
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v

# Reiniciar infraestructura
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

---

## 👤 Autor

Proyecto **Vento App** — Plataforma de tickets para eventos.
