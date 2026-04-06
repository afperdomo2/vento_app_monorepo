package com.vento.payment.service;

import com.vento.common.dto.payment.PaymentResult;
import com.vento.payment.model.PaymentStatus;
import com.vento.payment.model.ProcessedPayment;
import com.vento.payment.repository.ProcessedPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Servicio para garantizar idempotencia en el procesamiento de pagos.
 * <p>
 * Evita que el mismo pago se procese múltiples veces cuando se reciben
 * requests duplicados (reintentos, timeouts, etc.).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentIdempotencyService {

    private final ProcessedPaymentRepository processedPaymentRepository;

    /**
     * Verificar si un pago ya fue procesado para una orden.
     *
     * @param orderId ID de la orden
     * @return true si ya fue procesado, false en caso contrario
     */
    public boolean isAlreadyProcessed(UUID orderId) {
        return processedPaymentRepository.existsByOrderId(orderId);
    }

    /**
     * Obtener el resultado cacheado de un pago ya procesado.
     *
     * @param orderId ID de la orden
     * @return resultado del pago
     * @throws IllegalStateException si el pago no existe
     */
    @Transactional(readOnly = true)
    public PaymentResult getCachedResult(UUID orderId) {
        ProcessedPayment payment = processedPaymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalStateException("Pago no encontrado para orden: " + orderId));

        return PaymentResult.builder()
                .orderId(payment.getOrderId())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .build();
    }

    /**
     * Registrar un pago exitoso en la base de datos.
     *
     * @param orderId     ID de la orden
     * @param result      resultado del pago
     * @param userId      ID del usuario
     */
    @Transactional
    public void recordPayment(UUID orderId, PaymentResult result, UUID userId) {
        ProcessedPayment payment = ProcessedPayment.builder()
                .orderId(orderId)
                .userId(userId)
                .amount(result.getAmount())
                .currency("USD")
                .status(PaymentStatus.COMPLETED)
                .transactionId(result.getTransactionId())
                .build();

        processedPaymentRepository.save(payment);
        log.info("✅ Pago registrado en processed_payments: orderId={}, transactionId={}",
                orderId, result.getTransactionId());
    }

    /**
     * Registrar un pago fallido en la base de datos.
     *
     * @param orderId     ID de la orden
     * @param reason      razón del fallo
     * @param amount      monto del intento de pago
     * @param userId      ID del usuario
     */
    @Transactional
    public void recordFailedPayment(UUID orderId, String reason, BigDecimal amount, UUID userId) {
        ProcessedPayment payment = ProcessedPayment.builder()
                .orderId(orderId)
                .userId(userId)
                .amount(amount)
                .currency("USD")
                .status(PaymentStatus.FAILED)
                .failureReason(reason)
                .build();

        processedPaymentRepository.save(payment);
        log.info("✅ Pago fallido registrado en processed_payments: orderId={}, reason={}",
                orderId, reason);
    }
}
