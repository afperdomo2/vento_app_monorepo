package com.vento.gateway.exception;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements ServerAccessDeniedHandler {

    private final ProblemDetailWriter writer;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException ex) {
        log.debug("🐞 Acceso denegado en {}: {}",
                exchange.getRequest().getPath(), ex.getMessage());

        return writer.write(
                exchange,
                HttpStatus.FORBIDDEN,
                "https://vento.app/errors/forbidden",
                "Acceso denegado",
                "No tienes permisos suficientes para acceder a este recurso"
        );
    }
}