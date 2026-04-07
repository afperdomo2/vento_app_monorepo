package com.vento.order.infrastructure.persistence.repository;

import com.vento.order.core.model.FailedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FailedEventRepository extends JpaRepository<FailedEvent, UUID> {

    /**
     * Obtener todos los eventos fallidos no procesados
     */
    List<FailedEvent> findByProcessedFalse();

    /**
     * Contar eventos fallidos por topic
     */
    long countByTopic(String topic);

    /**
     * Obtener eventos fallidos ordenados por fecha de fallo
     */
    List<FailedEvent> findByOrderByFailedAtDesc();
}
