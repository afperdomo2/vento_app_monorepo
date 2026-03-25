# Sprint 1: Cimientos y Core de Dominio (Semanas 1-2)

## Resumen

Implementar la base del sistema: contratos API, infraestructura Docker, seguridad centralizada en API Gateway con
Keycloak, y el flujo básico crear evento -> reservar entrada de forma síncrona. La administración de usuarios se realiza
directamente en el dashboard de Keycloak.

---

## Semana 1: Cimientos

### 1.1 - Contratos API (SpringDoc en código)

- [x] **Event-service**: Endpoints para CRUD de eventos
    - `POST /api/events` - Crear evento
    - `GET /api/events/{id}` - Obtener evento
    - `GET /api/events` - Listar eventos (con filtros)
    - `PUT /api/events/{id}` - Actualizar evento
    - Anotaciones SpringDoc en todos los endpoints

- [x] **Order-service**: Endpoints para gestión de pedidos
    - `POST /api/orders` - Crear reserva
    - `GET /api/orders/{id}` - Obtener pedido
    - `GET /api/orders/user/{userId}` - Pedidos por usuario
    - `PUT /api/orders/{id}/cancel` - Cancelar pedido
    - Anotaciones SpringDoc en todos los endpoints

### 1.2 - Docker Compose (Infraestructura)

- [x] Agregar **PostgreSQL** para event-service (`events_db`, puerto 5432)
- [x] Agregar **PostgreSQL** para order-service (`orders_db`, puerto 5433)
- [x] Agregar **Redis** (puerto 6379)
- [x] Agregar **Keycloak** (puerto 8180) - Realm: vento-realm
- [x] Actualizar red y dependencias existentes

### 1.3 - Event-service: Estructura Base

- [x] Crear `microservices/event-service/`
- [x] Crear `build.gradle` con dependencias:
    - Spring Web, Spring Data JPA, PostgreSQL
    - SpringDoc OpenAPI
    - Lombok, validation
    - Dependencia a `:common`
- [x] Crear `application.yml`:
    - Puerto 8082
    - Conexión a `events_db`
    - Configuración SpringDoc
- [x] Crear clase principal `EventServiceApplication.java`
- [x] Crear Dockerfile

### 1.4 - Order-service: Estructura Base

- [x] Crear `microservices/order-service/`
- [x] Crear `build.gradle` con dependencias:
    - Spring Web, Spring Data JPA, PostgreSQL
    - SpringDoc OpenAPI
    - OpenFeign client
    - Lombok, validation
    - Dependencia a `:common`
- [x] Crear `application.yml`:
    - Puerto 8083
    - Conexión a `orders_db`
    - Configuración SpringDoc
- [x] Crear clase principal `OrderServiceApplication.java`
- [x] Crear Dockerfile

### 1.5 - Common Module: DTOs Compartidos

- [x] `EventDto` - DTO de evento
- [x] `CreateEventRequest` - Request para crear evento
- [x] `UpdateEventRequest` - Request para actualizar evento
- [x] `OrderDto` - DTO de pedido
- [x] `CreateOrderRequest` - Request para crear pedido
- [ ] `OrderItemDto` - Item dentro de un pedido
- [x] `ApiResponse<T>` - Wrapper de respuesta estándar

### 1.6 - 🔐 Seguridad (API Gateway + Keycloak)

- [x] **Keycloak Configuration**:
    - Configurar realm `vento-realm` en Keycloak
    - Crear cliente `vento-api` (confidential/public)
    - Definir roles: `ADMIN`, `USER`

- [x] **API Gateway - Routing Configuration**:
    - Configurar ruta `/api/events/**` → `http://event-service:8082` (StripPrefix=1)
    - Configurar ruta `/api/orders/**` → `http://order-service:8083` (StripPrefix=1)
    - El Gateway recibe requests externas y las reenvía a los microservicios internos

- [x] **API Gateway - JWT Validation**:
    - Agregar dependencia Spring Security OAuth2 Resource Server
    - Configurar JwtDecoder con Keycloak issuer URI
    - Validar tokens JWT en todas las rutas protegidas
    - Si token es inválido → retorna 401 Unauthorized

- [x] **API Gateway - Header Propagation**:
    - Extraer `sub` (userId) del JWT
    - Insertar header `X-User-Id` en requests hacia microservicios
    - Insertar header `X-User-Roles` con roles del usuario
    - Implementado: `JwtHeaderFilter.java` en API Gateway

