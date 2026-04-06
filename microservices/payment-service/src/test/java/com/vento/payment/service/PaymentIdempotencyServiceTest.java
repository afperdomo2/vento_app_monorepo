package com.vento.payment.service;

import com.vento.common.context.UserContext;
import com.vento.common.dto.payment.PaymentRequest;
import com.vento.common.dto.payment.PaymentResult;
import com.vento.common.exception.PaymentFailedException;
import com.vento.payment.model.PaymentStatus;
import com.vento.payment.model.ProcessedPayment;
import com.vento.payment.repository.ProcessedPaymentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentIdempotencyService Tests")
class PaymentIdempotencyServiceTest {

    @Mock
    private ProcessedPaymentRepository processedPaymentRepository;

    @InjectMocks
    private PaymentIdempotencyService idempotencyService;

    private UUID orderId;
    private UUID userId;
    private BigDecimal amount;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        userId = UUID.randomUUID();
        amount = new BigDecimal("150.00");
        
        // Set UserContext for tests
        UserContext.setUserId(userId.toString());
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    @DisplayName("shouldReturnFalseWhenPaymentNotProcessed")
    void shouldReturnFalseWhenPaymentNotProcessed() {
        // Given
        when(processedPaymentRepository.existsByOrderId(orderId)).thenReturn(false);

        // When
        boolean result = idempotencyService.isAlreadyProcessed(orderId);

        // Then
        assertThat(result).isFalse();
        verify(processedPaymentRepository).existsByOrderId(orderId);
    }

    @Test
    @DisplayName("shouldReturnTrueWhenPaymentAlreadyProcessed")
    void shouldReturnTrueWhenPaymentAlreadyProcessed() {
        // Given
        when(processedPaymentRepository.existsByOrderId(orderId)).thenReturn(true);

        // When
        boolean result = idempotencyService.isAlreadyProcessed(orderId);

        // Then
        assertThat(result).isTrue();
        verify(processedPaymentRepository).existsByOrderId(orderId);
    }

    @Test
    @DisplayName("shouldGetCachedResultWhenPaymentExists")
    void shouldGetCachedResultWhenPaymentExists() {
        // Given
        String transactionId = "txn_" + UUID.randomUUID().toString().substring(0, 12);
        ProcessedPayment payment = ProcessedPayment.builder()
                .orderId(orderId)
                .userId(userId)
                .amount(amount)
                .currency("USD")
                .status(PaymentStatus.COMPLETED)
                .transactionId(transactionId)
                .build();

        when(processedPaymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

        // When
        PaymentResult result = idempotencyService.getCachedResult(orderId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getOrderId()).isEqualTo(orderId);
        assertThat(result.getTransactionId()).isEqualTo(transactionId);
        assertThat(result.getAmount()).isEqualTo(amount);
        verify(processedPaymentRepository).findByOrderId(orderId);
    }

    @Test
    @DisplayName("shouldThrowExceptionWhenCachedResultNotFound")
    void shouldThrowExceptionWhenCachedResultNotFound() {
        // Given
        when(processedPaymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> idempotencyService.getCachedResult(orderId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Pago no encontrado para orden: " + orderId);
    }

    @Test
    @DisplayName("shouldRecordSuccessfulPayment")
    void shouldRecordSuccessfulPayment() {
        // Given
        String transactionId = "txn_" + UUID.randomUUID().toString().substring(0, 12);
        PaymentResult result = PaymentResult.builder()
                .orderId(orderId)
                .transactionId(transactionId)
                .amount(amount)
                .build();

        // When
        idempotencyService.recordPayment(orderId, result, userId);

        // Then
        verify(processedPaymentRepository).save(argThat(payment ->
                payment.getOrderId().equals(orderId) &&
                payment.getUserId().equals(userId) &&
                payment.getAmount().equals(amount) &&
                payment.getStatus() == PaymentStatus.COMPLETED &&
                payment.getTransactionId().equals(result.getTransactionId())
        ));
    }

    @Test
    @DisplayName("shouldRecordFailedPayment")
    void shouldRecordFailedPayment() {
        // Given
        String failureReason = "Insufficient funds";

        // When
        idempotencyService.recordFailedPayment(orderId, failureReason, amount, userId);

        // Then
        verify(processedPaymentRepository).save(argThat(payment ->
                payment.getOrderId().equals(orderId) &&
                payment.getUserId().equals(userId) &&
                payment.getAmount().equals(amount) &&
                payment.getStatus() == PaymentStatus.FAILED &&
                payment.getFailureReason().equals(failureReason)
        ));
    }
}
