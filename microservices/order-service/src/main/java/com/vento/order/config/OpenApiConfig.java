package com.vento.order.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springdoc.core.customizers.GlobalOpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI orderServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Order Service API")
                        .description("API para la gestión de pedidos y reservas de entradas. " +
                                "\n\n**Nota:** Los endpoints que requieren autenticación esperan el header `X-User-Id` " +
                                "cuando se llaman directamente (sin pasar por el API Gateway).")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Vento Team")
                                .email("dev@vento.com")))
                .addSecurityItem(new SecurityRequirement().addList("X-User-Id"))
                .components(new Components()
                        .addSecuritySchemes("X-User-Id", new SecurityScheme()
                                .name("X-User-Id")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .description("ID del usuario autenticado (propagado desde API Gateway o manual para testing)")));
    }

    /**
     * Customizer global para eliminar el header X-User-Id de los parámetros de cada operación.
     * El header se maneja como security scheme global (botón Authorize),
     * por lo que no debe aparecer como parámetro manual en cada endpoint.
     */
    @Bean
    public GlobalOpenApiCustomizer removeXUserIdHeader() {
        return openApi -> {
            if (openApi.getPaths() != null) {
                openApi.getPaths().forEach((path, pathItem) -> {
                    if (pathItem.readOperations() != null) {
                        pathItem.readOperations().forEach(operation -> {
                            if (operation.getParameters() != null) {
                                operation.getParameters().removeIf(
                                        param -> "X-User-Id".equalsIgnoreCase(param.getName())
                                                && param.getIn().equalsIgnoreCase("header")
                                );
                            }
                        });
                    }
                });
            }
        };
    }
}
