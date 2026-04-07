package com.vento.event.infrastructure.elasticsearch.repository;

import com.vento.event.infrastructure.elasticsearch.document.EventDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventElasticsearchRepository extends ElasticsearchRepository<EventDocument, String> {
}
