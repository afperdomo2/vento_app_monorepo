package com.vento.common.exception;

/**
 * Excepción lanzada cuando se viola una regla de negocio.
 * Resulta en una respuesta HTTP 409 Conflict con estructura RFC 9457.
 *
 * Ejemplos: tickets insuficientes, cancelar un pedido en estado no cancelable.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
