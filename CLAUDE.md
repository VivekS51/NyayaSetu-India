# Claude Code & AI Instructions — NyayaSetu India

## Build & Test Commands
- **Install All Dependencies**: `pnpm install`
- **Backend Dev Server**: `pnpm --filter @legal-marketplace/backend run dev` (Port 5000)
- **Frontend Dev Server**: `pnpm --filter @legal-marketplace/frontend run dev` (Port 3000)
- **Unit & Integration Tests**: `pnpm --filter @legal-marketplace/backend run test:all`
- **Coverage**: `pnpm --filter @legal-marketplace/backend run test:coverage`
- **E2E Playwright**: `pnpm test:e2e`

## Core Architectural Invariants
1. **BCI Rule 36 Compliance**: Never remove or bypass regex sanitization for legal practitioner bios and listings. Superlative marketing terms ("best lawyer", "top advocate", "100% win rate") must always be rejected.
2. **0% Legal Fee Commission**: Platform fees are strictly limited to statutory flat facilitation fees; professional advocate fees must remain 100% pass-through without deduction.
3. **DPDP Act 2023**: Every citizen data mutation must log an audit trail entry. Anonymization on account decommissioning must clear personal data while retaining statutory transaction records.
4. **Escrow Locking**: Booking fees are held in statutory escrow until consultation sign-off or mutual resolution. If a dispute is raised, funds remain frozen until resolved by the admin desk.
