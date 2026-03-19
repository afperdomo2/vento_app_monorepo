# Sprint 2: El Corazón de la Concurrencia (Semanas 3-4)

## Resumen
Resolver el problema de la sobreventa implementando inventario en Redis con operaciones atómicas, reservas temporales con TTL, y optimistic locking en la base de datos.

---

## Semana 3: Inventario en Redis

### 3.1 - Sincronización Evento → Redis
- [ ] **Redis Key Design**:
  - Patrón: `event:{eventId}:available_tickets`
  - Valor: número entero de tickets disponibles
  - Tipo de dato: String (para usar INCR/DECR atómicos)
- [ ] **Service de Sincronización**:
  - Cuando se crea un evento → inicializar clave en Redis
  - Cuando se actualiza capacidad → actualizar clave en Redis
  - Cuando se elimina evento → eliminar clave en Redis
- [ ] **Fallback a DB**:
  - Si Redis no tiene la clave, leer de PostgreSQL e inicializar
  - Crear componente `InventoryService` que gestione esta lógica

### 3.2 - Operaciones Atómicas para Reservas
- [ ] **Reservar Tickets (DECR atómico)**:
  - Usar `DECRBY` atómico en Redis antes de ir a la DB
  - Si resultado < 0, hacer `INCRBY` para revertir y rechazar
  - Pseudocódigo:
    ```
    tickets = DECRBY event:{id}:available_tickets {quantity}
    if tickets < 0:
        INCRBY event:{id}:available_tickets {quantity}
        throw InsufficientTicketsException
    ```
- [ ] **Liberar Tickets (INCR al cancelar)**:
  - Cuando se cancela orden → `INCRBY` en Redis
  - Integrar con lógica existente de cancelOrder()
- [ ] **Confirmar Reserva**:
  - Solo persiste en PostgreSQL si Redis permitió la reserva
  - Transaccionalidad: Redis OK → persistir en DB

### 3.3 - Redis Connection Configuration
- [ ] Agregar dependencias Redis en event-service y order-service
- [ ] Configurar RedisTemplate con Serializers apropiados
- [ ] Configurar connection pooling (Lettuce)
- [ ] Agregar propiedades de conexión en application.yml

---

## Semana 4: Reservas Temporales y Estados

### 4.1 - Estados de Orden Ampliados
- [ ] **Enum OrderStatus**:
  - `PENDING` - Reserva temporal, esperando pago
  - `CONFIRMED` - Pago aprobado, ticket entregado
  - `CANCELLED` - Cancelada por usuario o timeout
  - `EXPIRED` - Timeout de pago alcanzado
- [ ] **Transiciones de Estado**:
  - PENDING → CONFIRMED (pago exitoso)
  - PENDING → CANCELLED (usuario cancela)
  - PENDING → EXPIRED (timeout automático)
  - CONFIRMED → CANCELLED (reembolso, si aplica)
- [ ] **Validaciones**:
  - Solo PENDING puede ir a CONFIRMED
  - Solo PENDING puede cancelarse

### 4.2 - TTL en Redis para Reservas Temporales
- [ ] **Redis Key para Reserva Temporal**:
  - Patrón: `reservation:{orderId}`
  - Valor: JSON con { eventId, userId, quantity, timestamp }
  - TTL: 5 minutos (configurable)
- [ ] **Crear Reserva Temporal**:
  - Crear orden con estado PENDING
  - Crear clave en Redis con TTL
  - Devolver orderId al cliente
- [ ] **Expiración de Reserva**:
  - Redis expira la clave automáticamente
  - Configurar Redis Keyspace Notifications para detectar expiración
  - O usar scheduled task que revise reservas pendientes vencidas
- [ ] **Liberación de Stock al Expirar**:
  - Cuando expire → buscar orden PENDING → cambiar a EXPIRED
  - Hacer INCR en available_tickets de Redis

### 4.3 - Optimistic Locking en PostgreSQL
- [ ] **@Version en Entidades**:
  - Ya configurado en Event y Order (Sprint 1)
  - Verificar que @Version está en todas las entidades actualizables
- [ ] **Manejo de OptimisticLockException**:
  - Crear servicio `ConflictResolutionService`
  - Retry logic con exponential backoff (máximo 3 intentos)
  - Si persiste el conflicto → rollback y retornar 409 Conflict
- [ ] **Verificación de Disponibilidad Pre-Persist**:
  - Antes de guardar, verificar que hay tickets suficientes
  - Usar `@Lock(PESSIMISTIC_WRITE)` en consulta inicial
  - Combinar con versión para máxima consistencia

### 4.4 - Flujo Completo de Reserva
- [ ] **Happy Path**:
  1. Cliente: POST /api/orders { eventId, quantity }
  2. Order-service: DECRBY en Redis
  3. Si OK: Crear Order(PENDING) en DB
  4. Crear clave `reservation:{orderId}` con TTL 5min
  5. Retornar orderId al cliente
  6. Cliente: POST /api/payments (externo o simulado)
  7. Payment: Confirma → Order(CONFIRMED), eliminar clave Redis
- [ ] **Timeout Path**:
  1. TTL expira en Redis
  2. Scheduled job detecta órdenes PENDING vencidas
  3. INCRBY en Redis para liberar tickets
  4. Actualizar Order → EXPIRED
- [ ] **Cancel Path**:
  1. Cliente: PUT /api/orders/{id}/cancel
  2. Order-service: Cambiar estado → CANCELLED
  3. INCRBY en Redis para liberar tickets
  4. Eliminar clave reservation si existe

### 4.5 - Tests de Concurrencia
- [ ] **Tests de Race Condition**:
  - Simular 100 requests concurrentes para último ticket
  - Verificar que solo 1 succeeds
- [ ] **Tests de Timeout**:
  - Crear reserva, esperar expiración
  - Verificar tickets liberados
- [ ] **Tests de Optimistic Locking**:
  - Actualizar misma orden desde 2 threads
  - Verificar que 1 falla con 409

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

- [ ] 100 requests concurrentes para 50 tickets → exactamente 50 succeed, 50 fail
- [ ] Reserva expira después de 5 minutos → tickets se liberan
- [ ] Cancelar reserva → tickets se liberan inmediatamente
- [ ] Conflicto de versión JPA retorna 409 Conflict
- [ ] Flujo completo (crear → reservar → timeout) funciona end-to-end
- [ ] Tests de concurrencia pasan
- [ ] Build completo pasa con `./gradlew build`

---

## Servicios Involucrados

| Servicio | Cambios |
|----------|---------|
| event-service | InventoryService, sincronización Redis |
| order-service | Estados ampliados, TTL, reserva temporal |
| redis | Keys: `event:{id}:available_tickets`, `reservation:{orderId}` |

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
