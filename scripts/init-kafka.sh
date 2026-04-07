#!/bin/bash
# Script para crear topics de Kafka
# Se ejecuta desde el contenedor kafka-init después de que Kafka está healthy
# Los topics se conservan entre reinicios; este script solo crea los que no existen

KAFKA_TOPICS="/opt/kafka/bin/kafka-topics.sh"
BOOTSTRAP_SERVER="kafka:9092"
PARTITIONS=3
REPLICATION_FACTOR=1

echo "⏳ Esperando a que Kafka esté listo..."
sleep 5
echo "✅ Kafka debería estar listo"

echo "📝 Creando topics..."

$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic payment.processed --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic payment.failed --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic order.confirmed --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic order.cancelled --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic payment.processed.DLQ --partitions 1 --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic payment.failed.DLQ --partitions 1 --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic event.created --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic event.updated --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true
$KAFKA_TOPICS --create --bootstrap-server "$BOOTSTRAP_SERVER" --topic event.deleted --partitions "$PARTITIONS" --replication-factor "$REPLICATION_FACTOR" --if-not-exists || true

echo "✅ Topics creados:"
$KAFKA_TOPICS --list --bootstrap-server "$BOOTSTRAP_SERVER"
