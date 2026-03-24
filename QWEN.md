# Vento App Monorepo - Contexto del Proyecto

## Resumen del Proyecto

Este es un **monorepo de microservicios con Spring Boot** para el proyecto Vento App. Sigue una estructura de
compilación Gradle multi-módulo con la siguiente arquitectura:

- **API Gateway** (Spring Cloud Gateway/WebFlux) - Punto de entrada único que enruta solicitudes a los servicios backend
- **Event Service** - Microservicio Spring Boot para gestión de eventos
- **Order Service** - Microservicio Spring Boot para gestión de pedidos
- **Módulo Common** - Librería compartida con DTOs, excepciones y utilerías
- **Frontend** - Espacio reservado para una futura aplicación frontend (React, Vue, Next.js, etc.)

### Stack Tecnológico

| Componente       | Tecnología                      |
|------------------|---------------------------------|
| Lenguaje         | Java 25                         |
| Build Tool       | Gradle 9.4.0 (wrapper incluido) |
| Framework        | Spring Boot 3.5.0               |
| API Gateway      | Spring Cloud Gateway (WebFlux)  |
| Containerización | Docker y Docker Compose         |
| Frontend         | Node.js 22 (placeholder)        |

## 🌍 Entornos

El proyecto soporta tres entornos de ejecución:

| Entorno | Base de Datos | Microservicios | Uso |
|---------|---------------|----------------|-----|
| **Local** | PostgreSQL en Docker | Gradle (hot reload) | Desarrollo diario |
| **Dev** | PostgreSQL en Docker | Docker | Testing integrado |
| **Prod** | PostgreSQL persistente | Docker | Producción |

## Estructura del Repositorio

```
vento_app_monorepo/
├── common/                          # Módulo compartido (DTOs, utilerías)
│   └── src/main/java/com/vento/common/dto/
│       ├── ApiResponse.java         # Wrapper de respuesta
│       ├── event/                  # DTOs de eventos
│       └── order/                  # DTOs de pedidos
├── microservices/
│   ├── api-gateway/                 # Spring Cloud Gateway (:8080)
│   │   ├── src/main/java/com/vento/gateway/
│   │   ├── src/main/resources/
│   │   │   ├── application.yml          # Config base (default: local)
│   │   │   ├── application-local.yml    # Rutas a localhost
│   │   │   ├── application-dev.yml      # Rutas a contenedores
│   │   │   └── application-prod.yml     # Rutas a contenedores (prod)
│   │   ├── Dockerfile               # Legacy (usar dev/prod)
│   │   ├── Dockerfile.dev           # Debug remoto habilitado
│   │   ├── Dockerfile.prod          # Optimizado para producción
│   │   └── build.gradle
│   ├── event-service/               # Microservicio de eventos (:8082)
│   │   ├── src/main/java/com/vento/event/
│   │   ├── src/main/resources/
│   │   │   ├── application.yml          # Config base
│   │   │   ├── application-local.yml    # PostgreSQL localhost
│   │   │   ├── application-dev.yml      # PostgreSQL Docker
│   │   │   └── application-prod.yml     # PostgreSQL prod
│   │   ├── Dockerfile               # Legacy
│   │   ├── Dockerfile.dev           # Debug remoto
│   │   ├── Dockerfile.prod          # Producción
│   │   └── build.gradle
│   └── order-service/               # Microservicio de pedidos (:8083)
│       ├── src/main/java/com/vento/order/
│       ├── src/main/resources/
│       │   ├── application.yml          # Config base
│       │   ├── application-local.yml    # PostgreSQL localhost
│       │   ├── application-dev.yml      # PostgreSQL Docker
│       │   └── application-prod.yml     # PostgreSQL prod
│       ├── Dockerfile               # Legacy
│       ├── Dockerfile.dev           # Debug remoto
│       ├── Dockerfile.prod          # Producción
│       └── build.gradle
├── frontend/                        # Espacio para frontend (basado en Node.js)
├── docker-compose.yml               # Red base
├── docker-compose.local.yml         # Infraestructura local
├── docker-compose.dev.yml           # Todos los servicios (dev)
├── docker-compose.prod.yml          # Todos los servicios (prod)
├── build.gradle                     # Configuración raíz del build
├── settings.gradle                  # Definición de módulos
├── gradle.properties                # Configuración de Gradle
└── gradlew / gradlew.bat            # Scripts del wrapper de Gradle
```

