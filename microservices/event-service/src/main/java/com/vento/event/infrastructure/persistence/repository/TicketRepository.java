package com.vento.event.infrastructure.persistence.repository;

import com.vento.event.core.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByOrderId(UUID orderId);

    List<Ticket> findByUserId(UUID userId);

    List<Ticket> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByAccessCode(String accessCode);
}
