import { PrismaClient } from '@prisma/client';
import { envConfig } from './env.config';

const DEFAULT_NEON_DB_URL =
  'postgresql://neondb_owner:npg_MYs4BmpHL0Ed@ep-blue-credit-bdfp4ylx-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_NEON_DB_URL;
}

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

export const prisma =
  global.__prismaInstance ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || DEFAULT_NEON_DB_URL,
      },
    },
    log: envConfig.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (envConfig.nodeEnv !== 'production') {
  global.__prismaInstance = prisma;
}

