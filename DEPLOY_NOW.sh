#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT"
mkdir -p secrets
umask 077
[ -s secrets/auth_secret ] || head -c 48 /dev/urandom | base64 | tr -d '\n' > secrets/auth_secret
[ -s secrets/postgres_password ] || head -c 32 /dev/urandom | base64 | tr -d '\n' > secrets/postgres_password
if [ ! -s secrets/tls_cert.pem ] || [ ! -s secrets/tls_key.pem ]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
    -keyout secrets/tls_key.pem -out secrets/tls_cert.pem \
    -subj '/CN=localhost' >/dev/null 2>&1
fi
chmod 600 secrets/*
docker compose -f docker-compose.production.yml up -d --build
printf '\nHokm Online is starting. Check: https://localhost:3000/ready\n'
printf 'Logs: docker compose -f docker-compose.production.yml logs -f app\n'
