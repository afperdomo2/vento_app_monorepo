package com.vento.common.exception;

/**
 * Excepción lanzada cuando un recurso no es encontrado por su identificador.
 * Resulta en una respuesta HTTP 404 con estructura RFC 9457.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " con ID '" + id + "' no fue encontrado");
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
