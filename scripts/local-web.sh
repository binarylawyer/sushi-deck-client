#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
compose=(docker compose -f deployment/web/compose.local.yml)
case "${1:-help}" in
  build)
    builder="sushii-deck-client-local-builder"
    if ! docker buildx inspect "$builder" >/dev/null 2>&1; then
      docker buildx create --name "$builder" --driver docker-container \
        --driver-opt memory=3g,memory-swap=3g,cpu-period=100000,cpu-quota=200000 >/dev/null
    fi
    trap 'docker buildx stop "$builder" >/dev/null 2>&1 || true' EXIT
    revision="$(git rev-parse HEAD)"
    if ! git diff --quiet HEAD || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
      revision="${revision}-dirty"
    fi
    docker buildx build --builder "$builder" --load --progress plain \
      --build-arg "SOURCE_REVISION=$revision" \
      -f deployment/web/Dockerfile -t sushii-deck-client-web:local .
    ;;
  up) "${compose[@]}" up -d --wait --wait-timeout 90 ;;
  stop) "${compose[@]}" stop ;;
  down) "${compose[@]}" down ;;
  status) "${compose[@]}" ps ;;
  logs) "${compose[@]}" logs --tail 100 ;;
  check) python3 scripts/verify-local-web.py ;;
  *) echo "Usage: bash scripts/local-web.sh {build|up|stop|down|status|logs|check}" ;;
esac
