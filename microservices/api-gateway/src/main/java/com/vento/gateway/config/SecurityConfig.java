package com.vento.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Configuración de seguridad del API Gateway.
 * <p>
 * - Válida tokens JWT usando Keycloak como proveedor de identidad
 * - Define rutas públicas vs protegidas
 * - Extrae roles de Keycloak (realm_access.roles) y los mapea a autoridades Spring Security
 * - El JWT validado es disponible para filtros downstream (JwtHeaderFilter)
 */
@Configuration
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        http
                .authorizeExchange(exchanges -> exchanges
                        // Rutas públicas
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/swagger-ui/**").permitAll()
                        .pathMatchers("/v3/api-docs/**").permitAll()
                        .pathMatchers("/auth/**").permitAll()
                        // Rutas protegidas por rol
                        .pathMatchers("/api/events/**").hasRole("USER")
                        .pathMatchers("/api/orders/**").hasRole("USER")
                        // Todas las demás rutas requieren autenticación
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwtSpec -> jwtSpec
                                .jwtDecoder(jwtDecoder())
                                .jwtAuthenticationConverter(token -> {
                                    Collection<GrantedAuthority> authorities = extractAuthorities(token);
                                    return Mono.just(new JwtAuthenticationToken(token, authorities, token.getSubject()));
                                })
                        )
                );

        return http.build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        return NimbusReactiveJwtDecoder.withIssuerLocation(issuerUri).build();
    }

    /**
     * Extrae todas las autoridades del JWT de Keycloak.
     * Combina roles del realm (realm_access.roles) y roles del cliente (resource_access).
     * Cada rol se convierte en una GrantedAuthority con prefijo ROLE_.
     */
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        // Obtener roles desde realm_access.roles (formato Keycloak)
        Collection<GrantedAuthority> realmRoles = extractRealmRoles(jwt);

        // Obtener roles desde resource_access (roles específicos del cliente)
        Collection<GrantedAuthority> resourceRoles = extractResourceRoles(jwt);

        // Combinar ambos tipos de roles
        return Stream.concat(
                        realmRoles.stream(),
                        resourceRoles.stream()
                )
                .collect(Collectors.toSet());
    }

    /**
     * Extrae los roles del realm (realm_access.roles) del JWT de Keycloak.
     * Cada rol se convierte en una GrantedAuthority con prefijo ROLE_.
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");

        if (realmAccess instanceof Map) {
            Object roles = ((Map<String, Object>) realmAccess).get("roles");

            if (roles instanceof List) {
                return ((List<Object>) roles).stream()
                        .filter(Objects::nonNull)
                        .map(Object::toString)
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
            }
        }

        return Collections.emptyList();
    }

    /**
     * Extrae los roles específicos del cliente (resource_access.<client>.roles) del JWT de Keycloak.
     * Cada rol se convierte en una GrantedAuthority con prefijo ROLE_.
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Object resourceAccess = jwt.getClaim("resource_access");

        if (resourceAccess instanceof Map) {
            Map<String, Object> resourceAccessMap = (Map<String, Object>) resourceAccess;

            return resourceAccessMap.values().stream()
                    .filter(clientAccess -> clientAccess instanceof Map)
                    .map(clientAccess -> {
                        Object roles = ((Map<String, Object>) clientAccess).get("roles");
                        if (roles instanceof List) {
                            return ((List<Object>) roles).stream()
                                    .filter(Objects::nonNull)
                                    .map(Object::toString)
                                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                    .collect(Collectors.toList());
                        }
                        return Collections.<GrantedAuthority>emptyList();
                    })
                    .flatMap(Collection::stream)
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
    }
}
