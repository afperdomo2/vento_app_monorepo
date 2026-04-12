# Vento App Monorepo — Contexto de Qwen

## Resumen del Proyecto

**Vento App** es una plataforma de gestión de eventos construida como un monorepo de Spring Boot + Gradle con arquitectura de microservicios y un frontend en Angular 21. La aplicación permite crear eventos, gestionar inventario de tickets y procesar reservas con un sistema de reservas temporales respaldado por TTL de Redis.

### Arquitectura

```
vento_app_monorepo/
├── common/                      # Módulo compartido (DTOs, excepciones, utilerías)
├── microservices/
│   ├── api-gateway/             # Spring Cloud Gateway (puerto 8080)
│   ├── event-service/           # CRUD de eventos + inventario de tickets (puerto 8082)
│   ├── order-service/           # Gestión de pedidos/reservas (puerto 8083)
│   └── payment-service/         # Procesamiento de pagos simulado (puerto 8084)
├── frontend/                    # SPA Angular 21 (puerto 4200)
└── database/                    # Scripts SQL y migraciones
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Backend** | Java | 25 |
| | Spring Boot | 3.5.0 |
| | Spring Cloud | 2025.0.0 |
| | Gradle | 9.4 |
| | PostgreSQL | 16 (Docker) |
| | Redis | 7 (Docker) |
| | Keycloak | 24.0 (OAuth2/OIDC) |
| **Frontend** | Angular | 21.2 |
| | TypeScript | 5.9 |
| | Tailwind CSS | 4.x |
| | pnpm | 10 |
| | ESLint | 10 + Angular ESLint 21 |
| **Infra** | Docker Compose | Multi-entorno |
| | Kafka | 9092/9093 |
| | Elasticsearch | 9200 |
| | Kibana | 5601 |

---

## Construcción y Ejecución

### Prerrequisitos

```bash
# Backend
sdk install java 25-tem
sdk use java 25-tem

# Frontend
nvm install 22
npm install -g pnpm
```

### Inicio Rápido — Stack Completo (Desarrollo Local)

```bash
# Terminal 1: Infraestructura (PostgreSQL, Redis, Keycloak, Elasticsearch)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminales 2-5: Microservicios
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:payment-service:bootRun
./gradlew :microservices:api-gateway:bootRun

# Terminal 6: Frontend
cd frontend && pnpm start
```

**Puntos de Acceso:**
- 🌐 Frontend: http://localhost:4200
- 🔌 API Gateway: http://localhost:8080
- 📖 Swagger (event): http://localhost:8082/swagger-ui.html
- 📖 Swagger (order): http://localhost:8083/swagger-ui.html
- 📖 Swagger (payment): http://localhost:8084/swagger-ui.html
- 🔐 Keycloak: http://localhost:8180 (admin/admin)
- 🔍 Elasticsearch: http://localhost:9200
- 📊 Kibana: http://localhost:5601

### Comandos del Backend

```bash
./gradlew build                              # Compilar todo con tests
./gradlew build -x test                      # Compilar sin tests
./gradlew :microservices:event-service:build # Módulo específico
./gradlew test                               # Ejecutar todos los tests
./gradlew :microservices:event-service:test --tests "*SomeTest*"  # Test específico
./gradlew test --info                        # Tests con salida detallada
./gradlew :microservices:event-service:bootRun  # Ejecutar un servicio
./gradlew clean                              # Limpiar builds
```

### Comandos del Frontend

```bash
cd frontend
pnpm install                                 # Instalar dependencias
pnpm start                                   # Servidor de desarrollo (localhost:4200)
pnpm build                                   # Build de producción
pnpm test                                    # ng test (Karma/Jasmine)
pnpm lint                                    # Verificación ESLint
pnpm lint:fix                                # Auto-corrección ESLint
pnpm ng generate component features/<f>/components/<name>  # Generar componente
pnpm exec prettier --write "src/**/*.{ts,html,scss}"       # Formatear código
```

### Entornos Docker

```bash
# Local (solo infraestructura, servicios vía Gradle)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Dev (todos los servicios en Docker)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Prod (Docker optimizado, volúmenes persistentes)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Ver logs
docker compose logs -f <nombre-servicio>

