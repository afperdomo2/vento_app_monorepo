# Resumen de Cambios - Implementación de Entornos Local, Dev y Prod

## Fecha
Marzo 2026

## Descripción
Implementación de tres entornos de ejecución (local, dev, prod) para todos los microservicios, siguiendo las mejores prácticas de Spring Boot.

---

## 📁 Archivos Creados

### Docker Compose por Entorno
1. **`docker-compose.local.yml`** - Solo infraestructura (PostgreSQL, Redis, Keycloak) para desarrollo con hot reload
2. **`docker-compose.dev.yml`** - Todos los servicios en Docker con configuración de desarrollo
3. **`docker-compose.prod.yml`** - Todos los servicios en Docker con configuración de producción

### Dockerfiles por Entorno (por cada microservicio)
4. **`microservices/event-service/Dockerfile.dev`** - Con debug remoto (puerto 5005)
5. **`microservices/event-service/Dockerfile.prod`** - Optimizado para producción (multi-etapa, usuario no-root)
6. **`microservices/order-service/Dockerfile.dev`** - Con debug remoto
7. **`microservices/order-service/Dockerfile.prod`** - Optimizado para producción
8. **`microservices/api-gateway/Dockerfile.dev`** - Con debug remoto
9. **`microservices/api-gateway/Dockerfile.prod`** - Optimizado para producción

### Configuraciones Spring Boot por Perfil

#### Event Service
10. **`microservices/event-service/src/main/resources/application-local.yml`** - PostgreSQL localhost hardcodeado
11. **`microservices/event-service/src/main/resources/application-dev.yml`** - PostgreSQL con variables de entorno
12. **`microservices/event-service/src/main/resources/application-prod.yml`** - PostgreSQL con ddl-auto=validate

#### Order Service
13. **`microservices/order-service/src/main/resources/application-local.yml`** - PostgreSQL localhost hardcodeado
14. **`microservices/order-service/src/main/resources/application-dev.yml`** - PostgreSQL con variables de entorno
15. **`microservices/order-service/src/main/resources/application-prod.yml`** - PostgreSQL con ddl-auto=validate

#### API Gateway
16. **`microservices/api-gateway/src/main/resources/application-local.yml`** - Rutas a localhost:8082/8083
17. **`microservices/api-gateway/src/main/resources/application-dev.yml`** - Rutas a contenedores Docker
18. **`microservices/api-gateway/src/main/resources/application-prod.yml`** - Rutas a contenedores Docker (prod)

---

## 📝 Archivos Modificados

### Configuración
1. **`docker-compose.yml`** - Simplificado a red base compartida
2. **`microservices/event-service/src/main/resources/application.yml`** - Perfil default cambiado a `local`, eliminadas configuraciones inline
3. **`microservices/order-service/src/main/resources/application.yml`** - Perfil default cambiado a `local`, eliminadas configuraciones inline
4. **`microservices/api-gateway/src/main/resources/application.yml`** - Perfil default cambiado a `local`, eliminadas configuraciones de rutas inline

### Documentación
5. **`README.md`** - Actualizado con:
   - Tabla comparativa de entornos
   - Instrucciones detalladas por entorno
   - Comandos Docker actualizados
   - Sección de troubleshooting
   - Variables de entorno para producción

6. **`AGENTS.md`** - Actualizado con:
   - Tabla de entornos
   - Puertos actualizados (incluye debug remoto)
   - Comandos Docker por entorno
   - Sección de configuración por perfiles

7. **`QWEN.md`** - Actualizado con:
   - Sección de entornos
   - Estructura de repositorio expandida
   - Instrucciones de ejecución por entorno
   - Tabla de enrutamiento del API Gateway por perfil
   - Referencia de archivos clave actualizada

### Git
8. **`.gitignore`** - Agregados:
   - Archivos `.env.dev`, `.env.prod`
   - Configuraciones locales de Spring Boot
   - Keys y certificados

---

## 🎯 Cambios Clave

### 1. Perfil por Defecto
- **Antes**: `dev` (usando H2)
- **Ahora**: `local` (usando PostgreSQL en Docker)

### 2. Base de Datos
- **Antes**: H2 en memoria para dev
- **Ahora**: PostgreSQL en Docker para todos los entornos

### 3. Docker Compose
- **Antes**: Un solo archivo con todos los servicios
- **Ahora**: Archivo base + overlays por entorno

### 4. Dockerfiles
- **Antes**: Un solo Dockerfile genérico
- **Ahora**: Dockerfile.dev (debug) y Dockerfile.prod (optimizado)

### 5. API Gateway Routing
- **Antes**: Rutas hardcodeadas en application.yml principal
- **Ahora**: Rutas específicas por perfil en archivos separados

---

## 🚀 Cómo Usar

### Entorno Local (Desarrollo Diario)
```bash
# Terminal 1: Infraestructura
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminal 2, 3, 4: Microservicios con Gradle (hot reload)
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

### Entorno Dev (Testing)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Entorno Prod (Producción)
```bash
export POSTGRES_EVENTS_PASSWORD=xxx
export POSTGRES_ORDERS_PASSWORD=xxx
export KEYCLOAK_ADMIN_PASSWORD=xxx
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## ✅ Verificaciones Realizadas

- [x] Build exitoso con `./gradlew build -x test`
- [x] Todos los archivos de configuración creados
- [x] Todos los Dockerfiles creados
- [x] Documentación actualizada
- [x] .gitignore actualizado

---

## 📋 Próximos Pasos (Opcionales)

1. Agregar Spring Cloud Config para gestión centralizada de configuración
2. Implementar health checks con Spring Boot Actuator
3. Agregar tests de integración con Testcontainers
4. Configurar CI/CD para builds automáticos
5. Implementar monitoreo con Prometheus + Grafana

---

## 🔗 Referencias

- Spring Boot Profiles: https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config.profiles
- Docker Compose Override: https://docs.docker.com/compose/how-tos/multiple-compose-files/
- Spring Cloud Gateway: https://docs.spring.io/spring-cloud-gateway/reference.html
