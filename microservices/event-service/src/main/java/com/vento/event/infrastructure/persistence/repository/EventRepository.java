package com.vento.event.infrastructure.persistence.repository;

import com.vento.event.core.model.Event;
import org.springframework.data.domain.Page;
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

    /**
     * Busca eventos por término de texto en nombre, descripción y ubicación.
     * La búsqueda es case-insensitive y usa matching parcial.
     *
     * @param searchTerm término de búsqueda
     * @param pageable configuración de paginación
     * @return página de eventos que coinciden con la búsqueda
     */
    @Query("SELECT e FROM Event e WHERE e.availableTickets > 0 AND " +
           "(LOWER(e.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(e.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(e.venue) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Event> searchEvents(@Param("searchTerm") String searchTerm, Pageable pageable);
}
