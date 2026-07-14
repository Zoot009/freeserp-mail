#!/bin/sh
set -e

# App container entrypoint: apply DB migrations, then start the Next.js server.
echo "[entrypoint] Applying database migrations…"
npx prisma migrate deploy

echo "[entrypoint] Starting web server…"
exec node server.js
