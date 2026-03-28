package com.vento.event.repository;

import com.vento.event.model.Event;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    /**
     * Busca eventos destacados: eventos futuros con tickets disponibles,
     * ordenados por fecha (más próximos primero).
     *
     * @param now fecha actual para filtrar eventos futuros
     * @param pageable configuración de paginación para limitar resultados
     * @return lista de eventos destacados
     */
    @Query("SELECT e FROM Event e WHERE e.eventDate > :now AND e.availableTickets > 0 ORDER BY e.eventDate ASC")
    List<Event> findFeaturedEvents(@Param("now") LocalDateTime now, Pageable pageable);
}
