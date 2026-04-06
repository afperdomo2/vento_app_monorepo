package com.vento.event.service;

import com.vento.common.dto.event.TicketDto;
import com.vento.common.dto.kafka.OrderConfirmedEvent;
import com.vento.common.enums.TicketStatus;
import com.vento.event.model.Ticket;
import com.vento.event.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private static final String ACCESS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ACCESS_CODE_LENGTH = 8;
    private static final SecureRandom random = new SecureRandom();

    private final TicketRepository ticketRepository;

    /**
     * Genera tickets para cada entrada de una orden confirmada.
     *
     * @param event evento de orden confirmada desde Kafka
     * @return lista de tickets creados
     */
    @Transactional
    public List<Ticket> generateTickets(OrderConfirmedEvent event) {
        log.info("🎫 Generando {} tickets para orden: {}, evento: {}, usuario: {}",
                event.quantity(), event.orderId(), event.eventId(), event.userId());

        List<Ticket> tickets = new java.util.ArrayList<>();
        for (int i = 0; i < event.quantity(); i++) {
            String accessCode = generateUniqueAccessCode();
            Ticket ticket = Ticket.builder()
                    .eventId(event.eventId())
                    .orderId(event.orderId())
                    .userId(event.userId())
                    .accessCode(accessCode)
                    .status(TicketStatus.ACTIVE)
                    .build();
            tickets.add(ticket);
        }

        List<Ticket> saved = ticketRepository.saveAll(tickets);
        log.info("✅ {} tickets generados para orden: {}", saved.size(), event.orderId());
        return saved;
    }

    /**
     * Obtiene todos los tickets de una orden.
     */
    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsByOrderId(UUID orderId) {
        return ticketRepository.findByOrderId(orderId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Obtiene todos los tickets de un usuario.
     */
    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsByUserId(UUID userId) {
        return ticketRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Obtiene tickets de un usuario para un evento específico.
     */
    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsByUserIdAndEventId(UUID userId, UUID eventId) {
        return ticketRepository.findByUserIdAndEventId(userId, eventId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Genera un código de acceso único alfanumérico.
     * Formato: VNT-XXXXXXXX (8 chars alfanuméricos sin I, O, 0, 1 para evitar confusión visual).
     */
    private String generateAccessCode() {
        StringBuilder code = new StringBuilder("VNT-");
        for (int i = 0; i < ACCESS_CODE_LENGTH; i++) {
            code.append(ACCESS_CODE_CHARS.charAt(random.nextInt(ACCESS_CODE_CHARS.length())));
        }
        return code.toString();
    }

    /**
     * Genera un código de acceso único, reintentando si existe colisión.
     */
    private String generateUniqueAccessCode() {
        String code;
        int attempts = 0;
        do {
            code = generateAccessCode();
            attempts++;
            if (attempts > 10) {
                throw new RuntimeException("No se pudo generar código de acceso único tras " + attempts + " intentos");
            }
        } while (ticketRepository.existsByAccessCode(code));
        return code;
    }

    private TicketDto toDto(Ticket ticket) {
        return new TicketDto(
                ticket.getId(),
                ticket.getEventId(),
                ticket.getOrderId(),
                ticket.getUserId(),
                ticket.getAccessCode(),
                ticket.getStatus().name(),
                ticket.getCreatedAt() != null ? ticket.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toInstant() : null
        );
    }
}
