package com.vento.event.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI eventServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Event Service API")
                        .description("API para la gestión de eventos y venta de entradas")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Vento Team")
                                .email("dev@vento.com")));
    }
}
