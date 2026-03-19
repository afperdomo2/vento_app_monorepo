# Sprint 1: Cimientos y Core de Dominio (Semanas 1-2)

## Resumen

Implementar la base del sistema: contratos API, infraestructura Docker, seguridad centralizada en API Gateway con
Keycloak, y el flujo básico crear evento -> reservar entrada de forma síncrona. La administración de usuarios se realiza
directamente en el dashboard de Keycloak.

---

## Semana 1: Cimientos

### 1.1 - Contratos API (SpringDoc en código)

- [ ] **Event-service**: Endpoints para CRUD de eventos
    - `POST /api/events` - Crear evento
    - `GET /api/events/{id}` - Obtener evento
    - `GET /api/events` - Listar eventos (con filtros)
    - `PUT /api/events/{id}` - Actualizar evento
    - Anotaciones SpringDoc en todos los endpoints

- [ ] **Order-service**: Endpoints para gestión de pedidos
    - `POST /api/orders` - Crear reserva
    - `GET /api/orders/{id}` - Obtener pedido
    - `GET /api/orders/user/{userId}` - Pedidos por usuario
    - `PUT /api/orders/{id}/cancel` - Cancelar pedido
    - Anotaciones SpringDoc en todos los endpoints

### 1.2 - Docker Compose (Infraestructura)

- [ ] Agregar **PostgreSQL** para event-service (`eventos_db`, puerto 5432)
- [ ] Agregar **PostgreSQL** para order-service (`pedidos_db`, puerto 5433)
- [ ] Agregar **Redis** (puerto 6379)
- [ ] Agregar **Keycloak** (puerto 8180) - Realm: vento-realm
- [ ] Actualizar red y dependencias existentes

### 1.3 - Event-service: Estructura Base

- [ ] Crear `microservices/event-service/`
- [ ] Crear `build.gradle` con dependencias:
    - Spring Web, Spring Data JPA, PostgreSQL
    - SpringDoc OpenAPI
    - Lombok, validation
    - Dependencia a `:common`
- [ ] Crear `application.yml`:
    - Puerto 8082
    - Conexión a `eventos_db`
    - Configuración SpringDoc
- [ ] Crear clase principal `EventServiceApplication.java`
- [ ] Crear Dockerfile

### 1.4 - Order-service: Estructura Base

- [ ] Crear `microservices/order-service/`
- [ ] Crear `build.gradle` con dependencias:
    - Spring Web, Spring Data JPA, PostgreSQL
    - SpringDoc OpenAPI
    - OpenFeign client
    - Lombok, validation
    - Dependencia a `:common`
- [ ] Crear `application.yml`:
    - Puerto 8083
    - Conexión a `pedidos_db`
    - Configuración SpringDoc
- [ ] Crear clase principal `OrderServiceApplication.java`
- [ ] Crear Dockerfile

### 1.5 - Common Module: DTOs Compartidos

- [ ] `EventDto` - DTO de evento
- [ ] `CreateEventRequest` - Request para crear evento
- [ ] `OrderDto` - DTO de pedido
- [ ] `CreateOrderRequest` - Request para crear pedido
- [ ] `OrderItemDto` - Item dentro de un pedido
- [ ] `ApiResponse<T>` - Wrapper de respuesta estándar

### 1.6 - 🔐 Seguridad (API Gateway + Keycloak)

- [ ] **Keycloak Configuration**:
    - Configurar realm `vento-realm` en Keycloak
    - Crear cliente `vento-api` (confidential/public)
    - Definir roles: `ADMIN`, `USER`

- [ ] **API Gateway - Routing Configuration**:
    - Configurar ruta `/api/events/**` → `http://event-service:8082` (StripPrefix=1)
    - Configurar ruta `/api/orders/**` → `http://order-service:8083` (StripPrefix=1)
    - El Gateway recibe requests externas y las reenvía a los microservicios internos

- [ ] **API Gateway - JWT Validation**:
    - Agregar dependencia Spring Security OAuth2 Resource Server
    - Configurar JwtDecoder con Keycloak issuer URI
    - Validar tokens JWT en todas las rutas protegidas
    - Si token es inválido → retorna 401 Unauthorized

- [ ] **API Gateway - Header Propagation**:
    - Extraer `sub` (userId) del JWT
    - Insertar header `X-User-Id` en requests hacia microservicios
    - Insertar header `X-User-Roles` con roles del usuario

- [ ] **Rutas Protegidas vs Públicas**:
    - `/api/events/**` - Requiere rol `USER`
    - `/api/orders/**` - Requiere rol `USER`
    - `/actuator/**` - Público (para health checks)
    - `/swagger-ui/**`, `/v3/api-docs/**` - Público (desarrollo)
    - `/auth/**` - Público (para login, registro vía Keycloak)

- [ ] **Microservicios - Confianza en Headers**:
    - NO validar tokens en microservicios individuales
    - Confiar en `X-User-Id` y `X-User-Roles` del Gateway
    - Agregar filtro para extraer headers de contexto

---

## Semana 2: Core de Dominio

### 2.1 - Modelos y Repositorios (Event-service)

