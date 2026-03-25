# AGENTS.md - Vento App Monorepo

## Proyecto
Monorepo Spring Boot + Gradle con microservicios: `common/`, `api-gateway/` (8080), `event-service/` (8082), `order-service/` (8083). Stack: Java 25, Gradle 9.4, Spring Boot 3.5.0, Spring Cloud 2025.0.0.

## Comandos

### Build
```bash
./gradlew build                  # Compilar todo con tests
./gradlew build -x test          # Compilar sin tests
./gradlew :microservices:event-service:build   # Compilar modulo especifico
./gradlew clean                  # Limpiar artefactos
./gradlew dependencies           # Ver dependencias
```

### Tests
```bash
./gradlew test                           # Ejecutar todos los tests
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest.testMethod"
./gradlew :microservices:event-service:test --tests "*EventServiceTest*"
./gradlew :microservices:order-service:test --tests "*OrderServiceTest*"
```

### Ejecutar Servicios (Local)
```bash
# Infra: docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

## Convenciones de Codigo

### Estructura de Paquetes
```
com.vento.<modulo>/
├── controller/   # REST endpoints
├── service/      # Logica de negocio (interfaz + impl)
├── repository/   # Acceso a datos
├── model/        # Entidades JPA
├── dto/          # Data Transfer Objects
├── config/       # Configuracion
├── exception/    # Excepciones personalizadas
└── util/         # Utilidades
```

### Nombres
- Clases: PascalCase (`UserService`, `EventController`)
- Metodos: camelCase (`getUserById`, `saveEvent`)
- Constantes: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Paquetes: minusculas, singular (`com.vento.event`)
- Variables: camelCase (`userList`, `maxItems`)

### Imports
- Imports explicitos (sin `.*`)
- Orden: static > java > javax > org.springframework > terceros
- Agrupar con lineas en blanco entre grupos

### Tipos y Anotaciones
- Usar interfaces para servicios cuando aplique
- Preferir inmutables (`@Value`, records)
- Usar `Optional` para valores nulos
- `@Autowired` en constructores (no en campos)
- Usar `@Valid` en DTOs de entrada
- Usar `@Builder` para objetos complejos
- Usar `@Service`, `@Repository`, `@Controller` apropiadamente

### Manejo de Errores
- Excepciones personalizadas extienden `RuntimeException`
- `@ControllerAdvice` para manejo global de excepciones
- Codigos HTTP apropiados (4xx para cliente, 5xx para servidor)
- Usar `@Slf4j` para logging con Lombok
- Registrar en niveles apropiados (ERROR, WARN, INFO)

### Configuracion
- `application.yml` base + perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`)
- Usar `@ConfigurationProperties` para config tipada
- No hardcodear secrets (usar variables de entorno)
- Perfiles: local (dev rapido), dev (docker), prod (produccion)

### Pruebas
- Ubicacion: `src/test/java` reflejando estructura de `src/main`
- JUnit 5 (`org.junit.jupiter.api`)
- `@SpringBootTest` para tests de integracion
- `@MockBean` para dependencias externas
- Seguir patron AAA (Arrange, Act, Assert)
- Nombre: `*Test.java`, `*IntegrationTest.java`

### Documentacion y Logging
- Javadoc para APIs publicas y clases importantes
- Codigo autodocumentado con nombres significativos
- No loggear datos sensibles (contraseñas, tokens, PII)

## Agregar Nuevo Microservicio
1. Crear `microservices/<nombre>/` con estructura de paquetes
2. Crear `build.gradle` basado en servicios existentes
3. Agregar en `settings.gradle`: `include 'microservices:<nombre>'`
4. Agregar ruta en `api-gateway/src/main/resources/application.yml`
5. Crear `application.yml` con perfiles local/dev/prod

## Rutas Clave
- Raiz: `/home/felipe/www/vento_app_monorepo`
- Common: `common/`
- Event service: `microservices/event-service/`
- Order service: `microservices/order-service/`
- API Gateway: `microservices/api-gateway/`

## Puertos
- api-gateway: 8080
- event-service: 8082
- order-service: 8083
- postgres-events: 5432
- postgres-orders: 5433
- redis: 6379
- keycloak: 8180