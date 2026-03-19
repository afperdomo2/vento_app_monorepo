# Vento App Monorepo - Contexto del Proyecto

## Resumen del Proyecto

Este es un **monorepo de microservicios con Spring Boot** para el proyecto Vento App. Sigue una estructura de
compilación Gradle multi-módulo con la siguiente arquitectura:

- **API Gateway** (Spring Cloud Gateway/WebFlux) - Punto de entrada único que enruta solicitudes a los servicios backend
- **Event Service** - Microservicio Spring Boot para gestión de eventos
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
│   │   ├── src/main/resources/application.yml
│   │   ├── Dockerfile
│   │   └── build.gradle
│   ├── event-service/               # Microservicio de eventos (:8082)
│   │   ├── src/main/java/com/vento/event/
│   │   ├── src/main/resources/application.yml
│   │   ├── Dockerfile
│   │   └── build.gradle
│   └── order-service/               # Microservicio de pedidos (:8083)
│       ├── src/main/java/com/vento/order/
│       ├── src/main/resources/application.yml
│       ├── Dockerfile
│       └── build.gradle
├── frontend/                        # Espacio para frontend (basado en Node.js)
├── docker-compose.yml               # Orquestación Docker
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

### Ejecutar Localmente (Gradle)

```bash
# Iniciar Event Service
./gradlew :microservices:event-service:bootRun

# Iniciar API Gateway (en otra terminal)
./gradlew :microservices:api-gateway:bootRun
```

### Ejecutar con Docker

```bash
# Construir todas las imágenes Docker
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Ver logs
docker-compose logs -f
```

### Puertos de los Servicios

| Servicio     | Puerto | Descripción                                 |
|--------------|--------|---------------------------------------------|
| API Gateway  | 8080   | Punto de entrada para todas las solicitudes |
| Event Service | 8082  | Microservicio de gestión de eventos         |
| Order Service | 8083  | Microservicio de gestión de pedidos         |
| Frontend     | 3000   | Aplicación frontend (placeholder)           |

### Enrutamiento del API Gateway

| Patrón de Endpoint | Enruta a                    |
|--------------------|-----------------------------|
| `/ui/*`            | `frontend:3000`             |

## Convenciones de Desarrollo

### Dependencias entre Módulos

- Todos los microservicios dependen del módulo `common` para código compartido
- Se usa Lombok para reducir código boilerplate (`@Data`, `@Builder`, etc.)
- Spring Cloud BOM gestiona las versiones de dependencias para componentes cloud

### Patrón de Configuración

Cada microservicio usa un patrón de archivo de configuración externo:

```yaml
# application.yml en cada servicio
spring:
  config:
    import: optional:file:./config/<nombre-servicio>.yml
```

Crear archivos `config/<nombre-servicio>.yml` para configuraciones específicas del entorno (base de datos, RabbitMQ,
Redis, etc.).

### Agregar un Nuevo Microservicio

1. Crear directorio: `microservices/<nombre-servicio>/`
2. Agregar `build.gradle` basado en los servicios existentes
3. Crear estructura de paquetes Java: `src/main/java/com/vento/<servicio>/`
4. Agregar `src/main/resources/application.yml`
5. Crear `Dockerfile` basado en los existentes
6. Registrar módulo en `settings.gradle`:
   ```groovy
   include 'microservices:<nombre-servicio>'
   ```
7. Agregar ruta en `api-gateway/src/main/resources/application.yml`

### Build Multi-Etapa de Docker

Todos los servicios usan un build Docker de dos etapas:

1. **Etapa builder**: Usa JDK para compilar y crear el JAR
2. **Etapa runtime**: Usa imagen solo-JRE para menor tamaño

## Referencia de Archivos Clave

| Archivo               | Propósito                                                        |
|-----------------------|------------------------------------------------------------------|
| `settings.gradle`     | Define nombre del proyecto y módulos incluidos                   |
| `build.gradle` (raíz) | Declara plugins de Spring Boot y dependency management           |
| `gradle.properties`   | Configuración de rendimiento de Gradle (caché, paralelo, daemon) |
| `docker-compose.yml`  | Define servicios, redes y contextos de build                     |
| `common/build.gradle` | Configuración de librería Java con Lombok                        |

## Notas

- El directorio `frontend/` es un placeholder; implementar con React, Vue, Next.js o similar
- Los archivos de configuración externos en `./config/` son opcionales y se cargan si existen
- Git ignora `.gradle/`, `build/`, `.idea/`, y archivos específicos del entorno
