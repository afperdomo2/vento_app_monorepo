# 📮 Vento App API - Documentación de Endpoints para Postman

Guía de referencia rápida para configurar y usar la colección de Postman.

---

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración de Variables](#configuración-de-variables)
- [Flujo de Uso](#flujo-de-uso)
- [Endpoints](#endpoints)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Troubleshooting](#troubleshooting)

---

## 📐 Estándar de Errores (RFC 9457)

> **Nota:** Esta API utiliza el estándar **[RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457)** (Problem Details
> for HTTP APIs) para todas las respuestas de error.

**Formato de respuesta de error:**

```json
{
  "type": "https://vento.app/errors/validation-error",
  "title": "Errores de validación",
  "status": 400,
  "detail": "Se encontraron 2 errores de validación en la solicitud",
  "instance": "/api/orders",
  "service": "order-service",
  "timestamp": "2026-03-28T12:00:00.000"
}
```

**Campos:**

| Campo       | Descripción                          |
|-------------|--------------------------------------|
| `type`      | URI identificadora del tipo de error |
| `title`     | Título corto y legible               |
| `status`    | Código HTTP (400, 401, 403, etc.)    |
| `detail`    | Descripción detallada del error      |
| `instance`  | Path del endpoint                    |
| `service`   | Microservicio que respondió          |
| `timestamp` | Timestamp ISO 8601 (milisegundos)    |

Este formato es **consistente en todos los microservicios** (API Gateway, Event Service, Order Service).

---

## 🚀 Instalación

### Opción 1: Importar Colección JSON (Recomendado)

1. Abre Postman
2. Haz clic en **"Import"** (esquina superior izquierda)
3. Selecciona el archivo `POSTMAN_COLLECTION.json`
4. La colección **"Vento App API"** aparecerá en tu sidebar

### Opción 2: Configurar Manualmente

Si prefieres crear los requests manualmente, usa esta guía como referencia.

---

## ⚙️ Configuración de Variables

Antes de usar la colección, **debes configurar las siguientes variables**:

### Variables Requeridas

| Variable        | Valor por Defecto       | Descripción            | ¿Modificar?              |
|-----------------|-------------------------|------------------------|--------------------------|
| `base_url`      | `http://localhost:8080` | URL del API Gateway    | Solo si cambia el puerto |
| `keycloak_url`  | `http://localhost:8180` | URL de Keycloak        | Solo si cambia el puerto |
| `realm`         | `vento-realm`           | Nombre del realm       | No                       |
| `client_id`     | `vento-api`             | Cliente OAuth2         | No                       |
| `client_secret` | `<TU_CLIENT_SECRET>`    | **⚠️ DEBES CAMBIARLO** | **SÍ - Obligatorio**     |
| `username`      | `testuser`              | Usuario de prueba      | Opcional                 |
| `password`      | `password123`           | Contraseña del usuario | Opcional                 |

### Cómo Configurar el Client Secret

1. Abre el Dashboard de Keycloak: http://localhost:8180
2. Navega a **Clients** → `vento-api` → **Credentials**
3. Copia el valor de **Client secret**
4. En Postman, ve a la colección **"Vento App API"** → pestaña **"Variables"**
5. Reemplaza `<TU_CLIENT_SECRET>` con el valor copiado
6. Guarda los cambios

---

## 🔄 Flujo de Uso

### Paso 1: Obtener Token de Acceso

1. Expande la carpeta **"🔐 Authentication"**
2. Ejecuta el request **"Get Access Token (User)"**
3. Verifica en la consola que el token se guardó:
   ```
   ✅ Token guardado: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

El token se guarda automáticamente en la variable `access_token`.

### Paso 2: Crear un Evento (Opcional)

Si no hay eventos en la base de datos:

1. Expande la carpeta **"📅 Events"**
2. Ejecuta **"Create Event"** (requiere rol ADMIN)
3. El `event_id` se guarda automáticamente

### Paso 3: Listar Eventos

1. Ejecuta **"List Events (Paginated)"**
2. Verifica la respuesta JSON con la lista de eventos

### Paso 4: Crear una Reserva

1. Expande la carpeta **"🎫 Orders"**
2. Ejecuta **"Create Order (Reserve Tickets)"**
3. El `order_id` se guarda automáticamente

### Paso 5: Consultar Órdenes

1. Ejecuta **"Get Order by ID"** para ver la reserva creada
2. O ejecuta **"Get My Orders"** para ver todas tus órdenes

### Paso 6: Confirmar la Reserva (Opcional)

1. Ejecuta **"Confirm Order"** dentro de los **5 minutos** de creada la reserva
2. El estado cambiará de `PENDING` a `CONFIRMED`
3. Si no confirmas dentro del plazo, el job de expiración cambia el estado a `EXPIRED` y libera los tickets automáticamente

---

## 📡 Endpoints

### 🔐 Authentication

#### Get Access Token (User)

Obtiene un token JWT para un usuario estándar.

- **Método:** `POST`
- **URL:** `{{keycloak_url}}/realms/{{realm}}/protocol/openid-connect/token`
- **Body (x-www-form-urlencoded):**
  ```
  grant_type: password
  client_id: {{client_id}}
  client_secret: {{client_secret}}
  username: {{username}}
  password: {{password}}
  ```
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 300,
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
  ```

> ⚠️ **IMPORTANTE: Error "Account is not fully set up"**
>
> Si recibes el error `400 Bad Request` con la respuesta:
> ```json
> {
>   "error": "invalid_grant",
>   "error_description": "Account is not fully set up"
> }
> ```
>
> **Causa:** El usuario no tiene completados todos los campos obligatorios definidos en el Realm.
>
> **Solución:**
> 1. En Keycloak, ve a **Realm settings** → **User profile** → **Required fields**
> 2. Revisa qué campos están marcados como obligatorios (ej: `firstName`, `lastName`, `email`)
> 3. Al crear el usuario, completa **TODOS** los campos requeridos:
     >

- Username: `testuser`

> - Email: `testuser@vento.app`
    >

- **First name:** `Test` ← Obligatorio

> - **Last name:** `User` ← Obligatorio
>    - Email verified: `ON`
>    - Enabled: `ON`
> 4. En **Credentials**, establece:
     >

- Password: `password123`

> - **Temporary:** `OFF` (desactivado)
> 5. Guarda el usuario y vuelve a intentar el login
>
> **Nota para producción:** Revisa y configura los campos obligatorios en **Realm settings** → **User profile** antes de
> desplegar. Los campos comunes como `firstName` y `lastName` pueden ser requeridos según las políticas de tu
> organización.

---

### 📅 Events

#### List Events (Paginated)

Lista todos los eventos con paginación.

- **Método:** `GET`
- **URL:** `{{base_url}}/api/events?page=0&size=10`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Query Params:**
  | Parámetro | Tipo | Default | Descripción |
  |-----------|------|---------|-------------|
  | `page` | integer | 0 | Número de página (0-indexed) |
  | `size` | integer | 10 | Elementos por página |
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "content": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Concierto de Rock 2026",
        "description": "Gran concierto de rock...",
        "eventDate": "2026-08-15T20:00:00",
        "venue": "Estadio Nacional",
        "totalCapacity": 5000,
        "availableTickets": 4998,
        "price": 75.50
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalElements": 1,
    "totalPages": 1
  }
  ```

---

#### Get Featured Events

Obtiene eventos destacados: eventos futuros con tickets disponibles, ordenados por fecha.

- **Método:** `GET`
- **URL:** `{{base_url}}/api/events/featured`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Query Params:**
  | Parámetro | Tipo | Default | Descripción |
  |-----------|------|---------|-------------|
  | `limit` | integer | 6 | Cantidad de eventos (mín 6, máx 20) |
- **Ejemplos:**
  ```
  {{base_url}}/api/events/featured           ← 6 eventos (default)
  {{base_url}}/api/events/featured?limit=10  ← 10 eventos
  {{base_url}}/api/events/featured?limit=20  ← 20 eventos (máximo)
  ```
- **Criterios de selección:**
    - Eventos futuros (`eventDate > NOW`)
    - Con tickets disponibles (`availableTickets > 0`)
    - Ordenados por fecha ascendente (más próximos primero)
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Concierto de Rock 2026",
        "description": "Gran concierto de rock...",
        "eventDate": "2026-08-15T20:00:00",
        "venue": "Estadio Nacional",
        "totalCapacity": 5000,
        "availableTickets": 3500,
        "price": 75.50
      }
      // ... hasta 6 eventos (o el límite especificado)
    ]
  }
  ```
- **Respuesta vacía:** `200 OK` (cuando no hay eventos futuros con disponibilidad)
  ```json
  {
    "status": "success",
    "data": []
  }
  ```

---

#### Create Event

Crea un nuevo evento.

- **Método:** `POST`
- **URL:** `{{base_url}}/api/events`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Content-Type: application/json
  Accept: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "name": "Concierto de Rock 2026",
    "description": "Gran concierto de rock al aire libre",
    "eventDate": "2026-08-15T20:00:00",
    "venue": "Estadio Nacional",
    "totalCapacity": 5000,
    "price": 75.50
  }
  ```
- **Campos requeridos:**
  | Campo | Tipo | Descripción |
  |-------|------|-------------|
  | `name` | string | Nombre del evento |
  | `description` | string | Descripción detallada |
  | `eventDate` | string | Fecha y hora (ISO 8601) |
  | `venue` | string | Lugar del evento |
  | `totalCapacity` | integer | Capacidad total |
  | `price` | number | Precio por entrada |
- **Respuesta exitosa:** `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Concierto de Rock 2026",
      ...
    }
  }
  ```

---

#### Get Event by ID

Obtiene los detalles de un evento.

- **Método:** `GET`
- **URL:** `{{base_url}}/api/events/{{event_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Concierto de Rock 2026",
      "description": "Gran concierto de rock...",
      "eventDate": "2026-08-15T20:00:00",
      "venue": "Estadio Nacional",
      "totalCapacity": 5000,
      "availableTickets": 4998,
      "price": 75.50
    }
  }
  ```

---

#### Update Event

Actualiza un evento existente.

- **Método:** `PUT`
- **URL:** `{{base_url}}/api/events/{{event_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Content-Type: application/json
  Accept: application/json
  ```
- **Body (JSON):** (todos los campos son requeridos)
  ```json
  {
    "name": "Concierto de Rock 2026 - Actualizado",
    "description": "Descripción actualizada",
    "eventDate": "2026-08-15T21:00:00",
    "venue": "Estadio Nacional - Tribuna Oeste",
    "totalCapacity": 5000,
    "price": 85.00
  }
  ```
- **Respuesta exitosa:** `200 OK`

---

#### Delete Event

Elimina un evento.

- **Método:** `DELETE`
- **URL:** `{{base_url}}/api/events/{{event_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  ```
- **Respuesta exitosa:** `204 No Content`

---

#### Release Tickets

Libera manualmente tickets en Redis para un evento (por ejemplo, tras una cancelación masiva).

- **Método:** `PUT`
- **URL:** `{{base_url}}/api/events/{{event_id}}/tickets/release`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Content-Type: application/json
  Accept: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "quantity": 2
  }
  ```
- **Respuesta exitosa:** `200 OK`
- **Nota:** Incrementa el contador de tickets disponibles en Redis con `INCRBY`.

---

### 🎫 Orders

#### Create Order (Reserve Tickets)

Crea una reserva de entradas.

- **Método:** `POST`
- **URL:** `{{base_url}}/api/orders`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Content-Type: application/json
  Accept: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "eventId": "{{event_id}}",
    "quantity": 2
  }
  ```
- **Campos requeridos:**
  | Campo | Tipo | Descripción |
  |-------|------|-------------|
  | `eventId` | string (UUID) | ID del evento |
  | `quantity` | integer | Cantidad de entradas |
- **Nota:** El `userId` se extrae automáticamente del token JWT por el API Gateway.
- **Comportamiento de reserva (TTL):** La orden se crea en estado `PENDING` y se registra una reserva temporal en Redis con TTL de **5 minutos**. Si no se confirma dentro de ese plazo, el job de expiración cambia el estado a `EXPIRED` y libera los tickets automáticamente.
- **Respuesta exitosa:** `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "id": "abc12345-e89b-12d3-a456-426614174999",
      "userId": "user-123",
      "eventId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 2,
      "totalAmount": 151.00,
      "status": "PENDING",
      "createdAt": "2026-03-25T10:00:00"
    }
  }
  ```

---

#### Get Order by ID

Obtiene los detalles de una orden. **Solo el dueño de la orden puede verla.**

- **Método:** `GET`
- **URL:** `{{base_url}}/api/orders/{{order_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "abc12345-e89b-12d3-a456-426614174999",
      "userId": "user-123",
      "eventId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 2,
      "totalAmount": 151.00,
      "status": "PENDING",
      "createdAt": "2026-03-25T10:00:00",
      "updatedAt": "2026-03-25T10:00:00"
    }
  }
  ```
- **Respuesta 403 Forbidden:** Si intentas ver una orden que no es tuya.

---

#### Get My Orders

Obtiene todas las órdenes del usuario autenticado.

- **Método:** `GET`
- **URL:** `{{base_url}}/api/orders/my-orders`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Nota:** El `userId` se extrae automáticamente del token JWT.
- **Respuesta exitosa:** `200 OK`

---

#### Cancel Order

Cancela una orden existente. **Solo el dueño de la orden puede cancelarla.**

- **Método:** `PUT`
- **URL:** `{{base_url}}/api/orders/{{order_id}}/cancel`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Comportamiento Redis:** Al cancelar, se ejecuta `INCRBY` en Redis para devolver los tickets al inventario y se elimina la reserva temporal.
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "abc12345-e89b-12d3-a456-426614174999",
      "status": "CANCELLED",
      ...
    }
  }
  ```
- **Respuesta 403 Forbidden:** Si intentas cancelar una orden que no es tuya.

---

#### Confirm Order

Confirma una orden en estado `PENDING`, pasándola a `CONFIRMED`. Elimina la reserva temporal en Redis.

- **Método:** `PUT`
- **URL:** `{{base_url}}/api/orders/{{order_id}}/confirm`
- **Headers:**
  ```
  Authorization: Bearer {{access_token}}
  Accept: application/json
  ```
- **Comportamiento Redis:** Elimina la clave de reserva temporal (`vento:reservation:{orderId}`) de Redis. Los tickets ya habían sido decrementados al crear la orden.
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "id": "abc12345-e89b-12d3-a456-426614174999",
      "status": "CONFIRMED",
      ...
    }
  }
  ```
- **Respuesta 409 Conflict:** Si la orden no está en estado `PENDING`.
- **Respuesta 403 Forbidden:** Si intentas confirmar una orden que no es tuya.

---

### 🏥 Health Checks

#### API Gateway Health

- **Método:** `GET`
- **URL:** `{{base_url}}/actuator/health`
- **Respuesta exitosa:** `200 OK`
  ```json
  {
    "status": "UP"
  }
  ```

---

#### Event Service Health

- **Método:** `GET`
- **URL:** `http://localhost:8082/actuator/health`
- **Respuesta exitosa:** `200 OK`

