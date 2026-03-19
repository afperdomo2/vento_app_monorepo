# AGENTS.md - Vento App Monorepo

## Descripcion del Proyecto

Este es un monorepo Spring Boot + Gradle que contiene microservicios:

- **common/** - DTOs compartidos, utilerias, excepciones
  - `common/dto/event/` - DTOs de eventos
  - `common/dto/order/` - DTOs de pedidos
- **microservices/api-gateway/** - Spring Cloud Gateway (puerto 8080)
- **microservices/event-service/** - Servicio de gestion de eventos (puerto 8082)
- **microservices/order-service/** - Servicio de gestion de pedidos (puerto 8083)

Stack tecnologico: Java 25, Gradle 9.4, Spring Boot 3.5.0, Spring Cloud 2025.0.0

## Estructura de DTOs en Common

```
common/src/main/java/com/vento/common/dto/
├── ApiResponse.java              # Wrapper de respuesta generico
├── event/                        # DTOs de dominio de eventos
│   ├── EventDto.java
│   ├── CreateEventRequest.java
│   └── UpdateEventRequest.java
└── order/                        # DTOs de dominio de pedidos (futuro)
    └── ...
```

## Puertos de los Servicios

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| api-gateway | 8080 | Punto de entrada, routing, auth |
| event-service | 8082 | Gestion de eventos |
| order-service | 8083 | Gestion de pedidos |
| postgres-events | 5432 | Base de datos events_db |
| postgres-orders | 5433 | Base de datos orders_db |
| redis | 6379 | Cache y gestion de stock |
| keycloak | 8180 | Auth/SSO, Gestion de usuarios |

## Comandos de Build

### Compilar Todo

```bash
./gradlew build
```

### Compilar Sin Tests

```bash
./gradlew build -x test
```

### Compilar Un Solo Modulo

```bash
./gradlew :microservices:event-service:build
./gradlew :microservices:api-gateway:build
```

### Ejecutar Servicios (Desarrollo)

```bash
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

### Ejecutar Un Solo Test (Java/JUnit)

```bash
# Ejecutar clase de test especifica
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"

# Ejecutar metodo especifico
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest.testMethod"

# Ejecutar tests que coincidan con un patron
./gradlew :microservices:event-service:test --tests "*EventServiceTest*"
```

### Otros Comandos

```bash
./gradlew clean                              # Limpiar artefactos de build
./gradlew dependencies                       # Mostrar dependencias
./gradlew :microservices:event-service:dependencies
```

### Docker

```bash
docker compose build
docker compose up -d
docker compose down
```

## Guías de Estilo de Codigo

### General

- Usar convenciones estandar de Java/Kotlin
- Seguir mejores practicas de Spring Boot
- Mantener las clases enfocadas en una unica responsabilidad

### Convenciones de Nombres

- **Clases**: PascalCase (ej., `UserService`, `ApiGatewayApplication`)
- **Metodos**: camelCase (ej., `getUserById`, `saveUser`)
- **Constantes**: UPPER_SNAKE_CASE (ej., `MAX_RETRY_COUNT`)
- **Paquetes**: minusculas, singular (ej., `com.vento.user`, `com.vento.gateway`)

### Estructura de Paquetes

```
com.vento.<modulo>/
├── controller/    # Controladores REST
├── service/       # Logica de negocio
├── repository/    # Acceso a datos
├── model/         # Modelos de dominio
├── dto/           # Objetos de transferencia de datos
├── config/        # Clases de configuracion
├── exception/     # Excepciones personalizadas
└── util/          # Clases de utilidad
```

### Imports

- Usar imports explicitos (sin comodines `.*`)
- Orden: static, java, javax, org.springframework, terceros
- Agrupar por categoria con lineas en blanco entre grupos

### Tipos

- Usar interfaces para servicios donde sea apropiado
- Preferir objetos inmutables (usar `@Value` de Lombok o record)
- Usar `Optional` para tipos que pueden ser nulos
- Evitar tipos crudos con genericos

### Anotaciones

- Usar `@Service`, `@Repository`, `@Controller` apropiadamente
- Usar `@Autowired` en constructores (preferido sobre inyeccion de campos)
- Usar `@Valid` en DTOs en metodos de controlador
- Usar `@Builder` para construccion de objetos complejos

### Manejo de Errores

- Usar excepciones personalizadas extendiendo `RuntimeException`
- Crear manejador global de excepciones con `@ControllerAdvice`
- Retornar codigos HTTP apropiados (4xx para errores de cliente, 5xx para errores de servidor)
- Registrar errores apropiadamente (usar `@Slf4j` de Lombok)

### Logging

- Usar `@Slf4j` para logging
- Registrar en niveles apropiados (ERROR para fallos, INFO para eventos importantes)
- No registrar datos sensibles (contraseñas, tokens, PII)

### Configuracion

- Usar `application.yml` para configuracion
- Externalizar config con `spring.config.import` para archivos por entorno
- Usar `@ConfigurationProperties` para configuracion tipada
- Evitar valores hardcodeados

### Pruebas

- Colocar tests en `src/test/java` reflejando la estructura de src/main
- Usar JUnit 5 (Jupiter) con assertions de `org.junit.jupiter.api`
- Usar `@SpringBootTest` para tests de integracion
- Mockear dependencias externas con `@MockBean`
- Seguir patron AAA (Arrange, Act, Assert)

### Documentacion

- Agregar Javadoc para APIs publicas y clases importantes
- Usar nombres de metodos y variables significativos (codigo autodocumentado)
- Mantener comentarios actualizados con los cambios del codigo

### Buenas Practicas de Git

- Hacer commits atomicos
- Escribir mensajes de commit significativos
- Crear ramas de feature para nueva funcionalidad

## Agregar un Nuevo Microservicio

1. Crear carpeta en `microservices/<nombre-servicio>/`
2. Crear `build.gradle` basado en los servicios existentes
3. Crear estructura de paquetes Java bajo `src/main/java/com/vento/<modulo>/`
4. Agregar en `settings.gradle`: `include 'microservices:<nombre-servicio>'`
5. Agregar ruta en `api-gateway/src/main/resources/application.yml`

## Rutas Importantes

- Raiz: `/home/felipe/www/vento_app_monorepo`
- Modulo comun: `common/`
- Event service: `microservices/event-service/`
- Order service: `microservices/order-service/`
- API Gateway: `microservices/api-gateway/`
