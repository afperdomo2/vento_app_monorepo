# AGENTS.md - Vento App Monorepo

## Proyecto

Monorepo Spring Boot + Gradle con microservicios: `common/`, `api-gateway/` (8080), `event-service/` (8082),
`order-service/` (8083), **frontend/** (Angular 21, 4200).
Stack: Java 25, Gradle 9.4, Spring Boot 3.5.0, Spring Cloud 2025.0.0, Angular 21.2, pnpm 10.

## Comandos

### Build

```bash
./gradlew build                  # Compilar todo con tests
./gradlew build -x test          # Compilar sin tests
./gradlew :microservices:event-service:build   # Compilar modulo especifico
./gradlew clean                  # Limpiar artefactos
./gradlew dependencies           # Ver dependencias
./gradlew dependencies --configuration runtimeClasspath  # Ver tree de dependencias
```

### Tests

```bash
./gradlew test                           # Ejecutar todos los tests
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest.testMethod"
./gradlew :microservices:event-service:test --tests "*EventServiceTest*"
./gradlew :microservices:order-service:test --tests "*OrderServiceTest*"
./gradlew test --info                    # Tests con output detallado
./gradlew test --continue                # No parar en primer fallo
```

### Ejecutar Servicios (Local)

```bash
# Infra: docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

### Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose logs -f <servicio>
docker compose exec <servicio> sh
```

### Frontend (Angular 21)

```bash
cd frontend
pnpm install           # Instalar dependencias
pnpm start             # Servidor desarrollo (localhost:4200)
pnpm build             # Build producción
pnpm watch             # Build en modo watch
pnpm test              # Ejecutar tests
pnpm ng <comando>      # Angular CLI commands
```

**Generar componentes/servicios (Feature-First Architecture):**

```bash
# Componente en un feature específico
pnpm ng generate component features/home/components/my-component

# Servicio en core (global) o en un feature
pnpm ng generate service core/services/my-service
pnpm ng generate service features/home/services/my-service

# Guard, interceptor, pipe, directiva
pnpm ng generate guard core/guards/my-guard
pnpm ng generate interceptor core/interceptors/my-interceptor
pnpm ng generate pipe shared/pipes/my-pipe
pnpm ng generate directive shared/directives/my-directive
```

### Frontend (Angular) - Feature-First Architecture

#### Estructura de Carpetas

```
src/app/
├── core/                     # Lógica global (singleton services)
│   ├── auth/                 # Autenticación, JWT
│   ├── guards/               # Route guards (canActivate)
│   ├── interceptors/         # HTTP interceptors
│   ├── providers/            # Signal/State providers globales
│   └── services/             # Servicios globales
│
├── shared/                   # Reutilizable en toda la app
│   ├── components/           # UI components puros (event-card, speaker-card)
│   ├── directives/           # Directivas personalizadas
│   ├── pipes/                # Transformadores de datos
│   └── ui/                   # Layout components (navbars, footer)
│
└── features/                 # Módulos de negocio (lazy-loaded)
    ├── home/                 # Feature: Home page
    │   ├── components/       # Componentes específicos
    │   ├── services/         # Servicios del feature
    │   └── home.page.ts      # Página principal
    ├── event-detail/         # Feature: Event detail
    ├── checkout/             # Feature: Checkout
    ├── login/                # Feature: Login
    └── organizer/            # Feature: Organizer dashboard
```

#### Convenciones

- Usar **Signals** para estado reactivo (`signal()`, `computed()`, `effect()`)
- Componentes **standalone** (sin NgModules, usar `imports: []` en el decorator)
- **SCSS** para estilos
- Inmutabilidad preferida (usar `readonly` en señales cuando sea posible)
- Inyección de dependencias con `inject()` (no constructor injection)
- **Nomenclatura**: `*.page.ts` para páginas, `*.component.ts` para componentes

#### Ejemplo Componente con Signals

```typescript
import { Component, signal, inject } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `<p>{{ count() }}</p>`
})
export class ExampleComponent {
  private service = inject(MyService);
  count = signal(0);
}
```

#### Crear Nuevo Feature

1. Crear carpeta: `features/<nombre-feature>/`
2. Generar página: `pnpm ng generate component features/<nombre>/<nombre>.page --standalone`
3. Renombrar a `.page.ts`
4. Agregar ruta en `app.routes.ts`

## Convenciones de Codigo

### Backend (Java/Spring)

#### Estructura de Paquetes

```
com.vento.<modulo>/
├── controller/   # REST endpoints (usar @RestController)
├── service/      # Logica de negocio (interfaz + impl)
├── repository/   # Acceso a datos (usar @Repository)
├── model/        # Entidades JPA
├── dto/          # Data Transfer Objects
├── config/       # Configuracion (@Configuration, @ConfigurationProperties)
├── exception/    # Excepciones personalizadas
├── util/         # Utilidades
└── mapper/       # Mappers (MapStruct o manually)
```

#### Nombres

- Clases: PascalCase (`UserService`, `EventController`)
- Interfaces: Prefijo con I o sufijo `Service`, `Repository` (`IUserService`, `UserRepository`)
- Metodos: camelCase (`getUserById`, `saveEvent`)
- Constantes: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Paquetes: minusculas, singular (`com.vento.event`)
- Variables: camelCase (`userList`, `maxItems`)
- Archivos de test: `*Test.java`, `*IntegrationTest.java`

#### Imports

- Imports explicitos (nunca `.*`)
- Orden: static > java > javax > org.springframework > otros org > com > terceros
- Agrupar con lineas en blanco entre grupos
- No usar wildcard imports

#### Tipos y Anotaciones

- Usar interfaces para servicios siempre que sea posible
- Preferir inmutables (`@Value`, records de Java 17+) para DTOs
- Usar `Optional` para valores que pueden ser nulos
- `@Autowired` en constructores (nunca en campos)
- Usar `@Valid` en DTOs de entrada en controladores
- Usar `@Builder` (Lombok) para objetos complejos
- Usar `@Service`, `@Repository`, `@Controller`, `@RestController` apropiadamente
- Usar `@Transactional` en metodos de servicio que modifican datos

#### Manejo de Errores

- Excepciones personalizadas extienden `RuntimeException`
- Usar `BusinessException` o similar para errores de dominio
- Usar `GlobalExceptionHandler` con `@ControllerAdvice` para manejo global
- Codigos HTTP apropiados (4xx para errores de cliente, 5xx para servidor)
- Usar `@Slf4j` (Lombok) para logging
- Registrar en niveles apropiados: ERROR (excepciones), WARN (warnings), INFO (informacion)
- No loggear datos sensibles (contraseñas, tokens, PII)

#### Configuracion

- `application.yml` base + perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`)
- Usar `@ConfigurationProperties` para configuration tipada
- No hardcodear secrets (usar variables de entorno)
- Perfiles: local (dev rapido), dev (docker), prod (produccion)
- Properties: usar kebab-case (`my-property` no `myProperty`)

#### Pruebas

- Ubicacion: `src/test/java` reflejando estructura de `src/main`
- JUnit 5 (`org.junit.jupiter.api`)
- Mockito para unit tests
- `@SpringBootTest` para tests de integracion
- `@MockBean` para dependencias externas
- `@DataJpaTest` para repositorios
- Seguir patron AAA (Arrange, Act, Assert)
- Nombre: `*Test.java` para unit, `*IntegrationTest.java` para integracion

#### Documentacion

- Javadoc para APIs publicas y clases importantes
- Codigo autodocumentado con nombres significativos
- No documentar lo obvio

## Agregar Nuevo Microservicio

1. Crear `microservices/<nombre>/` con estructura de paquetes
2. Crear `build.gradle` basado en servicios existentes (copiar de event-service)
3. Agregar en `settings.gradle`: `include 'microservices:<nombre>'`
4. Agregar dependencia en `api-gateway/build.gradle`
5. Agregar ruta en `api-gateway/src/main/resources/application.yml`
6. Crear `application.yml` con perfiles local/dev/prod en resources

## Rutas Clave

- Raiz: `/home/felipe/www/vento_app_monorepo`
- Common: `common/`
- Event service: `microservices/event-service/`
- Order service: `microservices/order-service/`
- API Gateway: `microservices/api-gateway/`
- Frontend: `frontend/`
- Docker compose: `docker-compose.yml`, `docker-compose.local.yml`

## Puertos

- api-gateway: 8080
- event-service: 8082
- order-service: 8083
- frontend: 4200
- postgres-events: 5432
- postgres-orders: 5433
- redis: 6379
- keycloak: 8180

## Redis — Esquema de Claves

| Clave                                       | Tipo   | TTL       | Descripción                          |
|---------------------------------------------|--------|-----------|--------------------------------------|
| `vento:event:{eventId}:available_tickets`   | String | Sin TTL   | Tickets disponibles (INCR/DECR)      |
| `vento:reservation:{orderId}`               | String | 5 minutos | Reserva temporal asociada a la orden |

- El prefijo `vento:` se configura con `vento.redis.key-prefix`
- El TTL de reservas se configura con `vento.reservation.ttl-minutes` (default: 5)
- Si Redis no tiene la clave de inventario, `InventoryService` hace fallback a PostgreSQL

## Endpoints por Servicio

### Event Service (8082)

| Método | Endpoint                          | Descripción                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/api/events`                     | Crear evento (init Redis key)      |
| GET    | `/api/events`                     | Listar eventos (paginado)          |
| GET    | `/api/events/featured`            | Eventos destacados                 |
| GET    | `/api/events/{id}`                | Obtener evento por ID              |
| PUT    | `/api/events/{id}`                | Actualizar evento (adjust Redis)   |
| DELETE | `/api/events/{id}`                | Eliminar evento (remove Redis key) |
| PUT    | `/api/events/{id}/tickets/release`| Liberar tickets en Redis           |

### Order Service (8083)

| Método | Endpoint                   | Descripción                                      |
|--------|----------------------------|--------------------------------------------------|
| POST   | `/api/orders`              | Crear reserva (DECRBY Redis + TTL 5 min)         |
| GET    | `/api/orders/{id}`         | Obtener pedido por ID                            |
| GET    | `/api/orders/my-orders`    | Pedidos del usuario autenticado                  |
| PUT    | `/api/orders/{id}/cancel`  | Cancelar (INCRBY Redis + eliminar reserva)       |
| PUT    | `/api/orders/{id}/confirm` | Confirmar → CONFIRMED (eliminar reserva Redis)   |

### Estados de Orden (OrderStatus)

`PENDING` → `CONFIRMED` (confirm) | `CANCELLED` (cancel) | `EXPIRED` (TTL job)