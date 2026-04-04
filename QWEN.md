# Vento App Monorepo - Contexto del Proyecto

## Resumen del Proyecto

**Vento App** es una plataforma de gestión de eventos basada en microservicios, construida con Spring Boot 3.5.0 y Angular 21. La aplicación permite crear eventos, gestionar inventario de tickets y procesar reservas con un sistema de reservas temporales.

### Arquitectura

```
vento_app_monorepo/
├── common/                      # Módulo compartido (DTOs, excepciones, utilerías)
├── microservices/
│   ├── api-gateway/             # Spring Cloud Gateway (puerto 8080)
│   ├── event-service/           # Gestión de eventos (puerto 8082)
│   ├── order-service/           # Gestión de pedidos/reservas (puerto 8083)
│   └── payment-service/         # Procesamiento de pagos (puerto 8084)
├── frontend/                    # Aplicación Angular 21 (puerto 4200)
└── database/                    # Scripts y migraciones de base de datos
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
| | pnpm | 10.x |
| **Infraestructura** | Docker Compose | Multi-entorno |
| | Node.js | 22+ |

### Características Principales

- **Gestión de Eventos**: Operaciones CRUD con inventario de tickets
- **Sistema de Pedidos**: Reservas temporales con TTL de 5 minutos en Redis
- **Procesamiento de Pagos**: Simulación de gateway de pago con 80% éxito, 20% fallo
- **Seguridad OAuth2**: Integración con Keycloak y validación JWT en API Gateway
- **Patrón Microservicios**: Enrutamiento por Gateway, aislamiento de servicios
- **Caché Redis**: Seguimiento de disponibilidad de tickets y reservas temporales
- **Multi-entorno**: Local (hot reload), Dev (Docker), Prod (Docker optimizado)

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

### Inicio Rápido - Stack Completo (Desarrollo)

```bash
# Terminal 1: Infraestructura (PostgreSQL, Redis, Keycloak)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminal 2: Event Service
./gradlew :microservices:event-service:bootRun

# Terminal 3: Order Service
./gradlew :microservices:order-service:bootRun

# Terminal 4: Payment Service
./gradlew :microservices:payment-service:bootRun

# Terminal 5: API Gateway
./gradlew :microservices:api-gateway:bootRun

# Terminal 6: Frontend
cd frontend && pnpm start
```

**Puntos de Acceso:**
- 🌐 Frontend: http://localhost:4200
- 🔌 API Gateway: http://localhost:8080
- 📖 Swagger Event Service: http://localhost:8082/swagger-ui.html
- 📖 Swagger Order Service: http://localhost:8083/swagger-ui.html
- 📖 Swagger Payment Service: http://localhost:8084/swagger-ui.html
- 🔐 Keycloak Dashboard: http://localhost:8180

### Comandos del Backend

```bash
# Construir todo
./gradlew build

# Construir sin tests
./gradlew build -x test

# Construir módulo específico
./gradlew :microservices:event-service:build

# Ejecutar tests
./gradlew test

# Ejecutar test específico
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"

# Ejecutar servicio
./gradlew :microservices:event-service:bootRun

# Limpiar build
./gradlew clean
```

### Comandos del Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm start

# Build producción
pnpm build

# Ejecutar tests
pnpm test

# Generar componente
pnpm ng generate component features/<feature>/components/<name>
```

### Comandos Docker

```bash
# Entorno local (solo infraestructura)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Entorno dev (todos los servicios en Docker)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Entorno producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Ver logs
docker compose logs -f <nombre-servicio>

# Detener y eliminar volúmenes
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

---

## Convenciones de Desarrollo

### Backend (Java/Spring)

#### Estructura de Paquetes

```
microservices/<servicio>/src/main/java/com/vento/<modulo>/
├── controller/      # Endpoints REST (@RestController)
├── service/         # Lógica de negocio (@Service)
├── repository/      # Acceso a datos (@Repository)
├── model/           # Entidades JPA
├── dto/             # Objetos de Transferencia de Datos
├── config/          # Clases de configuración
└── exception/       # Excepciones y handlers personalizados
```

#### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clases | PascalCase | `EventController`, `OrderService` |
| Métodos | camelCase | `createEvent()`, `findById()` |
| Constantes | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `REDIS_TTL` |
| Paquetes | minúsculas singular | `com.vento.event.controller` |

#### Estilo de Código

- **Imports**: Explícitos (nunca `.*`), orden: static > java > javax > org.springframework > otros > terceros
- **Anotaciones**: `@Autowired` en constructores, `@Transactional` en métodos que modifican datos
- **DTOs**: Inmutables con `@Value` o records, usar `@Builder` para objetos complejos
- **Excepciones**: Extienden `RuntimeException`, usar `@ControllerAdvice` para manejo global
- **Logging**: `@Slf4j` (Lombok), niveles: ERROR (excepciones), WARN (warnings), INFO (operacional)
- **Config**: `application.yml` con perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`)