- [ ] **Rutas Protegidas vs Públicas**:
    - `/api/events/**` - Requiere rol `USER`
    - `/api/orders/**` - Requiere rol `USER`
    - `/actuator/**` - Público (para health checks)
    - `/swagger-ui/**`, `/v3/api-docs/**` - Público (desarrollo)
    - `/auth/**` - Público (para login, registro vía Keycloak)

- [x] **Microservicios - Confianza en Headers**:
    - NO validar tokens en microservicios individuales
    - Confiar en `X-User-Id` y `X-User-Roles` del Gateway
    - Agregar filtro para extraer headers de contexto
    - Implementado: `UserContextFilter.java` + `UserContext.java` en common module

---

## Semana 2: Core de Dominio

### 2.1 - Modelos y Repositorios (Event-service)

- [x] Entidad `Event`:
    - id (UUID), name, description, eventDate, venue, totalCapacity, availableTickets, price, createdAt, updatedAt
    - Anotaciones JPA (@Entity, @Table)
    - @Version para optimistic locking
- [x] Repositorio `EventRepository` (JpaRepository)
- [x] Servicio `EventService`:
    - createEvent()
    - getEventById()
    - listEvents() con paginación
    - updateEvent()
    - getAvailableTickets(eventId)
- [x] Controlador `EventController` con @Operation/@ApiResponse

### 2.2 - Modelos y Repositorios (Order-service)

- [x] Entidad `Order`:
    - id, userId, eventId, quantity, totalAmount, status (PENDING, CONFIRMED, CANCELLED), createdAt, updatedAt
    - @Version para optimistic locking
- [x] Entidad `OrderItem`:
    - id, orderId, ticketType, price
- [x] Repositorio `OrderRepository`
- [x] Servicio `OrderService`:
    - createOrder() - valida disponibilidad y crea reserva
    - getOrderById()
    - getOrdersByUserId()
    - cancelOrder()
- [x] Controlador `OrderController`

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
  1.1 Contratos API    ✅ Completado (Event-service + Order-service)
  1.2 Docker Compose   ✅ Completado
  1.3 Event-service    ✅ Completado
  1.4 Order-service    ✅ Completado
  1.5 Common DTOs      ✅ (Eventos + Órdenes: OrderDto, CreateOrderRequest, OrderStatus)
  1.6 Seguridad        ✅ JWT Validation + Header Propagation completados

Semana 2 ──────────────────────────────────────
  2.1 Event models     ✅ Completado
  2.2 Order models     ✅ Completado (Order, OrderItem, OrderRepository, OrderService, OrderController)
  2.3 OpenFeign        ──> Pendiente
  2.4 Flujo E2E        ──> Pendiente
  2.5 Tests            ──> Pendiente
```

---

## Criterios de Aceptación

- [x] `docker compose up` levanta: api-gateway, event-service, order-service, postgres-events,
  postgres-orders, redis, keycloak
- [ ] Keycloak accesible en http://localhost:8180 con realm `vento-realm`
- [ ] Dashboard de Keycloak permite crear/editar/eliminar usuarios
- [ ] Solicitudes sin token JWT retornan 401 Unauthorized
- [x] Solicitudes con token válido pasan a través del Gateway con header `X-User-Id`
- [ ] POST /api/events crea un evento y guarda en PostgreSQL
- [ ] POST /api/orders crea una reserva verificando disponibilidad en event-service
- [ ] GET /api/events retorna lista paginada con documentación Swagger
- [ ] Tests unitarios pasan con `./gradlew test`
- [x] Build completo pasa con `./gradlew build`

---

## Servicios a Crear (Ports)

| Servicio         | Puerto | DB              | Descripción                        |
|------------------|--------|-----------------|------------------------------------|
| api-gateway      | 8080   | -               | Routing, JWT validation, X-User-Id |
| event-service    | 8082   | events_db:5432  | Gestión de eventos                 |
| order-service    | 8083   | orders_db:5433  | Gestión de pedidos                 |
| postgres-events  | 5432   | -               | DB eventos                         |
| postgres-orders  | 5433   | -               | DB pedidos                         |
| redis            | 6379   | -               | Caché y gestión de stock           |
| keycloak         | 8180   | -               | Auth/SSO, Gestión de usuarios      |

**Nota:** La gestión de usuarios (crear, editar, eliminar) se realiza directamente en el dashboard de Keycloak.

---

## Siguiente Sprint (Semana 3-4)

- Estrategia de inventario en Redis (operaciones atómicas DECR)
- Lógica de reservas temporales con TTL en Redis
- Estados PENDING → CONFIRMED/CANCELLED
- Optimistic Locking completo