## Construcción y Ejecución

### Prerrequisitos

- **Java 25** (recomendado: usar SDKMAN)
- **Docker y Docker Compose** (para despliegue en contenedores)

### Configurar Entorno Java

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 25-tem
sdk use java 25-tem
```

### Comandos de Build

| Comando                                      | Descripción                                |
|----------------------------------------------|--------------------------------------------|
| `./gradlew build -x test`                    | Construir todos los módulos (saltar tests) |
| `./gradlew clean`                            | Limpiar todos los artefactos de build      |
| `./gradlew :common:build`                    | Construir solo el módulo common            |
| `./gradlew :microservices:event-service:build` | Construir solo event-service             |
| `./gradlew :microservices:api-gateway:build` | Construir solo api-gateway                 |

### Ejecutar en Entorno Local (Recomendado para Desarrollo)

```bash
# Terminal 1: Iniciar infraestructura (PostgreSQL, Redis, Keycloak)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminal 2: Iniciar Event Service con hot reload
./gradlew :microservices:event-service:bootRun

# Terminal 3: Iniciar Order Service con hot reload
./gradlew :microservices:order-service:bootRun

# Terminal 4: Iniciar API Gateway con hot reload
./gradlew :microservices:api-gateway:bootRun
```

**Ventajas del entorno local:**
- ✅ Hot reload automático al cambiar código
- ✅ Debugging directo desde el IDE
- ✅ Iteración rápida en desarrollo

### Ejecutar en Entorno Dev (Testing)

```bash
# Todos los servicios en Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs
docker compose logs -f
```

### Ejecutar en Entorno Prod (Producción)

```bash
# Requiere variables de entorno para secretos
export POSTGRES_EVENTS_PASSWORD=tu_password_seguro
export POSTGRES_ORDERS_PASSWORD=tu_password_seguro
export KEYCLOAK_ADMIN_PASSWORD=tu_password_seguro

# Todos los servicios en Docker con configuración de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Puertos de los Servicios

| Servicio       | Puerto | Descripción                                 |
|----------------|--------|---------------------------------------------|
| API Gateway    | 8080   | Punto de entrada para todas las solicitudes |
| API Gateway    | 5005   | Debug remoto (solo dev)                     |
| Event Service  | 8082   | Microservicio de gestión de eventos         |
| Event Service  | 5005   | Debug remoto (solo dev)                     |
| Order Service  | 8083   | Microservicio de gestión de pedidos         |
| Order Service  | 5005   | Debug remoto (solo dev)                     |
| Frontend       | 3000   | Aplicación frontend (placeholder)           |
| PostgreSQL     | 5432   | Base de datos events_db                     |
| PostgreSQL     | 5433   | Base de datos orders_db                     |
| Redis          | 6379   | Caché y gestión de stock                    |
| Keycloak       | 8180   | Autenticación y gestión de usuarios         |

### Enrutamiento del API Gateway

El API Gateway tiene configuraciones de rutas específicas por perfil:

| Perfil  | Event Service         | Order Service         | Frontend            |
|---------|-----------------------|-----------------------|---------------------|
| Local   | `http://localhost:8082` | `http://localhost:8083` | `http://localhost:3000` |
| Dev     | `http://event-service:8082` | `http://order-service:8083` | `http://frontend:3000` |
| Prod    | `http://event-service:8082` | `http://order-service:8083` | `http://frontend:3000` |

## Convenciones de Desarrollo

### Dependencias entre Módulos

- Todos los microservicios dependen del módulo `common` para código compartido
- Se usa Lombok para reducir código boilerplate (`@Data`, `@Builder`, etc.)
- Spring Cloud BOM gestiona las versiones de dependencias para componentes cloud

### Configuración por Perfiles

Cada microservicio usa configuraciones específicas por perfil:

