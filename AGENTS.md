# AGENTS.md - Vento App Monorepo

## Proyecto

Monorepo Spring Boot + Gradle con microservicios: `common/`, `api-gateway/` (8080), `event-service/` (8082),
`order-service/` (8083), **frontend/** (Angular 21, 4200).
Stack: Java 25, Gradle 9.4, Spring Boot 3.5.0, Spring Cloud 2025.0.0, Angular 21.2, pnpm 10.

## Comandos

### Build

```bash
./gradlew build                  # Compilar todo con tests
./gradlew build -x test          # Compilar sin tests
./gradlew :microservices:event-service:build   # Compilar modulo especifico
./gradlew clean                  # Limpiar artefactos
./gradlew dependencies           # Ver dependencias
./gradlew dependencies --configuration runtimeClasspath  # Ver tree de dependencias
```

### Tests

```bash
./gradlew test                           # Ejecutar todos los tests
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest.testMethod"
./gradlew :microservices:event-service:test --tests "*EventServiceTest*"
./gradlew :microservices:order-service:test --tests "*OrderServiceTest*"
./gradlew test --info                    # Tests con output detallado
./gradlew test --continue                # No parar en primer fallo
```

### Ejecutar Servicios (Local)

```bash
# Infra: docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
./gradlew :microservices:event-service:bootRun
./gradlew :microservices:order-service:bootRun
./gradlew :microservices:api-gateway:bootRun
```

### Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose logs -f <servicio>
docker compose exec <servicio> sh
```

### Frontend (Angular 21)

```bash
cd frontend
pnpm install           # Instalar dependencias
pnpm start             # Servidor desarrollo (localhost:4200)
pnpm build             # Build producción
pnpm watch             # Build en modo watch
pnpm test              # Ejecutar tests
pnpm ng <comando>      # Angular CLI commands
```

**Generar componentes/servicios:**

```bash
pnpm ng generate component components/my-component
pnpm ng generate service services/my-service
pnpm ng generate interceptor interceptors/my-interceptor
pnpm ng generate guard guards/my-guard
```

## Convenciones de Codigo

### Backend (Java/Spring)

### Estructura de Paquetes

```
com.vento.<modulo>/
├── controller/   # REST endpoints (usar @RestController)
├── service/      # Logica de negocio (interfaz + impl)
├── repository/   # Acceso a datos (usar @Repository)
├── model/        # Entidades JPA
├── dto/          # Data Transfer Objects
├── config/       # Configuracion (@Configuration, @ConfigurationProperties)
├── exception/    # Excepciones personalizadas
├── util/         # Utilidades
└── mapper/       # Mappers (MapStruct o manually)
```

### Nombres

- Clases: PascalCase (`UserService`, `EventController`)
- Interfaces: Prefijo con I o sufijo `Service`, `Repository` (`IUserService`, `UserRepository`)
- Metodos: camelCase (`getUserById`, `saveEvent`)
- Constantes: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Paquetes: minusculas, singular (`com.vento.event`)
- Variables: camelCase (`userList`, `maxItems`)
- Archivos de test: `*Test.java`, `*IntegrationTest.java`

### Imports

- Imports explicitos (nunca `.*`)
- Orden: static > java > javax > org.springframework > otros org > com > terceros
- Agrupar con lineas en blanco entre grupos
- No usar wildcard imports

### Tipos y Anotaciones

- Usar interfaces para servicios siempre que sea posible
- Preferir inmutables (`@Value`, records de Java 17+) para DTOs
- Usar `Optional` para valores que pueden ser nulos
- `@Autowired` en constructores (nunca en campos)
- Usar `@Valid` en DTOs de entrada en controladores
- Usar `@Builder` (Lombok) para objetos complejos
- Usar `@Service`, `@Repository`, `@Controller`, `@RestController` apropiadamente
- Usar `@Transactional` en metodos de servicio que modifican datos

### Manejo de Errores

- Excepciones personalizadas extienden `RuntimeException`
- Usar `BusinessException` o similar para errores de dominio
- Usar `GlobalExceptionHandler` con `@ControllerAdvice` para manejo global
- Codigos HTTP apropiados (4xx para errores de cliente, 5xx para servidor)
- Usar `@Slf4j` (Lombok) para logging
- Registrar en niveles apropiados: ERROR (excepciones), WARN (warnings), INFO (informacion)
- No loggear datos sensibles (contraseñas, tokens, PII)

### Configuracion

- `application.yml` base + perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`)
- Usar `@ConfigurationProperties` para configuration tipada
- No hardcodear secrets (usar variables de entorno)
- Perfiles: local (dev rapido), dev (docker), prod (produccion)
- Properties: usar kebab-case (`my-property` no `myProperty`)

### Pruebas

- Ubicacion: `src/test/java` reflejando estructura de `src/main`
- JUnit 5 (`org.junit.jupiter.api`)
- Mockito para unit tests
- `@SpringBootTest` para tests de integracion
- `@MockBean` para dependencias externas
- `@DataJpaTest` para repositorios
- Seguir patron AAA (Arrange, Act, Assert)
- Nombre: `*Test.java` para unit, `*IntegrationTest.java` para integracion

### Documentacion

- Javadoc para APIs publicas y clases importantes
- Codigo autodocumentado con nombres significativos
- No documentar lo obvio

### Frontend (Angular)

#### Estructura de Carpetas

```
src/app/
├── components/   # Componentes standalone
├── services/     # Servicios (@injectable)
├── models/       # Interfaces/Types
├── config/       # Configuración de la app
└── guards/       # Guards de rutas
```

#### Convenciones

- Usar **Signals** para estado reactivo (`signal()`, `computed()`, `effect()`)
- Componentes **standalone** (sin NgModules, usar `imports: []` en el decorator)
- **SCSS** para estilos
- Inmutabilidad preferida (usar `readonly` en señales cuando sea posible)
- Inyección de dependencias con `inject()` (no constructor injection)

#### Ejemplo Componente con Signals

```typescript
import { Component, signal, inject } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `<p>{{ count() }}</p>`
})
export class ExampleComponent {
  private service = inject(MyService);
  count = signal(0);
}
```

## Agregar Nuevo Microservicio

1. Crear `microservices/<nombre>/` con estructura de paquetes
2. Crear `build.gradle` basado en servicios existentes (copiar de event-service)
3. Agregar en `settings.gradle`: `include 'microservices:<nombre>'`
4. Agregar dependencia en `api-gateway/build.gradle`
5. Agregar ruta en `api-gateway/src/main/resources/application.yml`
6. Crear `application.yml` con perfiles local/dev/prod en resources

## Rutas Clave

- Raiz: `/home/felipe/www/vento_app_monorepo`
- Common: `common/`
- Event service: `microservices/event-service/`
- Order service: `microservices/order-service/`
- API Gateway: `microservices/api-gateway/`
- Frontend: `frontend/`
- Docker compose: `docker-compose.yml`, `docker-compose.local.yml`

## Puertos

- api-gateway: 8080
- event-service: 8082
- order-service: 8083
- frontend: 4200
- postgres-events: 5432
- postgres-orders: 5433
- redis: 6379
- keycloak: 8180