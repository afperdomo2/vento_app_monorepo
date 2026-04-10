package com.vento.payment.controller;

import com.vento.common.config.KafkaTopics;
import com.vento.common.context.UserContext;
import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.kafka.PaymentFailedEvent;
import com.vento.common.dto.kafka.PaymentProcessedEvent;
import com.vento.common.dto.payment.PaymentRequest;
import com.vento.common.dto.payment.PaymentDto;
import com.vento.common.exception.PaymentFailedException;
import com.vento.payment.service.PaymentIdempotencyService;
import com.vento.payment.service.SimulatedPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "Endpoints para procesamiento de pagos simulados")
public class PaymentController {

    private final SimulatedPaymentService paymentService;
    private final PaymentIdempotencyService idempotencyService;
    private final KafkaTemplate<String, Object> paymentKafkaTemplate;
    private final Tracer tracer;

    @PostMapping("/process")
    @ResponseStatus(HttpStatus.OK)
    @Operation(
            summary = "Procesar pago simulado",
            description = "Simula el procesamiento de un pago con 80% de éxito, 20% de fallo y 2s de delay",
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pago procesado exitosamente"),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Solicitud inválida"),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "402", description = "Pago fallido (fondo insuficiente, tarjeta rechazada, etc.)")
            }
    )
    public ApiResponse<PaymentDto> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("📥 Recibida solicitud de pago para orden: {}", request.getOrderId());

        Span span = tracer.nextSpan().name("payment.process").start();
        span.tag("payment.orderId", request.getOrderId().toString());
        span.tag("payment.amount", request.getAmount().toString());

        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {

        // Extraer userId del contexto de usuario (propagado por API Gateway via header X-User-Id)
        UUID userId = UUID.fromString(UserContext.getUserId());

        // 1️⃣ Verificar si ya fue procesado (idempotencia)
        if (idempotencyService.isAlreadyProcessed(request.getOrderId())) {
            log.info("⚠️ Pago ya procesado para orden {}, retornando resultado existente",
                    request.getOrderId());
            return ApiResponse.success(idempotencyService.getCachedResult(request.getOrderId()));
        }

        try {
            PaymentDto result = paymentService.processPayment(request);

            // 2️⃣ Registrar pago exitoso (idempotencia)
            idempotencyService.recordPayment(request.getOrderId(), result, userId);

            // 3️⃣ Publicar evento de pago exitoso en Kafka
            PaymentProcessedEvent event = new PaymentProcessedEvent(
                    result.getOrderId(),
                    result.getTransactionId(),
                    result.getAmount()
            );
            paymentKafkaTemplate.send(KafkaTopics.PAYMENT_PROCESSED, result.getOrderId().toString(), event);
            log.info("📨 Evento PaymentProcessedEvent publicado para orden: {}", result.getOrderId());

            log.info("✅ Pago exitoso para orden: {}, transacción: {}", result.getOrderId(), result.getTransactionId());
            return ApiResponse.success(result);
        } catch (PaymentFailedException e) {
            // 4️⃣ Registrar pago fallido (idempotencia)
            idempotencyService.recordFailedPayment(request.getOrderId(), e.getMessage(), request.getAmount(), userId);

            // 5️⃣ Publicar evento de pago fallido en Kafka
            PaymentFailedEvent event = new PaymentFailedEvent(
                    request.getOrderId(),
                    e.getMessage()
            );
            paymentKafkaTemplate.send(KafkaTopics.PAYMENT_FAILED, request.getOrderId().toString(), event);
            log.info("📨 Evento PaymentFailedEvent publicado para orden: {}", request.getOrderId());

            log.warn("❌ Pago fallido para orden: {}, razón: {}", request.getOrderId(), e.getMessage());
            throw e;
        }
        } catch (Exception e) {
            span.error(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
