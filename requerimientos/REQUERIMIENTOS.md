# Requerimientos para el Proyecto de Venta de Entradas

## Fase 1: Cimientos y Core de Dominio (Semanas 1-2)

El objetivo es tener la lógica básica funcionando antes de introducir la complejidad de Kafka o Kubernetes.

- **Definición de Contratos (API First):** Antes de programar, define los contratos de las APIs (puedes usar
  Swagger/OpenAPI).
  Esto te permitirá saber exactamente qué datos necesita el Servicio de Pedidos del Servicio de Eventos.

- **Bases de Datos Independientes:** No compartas base de datos. Usa PostgreSQL para Eventos y Pedidos por su soporte de
  transacciones ACID y @Version (Optimistic Locking).

- **Contenedores Base:** Configura un archivo docker-compose.yml inicial con lo esencial: PostgreSQL, Redis y Keycloak.

- 🔐 **Seguridad:** Centraliza todo en el Spring Cloud Gateway. No dejes que los microservicios individuales validen el
  usuario contra la base de datos; deja que el Gateway valide el JWT y pase la información del usuario en las cabeceras
  (X-User-Id). La administración de usuarios se realiza directamente en el dashboard de Keycloak.

- **MVP Síncrono:** Empieza comunicando los servicios mediante OpenFeign. Es más fácil de depurar al principio. Una vez
  que
  el
  flujo "crear evento -> reservar entrada" funcione de forma síncrona, estarás listo para desacoplar.

## Fase 2: El Corazón de la Concurrencia (Semanas 3-4)

Aquí es donde el proyecto se vuelve "interesante" y resuelves el problema de la sobreventa.

- **Estrategia de Inventario en Redis:** Implementa un sistema donde, antes de ir a la DB, el Servicio de Pedidos
  descuente
  el
  cupo en Redis usando operaciones atómicas (como DECR). Si el contador llega a cero, rechazas la petición de inmediato
  sin tocar la base de datos.

- **Lógica de Reservas Temporales:** Implementa un estado de "Pendiente" en la entrada. Si el pago no se confirma en X
  minutos, Redis expira la clave y un proceso devuelve el stock al pool.

- **Optimistic Locking:** Configura @Version en JPA para que, si dos transacciones intentan confirmar la última entrada
  al
  mismo tiempo en la DB, una falle elegantemente.

## Fase 3: Desacoplamiento y Event-Driven (Semanas 5-6)

Introducimos Kafka para manejar la consistencia eventual.

- **Implementación del Patrón Saga (Coreografía):**

    - **Servicio Pedidos:** Crea reserva (estado: PENDIENTE) -> Publica OrderCreatedEvent.

    - **Servicio Pagos:** Escucha evento -> Procesa pago -> Publica PaymentProcessedEvent (o Failed).

    - **Servicio Pedidos:** Escucha resultado -> Cambia estado a CONFIRMADO o libera stock.

- **Dead Letter Queues (DLQ):** Configura Kafka para manejar mensajes fallidos. ¿Qué pasa si el servicio de
  notificaciones
  está caído? El evento debe reintentarse.

- 💳 **Simulación de Pagos:** No te compliques con APIs reales todavía. Crea un servicio de pagos que, de forma
  aleatoria (80% éxito, 20% fallo), responda tras un delay de 2 segundos. Esto te servirá para probar el patrón Saga
  y las compensaciones de transacciones.

## Fase 4: Búsqueda Avanzada y Observabilidad (Semanas 7-8)

El sistema ya funciona; ahora hay que hacerlo profesional y monitoreable.

- **Sincronización con Elasticsearch:** No busques eventos con LIKE %query% en SQL. Usa el patrón Logstash o un "River"
  para
  replicar los datos de tu tabla de Eventos a un índice de Elasticsearch. Esto permitirá filtros por ubicación
  geográfica y texto predictivo.

- **Tracing Distribuido (OpenTelemetry):** Es vital para entender por qué una compra falló. Con un traceId podrás ver el
  salto desde el Gateway hasta el microservicio de Pagos y el evento en Kafka.

- **Prometheus & Grafana:** Crea un dashboard para ver cuántas entradas se venden por segundo y el tiempo de respuesta
  del
  servicio de reserva.
