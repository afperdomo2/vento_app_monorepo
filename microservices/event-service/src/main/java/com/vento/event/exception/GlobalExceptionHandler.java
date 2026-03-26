package com.vento.event.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Captura errores de deserialización JSON (tipo incorrecto, formato inválido)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleJsonParseError(HttpMessageNotReadableException ex) {
        String mensaje = "El JSON enviado tiene un formato inválido";

        // Intenta dar un mensaje más específico según el tipo de error
        Throwable causa = ex.getCause();
        if (causa instanceof InvalidFormatException invalidFormat) {
            String campo = invalidFormat.getPath().isEmpty()
                    ? "desconocido"
                    : invalidFormat.getPath().getFirst().getFieldName();
            String tipoEsperado = invalidFormat.getTargetType().getSimpleName();
            mensaje = "El campo '" + campo + "' tiene un valor inválido. Se esperaba un valor de tipo " + tipoEsperado;
        }

        return Map.of(
                "status", 400,
                "error", "Solicitud inválida",
                "message", mensaje,
                "timestamp", LocalDateTime.now()
        );
    }

    // Captura errores de Jakarta Validation (@NotNull, @NotBlank, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage())
        );

        return Map.of(
                "status", 400,
                "error", "Errores de validación",
                "messages", errores,
                "timestamp", LocalDateTime.now()
        );
    }
}