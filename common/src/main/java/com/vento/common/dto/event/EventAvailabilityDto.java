package com.vento.common.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO ligero para consultar disponibilidad de un evento.
 * Contiene solo la cantidad de tickets disponibles y el precio.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAvailabilityDto {

    private Integer availableTickets;
    private BigDecimal price;
}
