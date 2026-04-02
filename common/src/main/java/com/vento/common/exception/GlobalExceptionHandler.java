package com.vento.common.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para microservicios Spring MVC.
 * Produce respuestas con estructura RFC 9457 (application/problem+json).
 *
 * Activado automáticamente vía ExceptionHandlerAutoConfiguration solo en
 * módulos Spring MVC (SERVLET), ignorado en WebFlux (api-gateway).
 *
 * Excluye endpoints de SpringDoc (/v3/api-docs, /swagger-ui) para permitir
 * que la documentación OpenAPI funcione correctamente.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final String BASE_TYPE = "https://vento.app/errors/";
    private static final String SPRINGDOC_PACKAGE = "org.springdoc";

    private final String serviceName;

    /**
     * Verifica si la excepción proviene de SpringDoc y debe ser ignorada.
     */
    private boolean isSpringDocException(Throwable ex) {
        if (ex == null) return false;
        
        // Check current exception
        String className = ex.getClass().getName();
        if (className.startsWith("org.springdoc") 
                || className.contains("springdoc")
                || className.startsWith("io.swagger")) {
            return true;
        }
        
        // Check cause chain for SpringDoc exceptions
        Throwable cause = ex.getCause();
        while (cause != null && cause != ex) {
            String causeClassName = cause.getClass().getName();
            if (causeClassName.startsWith("org.springdoc") 
                    || causeClassName.contains("springdoc")
                    || causeClassName.startsWith("io.swagger")) {
                return true;
            }
            cause = cause.getCause();
        }
        
        return false;
    }

    /**
     * Verifica si el request es para un endpoint de SpringDoc.
     */
    private boolean isSpringDocEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.contains("/v3/api-docs")
                || path.contains("/swagger-ui")
                || path.contains("/swagger-resources")
                || path.contains("/webjars");
    }

    // -------------------------------------------------------------------------
    // 400 — Validación DTO (@Valid, @NotNull, @NotBlank, etc.)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));

        int count = errors.size();
        String detail = "Se encontr" + (count == 1 ? "ó 1 error" : "aron " + count + " errores")
                + " de validación en la solicitud";

        ProblemDetail problem = buildProblem(
                HttpStatus.BAD_REQUEST,
                "validation-error",
                "Errores de validación",
                detail,
                request.getRequestURI()
        );
        problem.setProperty("errors", errors);

        log.warn("⚠️ [{}] Validación fallida en {}: {}", serviceName, request.getRequestURI(), errors);
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 — JSON malformado o tipo de campo incorrecto
    // -------------------------------------------------------------------------

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleJsonParseError(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();
        Throwable causa = ex.getCause();

        if (causa instanceof InvalidFormatException invalidFormat) {
            String campo = invalidFormat.getPath().isEmpty()
                    ? "desconocido"
                    : invalidFormat.getPath().getFirst().getFieldName();
            errors.put(campo, "Se esperaba " + traducirTipo(invalidFormat.getTargetType()));
        } else {
            errors.put("body", "El JSON enviado tiene un formato inválido");
        }

        ProblemDetail problem = buildProblem(
                HttpStatus.BAD_REQUEST,
                "validation-error",
                "Errores de validación",
                "Se encontró 1 error de validación en la solicitud",
                request.getRequestURI()
        );
        problem.setProperty("errors", errors);

        log.warn("⚠️ [{}] JSON inválido en {}: {}", serviceName, request.getRequestURI(), errors);
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 404 — Recurso no encontrado
    // -------------------------------------------------------------------------

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.NOT_FOUND,
                "not-found",
                "Recurso no encontrado",
                ex.getMessage(),
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] Recurso no encontrado en {}: {}", serviceName, request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 409 — Conflicto de Optimistic Locking agotado (ConflictResolutionService)
    // -------------------------------------------------------------------------

    @ExceptionHandler(OptimisticLockConflictException.class)
    public ResponseEntity<ProblemDetail> handleOptimisticLockConflict(
            OptimisticLockConflictException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.CONFLICT,
                "optimistic-lock-conflict",
                "Conflicto de concurrencia",
                ex.getMessage(),
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] Conflicto de Optimistic Locking agotado en {}: {}", serviceName, request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 409 — ObjectOptimisticLockingFailureException directa (sin retry)
    // -------------------------------------------------------------------------

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> handleJpaOptimisticLock(
            ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.CONFLICT,
                "optimistic-lock-conflict",
                "Conflicto de concurrencia",
                "La entidad fue modificada por otro proceso. Por favor intente nuevamente.",
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] ObjectOptimisticLockingFailureException en {}: {}", serviceName, request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 409 — Tickets insuficientes (sobreventa)
    // -------------------------------------------------------------------------

    @ExceptionHandler(InsufficientTicketsException.class)
    public ResponseEntity<ProblemDetail> handleInsufficientTickets(
            InsufficientTicketsException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.CONFLICT,
                "insufficient-tickets",
                "Tickets insuficientes",
                ex.getMessage(),
                request.getRequestURI()
        );
        problem.setProperty("available", ex.getAvailable());
        problem.setProperty("requested", ex.getRequested());

        log.warn("⚠️ [{}] Tickets insuficientes en {}: disponibles={}, solicitados={}",
                serviceName, request.getRequestURI(), ex.getAvailable(), ex.getRequested());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 409 — Conflicto de negocio
    // -------------------------------------------------------------------------

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(
            BusinessException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.CONFLICT,
                "conflict",
                "Conflicto de negocio",
                ex.getMessage(),
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] Conflicto de negocio en {}: {}", serviceName, request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 403 — Acceso denegado (usuario no tiene permiso sobre el recurso)
    // -------------------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.FORBIDDEN,
                "access-denied",
                "Acceso denegado",
                ex.getMessage(),
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] Acceso denegado en {}: {}", serviceName, request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 400 — Header requerido faltante (X-User-Id)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ProblemDetail> handleMissingHeader(
            MissingRequestHeaderException ex, HttpServletRequest request) {

        String headerName = ex.getHeaderName();
        String detail = "El header '%s' es requerido. Esta solicitud debe venir del API Gateway o debes especificarlo manualmente.".formatted(headerName);

        ProblemDetail problem = buildProblem(
                HttpStatus.BAD_REQUEST,
                "missing-header",
                "Header requerido faltante",
                detail,
                request.getRequestURI()
        );

        log.warn("⚠️ [{}] Header requerido faltante en {}: {}", serviceName, request.getRequestURI(), headerName);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 502 — Fallo en llamada a servicio externo
    // -------------------------------------------------------------------------

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ProblemDetail> handleExternalService(
            ExternalServiceException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.BAD_GATEWAY,
                "bad-gateway",
                "Error de servicio externo",
                ex.getMessage(),
                request.getRequestURI()
        );

        log.error("❌ [{}] Error de servicio externo en {}: {}", serviceName, request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 503 — Error de conexión con Redis
    // -------------------------------------------------------------------------

    @ExceptionHandler(RedisConnectionFailureException.class)
    public ResponseEntity<ProblemDetail> handleRedisConnectionFailure(
            RedisConnectionFailureException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "redis-connection-error",
                "Error de conexión con Redis",
                "No se pudo conectar al servicio de caché. El sistema está intentando reconectar.",
                request.getRequestURI()
        );

        log.error("❌ [{}] Redis Connection Failure en {}: {}", serviceName, request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 503 — Error de conexión con Base de Datos
    // -------------------------------------------------------------------------

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ProblemDetail> handleDatabaseConnectionFailure(
            DataAccessException ex, HttpServletRequest request) {

        ProblemDetail problem = buildProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "database-connection-error",
                "Error de conexión con la base de datos",
                "No se pudo conectar a la base de datos. El sistema está intentando reconectar.",
                request.getRequestURI()
        );

        log.error("❌ [{}] Database Connection Failure en {}: {}", serviceName, request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // 500 — Error inesperado (captura cualquier excepción no manejada)
    // -------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(
            Exception ex, HttpServletRequest request) throws Exception {

        // Excepciones de SpringDoc o endpoints de documentación deben propagarse
        // para que Swagger funcione correctamente
        if (isSpringDocException(ex) || isSpringDocEndpoint(request)) {
            throw ex;
        }

        ProblemDetail problem = buildProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "internal-error",
                "Error interno del servidor",
                "Ocurrió un error inesperado. Por favor intente más tarde",
                request.getRequestURI()
        );

        log.error("❌ [{}] Error inesperado en {}: {}", serviceName, request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ProblemDetail buildProblem(HttpStatus status, String typeSlug,
            String title, String detail, String instance) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(BASE_TYPE + typeSlug));
        problem.setTitle(title);
        problem.setInstance(URI.create(instance));
        problem.setProperty("service", serviceName);
        problem.setProperty("timestamp", LocalDateTime.now().truncatedTo(ChronoUnit.MILLIS).toString());
        return problem;
    }

    private String traducirTipo(Class<?> tipo) {
        if (tipo == Integer.class || tipo == Long.class) return "un número entero";
        if (tipo == BigDecimal.class || tipo == Double.class) return "un número decimal";
        if (tipo == Boolean.class) return "un valor true o false";
        if (tipo == LocalDateTime.class) return "una fecha con formato yyyy-MM-ddTHH:mm:ss";
        return "un valor de tipo " + tipo.getSimpleName();
    }
}
