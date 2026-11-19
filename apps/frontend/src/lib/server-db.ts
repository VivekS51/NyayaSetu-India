import { PrismaClient } from '@prisma/client';

const DEFAULT_NEON_DB_URL =
  'postgresql://neondb_owner:npg_MYs4BmpHL0Ed@ep-blue-credit-bdfp4ylx-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_NEON_DB_URL;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || DEFAULT_NEON_DB_URL,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Resilient memory OTP cache
const globalOtps = globalThis as unknown as {
  otps: Map<string, { code: string; expiresAt: Date; attempts: number }>;
};
if (!globalOtps.otps) {
  globalOtps.otps = new Map();
}
export const serverOtps = globalOtps.otps;