- [ ] Entidad `Event`:
    - id, name, description, eventDate, venue, totalCapacity, availableTickets, price, createdAt, updatedAt
    - Anotaciones JPA (@Entity, @Table)
    - @Version para optimistic locking
- [ ] Repositorio `EventRepository` (JpaRepository)
- [ ] Servicio `EventService`:
    - createEvent()
    - getEventById()
    - listEvents() con paginación
    - updateEvent()
    - getAvailableTickets(eventId)
- [ ] Controlador `EventController` con @Operation/@ApiResponse

### 2.2 - Modelos y Repositorios (Order-service)

- [ ] Entidad `Order`:
    - id, userId, eventId, quantity, totalAmount, status (PENDING, CONFIRMED, CANCELLED), createdAt, updatedAt
    - @Version para optimistic locking
- [ ] Entidad `OrderItem`:
    - id, orderId, ticketType, price
- [ ] Repositorio `OrderRepository`
- [ ] Servicio `OrderService`:
    - createOrder() - valida disponibilidad y crea reserva
    - getOrderById()
    - getOrdersByUserId()
    - cancelOrder()
- [ ] Controlador `OrderController`

### 2.3 - OpenFeign: Comunicación Síncrona

- [ ] **Order-service → Event-service**:
    - Crear `EventClient` interface con @FeignClient
    - Método para verificar disponibilidad de tickets
    - Método para descontar tickets al confirmar
- [ ] Configurar Eureka o DNS-based discovery (opcional por ahora)
- [ ] Manejo de errores con @ErrorDecoder

### 2.4 - Flujo Básico: Crear Evento -> Reservar Entrada

- [ ] Integrar flujo end-to-end:
    1. Crear evento (POST /api/events) → retorna eventId
    2. Reservar entrada (POST /api/orders) → usa EventClient para validar disponibilidad
    3. Descontar tickets en Event-service
- [ ] Validaciones:
    - Verificar que hay tickets disponibles antes de reservar
    - Retornar error 409 Conflict si no hay disponibilidad
- [ ] Endpoint en API Gateway para routing a ambos servicios

### 2.5 - Tests Unitarios

- [ ] Tests para `EventService`:
    - Crear evento
    - Verificar decremento de availableTickets
    - Manejo de capacidad agotada
- [ ] Tests para `OrderService`:
    - Crear orden exitosa
    - Rechazar cuando no hay tickets
    - Cancelar orden
- [ ] Tests para `EventClient` (mock)

---

## Dependencias Entre Tareas

```
Semana 1 ──────────────────────────────────────
  1.1 Contratos API
  1.2 Docker Compose  ──> Necesario para tests locales
  1.3 Event-service    ──> Depende de 1.5 (common)
  1.4 Order-service    ──> Depende de 1.3 (OpenFeign client)
  1.5 Common DTOs      ─> Dependencias base
  1.6 Seguridad        ──> Depende de 1.2 (Keycloak), 1.3, 1.4 (routing)

Semana 2 ──────────────────────────────────────
  2.1 Event models     ──> Depende de 1.3
  2.2 Order models     ──> Depende de 1.4
  2.3 OpenFeign        ──> Depende de 2.1
  2.4 Flujo E2E        ──> Depende de 2.1, 2.2, 2.3
  2.5 Tests            ──> Depende de 2.4
```

---

## Criterios de Aceptación

- [ ] `docker-compose up` levanta: api-gateway, event-service, order-service, postgres-eventos,
  postgres-pedidos, redis, keycloak
- [ ] Keycloak accesible en http://localhost:8180 con realm `vento-realm`
- [ ] Dashboard de Keycloak permite crear/editar/eliminar usuarios
- [ ] Solicitudes sin token JWT retornan 401 Unauthorized
- [ ] Solicitudes con token válido pasan a través del Gateway con header `X-User-Id`
- [ ] POST /api/events crea un evento y guarda en PostgreSQL
- [ ] POST /api/orders crea una reserva verificando disponibilidad en event-service
- [ ] GET /api/events retorna lista paginada con documentación Swagger
- [ ] Tests unitarios pasan con `./gradlew test`
- [ ] Build completo pasa con `./gradlew build`

---

## Servicios a Crear (Ports)

| Servicio         | Puerto | DB              | Descripción                        |
|------------------|--------|-----------------|------------------------------------|
| api-gateway      | 8080   | -               | Routing, JWT validation, X-User-Id |
| event-service    | 8082   | eventos_db:5432 | Gestión de eventos                 |
| order-service    | 8083   | pedidos_db:5433 | Gestión de pedidos                 |
| postgres-eventos | 5432   | -               | DB eventos                         |
| postgres-pedidos | 5433   | -               | DB pedidos                         |
| redis            | 6379   | -               | Cache y gestión de stock           |
| keycloak         | 8180   | -               | Auth/SSO, Gestión de usuarios      |

**Nota:** La gestión de usuarios (crear, editar, eliminar) se realiza directamente en el dashboard de Keycloak.

---

## Siguiente Sprint (Semana 3-4)

- Estrategia de inventario en Redis (operaciones atómicas DECR)
- Lógica de reservas temporales con TTL en Redis
- Estados PENDING → CONFIRMED/CANCELLED
- Optimistic Locking completo
