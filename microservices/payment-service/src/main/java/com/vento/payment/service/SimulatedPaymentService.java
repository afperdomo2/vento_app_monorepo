package com.vento.payment.service;

import com.vento.common.dto.payment.PaymentRequest;
import com.vento.common.dto.payment.PaymentResult;
import com.vento.common.exception.PaymentFailedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
public class SimulatedPaymentService {

    private static final double SUCCESS_RATE = 0.8;
    private static final long PROCESSING_DELAY_MS = 2000;

    private static final String[] FAILURE_REASONS = {
            "Fondo insuficiente",
            "Tarjeta rechazada",
            "Límite de crédito excedido",
            "Transacción bloqueada por seguridad",
            "Error en la verificación 3D Secure"
    };

    /**
     * Simula el procesamiento de un pago con 80% de éxito y 20% de fallo.
     * Incluye un delay de 2 segundos para simular procesamiento real.
     *
     * @param request solicitud de pago
     * @return resultado del procesamiento
     */
    public PaymentResult processPayment(PaymentRequest request) {
        log.info("🔄 Procesando pago para orden: {}, monto: {}", request.getOrderId(), request.getAmount());

        try {
            Thread.sleep(PROCESSING_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("⚠️ Hilo interrumpido durante el procesamiento de pago para orden: {}", request.getOrderId());
        }

        boolean success = ThreadLocalRandom.current().nextDouble(1.0) < SUCCESS_RATE;

        if (success) {
            String transactionId = "txn_" + UUID.randomUUID().toString().substring(0, 12);
            log.info("✅ Pago exitoso para orden: {}, transacción: {}", request.getOrderId(), transactionId);

            return PaymentResult.builder()
                    .orderId(request.getOrderId())
                    .transactionId(transactionId)
                    .amount(request.getAmount())
                    .build();
        } else {
            String reason = FAILURE_REASONS[ThreadLocalRandom.current().nextInt(FAILURE_REASONS.length)];
            log.warn("❌ Pago fallido para orden: {}, razón: {}", request.getOrderId(), reason);

            throw new PaymentFailedException(request.getOrderId(), reason);
        }
    }
}
