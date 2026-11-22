#!/usr/bin/env bash
set -euo pipefail

: "${TAISTO_PASSWORD:?Aseta TAISTO_PASSWORD-ymparistomuuttuja ennen skriptin ajoa}"

IMAGE="${TAISTO_IMAGE:-ghcr.io/koodinikkarit/taisto2:latest}"
CONTAINER_NAME="${TAISTO_CONTAINER_NAME:-taisto}"
DATABASE_DIR="${TAISTO_DATABASE_DIR:-/home/taisto/database}"
HOST_PORT="${TAISTO_HOST_PORT:-1337}"
AUDIT_RETENTION_DAYS="${TAISTO_AUDIT_RETENTION_DAYS:-0}"

backup_args=()
if [[ -n "${BACKUP_OAUTH_FILE:-}" || -n "${BACKUP_KEY_FILE:-}" ]]; then
  for file in "${BACKUP_OAUTH_FILE:-}" "${BACKUP_KEY_FILE:-}"; do
    if [[ "$file" != /* || "$file" == *,* || ! -f "$file" || ! -r "$file" ]]; then
      echo "Aseta sekä BACKUP_OAUTH_FILE että BACKUP_KEY_FILE luettavien tiedostojen absoluuttisiksi poluiksi (ei pilkkua)." >&2
      exit 1
    fi
  done
  backup_args+=(--mount "type=bind,source=$BACKUP_OAUTH_FILE,target=/run/secrets/drive-oauth.json,readonly" -e BACKUP_OAUTH_FILE=/run/secrets/drive-oauth.json)
  backup_args+=(--mount "type=bind,source=$BACKUP_KEY_FILE,target=/run/secrets/drive-backup.key,readonly" -e BACKUP_KEY_FILE=/run/secrets/drive-backup.key)
elif docker inspect --type=container --format '{{range .Config.Env}}{{println (index (split . "=") 0)}}{{end}}' "$CONTAINER_NAME" 2>/dev/null | grep -Ex 'BACKUP_(OAUTH|KEY)_FILE' >/dev/null; then
  echo "Nykyisellä kontilla on Drive-varmistus käytössä. Aseta BACKUP_OAUTH_FILE ja BACKUP_KEY_FILE ennen päivitystä. Konttia ei pysäytetty." >&2
  exit 1
fi

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
  "${backup_args[@]}" \
  "$IMAGE"

echo "Kontin tila:"
docker ps --filter "name=^/${CONTAINER_NAME}$"

echo "Viimeisimmat lokirivit:"
docker logs --tail 30 "$CONTAINER_NAME"
