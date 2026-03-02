#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
SANITIZER_SCRIPT="$SCRIPT_DIR/clear-npm-http-proxy.js"

case "${NODE_OPTIONS:-}" in
  *"--require $SANITIZER_SCRIPT"*)
    ;;
  "")
    NODE_OPTIONS="--require $SANITIZER_SCRIPT"
    ;;
  *)
    NODE_OPTIONS="--require $SANITIZER_SCRIPT $NODE_OPTIONS"
    ;;
esac

export NODE_OPTIONS
exec npm "$@"
