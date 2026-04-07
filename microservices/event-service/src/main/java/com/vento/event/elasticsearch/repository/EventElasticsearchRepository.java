package com.vento.event.elasticsearch.repository;

import com.vento.event.elasticsearch.document.EventDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventElasticsearchRepository extends ElasticsearchRepository<EventDocument, String> {
}
