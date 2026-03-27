package com.vento.common.config;

import com.vento.common.exception.GlobalExceptionHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;

/**
 * Auto-configuración para el manejador global de excepciones.
 * Se activa automáticamente en aplicaciones web Spring MVC (SERVLET).
 *
 * Puede desactivarse con: vento.exception-handler.enabled=false
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "vento.exception-handler.enabled", havingValue = "true", matchIfMissing = true)
public class ExceptionHandlerAutoConfiguration {

    @Value("${spring.application.name:unknown}")
    private String serviceName;

    @Bean
    public GlobalExceptionHandler globalExceptionHandler() {
        return new GlobalExceptionHandler(serviceName);
    }
}
