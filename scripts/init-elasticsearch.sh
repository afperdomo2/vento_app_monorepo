#!/bin/bash
# Script para inicializar Elasticsearch
# Crea el índice 'events' con mappings y analyzers para búsqueda avanzada
# Se ejecuta después de que Elasticsearch está healthy

ES_URL="http://elasticsearch:9200"

echo "⏳ Esperando a que Elasticsearch esté listo..."
sleep 10
echo "✅ Elasticsearch debería estar listo"

echo "📝 Creando índice 'events' con configuración de búsqueda avanzada..."

# Crear índice con analyzers para autocomplete
curl -X PUT "$ES_URL/events" \
  -H 'Content-Type: application/json' \
  -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "autocomplete",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "autocomplete": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete"
          }
        }
      },
      "description": { "type": "text", "analyzer": "standard" },
      "venue": { "type": "text", "analyzer": "standard" },
      "location": { "type": "geo_point" },
      "eventDate": { "type": "date" },
      "price": { "type": "float" },
      "availableTickets": { "type": "integer" },
      "totalCapacity": { "type": "integer" },
      "status": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}' || echo "⚠️ El índice ya existe o hubo un error (continuando...)"

echo ""
echo "✅ Índice 'events' creado/configurado"

# Verificar que el índice existe
echo "📋 Verificando índice..."
curl -X GET "$ES_URL/events" -H 'Content-Type: application/json' | jq '.' || echo "⚠️ jq no disponible, verificando con curl..."
curl -X GET "$ES_URL/_cat/indices/events?v"

echo ""
echo "✅ Inicialización de Elasticsearch completada"
