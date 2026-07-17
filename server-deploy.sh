#!/usr/bin/env bash
# One-shot server deploy for the email-automation platform.
# Run this ON the VPS from inside the extracted email-platform folder:
#   bash server-deploy.sh
set -euo pipefail

echo "==> [1/4] Ensuring Docker is installed…"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
# compose plugin check
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin missing — installing…"
  apt-get update -y && apt-get install -y docker-compose-plugin || true
fi

echo "==> [2/4] Writing .env (first run generates strong secrets, kept on redeploy)…"
if [ ! -f .env ]; then
  # Force IPv4 — ifconfig.me can otherwise return an IPv6 address that breaks
  # URL generation (IPv6 needs brackets and may be unreachable over v4).
  PUBLIC_IP="$(curl -4 -fsSL ifconfig.me 2>/dev/null || curl -4 -fsSL icanhazip.com 2>/dev/null || echo 127.0.0.1)"
  SESSION_SECRET="$(openssl rand -base64 48)"
  ENCRYPTION_KEY="$(openssl rand -base64 32)"
  DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
  cat > .env <<EOF
APP_URL=http://${PUBLIC_IP}:3000
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=email_automation
ALLOW_REGISTRATION=true
APP_PORT=3000
EOF
  echo "    .env created for http://${PUBLIC_IP}:3000"
else
  echo "    .env already exists — keeping it."
fi

echo "==> [3/4] Building and starting the stack (this takes a few minutes)…"
docker compose up -d --build

echo "==> [4/4] Waiting for the app…"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://localhost:3000/login" 2>/dev/null; then break; fi
  sleep 2
done

APP_URL="$(grep '^APP_URL=' .env | cut -d= -f2-)"
echo ""
echo "======================================================================"
echo " ✅ Platform is up:  ${APP_URL}"
echo "    Next: open ${APP_URL}/register to create your admin account."
echo "    (If it doesn't load, open port 3000 in your VPS firewall.)"
echo "======================================================================"