---

#### Order Service Health

- **Método:** `GET`
- **URL:** `http://localhost:8083/actuator/health`
- **Respuesta exitosa:** `200 OK`

---

#### Keycloak Health

- **Método:** `GET`
- **URL:** `{{keycloak_url}}/health/ready`
- **Respuesta exitosa:** `200 OK`

---

## 📊 Códigos de Respuesta

| Código                      | Significado        | Causas Comunes                                 |
|-----------------------------|--------------------|------------------------------------------------|
| `200 OK`                    | Éxito              | Request procesado correctamente                |
| `201 Created`               | Recurso creado     | POST exitoso                                   |
| `204 No Content`            | Sin contenido      | DELETE exitoso                                 |
| `400 Bad Request`           | Error de cliente   | Body mal formado, campos faltantes             |
| `401 Unauthorized`          | No autenticado     | Token faltante, inválido o expirado            |
| `403 Forbidden`             | Sin permisos       | Token válido pero sin rol requerido            |
| `404 Not Found`             | No encontrado      | ID de evento/orden no existe                   |
| `409 Conflict`              | Conflicto          | No hay tickets disponibles, orden ya cancelada |
| `500 Internal Server Error` | Error del servidor | Excepción no manejada en el backend            |

---

## 🐛 Troubleshooting

