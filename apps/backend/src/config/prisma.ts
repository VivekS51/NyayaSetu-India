import { PrismaClient } from '@prisma/client';
import { envConfig } from './env.config';

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

export const prisma =
  global.__prismaInstance ||
  new PrismaClient({
    log: envConfig.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (envConfig.nodeEnv !== 'production') {
  global.__prismaInstance = prisma;
}