#### Ejemplo de Patrón Service

```java
@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final TicketInventoryService ticketInventoryService;

    @Transactional
    public EventDTO createEvent(CreateEventRequest request) {
        // Lógica de negocio
    }
}
```

#### Prácticas de Testing

- **Framework**: JUnit 5, Mockito
- **Patrón**: AAA (Arrange, Act, Assert)
- **Nombres**: `*Test.java` para clases de test
- **Tests Integración**: `@SpringBootTest`
- **Tests Unitarios**: Mockear dependencias con Mockito

### Frontend (Angular)

#### Arquitectura: Feature-First

```
src/app/
├── core/                     # Servicios globales singleton
│   ├── auth/                 # Autenticación, manejo JWT
│   ├── guards/               # Guards de rutas (canActivate)
│   ├── interceptors/         # Interceptores HTTP
│   └── services/             # Servicios globales
├── shared/                   # Componentes reutilizables
│   ├── components/           # Componentes UI (event-card, etc.)
│   ├── directives/           # Directivas personalizadas
│   ├── pipes/                # Transformadores de datos
│   └── ui/                   # Componentes de layout
└── features/                 # Módulos de negocio (lazy-loaded)
    └── <feature>/
        ├── components/       # Componentes específicos del feature
        ├── services/         # Servicios del feature
        └── <feature>.page.ts # Componente página principal
```

#### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Páginas | `*.page.ts` | `home.page.ts`, `login.page.ts` |
| Componentes | `*.component.ts` | `event-card.component.ts` |
| Servicios | `*.service.ts` | `auth.service.ts` |
| Guards | `*.guard.ts` | `auth.guard.ts` |
| Interceptors | `*.interceptor.ts` | `jwt.interceptor.ts` |

#### Estilo de Código

- **Componentes**: Standalone (sin NgModules), usar `imports: []` en decorator
- **Gestión de Estado**: Signals (`signal()`, `computed()`, `effect()`)
- **Inyección de Dependencias**: Función `inject()` (no constructor injection)
- **Estilos**: SCSS con Tailwind CSS v4
- **Formato**: Prettier (printWidth: 100, comillas simples, 2 espacios)
- **TypeScript**: strict mode, noImplicitOverride, strictTemplates

#### Ejemplo de Patrón Componente

```typescript
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, EventCardComponent],
  templateUrl: './event-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventListComponent {
  private eventService = inject(EventService);
  
  events = this.eventService.events;
  isLoading = signal(false);

  loadEvents() {
    this.isLoading.set(true);
    this.eventService.loadEvents();
  }
}
```

---

## Referencia de la API

### Rutas del API Gateway (Puerto 8080)

| Endpoint | Método | Servicio | Descripción |
|----------|--------|----------|-------------|
| `/api/events/**` | Todos | event-service:8082 | Gestión de eventos |
| `/api/orders/**` | Todos | order-service:8083 | Gestión de pedidos |
| `/api/payments/**` | Todos | payment-service:8084 | Procesamiento de pagos |
| `/ui/*` | GET | frontend:4200 | Aplicación frontend |

### Endpoints del Event Service

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/events` | Crear evento |
| GET | `/api/events/{id}` | Obtener evento por UUID |
| GET | `/api/events` | Listar eventos (paginado) |
| GET | `/api/events/featured` | Eventos destacados |
| PUT | `/api/events/{id}` | Actualizar evento |
| DELETE | `/api/events/{id}` | Eliminar evento |
| PUT | `/api/events/{id}/tickets/release` | Liberar tickets en Redis |

### Endpoints del Order Service

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/orders` | Crear reserva (TTL 5 min) |
| GET | `/api/orders/{id}` | Obtener pedido por ID |
| GET | `/api/orders/my-orders` | Pedidos del usuario autenticado |
| PUT | `/api/orders/{id}/cancel` | Cancelar pedido |
| PUT | `/api/orders/{id}/confirm` | Confirmar pedido |

