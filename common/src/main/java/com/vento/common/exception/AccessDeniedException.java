package com.vento.common.exception;

/**
 * Excepción lanzada cuando un usuario autenticado intenta acceder
 * a un recurso que no le pertenece o no tiene permisos.
 * Resulta en una respuesta HTTP 403 Forbidden.
 *
 * Ejemplos: ver orden de otro usuario, cancelar orden ajena.
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }
}
