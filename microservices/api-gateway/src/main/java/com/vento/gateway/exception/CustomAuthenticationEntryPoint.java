package com.vento.gateway.exception;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final ProblemDetailWriter writer;

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        log.debug("🐞 Error de autenticación en {}: {}",
                exchange.getRequest().getPath(), ex.getMessage());

        return writer.write(
                exchange,
                HttpStatus.UNAUTHORIZED,
                "https://vento.app/errors/unauthorized",
                "No autenticado",
                "Se requiere autenticación para acceder a este recurso"
        );
    }
}