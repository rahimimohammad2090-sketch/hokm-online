#!/bin/sh
set -eu
if [ -f /run/secrets/postgres_password ]; then
  export POSTGRES_PASSWORD="$(cat /run/secrets/postgres_password)"
  export DATABASE_URL="postgresql://hokm:${POSTGRES_PASSWORD}@postgres:5432/hokm"
fi
exec node production_server.js
