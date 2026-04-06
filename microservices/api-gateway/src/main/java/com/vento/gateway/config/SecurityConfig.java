package com.vento.gateway.config;

import com.vento.gateway.exception.CustomAccessDeniedHandler;
import com.vento.gateway.exception.CustomAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
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
 * - Configura CORS para permitir requests desde el frontend
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    // CORS Configuration - Externalized via environment variables
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${app.cors.allowed-headers}")
    private List<String> allowedHeaders;

    @Value("${app.cors.exposed-headers}")
    private List<String> exposedHeaders;

    @Value("${app.cors.allow-credentials:true}")
    private Boolean allowCredentials;

    @Value("${app.cors.max-age:3600}")
    private Long maxAge;

    private final CustomAuthenticationEntryPoint authEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        // Rutas públicas
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/swagger-ui/**").permitAll()
                        .pathMatchers("/v3/api-docs/**").permitAll()

                        // Eventos - GET público (cualquiera puede ver eventos)
                        .pathMatchers(HttpMethod.GET, "/api/events/**").permitAll()

                        // Tickets - requieren autenticación (usuario dueño de los tickets)
                        .pathMatchers(HttpMethod.GET, "/api/events/tickets/**").hasAnyRole("USER", "ADMIN")

                        // Eventos - Mutaciones solo para ADMIN
                        .pathMatchers(HttpMethod.POST, "/api/events/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/api/events/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PATCH, "/api/events/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("ADMIN")

                        // Orders requieren rol USER
                        .pathMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")

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
                        .authenticationEntryPoint(authEntryPoint)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                );

        return http.build();
    }

    /**
     * Configuración CORS para permitir requests desde el frontend.
     * Los orígenes permitidos se configuran vía variables de entorno para flexibilidad.
     * <p>
     * Para desarrollo: http://localhost:4200,http://localhost:3000
     * Para producción: https://tuapp.com,https://www.tuapp.com
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Usar configuración externalizada
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(allowedMethods);
        configuration.setAllowedHeaders(allowedHeaders);
        configuration.setExposedHeaders(exposedHeaders);
        configuration.setAllowCredentials(allowCredentials);
        configuration.setMaxAge(maxAge);

        // Fuente de configuración
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
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
