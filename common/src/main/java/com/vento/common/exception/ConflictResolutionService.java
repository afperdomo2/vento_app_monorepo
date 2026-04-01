package com.vento.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.function.Supplier;

/**
 * Utilidad para ejecutar operaciones con retry automático ante conflictos de
 * Optimistic Locking (ObjectOptimisticLockingFailureException).
 * <p>
 * Estrategia: exponential backoff con jitter.
 * - Intento 1: sin delay
 * - Intento 2: 100ms base
 * - Intento 3: 200ms base
 * - Si todos fallan: lanza OptimisticLockConflictException (→ HTTP 409)
 * <p>
 * Uso:
 * <pre>
 *   ConflictResolutionService.executeWithRetry(() -> orderService.save(order), maxRetries);
 * </pre>
 */
@Slf4j
public final class ConflictResolutionService {

    private static final long BASE_DELAY_MS = 100;

    private ConflictResolutionService() {
        // Clase de utilidad estática
    }

    /**
     * Ejecuta la operación con retry ante conflictos de versión JPA.
     *
     * @param operation   operación a ejecutar (puede ser un Supplier<T>)
     * @param maxRetries  número máximo de reintentos (recomendado: 3)
     * @param <T>         tipo de retorno
     * @return resultado de la operación
     * @throws OptimisticLockConflictException si se agotaron todos los reintentos
     */
    public static <T> T executeWithRetry(Supplier<T> operation, int maxRetries) {
        int attempt = 0;
        while (attempt <= maxRetries) {
            try {
                return operation.get();
            } catch (ObjectOptimisticLockingFailureException e) {
                attempt++;
                if (attempt > maxRetries) {
                    log.error("Conflicto de versión JPA agotó {} reintentos. Lanzando excepción.", maxRetries);
                    throw new OptimisticLockConflictException(
                            "Conflicto de concurrencia persistente después de " + maxRetries + " intentos. " +
                            "Por favor intente nuevamente.");
                }
                long delay = BASE_DELAY_MS * (1L << (attempt - 1)); // exponential: 100, 200, 400...
                log.warn("Conflicto de versión JPA en intento {}. Reintentando en {}ms...", attempt, delay);
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new OptimisticLockConflictException("Operación interrumpida durante retry.");
                }
            }
        }
        // Nunca debería llegar aquí
        throw new OptimisticLockConflictException("Error inesperado en lógica de retry.");
    }

    /**
     * Sobrecarga sin valor de retorno (Runnable).
     *
     * @param operation  operación a ejecutar
     * @param maxRetries número máximo de reintentos
     */
    public static void executeWithRetry(Runnable operation, int maxRetries) {
        executeWithRetry(() -> {
            operation.run();
            return null;
        }, maxRetries);
    }
}
