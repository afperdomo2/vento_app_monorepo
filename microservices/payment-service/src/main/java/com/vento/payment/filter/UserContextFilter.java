package com.vento.payment.filter;

import com.vento.common.context.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que extrae los headers de contexto de usuario propagados por el API Gateway
 * y los almacena en el UserContext para acceso desde la capa de servicio.
 * <p>
 * Headers esperados:
 * - X-User-Id: ID del usuario autenticado
 * - X-User-Roles: Roles del usuario separados por coma
 * <p>
 * Este filtro se ejecuta en cada request y asegura que la información del usuario
 * esté disponible globalmente durante el procesamiento de la solicitud.
 */
@Component
public class UserContextFilter extends OncePerRequestFilter {

    public static final String X_USER_ID_HEADER = "X-User-Id";
    public static final String X_USER_ROLES_HEADER = "X-User-Roles";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String userId = request.getHeader(X_USER_ID_HEADER);
            String roles = request.getHeader(X_USER_ROLES_HEADER);

            if (userId != null && !userId.isEmpty()) {
                UserContext.setUserId(userId);
            }

            if (roles != null && !roles.isEmpty()) {
                UserContext.setRoles(roles);
            }

            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}
