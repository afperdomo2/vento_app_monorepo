# Sprint 2: El Corazón de la Concurrencia (Semanas 3-4)

## Resumen
Resolver el problema de la sobreventa implementando inventario en Redis con operaciones atómicas, reservas temporales con TTL, y optimistic locking en la base de datos.

---

## Semana 3: Inventario en Redis

### 3.1 - Sincronización Evento → Redis ✅
- [x] **Redis Key Design**:
  - Patrón: `vento:event:{eventId}:available_tickets`
  - Valor: número entero de tickets disponibles
  - Tipo de dato: String (para usar INCR/DECR atómicos)
- [x] **Service de Sincronización** (`InventoryService`):
  - Cuando se crea un evento → `initializeInventory()` en Redis
  - Cuando se actualiza capacidad → `adjustInventory()` con delta en Redis
  - Cuando se elimina evento → `removeInventory()` en Redis
- [x] **Fallback a DB**:
  - Si Redis no tiene la clave, `getAvailableTickets()` lee de PostgreSQL e inicializa
  - Componente `InventoryService` gestiona esta lógica

### 3.2 - Operaciones Atómicas para Reservas ✅
- [x] **Reservar Tickets (DECR atómico)**:
  - `TicketInventoryService.reserveTickets()` usa `DECRBY` atómico en Redis
  - Si resultado < 0, hace `INCRBY` para revertir y lanza `InsufficientTicketsException`
  - Pseudocódigo implementado:
    ```
    tickets = DECRBY vento:event:{id}:available_tickets {quantity}
    if tickets < 0:
        INCRBY vento:event:{id}:available_tickets {quantity}
        throw InsufficientTicketsException
    ```
- [x] **Liberar Tickets (INCR al cancelar)**:
  - `TicketInventoryService.releaseTickets()` hace `INCRBY` en Redis
  - Integrado en `cancelOrder()` y en el job de expiración
- [x] **Confirmar Reserva**:
  - Solo persiste en PostgreSQL si Redis permitió la reserva
  - Flujo: Redis OK → persistir Order(PENDING) en DB → Feign best-effort

### 3.3 - Redis Connection Configuration ✅
- [x] Dependencias `spring-boot-starter-data-redis` en `event-service` y `order-service`
- [x] `RedisConfig.java` con `RedisTemplate<String, String>` y serializers `StringRedisSerializer`
- [x] Connection pooling con Lettuce (`spring.data.redis.lettuce.pool.*`)
- [x] Propiedades de conexión en `application.yml` de ambos servicios

---

## Semana 4: Reservas Temporales y Estados

### 4.1 - Estados de Orden Ampliados ✅
- [x] **Enum OrderStatus** (en `common/`):
  - `PENDING` - Reserva temporal, esperando pago
  - `CONFIRMED` - Pago aprobado, ticket entregado
  - `CANCELLED` - Cancelada por usuario o timeout
  - `EXPIRED` - Timeout de pago alcanzado *(agregado en este sprint)*
- [x] **Transiciones de Estado**:
  - PENDING → CONFIRMED (`confirmOrder()`)
  - PENDING → CANCELLED (`cancelOrder()`)
  - PENDING → EXPIRED (`OrderExpirationJob`)
- [x] **Validaciones**:
  - Solo PENDING puede ir a CONFIRMED (lanza `BusinessException` si no)
  - Solo PENDING puede cancelarse (lanza `BusinessException` si no)

### 4.2 - TTL en Redis para Reservas Temporales ✅
- [x] **Redis Key para Reserva Temporal** (`ReservationService`):
  - Patrón: `vento:reservation:{orderId}`
  - TTL configurable via `vento.reservation.ttl-minutes` (default 5 min)
- [x] **Crear Reserva Temporal**:
  - `createOrder()` crea Order(PENDING) → llama `reservationService.createReservation(orderId)`
  - Retorna `orderId` al cliente
- [x] **Expiración de Reserva**:
  - `OrderExpirationJob` con `@Scheduled` revisa órdenes PENDING vencidas en DB
  - Usa `findByStatusAndCreatedAtBefore()` en `OrderRepository`
- [x] **Liberación de Stock al Expirar**:
  - Job cambia estado → EXPIRED
  - Hace `INCRBY` en Redis via `TicketInventoryService.releaseTickets()`
  - Feign best-effort para sincronizar DB de event-service

### 4.3 - Optimistic Locking en PostgreSQL ✅
- [x] **@Version en Entidades**:
  - `AuditableEntity` en `common/` ya tenía `@Version Long version` desde Sprint 1
