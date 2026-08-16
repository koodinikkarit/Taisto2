#!/usr/bin/env bash
set -euo pipefail

: "${TAISTO_PASSWORD:?Aseta TAISTO_PASSWORD-ymparistomuuttuja ennen skriptin ajoa}"

IMAGE="${TAISTO_IMAGE:-ghcr.io/koodinikkarit/taisto2:latest}"
CONTAINER_NAME="${TAISTO_CONTAINER_NAME:-taisto}"
DATABASE_DIR="${TAISTO_DATABASE_DIR:-/home/taisto/database}"
HOST_PORT="${TAISTO_HOST_PORT:-1337}"
AUDIT_RETENTION_DAYS="${TAISTO_AUDIT_RETENTION_DAYS:-0}"

mkdir -p "$DATABASE_DIR"

echo "Ladataan image $IMAGE..."
docker pull "$IMAGE"

echo "Pysaytetaan vanha kontti..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "Kaynnistetaan uusi kontti..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$HOST_PORT:80" \
  -e TAISTO_PASSWORD="$TAISTO_PASSWORD" \
  -e TAISTO_AUDIT_RETENTION_DAYS="$AUDIT_RETENTION_DAYS" \
  --mount type=bind,source="$DATABASE_DIR",target=/usr/src/database \
  --restart unless-stopped \
  "$IMAGE"

echo "Kontin tila:"
docker ps --filter "name=^/${CONTAINER_NAME}$"

echo "Viimeisimmat lokirivit:"
docker logs --tail 30 "$CONTAINER_NAME"
