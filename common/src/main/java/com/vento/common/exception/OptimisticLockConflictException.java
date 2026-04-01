package com.vento.common.exception;

/**
 * Excepción lanzada cuando se agotaron los reintentos ante un conflicto de
 * Optimistic Locking (ObjectOptimisticLockingFailureException).
 * Resulta en una respuesta HTTP 409 Conflict con estructura RFC 9457.
 */
public class OptimisticLockConflictException extends RuntimeException {

    public OptimisticLockConflictException(String message) {
        super(message);
    }
}
