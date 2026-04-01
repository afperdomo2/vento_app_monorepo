package com.vento.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("ConflictResolutionService Tests")
class ConflictResolutionServiceTest {

    @Test
    @DisplayName("Ejecuta operación exitosa sin retry")
    void shouldExecuteSuccessfully_WhenNoConflict() {
        // Given
        AtomicInteger callCount = new AtomicInteger(0);

        // When
        String result = ConflictResolutionService.executeWithRetry(() -> {
            callCount.incrementAndGet();
            return "success";
        }, 3);

        // Then
        assertThat(result).isEqualTo("success");
        assertThat(callCount.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("Hace retry y tiene éxito en el segundo intento")
    void shouldRetryAndSucceed_OnSecondAttempt() {
        // Given
        AtomicInteger callCount = new AtomicInteger(0);

        // When
        String result = ConflictResolutionService.executeWithRetry(() -> {
            int count = callCount.incrementAndGet();
            if (count == 1) {
                throw new ObjectOptimisticLockingFailureException(Object.class, "test");
            }
            return "success";
        }, 3);

        // Then
        assertThat(result).isEqualTo("success");
        assertThat(callCount.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("Lanza OptimisticLockConflictException cuando se agotan los reintentos")
    void shouldThrowOptimisticLockConflictException_WhenRetriesExhausted() {
        // Given
        AtomicInteger callCount = new AtomicInteger(0);

        // When & Then
        assertThatThrownBy(() ->
                ConflictResolutionService.executeWithRetry(() -> {
                    callCount.incrementAndGet();
                    throw new ObjectOptimisticLockingFailureException(Object.class, "test");
                }, 3)
        ).isInstanceOf(OptimisticLockConflictException.class)
         .hasMessageContaining("3");

        // Verifica que intentó 1 vez inicial + 3 reintentos = 4 llamadas
        assertThat(callCount.get()).isEqualTo(4);
    }

    @Test
    @DisplayName("Ejecuta Runnable sin valor de retorno")
    void shouldExecuteRunnable_WithoutReturnValue() {
        // Given
        AtomicInteger callCount = new AtomicInteger(0);

        // When
        ConflictResolutionService.executeWithRetry(callCount::incrementAndGet, 3);

        // Then
        assertThat(callCount.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("Respeta el límite de maxRetries = 0 (sin reintentos)")
    void shouldFailImmediately_WhenMaxRetriesIsZero() {
        // When & Then
        assertThatThrownBy(() ->
                ConflictResolutionService.executeWithRetry(() -> {
                    throw new ObjectOptimisticLockingFailureException(Object.class, "test");
                }, 0)
        ).isInstanceOf(OptimisticLockConflictException.class);
    }
}