### Error 401 Unauthorized

**Causa:** Token inválido, expirado o faltante.

**Solución:**

1. Ejecuta nuevamente **"Get Access Token (User)"**
2. Verifica que `client_secret` esté configurado correctamente
3. Verifica que el usuario exista en Keycloak

---

### Error 400 - "Account is not fully set up"

**Causa:** El usuario no tiene completados los campos obligatorios del Realm (ej: `firstName`, `lastName`).

**Síntoma:**

```json
{
  "error": "invalid_grant",
  "error_description": "Account is not fully set up"
}
```

**Solución:**

1. En Keycloak, ve a **Realm settings** → **User profile** → **Required fields**
2. Identifica los campos obligatorios
3. Edita el usuario y completa todos los campos requeridos
4. Asegúrate de que **Temporary password** = `OFF`
5. Vuelve a intentar el login

**Prevención:** Al crear usuarios de prueba, siempre completa:

- First name
- Last name
- Email (con verified = ON)

---

### Error 403 Forbidden

**Causa:** El usuario no tiene el rol requerido.

**Solución:**

1. En Keycloak, ve a **Users** → tu usuario → **Role mapping**
2. Asegúrate de que tenga el rol `USER` o `ADMIN` asignado
3. Obtén un nuevo token después de asignar el rol

