package com.vento.event.core.model;

import com.vento.common.enums.TicketStatus;
import com.vento.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_tickets_order_id", columnList = "order_id"),
        @Index(name = "idx_tickets_user_id", columnList = "user_id"),
        @Index(name = "idx_tickets_access_code", columnList = "access_code", unique = true),
        @Index(name = "idx_tickets_event_id", columnList = "event_id")
})
@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "access_code", nullable = false, unique = true, length = 12)
    private String accessCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.ACTIVE;
}