### Endpoints del Payment Service

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/process` | Procesar pago simulado (80% éxito, 20% fallo, ~2s delay) |

**Respuestas:**
- **200 OK** — Pago exitoso: `{ "success": true, "data": { "orderId", "transactionId", "amount" } }`
- **402 Payment Required** — Pago fallido (RFC 9457): `{ "type": "https://vento.app/errors/payment-failed", "title", "status", "detail", "orderId" }`

### Seguridad (Keycloak)

| Escenario | Respuesta |
|-----------|-----------|
| Request sin token | `401 Unauthorized` |
| Token inválido/expirado | `401 Unauthorized` |
| Token válido sin rol | `403 Forbidden` |
| Token válido con rol | `200 OK` |

**Headers propagados a microservicios:**
- `X-User-Id`: ID del usuario desde claim `sub` del JWT
- `X-User-Roles`: Roles separados por coma desde `realm_access.roles`

---

## Datos y Estado

### Claves de Redis

| Patrón | Propósito | TTL |
|--------|-----------|-----|
| `vento:event:{id}:available_tickets` | Inventario de tickets | Persistente |
| `vento:reservation:{orderId}` | Reserva de pedido | 5 minutos |

### Estados de Pedido

```
PENDING → CONFIRMED (pago exitoso)
        → CANCELLED (usuario canceló)
        → EXPIRED (timeout 5 min)
```

### Puertos de Base de Datos

| Base de Datos | Puerto | Servicio |
|---------------|--------|----------|
| PostgreSQL Events | 5432 | event-service |
| PostgreSQL Orders | 5433 | order-service |

---

## Variables de Entorno

### Archivos de Configuración

| Archivo | Propósito | Versionado |
|---------|-----------|------------|
| `.env.example` | Plantilla | ✅ Sí |
| `.env` | Desarrollo local | ❌ No |
| `.env.prod` | Producción | ❌ No |

### Variables Principales

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

## Agregar un Nuevo Microservicio

1. Crear carpeta en `microservices/<nombre>/`
2. Copiar `build.gradle` de un servicio existente, ajustar dependencias
3. Crear estructura de paquetes siguiendo convenciones
4. Agregar en `settings.gradle`:
   ```groovy
   include 'microservices:<nombre>'
   ```
5. Configurar ruta en `api-gateway/application.yml`
6. Crear `application.yml` con configs específicas por perfil

---

## Troubleshooting

### Problemas de Conexión a BD (Local)

```bash
# Verificar infraestructura corriendo
docker compose -f docker-compose.yml -f docker-compose.local.yml ps

# Ver logs de la BD
docker compose logs postgres-events
```

### API Gateway "Connection Refused"

El Gateway en modo local apunta a `localhost:8082` y `localhost:8083`. Asegúrate que los servicios estén corriendo:

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

## Referencia de Estructura del Proyecto

### Archivos Raíz

| Archivo | Propósito |
|---------|-----------|
| `build.gradle` | Configuración Gradle raíz |
| `settings.gradle` | Definición de módulos del proyecto |
| `gradle.properties` | Configuración y versiones de Gradle |
| `docker-compose*.yml` | Configuraciones de entorno Docker |
| `.env.example` | Plantilla de variables de entorno |

### Directorios Principales

| Directorio | Contenido |
|------------|-----------|
| `common/` | DTOs compartidos, excepciones, utilerías |
| `microservices/` | Todos los servicios backend (api-gateway, event-service, order-service, payment-service) |
| `frontend/` | Aplicación Angular |
| `database/` | Scripts SQL, migraciones |
| `requerimientos/` | Documentación de requisitos |

---

## Testing

### Tests del Backend

```bash
# Todos los tests
./gradlew test

# Tests de un módulo
./gradlew :microservices:event-service:test

# Output detallado
./gradlew test --info
```

**Cobertura de Tests:**
- EventService: 6 tests ✅
- OrderService: 9 tests ✅
- TicketInventoryService: 3 tests ✅
- ConflictResolutionService: 3 tests ✅
- PaymentFailedException: tests pendientes

### Tests del Frontend

```bash
cd frontend
pnpm test
```

---

## Documentación Relacionada

- **[README.md](./README.md)**: Guía completa de usuario
- **[AGENTS.md](./AGENTS.md)**: Referencia rápida para agentes AI
- **[KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)**: Guía de configuración de Keycloak
- **[POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json)**: Colección para testing de API
- **[frontend/README.md](./frontend/README.md)**: Documentación específica del frontend
