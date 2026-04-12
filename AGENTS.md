# AGENTS.md - Vento App Monorepo

## Stack de versiones exactas

| Componente | Versión | Fuente |
|---|---|---|
| Java | 25 | `build.gradle` (allprojects), Dockerfiles `eclipse-temurin:25` |
| Gradle | 9.4.0 (full distribution) | `gradle/wrapper/gradle-wrapper.properties` |
| Spring Boot | 3.5.0 | root `build.gradle` plugin |
| Spring Cloud | 2025.0.0 | **`gradle.properties`** (no `build.gradle`) |
| Angular | ^21.2.0 | `frontend/package.json` |
| pnpm | 10.30.3 exacto | `frontend/package.json` campo `packageManager` |
| TypeScript | ~5.9.2 | `frontend/package.json` |
| Node.js | 22+ | docker-compose.dev.yml usa `node:22-alpine` |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) | `frontend/package.json` (no v3, sin `tailwind.config.js`) |

## Módulos Gradle

`settings.gradle` incluye solo:
```
common
microservices:api-gateway
microservices:event-service
microservices:order-service
microservices:payment-service
```
**Frontend no es módulo Gradle.** No existe `libs.versions.toml`; versiones en `gradle.properties` + bloque `ext` del `build.gradle` raíz.

`gradle.properties` activa caching, parallel build y daemon — no modificar.

## Comandos

### Backend (Gradle)

```bash
./gradlew build                              # Todo con tests
./gradlew build -x test                      # Sin tests
./gradlew :microservices:event-service:build # Módulo específico
./gradlew :common:build
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"
./gradlew :microservices:event-service:test --tests "*EventServiceTest.testCreate*"
./gradlew test --info                        # Output detallado
./gradlew :microservices:event-service:bootRun  # Usa perfil `local` por defecto
./gradlew clean
```

El flag `-parameters` se agrega globalmente en el `build.gradle` raíz — requerido por Spring MVC/Security.

### Frontend (Angular 21) — ejecutar desde `frontend/`

```bash
pnpm install
pnpm start           # dev server localhost:4200
pnpm build           # PRODUCCIÓN por defecto (defaultConfiguration: "production" en angular.json)
pnpm build -- --configuration development
pnpm test            # Karma/Jasmine
pnpm ng test -- --include='**/some.spec.ts'
pnpm run setup:env   # cp .env.example .env  (ejecutar una vez)
pnpm lint
pnpm lint:fix
pnpm exec prettier --write "src/**/*.{ts,html,scss}"
pnpm ng generate component features/<feature>/components/<name>
```

### Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d   # Local
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d     # Dev
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d    # Prod
docker compose logs -f <servicio>
docker compose down
```

## Infraestructura — puertos completos

| Servicio | Puerto externo (dev) | Puerto externo (prod) | Notas |
|---|---|---|---|
| api-gateway | 8080 | 8080 | Única entrada al backend |
| event-service | 8082 | — | Acceso solo vía API Gateway |
| order-service | 8083 | — | Acceso solo vía API Gateway |
| payment-service | 8084 | — | Acceso solo vía API Gateway |
| frontend | 4200 | 3000 | Angular/Nginx |
| postgres-events | 5432 | — | — |
| postgres-orders | 5433 | — | → interno 5432 |
| postgres-payments | 5434 | — | → interno 5432 |
| redis | 6379 | — | — |
| keycloak | 8180 | 8180 | → interno 8080 |
| kafka (containers) | 9092 | — | `INTERNAL://kafka:9092` |
| kafka (host) | **9093** | — | `EXTERNAL://localhost:9093` — solo dev |
| kafka-ui (Provectus) | 8089 | — | Solo dev |
| elasticsearch | 9200 | — | xpack.security deshabilitado |
| kibana | 5601 | 5601 | — |
| prometheus | 9090 | — | Acceso interno solo (Grafana) |
| jaeger | 16686 | 16686 | UI de traces (remover en prod si solo Grafana) |
| otel-collector | 4317, 4318 | — | Acceso interno solo |
| loki | 3100 | — | Acceso interno solo (Grafana) |
| grafana | 3000 | 3001 | Dashboards de observabilidad |
| debug JVM (event) | 5005 | — | JDWP, solo Docker dev |
| debug JVM (gateway) | 5007 | — | JDWP, solo Docker dev |
| debug JVM (order) | 5006 | — | JDWP, solo Docker dev |
| debug JVM (payment) | 5009 | — | JDWP, solo Docker dev |

