package com.vento.common.exception;

/**
 * Excepción lanzada cuando falla una llamada a un servicio externo o microservicio.
 * Resulta en una respuesta HTTP 502 Bad Gateway con estructura RFC 9457.
 */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }

    public ExternalServiceException(String message) {
        super(message);
    }
}
