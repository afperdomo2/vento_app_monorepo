# Vento App - Monorepo Microservicios

## 📁 Estructura del Proyecto

```
vento_app_monorepo/
├── common/                      # Módulo compartido (DTOs, excepciones, utilerías)
│   └── src/main/java/com/vento/common/
│       ├── dto/                 # DTOs compartidos
│       │   ├── ApiResponse.java
│       │   ├── event/           # DTOs de eventos
│       │   ├── order/           # DTOs de pedidos
│       │   └── payment/         # DTOs de pagos
│       └── exception/           # Excepciones globales
├── microservices/
│   ├── api-gateway/             # Spring Cloud Gateway (:8080)
│   ├── event-service/           # Microservicio de eventos (:8082)
│   ├── order-service/           # Microservicio de pedidos (:8083)
│   └── payment-service/         # Microservicio de pagos (:8084)
└── frontend/                    # Aplicación Angular 21 (:4200)
```

## ⚙️ Requisitos

### Backend

- **Java 25** (usar SDKMAN para gestionar versiones)
- **Gradle 9.4** (incluido via wrapper)
- **Docker & Docker Compose** (para despliegue)

### Frontend

- **Node.js 22+** (recomendado usar nvm o fnm)
- **pnpm** (gestor de paquetes)

```bash
# Instalar pnpm globalmente
npm install -g pnpm
```

## 🌍 Entornos

El proyecto soporta tres entornos de ejecución:

| Entorno   | Base de Datos          | Microservicios      | Uso               |
|-----------|------------------------|---------------------|-------------------|
| **Local** | PostgreSQL en Docker   | Gradle (hot reload) | Desarrollo diario |
| **Dev**   | PostgreSQL en Docker   | Docker              | Testing integrado |
| **Prod**  | PostgreSQL persistente | Docker              | Producción        |

### 🏠 Entorno Local (Desarrollo)

```bash
# Configurar Java 25
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 25-tem
sdk use java 25-tem
```

```bash
# Compilar
./gradlew build -x test
```

Los microservicios se ejecutan localmente con Gradle para aprovechar el hot reload. Solo la infraestructura (PostgreSQL,
Redis, Keycloak, Elasticsearch) corre en Docker.

```bash
# Iniciar solo infraestructura
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Ejecutar microservicios en terminales separadas
./gradlew :microservices:payment-service:bootRun
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:api-gateway:bootRun

# Compilar continuamente para hot reload (opcional)
./gradlew classes --continuous
```

**Ventajas:**

- ✅ Hot reload automático al cambiar código
- ✅ Debugging directo desde el IDE
- ✅ Iteración rápida en desarrollo

### 🎨 Frontend (Angular 21)

El frontend está construido con **Angular 21** usando **pnpm** como gestor de paquetes.

**Requisitos:**

- Node.js 22+
- pnpm (`npm install -g pnpm`)

**Inicio rápido:**

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias (primera vez)
pnpm install

# Iniciar servidor de desarrollo
pnpm start
```

La aplicación estará disponible en: **http://localhost:4200**

**Ventajas:**

- ✅ **Signals** incorporados (reactividad moderna sin librerías adicionales)
- ✅ **Standalone Components** (patrón moderno de Angular)
- ✅ Hot reload automático
- ✅ TypeScript para type safety

**Documentación completa:** Ver [frontend/README.md](./frontend/README.md)

### 🔧 Entorno Dev (Testing)

Todos los servicios corren en contenedores Docker con configuración de desarrollo.

```bash
# 1. Opciones de despliegue

# 1.1. Construir y levantar todos los contenedores (usa la última imagen contruida)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 1.2. Reconstruir todas las imagenes y deplegar todos los contenedores del proyecto
docker compose -f docker-compose.yml -f docker-compose.dev.yml --build up -d 

# 1.3. Recontruir una imagen individual (por si tiene cambios en el código) y desplegarla
docker compose -f docker-compose.yml -f docker-compose.dev.yml --build up -d event-service

# 1.4. Separar el proceso en 2 (menos consumo recursos, más tiempo)

# 1.4.1. Crear la imagen
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# 1.4.2. Desplegar su contenedor
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 2. Apaga y limpia los contenedores creados
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# 3. Ver logs
docker compose logs -f

