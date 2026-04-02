# AGENTS.md - Vento App Monorepo

## Proyecto

Monorepo Spring Boot + Gradle con microservicios: `common/`, `api-gateway/` (8080), `event-service/` (8082),
`order-service/` (8083), **frontend/** (Angular 21, 4200).
Stack: Java 25, Gradle 9.4, Spring Boot 3.5.0, Spring Cloud 2025.0.0, Angular 21.2, pnpm 10.

## Comandos

### Backend (Gradle)

```bash
./gradlew build                              # Compilar todo con tests
./gradlew build -x test                      # Compilar sin tests
./gradlew :microservices:event-service:build # Modulo especifico
./gradlew :common:build                      # Modulo common
./gradlew test                               # Todos los tests
./gradlew :microservices:event-service:test --tests "com.vento.event.SomeTest"       # Test class completa
./gradlew :microservices:event-service:test --tests "*EventServiceTest*"             # Test por nombre
./gradlew :microservices:event-service:test --tests "*EventServiceTest.testCreate*"  # Test individual
./gradlew test --info                        # Tests con output detallado
./gradlew :microservices:event-service:bootRun  # Ejecutar servicio
./gradlew clean                              # Limpiar builds
```

### Frontend (Angular 21)

```bash
cd frontend
pnpm install                                 # Instalar dependencias
pnpm start                                   # Dev server (localhost:4200)
pnpm build                                   # Build produccion
pnpm test                                    # ng test (Karma/Jasmine)
pnpm ng test -- --include='**/some.spec.ts'  # Test individual
pnpm ng generate component features/<f>/components/<name>  # Generar componente
pnpm exec prettier --write "src/**/*.{ts,html,scss}"       # Formatear codigo
```

### Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d   # Local
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d     # Dev
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d    # Prod
docker compose logs -f <servicio>
docker compose down
```

## Code Style

### Backend (Java/Spring Boot)

- **Paquetes**: `com.vento.<modulo>/` con `controller/`, `service/`, `repository/`, `model/`, `dto/`, `config/`, `exception/`
- **Nombres**: Clases PascalCase, metodos/variables camelCase, constantes UPPER_SNAKE_CASE, paquetes minusculas en singular
- **Imports**: Explicitos (nunca `.*`), orden: static > java > javax > org.springframework > otros > terceros
- **Inyeccion**: `@Autowired` en constructores (no en campos), preferir inyeccion por constructor
- **Anotaciones**: `@Service`, `@Repository`, `@RestController`, `@Transactional` en metodos que modifican datos
- **DTOs**: Inmutables con `@Value` o records, usar `@Builder` (Lombok) para objetos complejos
- **Entidades JPA**: Usar Lombok `@Data`, `@Entity`, `@Table`, campos con `@Id`, `@GeneratedValue`
- **Errores**: Excepciones extienden `RuntimeException`, usar `GlobalExceptionHandler` con `@ControllerAdvice`, codigos HTTP apropiados (400, 404, 409, 500)
- **Logging**: `@Slf4j` (Lombok), niveles: ERROR (excepciones), WARN (warnings esperados), INFO (operaciones importantes), DEBUG (detalles), nunca loggear datos sensibles
- **Config**: `application.yml` + perfiles (`-local.yml`, `-dev.yml`, `-prod.yml`), properties en kebab-case, secrets en variables de entorno
- **Validacion**: Usar `jakarta.validation` annotations (`@NotNull`, `@NotBlank`, `@Size`, etc.) en DTOs
- **API Docs**: `springdoc-openapi` con `@Operation`, `@ApiResponses` en controllers

### Backend Tests

- **Framework**: JUnit 5 (`@Test`, `@BeforeEach`, `@DisplayName`)
- **Mocks**: Mockito (`@Mock`, `@InjectMocks`, `when().thenReturn()`, `verify()`)
- **Integracion**: `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` segun corresponda
- **Patron**: AAA (Arrange, Act, Assert)
- **Nombres**: `*Test.java`, metodos descriptivos: `shouldReturnEventWhenExists()`
- **H2**: Usar H2 en memoria para tests de repositorio

### Frontend (Angular 21)

- **Arquitectura**: Feature-First con `core/` (global), `shared/` (reutilizable), `features/` (lazy-loaded)
- **Estado**: Signals (`signal()`, `computed()`, `effect()`) para estado reactivo, NO RxJS BehaviorSubject
- **Componentes**: Standalone (sin NgModules), usar `imports: []` en decorator
- **Inyeccion**: `inject()` function (no constructor injection)
- **HTTP**: Usar `httpResource()` o `inject(HttpClient)` con signals
- **Estilos**: SCSS, Tailwind CSS v4 con utility classes
- **Nomenclatura**: `*.page.ts` paginas principales, `*.component.ts` componentes hijos, `*.service.ts` servicios
- **Templates**: Inline o archivos `.html` separados segun complejidad, usar `@if/@for/@switch` nativo (no `*ngIf/*ngFor`)

### Frontend Formatting

- **Prettier**: printWidth 100, single quotes, parser angular para HTML
- **EditorConfig**: 2 spaces indent, UTF-8, final newline, trim trailing whitespace
- **TypeScript**: strict mode, noImplicitOverride, noImplicitReturns, noFallthroughCasesInSwitch, strictTemplates
- **Quotes**: Single quotes para strings y template literals

## Estructura Frontend

```
src/app/
├── core/                     # Global singleton services (auth, guards, interceptors)
├── shared/                   # Reusable components, directives, pipes, ui
└── features/                 # Business modules (lazy-loaded)
    └── <feature>/
        ├── components/       # Feature-specific components
        ├── services/         # Feature services
        └── <feature>.page.ts # Main page
```

## Puertos & Redis

- **Puertos**: api-gateway:8080, event-service:8082, order-service:8083, frontend:4200, postgres:5432/5433, redis:6379, keycloak:8180
- **Redis Keys**: `vento:event:{id}:available_tickets` (tickets), `vento:reservation:{orderId}` (5min TTL)
- **Order States**: `PENDING` → `CONFIRMED` | `CANCELLED` | `EXPIRED`

## Agregar Microservicio

1. Crear `microservices/<nombre>/` con estructura de paquetes estandar
2. Copiar `build.gradle` de event-service, ajustar dependencias
3. Agregar en `settings.gradle`: `include 'microservices:<nombre>'`
4. Configurar ruta en `api-gateway` application.yml
5. Crear `application.yml` con perfiles local/dev/prod
6. Agregar en `docker-compose.local.yml` si necesita infraestructura
