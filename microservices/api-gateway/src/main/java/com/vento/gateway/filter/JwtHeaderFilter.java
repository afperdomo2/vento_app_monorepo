package com.vento.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Filtro global que extrae información del JWT autenticado y la propaga
 * a los microservicios downstream mediante headers HTTP.
 * <p>
 * Headers propagados:
 * - X-User-Id: El subject (sub) del JWT, que representa el ID del usuario
 * - X-User-Roles: Los roles del usuario separados por coma
 */
@Slf4j
@Component
public class JwtHeaderFilter implements GlobalFilter, Ordered {

    public static final String X_USER_ID_HEADER = "X-User-Id";
    public static final String X_USER_ROLES_HEADER = "X-User-Roles";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Obtener el contexto de seguridad de forma reactiva
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> {
                    if (context.getAuthentication() instanceof JwtAuthenticationToken authentication) {
                        Jwt jwt = authentication.getToken();

                        // Extraer el userId del claim 'sub'
                        String userId = jwt.getSubject();

                        // Extraer los roles del claim 'realm_access' o 'resource_access'
                        List<String> roles = extractRoles(jwt);
                        String rolesHeader = String.join(",", roles);

                        log.debug("Propagando headers - UserId: {}, Roles: {}", userId, rolesHeader);

                        // Agregar headers a la request hacia el microservicio
                        return exchange.mutate()
                                .request(exchange.getRequest().mutate()
                                        .header(X_USER_ID_HEADER, userId)
                                        .header(X_USER_ROLES_HEADER, rolesHeader)
                                        .build())
                                .build();
                    }
                    return exchange;
                })
                .defaultIfEmpty(exchange)
                .flatMap(modifiedExchange -> {
                    log.debug("No hay autenticación JWT, continuando sin headers de usuario");
                    return chain.filter(modifiedExchange);
                });
    }

    @Override
    public int getOrder() {
        // Ejecutar después de la autenticación pero antes del routing
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }

    /**
     * Extrae los roles del JWT.
     * Keycloak almacena los roles en el claim 'realm_access.roles'
     */
    @SuppressWarnings("unchecked")
    private List<String> extractRoles(Jwt jwt) {
        // Intentar obtener roles de realm_access (formato Keycloak)
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof java.util.Map) {
            Object roles = ((java.util.Map<?, ?>) realmAccess).get("roles");
            if (roles instanceof List) {
                return ((List<Object>) roles).stream()
                        .filter(Objects::nonNull)
                        .map(Object::toString)
                        .collect(Collectors.toList());
            }
        }

        // Fallback: intentar con resource_access para el cliente específico
        Object resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess instanceof Map<?, ?> resourceAccessMap) {
            Object clientAccess = resourceAccessMap.get("vento-api");
            if (clientAccess instanceof java.util.Map) {
                Object roles = ((java.util.Map<?, ?>) clientAccess).get("roles");
                if (roles instanceof List) {
                    return ((List<Object>) roles).stream()
                            .filter(Objects::nonNull)
                            .map(Object::toString)
                            .collect(Collectors.toList());
                }
            }
        }

        // Si no hay roles, retornar lista vacía
        return List.of();
    }
}
