# Vento App - Monorepo Microservicios

## 📁 Estructura del Proyecto

```
vento_app_monorepo/
├── common/                      # Módulo compartido (DTOs, utilerías)
├── microservices/
│   ├── api-gateway/             # Spring Cloud Gateway (:8080)
│   ├── user-service/            # Microservicio de usuarios (:8081)
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
./gradlew :microservices:user-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

## 🐳 Docker

### Construir imágenes

```bash
docker-compose build
```

### Ejecutar todos los servicios

```bash
docker-compose up -d
```

### Detener servicios

```bash
docker-compose down
```

## 🌐 Ruteo del API Gateway

| Endpoint | Servicio |
|----------|----------|
| `/api/users/*` | user-service:8081 |
| `/ui/*` | frontend:3000 |

## 📦 Módulos

### `common/`
Módulo compartido con DTOs, excepciones y utilerías disponibles para todos los microservicios.

### `microservices/api-gateway/`
Punto de entrada único. Recibe todas las peticiones y las enruta a los microservicios correspondientes.

### `microservices/*-service/`
Cada microservicio es independiente:
- `user-service` - Gestión de usuarios

## 🛠️ Desarrollo

### Compilar un módulo específico

```bash
./gradlew :microservices:user-service:build
```

### Limpiar build

```bash
./gradlew clean
```

### Ver dependencias de un módulo

```bash
./gradlew :microservices:user-service:dependencies
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
# microservices/user-service/src/main/resources/application.yml
spring:
  config:
    import: optional:file:./config/user-service.yml
```

## 👤 Autor

Creado para el proyecto Vento App.
