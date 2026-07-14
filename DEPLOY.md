# Production Deployment Guide

This deploys the email-automation platform (dashboard + API + workflow worker +
Postgres + Redis) to a server with **Docker**, behind **automatic HTTPS**.

There are two paths — pick one:
- **Path A — Plain VPS + Docker Compose** (full control, documented below).
- **Path B — Coolify** (you already use it for FreeSERP; notes at the bottom).

---

## 0. What you need

- A **server/VPS** (Ubuntu 22.04+, 2 GB RAM is plenty) with Docker + Docker Compose installed.
- A **domain for the dashboard**, e.g. `emails.freeserp.com` (a subdomain is ideal).
- A **Resend account** with `onboarding-freeserp.com` added (for sending).

> The dashboard domain (`emails.freeserp.com`) and the email FROM domain
> (`onboarding-freeserp.com`) are different things. The first is where you log in;
> the second is who the emails come from.

---

## 1. DNS

Point the dashboard domain at your server:

```
A   emails.freeserp.com   ->   <your server's public IP>
```

(For `onboarding-freeserp.com` you'll add Resend's SPF/DKIM records in step 6.)

---

## 2. Get the code onto the server

```bash
ssh you@your-server
git clone <your repo>  email-platform      # or scp the folder up
cd email-platform
```

Only these are needed on the server: `Dockerfile`, `docker-compose.yml`,
`docker-compose.prod.yml`, `Caddyfile`, `docker/`, `prisma/`, `src/`, `worker/`,
`scripts/`, `package*.json`, and the config files. **Do not** copy `.env` or
`node_modules`.

---

## 3. Create the production `.env`

```bash
cp .env.example .env
nano .env
```

Set it to **exactly** this (use YOUR generated secrets — never the examples):

```bash
APP_URL=https://emails.freeserp.com
PLATFORM_DOMAIN=emails.freeserp.com

# Strong random secrets — generate with:
#   openssl rand -base64 48   (SESSION_SECRET)
#   openssl rand -base64 32   (ENCRYPTION_KEY, must decode to 32 bytes)
SESSION_SECRET=<paste a fresh 48-byte secret>
ENCRYPTION_KEY=<paste a fresh 32-byte key>

# Postgres — set a real password.
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<a strong db password>
POSTGRES_DB=email_automation

# Lock signups after you create your admin (see step 5).
ALLOW_REGISTRATION=true
```

`DATABASE_URL` and `REDIS_URL` are wired automatically by compose to the internal
`postgres`/`redis` services — you don't set them here.

> ⚠️ **Never commit `.env`.** It's already in `.gitignore`. If a real Redis/API
> token ever lands in `.env.example` (a committed file), rotate it immediately.

---

## 4. Launch (with automatic HTTPS)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This starts **caddy, app, worker, postgres, redis**. Caddy fetches a Let's Encrypt
certificate for your domain automatically. The `app` container runs the database
migrations on startup.

Check it:

```bash
docker compose ps
docker compose logs -f app worker
```

Open **https://emails.freeserp.com** — you should get the login screen over HTTPS.

---

## 5. Create your admin, then close registration

1. Visit `https://emails.freeserp.com/register`, create your admin account.
2. Edit `.env` → `ALLOW_REGISTRATION=false`.
3. Apply it: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

---

## 6. Configure sending (Resend + onboarding-freeserp.com)

1. **Resend dashboard → Domains → Add** `onboarding-freeserp.com`.
2. Add the **SPF / DKIM / DMARC** DNS records Resend shows you. Wait for **Verified**.
3. In the platform: create a **Project** → **Settings → SMTP**:
   - Host `smtp.resend.com` · Port `465` · TLS **on**
   - Username `resend` · Password = your **Resend API key** (`re_…`)
   - From email `hello@onboarding-freeserp.com` · From name `FreeSERP`
   - Click **Send test email** to confirm.
4. **Settings → API keys** → create one, copy it (shown once).
5. **Branding** → set your logo/color/footer.

---

## 7. Seed the 7 onboarding workflows on production

From your machine (or the server), pointed at the prod DB, or simpler — run it
inside the running app container:

```bash
# copy the seed in and run it against the internal DB:
docker compose cp scripts/seed-freeserp.ts app:/app/scripts/seed-freeserp.ts
docker compose exec app npx tsx scripts/seed-freeserp.ts
```

This creates the 7 templates + 7 active workflows + default branding in your
newest project. (Re-runnable; it updates rather than duplicates.)

---

## 8. Wire the FreeSERP backend to fire events

In **freeserp-backend-v2**'s production environment, set:

```bash
EMAIL_AUTOMATION_URL=https://emails.freeserp.com
EMAIL_AUTOMATION_KEY=<the API key from step 6.4>
```

Redeploy the backend. Real signups / first searches / etc. now trigger the emails.
(See `freeserp-backend-v2/ONBOARDING_EMAILS.md`.)

---

## 9. Operations

- **Logs:** `docker compose logs -f app worker`
- **Update after code changes:** `git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
- **Backups (do this!):** dump Postgres regularly —
  ```bash
  docker compose exec -T postgres pg_dump -U postgres email_automation | gzip > backup-$(date +%F).sql.gz
  ```
- **Firewall:** allow only 22, 80, 443. The DB/Redis are internal-only in prod (no host ports).
- **Scale throughput:** run more workers — `docker compose up -d --scale worker=3`.

---

## Path B — Deploy on Coolify (you already use it)

Since you run FreeSERP on Coolify, you can add this as a new **Docker Compose**
resource instead of a raw VPS:

1. New Resource → **Docker Compose** → paste `docker-compose.yml` (Coolify provides
   the reverse proxy + TLS, so you can **skip Caddy/`docker-compose.prod.yml`**).
2. Set the env vars from step 3 in Coolify's UI (`APP_URL`, `SESSION_SECRET`,
   `ENCRYPTION_KEY`, `POSTGRES_*`, `ALLOW_REGISTRATION`).
3. Set the domain (e.g. `emails.freeserp.com`) on the `app` service; Coolify issues
   the certificate.
4. Deploy, then do steps 5–8 above.

Coolify handles HTTPS, restarts, and updates on git push — the simplest path given
your setup.
