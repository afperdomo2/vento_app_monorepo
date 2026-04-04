package com.vento.common.exception;

import lombok.Getter;

import java.util.UUID;

/**
 * Excepción lanzada cuando un pago simulado falla.
 * Resulta en una respuesta HTTP 402 con formato RFC 9457.
 */
@Getter
public class PaymentFailedException extends RuntimeException {

    private final UUID orderId;
    private final String failureReason;

    public PaymentFailedException(UUID orderId, String failureReason) {
        super("Payment failed for order " + orderId + ": " + failureReason);
        this.orderId = orderId;
        this.failureReason = failureReason;
    }
}