```yaml
# application.yml (base)
spring:
  application:
    name: event-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}  # Default: local

# application-local.yml - Desarrollo rápido con PostgreSQL en Docker
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/events_db
    username: postgres
    password: postgres

# application-dev.yml - Desarrollo con variables de entorno
spring:
  datasource:
    url: jdbc:postgresql://${DATABASE_HOST:localhost}:${DATABASE_PORT:5432}/${DATABASE_NAME:events_db}
    username: ${DATABASE_USERNAME:postgres}
    password: ${DATABASE_PASSWORD:postgres}

# application-prod.yml - Producción con validación
spring:
  datasource:
    url: jdbc:postgresql://${DATABASE_HOST:localhost}:${DATABASE_PORT:5432}/${DATABASE_NAME:events_db}
  jpa:
    hibernate:
      ddl-auto: validate  # Nunca modificar schema automáticamente
```

### Variables de Entorno (.env)

Para los entornos **Dev** y **Prod** con Docker, el proyecto usa variables de entorno externalizadas:

```bash
# Archivos de variables
.env.example    # Plantilla versionada (git)
.env            # Desarrollo local (ignorado)
.env.prod       # Producción (ignorado, opcional)

# Variables principales
POSTGRES_EVENTS_DB=events_db
POSTGRES_EVENTS_USER=postgres
POSTGRES_EVENTS_PASSWORD=<password>

POSTGRES_ORDERS_DB=orders_db
POSTGRES_ORDERS_USER=postgres
POSTGRES_ORDERS_PASSWORD=<password>

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<password>
```

**Uso en Docker Compose:**

```bash
# Dev (usa .env automáticamente)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Prod (usa .env.prod o exportar variables)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Agregar un Nuevo Microservicio

1. Crear directorio: `microservices/<nombre-servicio>/`
2. Agregar `build.gradle` basado en los servicios existentes
3. Crear estructura de paquetes Java: `src/main/java/com/vento/<servicio>/`
4. Agregar `src/main/resources/application.yml` y configuraciones por perfil
5. Crear `Dockerfile.dev` y `Dockerfile.prod`
6. Registrar módulo en `settings.gradle`:
   ```groovy
   include 'microservices:<nombre-servicio>'
   ```
7. Agregar rutas en `api-gateway/src/main/resources/application-local.yml`, `application-dev.yml`, y `application-prod.yml`

### Build Multi-Etapa de Docker

**Dockerfile.dev** (una etapa, con debug):
```dockerfile
FROM eclipse-temurin:25-jdk-alpine
# ... con puerto de debug 5005 expuesto
```

**Dockerfile.prod** (multi-etapa, optimizado):
```dockerfile
FROM eclipse-temurin:25-jdk-alpine AS builder
# ... compilar JAR

FROM eclipse-temurin:25-jre-alpine
# ... usuario no-root, optimizaciones JVM
```

## Referencia de Archivos Clave

| Archivo               | Propósito                                                        |
|-----------------------|------------------------------------------------------------------|
| `settings.gradle`     | Define nombre del proyecto y módulos incluidos                   |
| `build.gradle` (raíz) | Declara plugins de Spring Boot y dependency management           |
| `gradle.properties`   | Configuración de rendimiento de Gradle (caché, paralelo, daemon) |
| `docker-compose.yml`  | Red base compartida                                              |
| `docker-compose.local.yml` | Infraestructura local (solo para desarrollo)             |
| `docker-compose.dev.yml` | Todos los servicios con Dockerfile.dev                     |
| `docker-compose.prod.yml` | Todos los servicios con Dockerfile.prod                    |
| `common/build.gradle` | Configuración de librería Java con Lombok                        |
| `microservices/*/src/main/resources/application.yml` | Config base con perfil default |
| `microservices/*/src/main/resources/application-local.yml` | Config local (DB hardcodeada) |
| `microservices/*/src/main/resources/application-dev.yml` | Config dev (variables de entorno) |
| `microservices/*/src/main/resources/application-prod.yml` | Config prod (validación) |

## Notas

- El directorio `frontend/` es un placeholder; implementar con React, Vue, Next.js o similar
- Los archivos de configuración externos en `./config/` son opcionales y se cargan si existen
- Git ignora `.gradle/`, `build/`, `.idea/`, y archivos específicos del entorno
- **Importante**: El perfil por defecto es `local` para facilitar el desarrollo rápido
- Los Dockerfile originales (`Dockerfile`) se mantienen por compatibilidad pero se recomienda usar `Dockerfile.dev` y `Dockerfile.prod`