## Kafka — gotchas críticos

- `KAFKA_AUTO_CREATE_TOPICS_ENABLE=false` — los topics deben existir antes de arrancar los servicios.
- En Docker local/dev el contenedor `kafka-init` crea los topics automáticamente al primer `up`.
- Si se recrea el contenedor de Kafka, re-ejecutar manualmente:
  ```bash
  docker exec vento-app-local-kafka-init-1 sh /init-kafka.sh
  ```
- Microservicios corriendo con Gradle (fuera de Docker) deben conectar a `localhost:9093`, no `9092`.
- Paquetes de confianza para deserialización JSON: `com.vento.common.dto.kafka` — ya configurado en `application.yml` de cada servicio.

### Topics (3 particiones c/u salvo DLQ con 1)
`payment.processed`, `payment.failed`, `order.confirmed`, `order.cancelled`,
`event.created`, `event.updated`, `event.deleted`,
`payment.processed.DLQ`, `payment.failed.DLQ`

## Elasticsearch — setup manual requerido

El script `scripts/init-elasticsearch.sh` **no se ejecuta automáticamente** (a diferencia de kafka-init). Crear el índice `events` manualmente después de que Elasticsearch esté healthy:

```bash
bash scripts/init-elasticsearch.sh
```

Crea analyzer `autocomplete` (edge_ngram min=2, max=20), campo `location` como `geo_point`. Sin esto las búsquedas de eventos fallan.

## Módulo `common/`

- Plugin `java-library` (no `java`) — los consumidores acceden via `implementation project(':common')`.
- Contiene: DTOs compartidos, Enums (`OrderStatus`, `PaymentStatus`, `TicketStatus`), todas las excepciones de dominio, `GlobalExceptionHandler` (RFC 9457 Problem Details), `KafkaTopics` (fuente única de nombres de topics), `UserContext`, `AuditableEntity`.
- Spring starters declarados `compileOnly` — no se propagan a los runtimes de los servicios.
- `ExceptionHandlerAutoConfiguration` registra `GlobalExceptionHandler` automáticamente en cada servicio via Spring auto-configuration.

## Perfiles de Spring Boot

- Default en todos los servicios: `local` (`${SPRING_PROFILES_ACTIVE:local}`).
- `application-local.yml` usa credenciales hardcodeadas para localhost.
- `application-dev.yml` usa variables de entorno (necesario para Docker dev).
- Correr `bootRun` sin definir `SPRING_PROFILES_ACTIVE` usa `local`.

## Arquitectura de seguridad

- **api-gateway** valida JWT (OAuth2 resource server vs Keycloak). Extrae `sub` → `X-User-Id` y `realm_access.roles` → `X-User-Roles` y los propaga como headers.
- **Microservicios** confían en esos headers directamente — **no validan JWT**. Una llamada directa que bypasee el gateway es efectivamente no autenticada.
- **Frontend** usa Keycloak **Direct Access Grant** (Resource Owner Password Credentials), no Authorization Code Flow. El cliente `vento-frontend` en Keycloak debe tener "Direct Access Grants Enabled". Tokens en `localStorage`.
- Token se considera expirado 1 minuto antes del `exp` real (buffer de 60s).

## Frontend — quirks importantes