# 4. Crear topics de kafka (solo la primera vez o si se reinicia el contenedor)
docker exec vento-app-local-kafka-init-1 sh /init-kafka.sh
```

**Ventajas:**

- ✅ Entorno consistente y reproducible
- ✅ Testing de integración real
- ✅ Debug remoto habilitado (puerto 5005)

### 🚀 Entorno Prod (Producción)

Todos los servicios corren en contenedores Docker con configuración optimizada para producción.

```bash
# Ejecutar en producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Requiere variables de entorno para secretos
export POSTGRES_EVENTS_PASSWORD=tu_password_seguro
export POSTGRES_ORDERS_PASSWORD=tu_password_seguro
export KEYCLOAK_ADMIN_PASSWORD=tu_password_seguro
```

**Características:**

- ✅ Imágenes optimizadas (multi-stage build)
- ✅ Volúmenes persistentes para datos
- ✅ Health checks configurados
- ✅ Políticas de restart automático
- ✅ Usuario no-root por seguridad

## 🐳 Docker

### Comandos por Entorno

#### LOCAL

```bash
# Solo infraestructura (microservicios con Gradle)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

#### DEV

```bash
# Todos los servicios en Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```
#### PROD

```bash
# Todos los servicios en Docker (producción)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Servicios Individuales

```bash
# Infraestructura común
docker compose up -d postgres-events
docker compose up -d postgres-orders
docker compose up -d redis
docker compose up -d keycloak

# Microservicios (solo en dev/prod)
docker compose up -d event-service
docker compose up -d order-service
docker compose up -d api-gateway
```

### Ver Logs

```bash
# Todos los logs
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f event-service
docker compose logs -f postgres-events
```

### Detener Servicios

```bash
# Detener todo
docker compose down

