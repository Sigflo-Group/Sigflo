#!/bin/bash
set -euo pipefail

if [[ -z "${WHATSAPP_PHONE:-}" ]]; then
  echo "Set WHATSAPP_PHONE (E.164, no +) before starting the bridge." >&2
  exit 1
fi

node "$(dirname "$0")/whatsapp-poll.mjs" >> /tmp/whatsapp-bridge.log 2>&1
