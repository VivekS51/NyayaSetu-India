# NyayaSetu India (न्यायसेतु) — Production Deployment Guide (No Docker)

This guide documents deploying the complete NyayaSetu India platform on the public internet **without Docker**, using a direct managed cloud database (Neon / Supabase / AWS RDS / Railway PostgreSQL).

---

## Architecture Overview (Direct Cloud Hosting)

```
                       ┌────────────────────────────┐
                       │      Vercel / Render       │
                       │   Next.js 14 Frontend UI   │
                       │  (https://nyayasetu.in)    │
                       └──────────────┬─────────────┘
                                      │ REST API Calls
                                      ▼
                       ┌────────────────────────────┐
                       │     Render / Railway       │
                       │   Express TypeScript API   │
                       │ (https://api.nyayasetu.in) │
                       └──────────────┬─────────────┘
                                      │ Direct TLS Connection
                                      ▼
                       ┌────────────────────────────┐
                       │  Neon / Supabase / AWS RDS │
                       │ Cloud PostgreSQL Database  │
                       │ (Direct Connection String) │
                       └────────────────────────────┘
```

---

## 1. Cloud Database Setup (Direct Connection — No Docker)

You can use any free-tier or production cloud PostgreSQL provider (such as [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Render PostgreSQL](https://render.com)):

1. Create a PostgreSQL instance in the region closest to Indian users (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
2. Copy your pooled direct connection string:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<host>/<database>?sslmode=require"
   ```
3. Push the complete schema (590 lines of tables, enums, indices) directly from your local machine to the cloud database:
   ```bash
   # Push Prisma schema directly to remote database
   pnpm db:push
   ```
4. Seed the initial statutory tiers, badges, and default roles:
   ```bash
   pnpm db:seed
   ```

---

## 2. Option A: Deploying Backend API to Render (Recommended)

1. Sign in to [Render.com](https://render.com) and click **New +** → **Blueprint** (or connect via GitHub repository `VivekS51/NyayaSetu-India`).
2. Select repository `VivekS51/NyayaSetu-India`.
3. Render reads `render.yaml` automatically:
   - **Service Name**: `nyayasetu-backend`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm build:backend`
   - **Start Command**: `pnpm start:backend`
4. Set your Environment Variables in the Render dashboard:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | Your direct Neon / Supabase PostgreSQL connection string |
   | `JWT_SECRET` | Auto-generated cryptographic random key (minimum 32 chars) |
   | `JWT_ACCESS_SECRET` | Cryptographic secret key |
   | `JWT_REFRESH_SECRET` | Cryptographic refresh key |
   | `BCI_COMPLIANCE_MODE` | `true` |
   | `DPDP_AUDIT_LOG_ENABLED` | `true` |
5. Click **Deploy**. Your API will be live at `https://nyayasetu-backend.onrender.com`.
   - Health check: `https://nyayasetu-backend.onrender.com/api/health`
   - Swagger documentation: `https://nyayasetu-backend.onrender.com/api/v1/docs`

---

## 3. Option B: Deploying Frontend Portal to Vercel (Recommended)

1. Sign in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Import `VivekS51/NyayaSetu-India`.
3. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/frontend` (or leave as root with preset)
   - **Build Command**: `pnpm --filter @legal-marketplace/frontend build`
   - **Install Command**: `pnpm install`
4. Configure Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://nyayasetu-backend.onrender.com/api/v1` |
   | `NEXT_PUBLIC_APP_URL` | `https://nyayasetu.vercel.app` |
5. Click **Deploy**. Vercel will build and deploy the Next.js 14 frontend globally with edge caching.

---

## 4. Option C: Deploying to Railway (All-in-One No-Docker)

1. Go to [Railway.app](https://railway.app) and create a **New Project** → **Deploy from GitHub repo**.
2. Railway will detect `railway.json` and `Procfile`.
3. Under Variables, add:
   - `DATABASE_URL`: Your direct cloud PostgreSQL URL.
   - `JWT_SECRET`: Random 256-bit secret.
   - `PORT`: `5000`
4. Railway starts the backend service automatically.

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit `https://<your-backend-domain>/api/health` — returns HTTP 200 with status `UP`.
- [ ] Visit `https://<your-frontend-domain>` — landing page renders with sovereign tricolor and BCI disclaimers.
- [ ] Visit `/providers` — verified practitioners load from the database.
- [ ] Complete a test registration at `/auth/register` and verify record is inserted into the cloud PostgreSQL database.
- [ ] Complete a test onboarding workflow at `/onboarding`.