# Detener y eliminar volúmenes
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

---

## Arquitectura del Frontend

### Path Aliases

Usa imports absolutos — nunca uses `../../`:

```typescript
import { EventService } from '@core/services/event.service';
import { EventCard } from '@shared/components/event-card/event-card';
import { formatCurrency } from '@core/format/format';
import { HomePage } from '@features/home/home.page';
import { ENV } from '@env/environment';
```

Aliases disponibles (configurados en `tsconfig.app.json`):
- `@app/*` → `src/app/*`
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@env/*` → `src/environments/*`

### Estructura de Features

```
src/app/
├── core/                     # Servicios globales singleton (auth, guards, interceptors)
├── shared/                   # Componentes, directivas, pipes, UI reutilizables
└── features/                 # Módulos de negocio (lazy-loaded)
    └── <feature>/
        ├── components/       # Componentes hijos específicos del feature
        ├── services/         # Servicios del feature
        └── <feature>.page.ts # Página principal (orquestador)
```

### Componentización de la Home Page

La home page se compone de 4 componentes hijos (patrón smart/presentational):

```
home/
├── home.page.ts                          # Orquestador (~30 líneas)
└── components/
    ├── home-hero-banner/                 # Dumb — banner hero estático
    ├── home-featured-events/             # Smart — carga eventos vía EventService
    ├── home-nearby-events/               # Smart — geolocalización + eventos cercanos
    └── home-newsletter-cta/              # Dumb — sección newsletter
```

### Todos los Features

| Feature | Descripción |
|---------|-------------|
| `home/` | Landing page con hero, eventos destacados, eventos cercanos, newsletter |
| `events-list/` | Listado completo con búsqueda, filtros, scroll infinito |
| `event-detail/` | Vista individual de evento con reserva de tickets |
| `checkout/` | Flujo de revisión de pedido y pago |
| `my-orders/` | Historial de pedidos del usuario y detalle con tickets QR |
| `nearby/` | Descubrimiento de eventos cercanos basado en mapa |
| `login/` | Página de autenticación |
| `profile/` | Gestión de perfil de usuario |
| `organizer/` | Dashboard del organizador de eventos |

### Gestión de Estado

- **Signals** (`signal()`, `computed()`, `effect()`) para estado reactivo — NO usar RxJS BehaviorSubject
- **Servicios** inyectados vía función `inject()` — NO inyección por constructor
- **HTTP** vía `httpResource()` o `inject(HttpClient)` con signals
- **Componentes** standalone (sin NgModules)

### Formato de Código

- **Prettier**: printWidth 100, comillas simples, parser Angular para HTML
- **EditorConfig**: 2 espacios, UTF-8, newline final, trim trailing whitespace
- **TypeScript**: strict mode, noImplicitOverride, strictTemplates

---

## Configuración de ESLint

El proyecto usa **ESLint 10** con **Angular ESLint 21** y **TypeScript ESLint 8**.

### Archivo de Config: `frontend/eslint.config.js`

Usa flat config con:
- `@typescript-eslint/recommended` + `stylistic`
- `@angular-eslint/tsRecommended` + `templateRecommended` + `templateAccessibility`
- Procesamiento de templates inline para componentes Angular

### Reglas Clave

| Regla | Nivel | Notas |
|-------|-------|-------|
| `@typescript-eslint/no-explicit-any` | **error** | Prohibir tipo `any` |
| `@typescript-eslint/no-unused-vars` | **error** | Variables/imports sin uso (args que empiezan con `_` permitidos) |
| `@typescript-eslint/no-non-null-assertion` | **warn** | Evitar operador `!` |
| `@typescript-eslint/explicit-function-return-type` | **warn** | Agregar tipos de retorno (expresiones y funcs tipadas exentas) |
| `@angular-eslint/component-selector` | **error** | Debe usar prefijo `app-`, kebab-case |
| `@angular-eslint/directive-selector` | **error** | Debe usar prefijo `app`, camelCase |

### Ejecutar ESLint

```bash
cd frontend
pnpm lint       # Verificar problemas
pnpm lint:fix   # Auto-corregir lo posible
```

### Patrones Comunes a Evitar (fallarán el lint)

- **Tipos `any`** → Usar interfaces propias, `unknown` con type guards, o tipos de librería
- **Aserciones `!`** → Usar `@if (signal(); as localVar)` en templates, type narrowing en TS
- **Imports sin uso** → Eliminar inmediatamente, el auto-import del IDE frecuentemente deja imports muertos
- **Return types faltantes en métodos** → Agregar `: void`, `: Type` a métodos de clases
- **Código muerto** → Eliminar Subjects, signals, métodos que nunca se llaman

---

## Convenciones del Backend

### Estructura de Paquetes

```
microservices/<servicio>/src/main/java/com/vento/<modulo>/
├── controller/      # Endpoints REST (@RestController)
├── service/         # Lógica de negocio (@Service)
├── repository/      # Acceso a datos (@Repository)
├── model/           # Entidades JPA
├── dto/             # Objetos de Transferencia de Datos
├── config/          # Clases de configuración
└── exception/       # Excepciones personalizadas y handlers
```

### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clases | PascalCase | `EventController`, `OrderService` |
| Métodos | camelCase | `createEvent()`, `findById()` |
| Constantes | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `REDIS_TTL` |
| Paquetes | minúsculas singular | `com.vento.event.controller` |

### Estilo de Código

- **Imports**: Explícitos (nunca `.*`), orden: static > java > javax > org.springframework > otros > terceros
- **Inyección**: `@Autowired` en constructores (no en campos), preferir inyección por constructor
- **Anotaciones**: `@Service`, `@Repository`, `@RestController`, `@Transactional` en métodos que modifican datos
- **DTOs**: Inmutables con `@Value` o records, usar `@Builder` (Lombok) para objetos complejos
- **Entidades JPA**: Usar Lombok `@Data`, `@Entity`, `@Table`, campos con `@Id`, `@GeneratedValue`
- **Errores**: Excepciones extienden `RuntimeException`, usar `@ControllerAdvice` para manejo global, códigos HTTP apropiados (400, 404, 409, 500)
- **Logging**: `@Slf4j` (Lombok), niveles: ERROR (excepciones), WARN (warnings esperados), INFO (operacional), DEBUG (detalles), nunca loggear datos sensibles
- **Config**: `application.yml` + perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`), properties en kebab-case, secretos en variables de entorno
- **Validación**: Usar anotaciones `jakarta.validation` (`@NotNull`, `@NotBlank`, `@Size`, etc.) en DTOs
- **API Docs**: `springdoc-openapi` con `@Operation`, `@ApiResponses` en controllers

### Testing del Backend

- **Framework**: JUnit 5 (`@Test`, `@BeforeEach`, `@DisplayName`)
- **Mocks**: Mockito (`@Mock`, `@InjectMocks`, `when().thenReturn()`, `verify()`)
- **Integración**: `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` según corresponda
- **Patrón**: AAA (Arrange, Act, Assert)
- **Nombres**: `*Test.java`, métodos descriptivos: `shouldReturnEventWhenExists()`
- **H2**: Usar H2 en memoria para tests de repositorio

---

## Datos y Estado Clave

### Puertos

| Servicio | Puerto (dev) | Puerto (prod) | Propósito |
|----------|-------------|---------------|-----------|
| API Gateway | 8080 | 8080 | Enrutamiento de peticiones (única entrada al backend) |
| Event Service | 8082 | — | Gestión de eventos (solo vía API Gateway en prod) |
| Order Service | 8083 | — | Gestión de pedidos/reservas (solo vía API Gateway en prod) |
| Payment Service | 8084 | — | Procesamiento de pagos (solo vía API Gateway en prod) |
| Frontend | 4200 | 3000 | SPA Angular |
| PostgreSQL Events | 5432 | — | DB de event-service |
| PostgreSQL Orders | 5433 | — | DB de order-service |
| PostgreSQL Payments | 5434 | — | DB de payment-service |
| Redis | 6379 | — | Caché + reservas temporales |
| Keycloak | 8180 | 8180 | Proveedor OAuth2/OIDC |
| Kafka | 9092/9093 | — | Message broker (solo dev) |
| Kafka UI | 8089 | — | Debug de Kafka (solo dev) |
| Elasticsearch | 9200 | — | Búsqueda full-text |
| Kibana | 5601 | 5601 | UI de Elasticsearch |
| Prometheus | 9090 | — | Métricas (acceso interno solo, vía Grafana) |
| Jaeger | 16686 | 16686 | UI de traces distribuidos |
| OTel Collector | 4317, 4318 | — | Recepción de traces (acceso interno) |
| Loki | 3100 | — | Agregación de logs (acceso interno, vía Grafana) |
| Grafana | 3000 | 3001 | Dashboards de observabilidad (métricas, logs, traces) |

### Claves de Redis

| Patrón | Propósito | TTL |
|--------|-----------|-----|
| `vento:event:{id}:available_tickets` | Inventario de tickets | Persistente |
| `vento:reservation:{orderId}` | Reserva temporal | 5 minutos |

### Estados de Pedido

```
PENDING → CONFIRMED (pago exitoso)
        → CANCELLED (usuario canceló)
        → EXPIRED (timeout de 5 min)
```

### Seguridad (Keycloak)

| Escenario | Respuesta |
|-----------|-----------|
| Sin token | `401 Unauthorized` |
| Token inválido/expirado | `401 Unauthorized` |
| Token válido, sin rol | `403 Forbidden` |
| Token válido, con rol | `200 OK` |

**Frontend — Token expiration:**
- Los tokens de Keycloak tienen una duración de 5 minutos (`expires_in: 300`)
- El frontend considera el token expirado 1 minuto antes del `exp` real (buffer de 60s)
- **Refresh automático**: al recibir 401 del gateway, el interceptor llama a `refreshSession()` (`grant_type=refresh_token`) y reintenta la petición original con el nuevo access token
- Si el refresh token también expiró o es inválido, se ejecuta logout y redirect a `/login`
- Requests concurrentes que reciben 401 comparten el mismo refresh in-flight (no se lanzan múltiples requests de refresh)

**Headers propagados a microservicios:**
- `X-User-Id`: ID del usuario desde claim `sub` del JWT
- `X-User-Roles`: Roles separados por coma desde `realm_access.roles`

---

## Observabilidad

### Pipeline completo

```
Microservicios → OTel Collector → Jaeger (traces)
              ↘ Prometheus (métricas) ← scrapea /actuator/prometheus
              ↘ Loki (logs) ← recibe via Promtail

Grafana ← datasource: Prometheus (métricas)
        ← datasource: Loki (logs)

Jaeger UI (http://localhost:16686) ← traces distribuidos
```

### Herramientas

| Herramienta | Propósito | Acceso |
|---|---|---|
| **OTel Collector** | Recibe traces OTLP de todos los servicios, los envía a Jaeger | Interno solo |
| **Jaeger** | Almacena y visualiza traces distribuidos | Puerto 16686 (UI directa) |
| **Prometheus** | Scrapea métricas de Spring Boot Actuator (`/actuator/prometheus`) | Interno solo (vía Grafana) |
| **Loki** | Agrega logs de todos los contenedores via Promtail | Interno solo (vía Grafana) |
| **Grafana** | Dashboards unificados para métricas y logs | Puerto 3000 (dev) / 3001 (prod) |

### Grafana — Datasources provisionados

- **Prometheus** (`grafana/provisioning/datasources/prometheus.yml`) → datasource default
- **Loki** (`grafana/provisioning-{dev,prod}/datasources/loki.yml`) → logs

### Grafana — Dashboards disponibles

| Dashboard | Archivo | Propósito |
|---|---|---|
| **Vento — Log Explorer** | `logs-dashboard.json` | Volumen de logs, errores, logs por servicio/nivel |
| **Infrastructure** | `infrastructure-dashboard.json` | Health de servicios, CPU, memoria, uptime |
| **Performance** | `performance-dashboard.json` | Latencia de requests, throughput, percentiles |
| **Sales** | `sales-dashboard.json` | Métricas de negocio: órdenes, pagos, revenue |

### Jaeger UI

Acceso directo en `http://localhost:16686` para:
- Búsqueda de traces por servicio, operación, tags, duración
- Timeline visual completo con spans y critical path
- Grafo de dependencias entre servicios

### Métricas expuestas

Cada microservicio expone en `/actuator/prometheus`:
- `http_server_requests_seconds` — latencia de requests (histograma)
- `jvm_memory_used_bytes` — uso de memoria JVM
- `process_cpu_usage` — consumo de CPU
- `spring_data_repository_invocations_seconds` — rendimiento de repositorios

### Logs

- Promtail lee logs de Docker via `/var/run/docker.sock`
- Config en `scripts/promtail-config.yml`
- Enviados a Loki en `http://loki:3100`

---

## Variables de Entorno

| Archivo | Propósito | Versionado |
|---------|-----------|------------|
| `.env.example` | Plantilla | ✅ Sí |
| `.env` | Desarrollo local | ❌ No |
| `.env.prod` | Producción | ❌ No |

### Variables Clave

```bash
# PostgreSQL
POSTGRES_EVENTS_DB=events_db
POSTGRES_EVENTS_USER=postgres
POSTGRES_EVENTS_PASSWORD=postgres

POSTGRES_ORDERS_DB=orders_db
POSTGRES_ORDERS_USER=postgres
POSTGRES_ORDERS_PASSWORD=postgres

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
```

---

## Troubleshooting

### Los servicios no se conectan a la BD (Local)

```bash
# Verificar que la infraestructura esté corriendo
docker compose -f docker-compose.yml -f docker-compose.local.yml ps

# Ver logs de la BD
docker compose logs postgres-events
```

### API Gateway "Connection Refused"

El Gateway en modo local apunta a `localhost:8082` y `localhost:8083`. Verificar que los servicios estén corriendo:

```bash
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
```

### Resetear Bases de Datos (Local)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

### Problemas de Autenticación Keycloak

1. Verificar que el realm `vento-realm` existe
2. Verificar configuración de clientes (`vento-api`, `vento-frontend`)
3. Asegurarse que el usuario tiene roles asignados a nivel de **Realm**
4. Verificar campos obligatorios del usuario completos (firstName, lastName)

---

## Agregar un Nuevo Microservicio

1. Crear carpeta en `microservices/<nombre>/`
2. Copiar `build.gradle` de un servicio existente, ajustar dependencias
3. Crear estructura de paquetes Java estándar
4. Agregar en `settings.gradle`:
   ```groovy
   include 'microservices:<nombre>'
   ```
5. Configurar ruta en `api-gateway/application.yml`
6. Crear `application.yml` con configs por perfil (local/dev/prod)
7. Agregar en `docker-compose.local.yml` si necesita infraestructura

---

## Referencias

- **[README.md](./README.md)**: Guía completa de usuario
- **[AGENTS.md](./AGENTS.md)**: Referencia rápida para agentes AI
- **[KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)**: Guía de configuración de Keycloak
- **[POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json)**: Colección para testing de API
- **[frontend/README.md](./frontend/README.md)**: Documentación específica del frontend
