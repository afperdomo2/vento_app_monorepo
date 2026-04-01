package com.vento.common.exception;

/**
 * Excepción lanzada cuando no hay tickets suficientes disponibles para completar una reserva.
 * El DECRBY atómico en Redis devolvió un valor negativo, indicando sobreventa.
 * Resulta en una respuesta HTTP 409 Conflict con estructura RFC 9457.
 */
public class InsufficientTicketsException extends RuntimeException {

    private final int available;
    private final int requested;

    public InsufficientTicketsException(int available, int requested) {
        super("No hay suficientes tickets disponibles. Disponibles: " + available +
              ", Solicitados: " + requested);
        this.available = available;
        this.requested = requested;
    }

    public int getAvailable() {
        return available;
    }

    public int getRequested() {
        return requested;
    }
}
