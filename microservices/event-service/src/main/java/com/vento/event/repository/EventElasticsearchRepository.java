package com.vento.event.repository;

import com.vento.event.document.EventDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventElasticsearchRepository extends ElasticsearchRepository<EventDocument, String> {
}
