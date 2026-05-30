#!/bin/bash
export WHATSAPP_PHONE=REDACTED
node /root/Sigflo/whatsapp-poll.mjs >> /tmp/whatsapp-bridge.log 2>&1
