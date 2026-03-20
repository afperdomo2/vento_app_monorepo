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

## 🚀 Inicio Rápido

### 1. Configurar Java

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 25-tem
sdk use java 25-tem
```

### 2. Compilar

```bash
./gradlew build -x test
```

### 3. Ejecutar Microservicios

```bash
# Iniciar Event Service
./gradlew :microservices:event-service:bootRun

# Iniciar Order Service (en otra terminal)
./gradlew :microservices:order-service:bootRun

# Iniciar API Gateway (en otra terminal)
./gradlew :microservices:api-gateway:bootRun
```

## 🐳 Docker

### Construir imágenes

```bash
docker compose build
```

### Ejecutar todos los servicios

```bash
docker compose up -d
```

```bash
# Más usados en development para evitar levantar toda la infraestructura
docker compose up -d postgres-events postgres-orders redis keycloak
```

### Ejecutar servicios individuales

```bash
docker compose up -d postgres-events
docker compose up -d postgres-orders
docker compose up -d redis
docker compose up -d keycloak
docker compose up -d event-service
docker compose up -d order-service
docker compose up -d api-gateway
```

### Detener servicios

```bash
docker compose down
```

### Detener servicios individuales

```bash
docker compose stop event-service
docker compose stop order-service
docker compose stop api-gateway
```

### Ver logs

```bash
docker compose logs -f
docker compose logs -f event-service
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

## 📂 Agregar un Nuevo Microservicio

1. Crear carpeta en `microservices/nombre-servicio/`
2. Crear `build.gradle` basado en los existentes
3. Crear estructura de paquetes Java
4. Agregar al `settings.gradle`:

```groovy
include 'microservices:nombre-servicio'
```

5. Agregar ruta en `api-gateway/application.yml`

## 🔧 Variables de Entorno

Para configurar Base de Datos, RabbitMQ, Redis, etc., crear archivos `application-dev.yml` en cada microservicio:

```yaml
# microservices/event-service/src/main/resources/application.yml
spring:
  config:
    import: optional:file:./config/event-service.yml
```

## 👤 Autor

Creado para el proyecto Vento App.