- **`pnpm build` compila en producción** (`defaultConfiguration: "production"` en `angular.json`). Para dev: añadir `-- --configuration development`.
- **`ng generate` nunca crea `.spec.ts`** — `skipTests: true` en todos los schematics de `angular.json`. Los specs deben crearse manualmente.
- **Config de entorno runtime**: se inyecta via `window.__env` en `index.html`, no via `environments/*.ts`. Los helpers están en `src/environments/env.config.ts`. Ejecutar `pnpm run setup:env` para crear `.env` desde `.env.example`.
- **Tailwind v4**: configuración CSS-first, entry point `src/tailwind.css`. No existe `tailwind.config.js`.
- **Rutas NO son lazy-loaded** a pesar de lo que sugiere la estructura — todos los componentes están importados estáticamente en `app.routes.ts`.
- **`auth.service.ts` usa `BehaviorSubject`** para `authChanged$` — excepción a la regla de Signals (código legacy, no cambiar a signals sin refactor completo).
- **ESLint prohíbe `any`** (`no-explicit-any: error`) — no usar `any` en TypeScript.
- **Librerías UI de terceros**: `@bluehalo/ngx-leaflet` + `leaflet` + `leaflet-control-geocoder` (mapas), `qrcode` (tickets).
- Estilos en `angular.json` en orden: `src/tailwind.css` → `src/styles.scss` → `leaflet.css`. El orden importa.

## Redis

- Keys: `vento:event:{id}:available_tickets` (tickets disponibles), `vento:reservation:{orderId}` (TTL 5min)
- Order states: `PENDING` → `CONFIRMED` | `CANCELLED` | `EXPIRED`

## Jobs en background

- `ElasticsearchSyncJob` (event-service): sincronización completa PostgreSQL→ES cada 5min (delay inicial 1min). Configurable via `vento.elasticsearch.sync.sync-interval-ms`.
- `OrderExpirationJob` (order-service): expira órdenes PENDING cada 60s (delay inicial 30s).

## Tests — quirks

- Unit tests usan solo `@ExtendWith(MockitoExtension.class)`, sin Spring context.
- `EventServiceTest` debe llamar `eventService.init()` manualmente (el `@PostConstruct` no se ejecuta sin contexto).
- Tests de integración Kafka usan `EmbeddedKafka` de `spring-kafka-test` (no Testcontainers).
- api-gateway **no tiene directorio de tests**.
- Reports HTML: `microservices/*/build/reports/tests/test/index.html`

## Agregar microservicio

1. Crear `microservices/<nombre>/` con estructura de paquetes estándar.
2. Copiar `build.gradle` de event-service, ajustar dependencias.
3. Agregar en `settings.gradle`: `include 'microservices:<nombre>'`
4. Configurar ruta en `api-gateway/src/main/resources/application.yml`.
5. Crear `application.yml` con perfiles `local`/`dev`/`prod`.
6. Agregar en `docker-compose.local.yml` si necesita infraestructura.
7. Dockerfiles usan `context: .` (repo raíz) — el build copia todo el monorepo.

## Code Style

### Backend (Java/Spring Boot)

- Paquetes: `com.vento.<modulo>/` con `controller/` (o `api/controller/`), `service/`, `repository/`, `model/`, `dto/`, `config/`, `exception/`
- Inyección por constructor (no `@Autowired` en campos), o `@RequiredArgsConstructor` de Lombok
- `@Transactional` en métodos que modifican datos
- DTOs: records o `@Value` (Lombok) inmutables, `@Builder` para objetos complejos
- Entidades JPA: `@Data`, `@Entity`, `@Table`, extender `AuditableEntity` del módulo `common`
- Excepciones: extender las del módulo `common`; usar `GlobalExceptionHandler` (ya registrado automáticamente)
- Logging: `@Slf4j`, nunca loggear datos sensibles

### Frontend (Angular 21)

- Componentes standalone (`imports: []`, sin NgModules)
- `inject()` function (no constructor injection)
- Signals para estado reactivo: `signal()`, `computed()`, `effect()` — no `BehaviorSubject` (excepto auth legacy)
- `@if/@for/@switch` nativo, nunca `*ngIf/*ngFor`
- Nomenclatura: `*.page.ts` páginas, `*.component.ts` hijos, `*.service.ts` servicios
- Selector components: `app-` prefix, kebab-case. Directives: `app` prefix, camelCase (ESLint lo enforcea)
- Prettier: printWidth 100, single quotes, parser angular para HTML
- TypeScript strict mode + `strictTemplates`
