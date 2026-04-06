package com.vento.common.enums;

/**
 * Estados posibles de un ticket de evento.
 */
public enum TicketStatus {
    /**
     * Ticket activo, válido para ingreso al evento.
     */
    ACTIVE,

    /**
     * Ticket cancelado (orden cancelada o expirada).
     */
    CANCELLED,

    /**
     * Ticket ya fue escaneado/usado para ingreso.
     */
    USED
}
