# Vento App - Monorepo Microservicios

## 📁 Estructura del Proyecto

```
vento_app_monorepo/
├── common/                      # Módulo compartido (DTOs, utilerías)
│   └── src/main/java/com/vento/common/dto/
│       ├── ApiResponse.java     # Wrapper de respuesta
│       ├── event/               # DTOs de eventos
│       └── order/               # DTOs de pedidos (futuro)
├── microservices/
│   ├── api-gateway/             # Spring Cloud Gateway (:8080)
│   ├── event-service/           # Microservicio de eventos (:8082)
│   └── order-service/            # Microservicio de pedidos (:8083)
└── frontend/                    # Carpeta para el frontend
```

## ⚙️ Requisitos

- **Java 25** (usar SDKMAN para gestionar versiones)
- **Gradle 9.4** (incluido via wrapper)
- **Docker & Docker Compose** (para despliegue)

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
Redis, Keycloak) corre en Docker.

```bash
# Iniciar solo infraestructura
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Ejecutar microservicios en terminales separadas
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

### 🔧 Entorno Dev (Testing)

Todos los servicios corren en contenedores Docker con configuración de desarrollo.

```bash
# Construir y ejecutar todo
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs
docker compose logs -f
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

```bash
# ===== LOCAL =====
# Solo infraestructura (microservicios con Gradle)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose -f docker-compose.yml -f docker-compose.local.yml down

# ===== DEV =====
# Todos los servicios en Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# ===== PROD =====
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

| Endpoint         | Servicio           | Descripción               |
|------------------|--------------------|---------------------------|
| `/api/events/**` | event-service:8082 | Gestión de eventos        |
| `/api/orders/**` | order-service:8083 | Gestión de pedidos        |
| `/ui/*`          | frontend:3000      | Frontend de la aplicación |

## 🔌 Endpoints

### A través del API Gateway (Puerto 8080)

| Método | Endpoint                    | Descripción                  |
|--------|-----------------------------|------------------------------|
| POST   | `/api/events`               | Crear evento                 |
| GET    | `/api/events/{id}`          | Obtener evento por ID (UUID) |
| GET    | `/api/events`               | Listar eventos (paginación)  |
| PUT    | `/api/events/{id}`          | Actualizar evento            |
| POST   | `/api/orders`               | Crear reserva                |
| GET    | `/api/orders/{id}`          | Obtener pedido por ID        |
| GET    | `/api/orders/user/{userId}` | Pedidos por usuario          |
| PUT    | `/api/orders/{id}/cancel`   | Cancelar pedido              |

----

> ⚠️ **NOTA:** Estas rutas son **solo para desarrollo**. En producción deben estar bloqueadas o no expuestas.

### Event Service (Puerto 8082)

**Swagger UI:** http://localhost:8082/swagger-ui.html

| Método | Endpoint       | Descripción                  |
|--------|----------------|------------------------------|
| POST   | `/events`      | Crear evento                 |
| GET    | `/events/{id}` | Obtener evento por ID (UUID) |
| GET    | `/events`      | Listar eventos (paginación)  |
| PUT    | `/events/{id}` | Actualizar evento            |

### Order Service (Puerto 8083)

**Swagger UI:** http://localhost:8083/swagger-ui.html

| Método | Endpoint                | Descripción           |
|--------|-------------------------|-----------------------|
| POST   | `/orders`               | Crear reserva         |
| GET    | `/orders/{id}`          | Obtener pedido por ID |
| GET    | `/orders/user/{userId}` | Pedidos por usuario   |
| PUT    | `/orders/{id}/cancel`   | Cancelar pedido       |

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

## 🛠️ Desarrollo

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

| Servicio        | Tests | Estado |
|-----------------|-------|--------|
| EventService    | 6     | ✅     |
| OrderService    | 10    | ✅     |

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

## 👤 Autor

Creado para el proyecto Vento App.