---

### Error 409 Conflict (Create Order)

**Causa:** No hay suficientes tickets disponibles.

**Solución:**

1. Verifica la disponibilidad con **"Get Event by ID"**
2. Reduce la cantidad de entradas solicitadas
3. O crea un evento con mayor capacidad

---

### Error: "Could not get token"

**Causa:** `client_secret` incorrecto o Keycloak no está corriendo.

**Solución:**

1. Verifica que Keycloak esté activo: `docker compose ps keycloak`
2. Revisa el **Client secret** en Keycloak Dashboard
3. Actualiza la variable en Postman

---

### Variables no se actualizan

**Causa:** Los scripts de test no se ejecutan.

**Solución:**

1. En Postman, ve a **Settings** → **General**
2. Asegúrate de que **"Automatically follow redirects"** esté activado
3. Verifica que la consola esté visible (**View** → **Show Postman Console**)

---

## 📚 Archivos Relacionados

| Archivo                   | Descripción                                |
|---------------------------|--------------------------------------------|
| `POSTMAN_COLLECTION.json` | Colección importable en Postman            |
| `POSTMAN_ENDPOINTS.md`    | Este archivo - documentación de referencia |
| `KEYCLOAK_SETUP.md`       | Guía de configuración de Keycloak          |
| `README.md`               | Documentación general del proyecto         |

---

**Última actualización:** Marzo 2026  
**Versión de la API:** 1.0.0
