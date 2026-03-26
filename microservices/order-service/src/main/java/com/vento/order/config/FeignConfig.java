package com.vento.order.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Configuración de Feign para propagar headers desde el API Gateway.
 * <p>
 * Este interceptor asegura que los headers X-User-Id y X-User-Roles
 * sean propagados en las llamadas Feign hacia otros microservicios.
 */
@Configuration
@Slf4j
public class FeignConfig implements RequestInterceptor {

    public static final String X_USER_ID_HEADER = "X-User-Id";
    public static final String X_USER_ROLES_HEADER = "X-User-Roles";

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();

            // Propagar X-User-Id
            String userId = request.getHeader(X_USER_ID_HEADER);
            if (userId != null) {
                template.header(X_USER_ID_HEADER, userId);
                log.debug("Propagando X-User-Id: {}", userId);
            }

            // Propagar X-User-Roles
            String roles = request.getHeader(X_USER_ROLES_HEADER);
            if (roles != null) {
                template.header(X_USER_ROLES_HEADER, roles);
                log.debug("Propagando X-User-Roles: {}", roles);
            }
        }
    }
}