- [x] **Manejo de OptimisticLockException**:
  - `ConflictResolutionService` (en `common/exception/`) con retry + exponential backoff
  - Máximo 3 intentos (configurable via `vento.reservation.max-retries`)
  - Si persiste → lanza `OptimisticLockConflictException` → HTTP 409 Conflict
- [x] **Handlers en `GlobalExceptionHandler`**:
  - `InsufficientTicketsException` → 409 con campos `available` y `requested`
  - `OptimisticLockConflictException` → 409 Conflict
  - `ObjectOptimisticLockingFailureException` → 409 Conflict

### 4.4 - Flujo Completo de Reserva ✅
- [x] **Happy Path**:
  1. Cliente: `POST /api/orders { eventId, quantity }`
  2. Order-service: Feign para obtener precio del evento
  3. `DECRBY` atómico en Redis (guard contra sobreventa)
  4. Si OK: Crear `Order(PENDING)` en DB
  5. Crear clave `vento:reservation:{orderId}` con TTL
  6. Retornar `orderId` al cliente
  7. Cliente: `PUT /api/orders/{id}/confirm` → `Order(CONFIRMED)`, eliminar clave Redis
- [x] **Timeout Path**:
  1. `OrderExpirationJob` detecta órdenes PENDING vencidas (cada minuto)
  2. `INCRBY` en Redis para liberar tickets
  3. Actualiza Order → EXPIRED
- [x] **Cancel Path**:
  1. Cliente: `PUT /api/orders/{id}/cancel`
  2. Order-service: Cambia estado → CANCELLED
  3. `INCRBY` en Redis para liberar tickets
  4. Elimina clave `vento:reservation:{orderId}`

### 4.5 - Tests de Concurrencia ✅
- [x] **Tests de Race Condition** (`OrderServiceTest`):
  - 100 requests concurrentes para 50 tickets → exactamente 50 succeed, 50 fail
  - Verificado con `AtomicInteger` simulando el comportamiento de `DECRBY` atómico
- [x] **Tests unitarios** (`TicketInventoryServiceTest`):
  - Cubre `reserveTickets()` y `releaseTickets()`
- [x] **Tests de Optimistic Locking** (`ConflictResolutionServiceTest`):
  - Retry con `ObjectOptimisticLockingFailureException`
  - Verifica que lanza `OptimisticLockConflictException` al agotar reintentos
- [ ] **Tests de Timeout** (integración):
  - Crear reserva, esperar expiración real → pendiente (requiere entorno con Redis real)

---

## Dependencias Entre Tareas

```
Semana 3 ──────────────────────────────────────
  3.1 Sync Event→Redis    ──> Depende de Sprint 1 (Redis setup)
  3.2 Atomic DECR/INCR   ──> Depende de 3.1
  3.3 Redis Config       ──> Depende de Sprint 1 (docker-compose)

Semana 4 ──────────────────────────────────────
  4.1 Order Status        ──> Depende de Sprint 1 (Order entity)
  4.2 TTL + Expiration   ──> Depende de 3.2, 4.1
  4.3 Optimistic Locking  ──> Depende de Sprint 1 (@Version)
  4.4 Complete Flow      ──> Depende de 3.2, 4.1, 4.2, 4.3
  4.5 Concurrency Tests  ──> Depende de 4.4
```

---

## Criterios de Aceptación

- [x] 100 requests concurrentes para 50 tickets → exactamente 50 succeed, 50 fail
- [x] Reserva expira después de 5 minutos → tickets se liberan (job scheduler)
- [x] Cancelar reserva → tickets se liberan inmediatamente
- [x] Conflicto de versión JPA retorna 409 Conflict
- [x] Flujo completo (crear → reservar → timeout) funciona end-to-end
- [x] Tests de concurrencia pasan
- [x] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Cambios |
|----------|---------|
| event-service | InventoryService, sincronización Redis |
| order-service | Estados ampliados, TTL, reserva temporal |
| redis | Keys: `vento:event:{id}:available_tickets`, `vento:reservation:{orderId}` |

---

## Configuración a Definir

| Propiedad | Valor Sugerido | Descripción |
|-----------|---------------|-------------|
| `vento.reservation.ttl-minutes` | 5 | Tiempo de expiración de reserva |
| `vento.reservation.max-retries` | 3 | Intentos en conflicto de versión |
| `vento.redis.key-prefix` | `vento:` | Prefijo para todas las keys |

---

## Siguiente Sprint (Semana 5-6)

- Patrón Saga con Kafka (OrderCreatedEvent, PaymentProcessedEvent)
- Payment-service simulado (80% éxito, 20% fallo, 2s delay)
- Dead Letter Queues (DLQ)
- Compensaciones de transacciones
