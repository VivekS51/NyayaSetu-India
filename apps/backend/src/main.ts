import { createApp } from './app';
import { envConfig } from './config/env.config';
import { prisma } from './config/prisma';
import { dbStore } from './config/database';

const syncNeon = async () => {
  if (!envConfig.databaseUrl) return;
  try {
    const adminEmail = 'admin@legalmarketplace.gov.in';
    const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (!existing) {
      const admin = dbStore.users.find((u) => u.email === adminEmail);
      if (admin) {
        await prisma.user.create({
          data: {
            id: admin.id,
            email: admin.email,
            phone: admin.phone,
            passwordHash: admin.passwordHash,
            fullName: admin.fullName,
            preferredLanguage: admin.preferredLanguage,
            status: 'ACTIVE',
            isPhoneVerified: true,
            isEmailVerified: true,
            roles: {
              create: [{ role: 'ADMIN' }, { role: 'VERIFIER' }],
            },
          },
        });
        console.log('⚡ [Neon Database] Initialized default Admin user in Neon PostgreSQL.');
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [Neon Database] Startup sync notice:', err.message);
  }
};

const bootstrap = async () => {
  await syncNeon();
  const app = createApp();
  const server = app.listen(envConfig.port, () => {
    console.log('================================================================');
    console.log(`⚖️  ${envConfig.appName}`);
    console.log(`🌐 Server running at: http://localhost:${envConfig.port}`);
    console.log(`📖 API Docs available at: http://localhost:${envConfig.port}${envConfig.apiPrefix}/docs`);
    console.log(`🩺 Health check: http://localhost:${envConfig.port}/api/health`);
    console.log(`🛡️  BCI Rule 36 Compliance Mode: ${envConfig.compliance.bciComplianceMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📜 DPDP Act 2023 Audit Logging: ${envConfig.compliance.dpdpAuditLogEnabled ? 'ACTIVE' : 'INACTIVE'}`);
    console.log('================================================================');
  });

  const handleShutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
    server.close(() => {
      console.log('[Server] HTTP connections closed. Platform service terminated safely.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

bootstrap();

