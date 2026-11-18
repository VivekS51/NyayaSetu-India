# NyayaSetu India (न्यायसेतु) — Agent & Developer Guide

## System Overview
NyayaSetu India is an incentive-based legal service provider eMarketplace connecting Indian citizens with verified advocates, notaries public, court-annexed mediators, arbitrators, and document writers.

## Architecture & Tech Stack
- **Monorepo Manager**: pnpm workspaces
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React
- **Backend API**: Node.js, Express, TypeScript, Zod, JWT
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Cache & Rate Limiting**: Redis, in-memory store
- **Security & Compliance**:
  - Bar Council of India (BCI) Rule 36 Anti-Solicitation Regex Validation
  - Digital Personal Data Protection (DPDP) Act 2023 Consent & Audit Trail
  - Statutory 0% Platform Fee on Professional Legal Fees
  - Escrow Protection & Razorpay Sandbox Webhooks
- **Test Suites**:
  - Jest, Supertest (10 test suites, 252 tests, 89%+ line coverage)
  - Playwright E2E test suites (`e2e/`)
  - Integration Runner (`pnpm test`)

## Directory Structure
```
├── .github/workflows/ci-cd.yml      # Automated CI/CD pipeline
├── apps/
│   ├── backend/                     # Express TypeScript REST API & Prisma
│   └── frontend/                    # Next.js 14 App Router portal
├── e2e/                             # Playwright end-to-end test suites
├── packages/
│   └── shared-types/                # Shared DTOs and TypeScript models
├── docker-compose.yml               # Production multi-container orchestration
├── docker-compose.test.yml          # Isolated test database & redis
├── package.json                     # Monorepo scripts
└── pnpm-workspace.yaml              # Workspace topology
```

## Running Locally
```bash
# Install dependencies
pnpm install

# Run backend API (port 5000)
pnpm dev:backend

# Run frontend portal (port 3000)
pnpm dev:frontend

# Execute full automated test suite
pnpm test
```

