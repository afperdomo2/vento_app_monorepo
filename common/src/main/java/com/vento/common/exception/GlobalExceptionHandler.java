package com.vento.common.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.vento.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Error de tipo incorrecto: "abc" para Integer, "texto" para BigDecimal, etc.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleJsonParseError(HttpMessageNotReadableException ex) {
        Throwable causa = ex.getCause();

        if (causa instanceof InvalidFormatException invalidFormat) {
            String campo = invalidFormat.getPath().isEmpty()
                    ? "desconocido"
                    : invalidFormat.getPath().getFirst().getFieldName();

            String mensajeCampo = "Se esperaba " + traducirTipo(invalidFormat.getTargetType());

            // Mismo formato que handleValidationErrors → errors como Map
            Map<String, String> errores = new LinkedHashMap<>();
            errores.put(campo, mensajeCampo);

            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Errores de validación en la solicitud", errores));
        }

        // JSON completamente malformado (llaves mal cerradas, etc.)
        Map<String, String> errores = new LinkedHashMap<>();
        errores.put("body", "El JSON enviado tiene un formato inválido");

        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Errores de validación en la solicitud", errores));
    }

    // Errores de Jakarta Validation (@NotNull, @NotBlank, @Min, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage())
        );

        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Errores de validación en la solicitud", errores));
    }

    private String traducirTipo(Class<?> tipo) {
        if (tipo == Integer.class || tipo == Long.class) return "un número entero";
        if (tipo == BigDecimal.class || tipo == Double.class) return "un número decimal";
        if (tipo == Boolean.class) return "un valor true o false";
        if (tipo == LocalDateTime.class) return "una fecha con formato yyyy-MM-ddTHH:mm:ss";
        return "un valor de tipo " + tipo.getSimpleName();
    }
}