package com.vento.event.filter;

import com.vento.common.context.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que extrae los headers de usuario propagados por el API Gateway
 * y los almacena en el UserContext para acceso desde la capa de servicio.
 * <p>
 * Headers esperados:
 * - X-User-Id: ID del usuario autenticado
 * - X-User-Roles: Roles del usuario separados por coma
 * <p>
 * Este filtro confía en que el API Gateway ya validó el token JWT.
 * Los microservicios NO validan JWTs directamente.
 */
@Slf4j
@Component
@Order(1)
public class UserContextFilter extends OncePerRequestFilter {

    public static final String X_USER_ID_HEADER = "X-User-Id";
    public static final String X_USER_ROLES_HEADER = "X-User-Roles";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extraer headers del request
            String userId = request.getHeader(X_USER_ID_HEADER);
            String roles = request.getHeader(X_USER_ROLES_HEADER);

            log.debug("Headers recibidos - X-User-Id: {}, X-User-Roles: {}", userId, roles);

            // Almacenar en el contexto
            if (userId != null) {
                UserContext.setUserId(userId);
            }
            if (roles != null) {
                UserContext.setRoles(roles);
            }

            // Continuar con la cadena de filtros
            filterChain.doFilter(request, response);

        } finally {
            // Siempre limpiar el contexto al finalizar la request
            // Esto previene memory leaks y contaminación entre requests
            UserContext.clear();
        }
    }
}