# Detener servicios individuales
docker compose stop event-service
docker compose stop order-service
```

## 🌐 Ruteo del API Gateway

| Endpoint         | Servicio            | Descripción               |
|------------------|---------------------|---------------------------|
| `/api/events/**` | event-service:8082  | Gestión de eventos        |
| `/api/orders/**` | order-service:8083  | Gestión de pedidos        |
| `/api/payments/**` | payment-service:8084 | Procesamiento de pagos  |
| `/ui/*`          | frontend:4200       | Frontend de la aplicación |

> **Nota:** Durante el desarrollo local, el frontend corre directamente en `http://localhost:4200`. El ruteo `/ui/*` es
> útil cuando el frontend se sirve a través del API Gateway en producción.

## 🔌 Endpoints

### A través del API Gateway (Puerto 8080)

| Método | Endpoint                          | Descripción                         |
|--------|-----------------------------------|-------------------------------------|
| POST   | `/api/events`                     | Crear evento                        |
| GET    | `/api/events/{id}`                | Obtener evento por ID (UUID)        |
| GET    | `/api/events`                     | Listar eventos (paginación)         |
| GET    | `/api/events/featured`            | Eventos destacados                  |
| PUT    | `/api/events/{id}`                | Actualizar evento                   |
| DELETE | `/api/events/{id}`                | Eliminar evento                     |
| PUT    | `/api/events/{id}/tickets/release`| Liberar tickets en Redis            |
| POST   | `/api/orders`                     | Crear reserva (TTL 5 min en Redis)  |
| GET    | `/api/orders/{id}`                | Obtener pedido por ID               |
| GET    | `/api/orders/my-orders`           | Pedidos del usuario autenticado     |
| PUT    | `/api/orders/{id}/cancel`         | Cancelar pedido                     |
| PUT    | `/api/orders/{id}/confirm`        | Confirmar pedido (simula pago)      |
| POST   | `/api/payments/process`           | Procesar pago simulado (80% éxito)  |

----

> ⚠️ **NOTA:** Estas rutas son **solo para desarrollo**. En producción deben estar bloqueadas o no expuestas.

### Event Service (Puerto 8082)

**Swagger UI:** http://localhost:8082/swagger-ui.html

| Método | Endpoint                    | Descripción                  |
|--------|-----------------------------|------------------------------|
| POST   | `/api/events`               | Crear evento                 |
| GET    | `/api/events/{id}`          | Obtener evento por ID (UUID) |
| GET    | `/api/events`               | Listar eventos (paginación)  |
| GET    | `/api/events/featured`      | Eventos destacados           |
| PUT    | `/api/events/{id}`          | Actualizar evento            |
| DELETE | `/api/events/{id}`          | Eliminar evento              |
| PUT    | `/api/events/{id}/tickets/release` | Liberar tickets en Redis |

### Order Service (Puerto 8083)

**Swagger UI:** http://localhost:8083/swagger-ui.html

| Método | Endpoint                   | Descripción                                        |
|--------|----------------------------|----------------------------------------------------|
| POST   | `/api/orders`              | Crear reserva (**reserva temporal de 5 min en Redis**) |
| GET    | `/api/orders/{id}`         | Obtener pedido por ID                              |
| GET    | `/api/orders/my-orders`    | Pedidos del usuario autenticado                    |
| PUT    | `/api/orders/{id}/cancel`  | Cancelar pedido (libera tickets en Redis)          |
| PUT    | `/api/orders/{id}/confirm` | Confirmar pedido → estado CONFIRMED                |

> **Reserva temporal:** Al crear una orden queda en estado `PENDING` con una reserva en Redis que expira a los
> **5 minutos** (configurable con `vento.reservation.ttl-minutes`). Si no se confirma o cancela antes, la orden
> pasa automáticamente a `EXPIRED` y los tickets se liberan. Ver Swagger para el flujo completo.

### Payment Service (Puerto 8084)

**Swagger UI:** http://localhost:8084/swagger-ui.html

| Método | Endpoint                   | Descripción                                        |
|--------|----------------------------|----------------------------------------------------|
| POST   | `/api/payments/process`    | Procesar pago simulado (80% éxito, 20% fallo, 2s delay) |

> **Simulación de pago:** El servicio simula un gateway de pago real con 80% de tasa de éxito y 20% de fallo.
> Cada request tiene un delay de ~2 segundos. Los fallos devuelven HTTP 402 con formato RFC 9457.

## 🔐 Seguridad (Keycloak)

La autenticación y autorización del sistema está centralizada en el **API Gateway** usando **Keycloak** como proveedor
de identidad OAuth2/OpenID Connect.

### 📋 Credenciales por Defecto (Solo Desarrollo Local)

| Servicio               | URL                   | Usuario | Contraseña |
|------------------------|-----------------------|---------|------------|
| **Keycloak Dashboard** | http://localhost:8180 | `admin` | `admin`    |

> ⚠️ **IMPORTANTE:** Estas credenciales son **EXCLUSIVAS para desarrollo local**. En producción, debes cambiar las
> contraseñas en el archivo `.env.prod` antes de desplegar.

### 🔑 Configuración Requerida

Antes de usar la API, debes configurar Keycloak con los siguientes elementos:

1. **Realm:** `vento-realm`
2. **Cliente:** `vento-api` (OpenID Connect, confidential)
3. **Roles:** `USER`, `ADMIN`
4. **Usuarios:** Crear usuarios y asignar roles

### 📖 Guía Completa de Configuración

Para instrucciones detalladas paso a paso, consulta: **[KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)**

La guía incluye:

- ✅ Creación de realm, cliente y roles
- ✅ Creación de usuarios
- ✅ Cómo obtener tokens JWT
- ✅ Ejemplos de requests autenticados
- ✅ Troubleshooting de errores comunes

### 🧪 Ejemplo Rápido de Uso

```bash
# 1. Obtener token JWT
TOKEN=$(curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123" | jq -r '.access_token')

# 2. Usar token en requests a la API
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
```

### 🛡️ Comportamiento de Seguridad

| Escenario                      | Comportamiento                   |
|--------------------------------|----------------------------------|
| Request sin token              | `401 Unauthorized`               |
| Token inválido/expirado        | `401 Unauthorized`               |
| Token válido sin rol requerido | `403 Forbidden`                  |
| Token válido con rol correcto  | `200 OK` → pasa al microservicio |

### 📡 Headers Propagados a Microservicios

El API Gateway extrae información del JWT y la propaga como headers:

| Header         | Descripción                         | Origen en JWT              |
|----------------|-------------------------------------|----------------------------|
| `X-User-Id`    | ID único del usuario                | Claim `sub`                |
| `X-User-Roles` | Roles del usuario (comma-separated) | Claim `realm_access.roles` |

> Los microservicios **NO validan JWT**. Confían en los headers propagados por el Gateway.

## 📦 Módulos

### `common/`

Módulo compartido con DTOs, excepciones y utilerías disponibles para todos los microservicios.

### `microservices/api-gateway/`

Punto de entrada único. Recibe todas las peticiones y las enruta a los microservicios correspondientes.

### `microservices/*-service/`

Cada microservicio es independiente:

- `event-service` - Gestión de eventos
- `order-service` - Gestión de pedidos
- `payment-service` - Procesamiento de pagos simulados

## 🛠️ Desarrollo

### Ejecutar Todo el Stack (Recomendado para Desarrollo)

Para desarrollar con frontend y backend simultáneamente:

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

**Acceso:**

- 🌐 **Frontend:** http://localhost:4200
- 🔌 **API Gateway:** http://localhost:8080
- 📖 **Swagger Event Service:** http://localhost:8082/swagger-ui.html
- 📖 **Swagger Order Service:** http://localhost:8083/swagger-ui.html
- 📖 **Swagger Payment Service:** http://localhost:8084/swagger-ui.html
- 🔐 **Keycloak:** http://localhost:8180
- 🔍 **Elasticsearch:** http://localhost:9200
- 📊 **Kibana:** http://localhost:5601

### Compilar un módulo específico

```bash
./gradlew :microservices:event-service:build
```

### Limpiar build

```bash
./gradlew clean
```

### Ver dependencias de un módulo

```bash
./gradlew :microservices:event-service:dependencies
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
./gradlew test

# Tests de un módulo específico
./gradlew :microservices:event-service:test
./gradlew :microservices:order-service:test

# Tests con reporte detallado
./gradlew test --info
```

### Cobertura Actual

| Servicio                  | Tests | Estado |
|---------------------------|-------|--------|
| EventService              | 6     | ✅      |
| OrderService              | 9     | ✅      |
| TicketInventoryService    | 3     | ✅      |
| ConflictResolutionService | 3     | ✅      |

### Reportes

Los reportes de tests se generan en:

- **HTML:** `microservices/*/build/reports/tests/test/index.html`
- **XML:** `microservices/*/build/test-results/test/`

## 📂 Agregar un Nuevo Microservicio

1. Crear carpeta en `microservices/nombre-servicio/`
2. Crear `build.gradle` basado en los existentes
3. Crear estructura de paquetes Java
4. Agregar al `settings.gradle`:

```groovy
include 'microservices:nombre-servicio'
```

5. Agregar ruta en `api-gateway/application.yml`

## 🔧 Configuración por Perfiles

Cada microservicio tiene configuración específica para cada entorno:

```
microservices/event-service/src/main/resources/
├── application.yml           # Configuración base (perfil por defecto: local)
├── application-local.yml     # PostgreSQL localhost para desarrollo rápido
├── application-dev.yml       # PostgreSQL con variables de entorno
└── application-prod.yml      # PostgreSQL con validación de schema
```

### Cambiar de Perfil

```bash
# Usar perfil específico (local, dev, prod)
export SPRING_PROFILES_ACTIVE=dev
./gradlew :microservices:event-service:bootRun

# O pasar como argumento
./gradlew :microservices:event-service:bootRun --args='--spring.profiles.active=prod'
```

## 🔐 Variables de Entorno (.env)

Para los entornos **Dev** y **Prod** con Docker, el proyecto usa variables de entorno externalizadas.

### Archivos de Variables

| Archivo        | Propósito                                      | Versionado      |
|----------------|------------------------------------------------|-----------------|
| `.env.example` | Plantilla con todas las variables              | ✅ Sí (git)      |
| `.env`         | Valores para desarrollo local                  | ❌ No (ignorado) |
| `.env.prod`    | Valores específicos para producción (opcional) | ❌ No (ignorado) |

### Configurar para Desarrollo (Dev)

```bash
# 1. Copiar plantilla
cp .env.example .env

# 2. (Opcional) Editar valores en .env
# Las contraseñas por defecto son: postgres

# 3. Levantar entorno dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Configurar para Producción (Prod)

**Opción 1: Usar archivo `.env.prod`**

```bash
# Crear archivo específico para producción
cp .env.example .env.prod

# Editar con valores seguros
# POSTGRES_EVENTS_PASSWORD=tu_password_seguro
# POSTGRES_ORDERS_PASSWORD=tu_password_seguro
# KEYCLOAK_ADMIN_PASSWORD=tu_password_seguro

# Desplegar
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Opción 2: Exportar variables en el shell**

```bash
export POSTGRES_EVENTS_PASSWORD=tu_password_seguro
export POSTGRES_ORDERS_PASSWORD=tu_password_seguro
export KEYCLOAK_ADMIN_PASSWORD=tu_password_seguro

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Opción 3: Usar Docker Compose directamente**

```bash
POSTGRES_EVENTS_PASSWORD=tu_password_seguro \
POSTGRES_ORDERS_PASSWORD=tu_password_seguro \
KEYCLOAK_ADMIN_PASSWORD=tu_password_seguro \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variables Disponibles

```bash
# PostgreSQL Event Service
POSTGRES_EVENTS_DB=events_db          # Nombre de la base de datos
POSTGRES_EVENTS_USER=postgres         # Usuario de la base de datos
POSTGRES_EVENTS_PASSWORD=postgres     # Contraseña (CAMBIAR EN PROD)

# PostgreSQL Order Service
POSTGRES_ORDERS_DB=orders_db          # Nombre de la base de datos
POSTGRES_ORDERS_USER=postgres         # Usuario de la base de datos
POSTGRES_ORDERS_PASSWORD=postgres     # Contraseña (CAMBIAR EN PROD)

# Keycloak
KEYCLOAK_ADMIN=admin                  # Usuario admin de Keycloak
KEYCLOAK_ADMIN_PASSWORD=admin         # Contraseña admin (CAMBIAR EN PROD)
```

## 🐛 Troubleshooting

### Los microservicios no se conectan a la base de datos (Local)

1. Verificar que la infraestructura esté corriendo:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml ps
   ```

2. Verificar puertos expuestos:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml ps
   # PostgreSQL events: 5432
   # PostgreSQL orders: 5433
   # Elasticsearch: 9200
   ```

3. Verificar logs de la base de datos:
   ```bash
   docker compose logs postgres-events
   ```

### Error "Connection refused" en API Gateway

El API Gateway en modo `local` apunta a `localhost:8082` y `localhost:8083`. Asegúrate de que los microservicios estén
corriendo:

```bash
# Verificar que los servicios estén activos
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
```

### Debug remoto en Docker (Dev)

Los contenedores Dev exponen el puerto 5005 para debug remoto:

1. En tu IDE, crear configuración de "Remote JVM Debug"
2. Host: `localhost`, Puerto: `5005`
3. El servicio debe estar corriendo en modo dev:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d event-service
   ```

### Resetear bases de datos (Local)

```bash
# Detener contenedores y eliminar volúmenes
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v

# Reiniciar
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

---

## 📐 Estándares de la API

### Manejo de Errores (RFC 9457)

La API utiliza el estándar **[RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457)** (Problem Details for HTTP APIs)
para la gestión de errores. Todas las respuestas de error siguen este formato:

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

**Campos de la respuesta:**

| Campo       | Tipo   | Descripción                                             |
|-------------|--------|---------------------------------------------------------|
| `type`      | URI    | Identificador del tipo de error (extensible)            |
| `title`     | string | Título corto y legible del error                        |
| `status`    | number | Código HTTP de la respuesta (400, 401, 403, etc.)       |
| `detail`    | string | Descripción detallada del error                         |
| `instance`  | string | Path del endpoint que generó el error                   |
| `service`   | string | Nombre del microservicio que respondió                  |
| `timestamp` | string | Timestamp en formato ISO 8601 (truncado a milisegundos) |

**Tipos de errores comunes:**

| Tipo                                        | HTTP | Descripción                    |
|---------------------------------------------|------|--------------------------------|
| `https://vento.app/errors/validation-error` | 400  | Errores de validación de datos |
| `https://vento.app/errors/unauthorized`     | 401  | Error de autenticación         |
| `https://vento.app/errors/forbidden`        | 403  | Error de autorización          |
| `https://vento.app/errors/not-found`        | 404  | Recurso no encontrado          |
| `https://vento.app/errors/payment-failed`   | 402  | Pago fallido                   |
| `https://vento.app/errors/conflict`         | 409  | Conflicto de negocio           |
| `https://vento.app/errors/internal-error`   | 500  | Error interno del servidor     |
| `https://vento.app/errors/bad-gateway`      | 502  | Error en servicio externo      |

> **Nota:** Este formato es consistente en todos los microservicios (API Gateway, Event Service, Order Service).

## 👤 Autor

Creado para el proyecto Vento App.
