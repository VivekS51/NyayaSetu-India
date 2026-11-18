import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { complianceMiddleware } from './common/middleware/compliance.middleware';
import { globalErrorHandler } from './common/middleware/error.middleware';
import { authRouter } from './modules/auth/auth.controller';
import { onboardingRouter } from './modules/onboarding/onboarding.controller';
import { verificationRouter } from './modules/verification/verification.controller';
import { bookingsRouter } from './modules/bookings/bookings.controller';
import { paymentsRouter } from './modules/payments/payments.controller';
import { chatRouter } from './modules/chat/chat.controller';
import { reviewsRouter } from './modules/reviews/reviews.controller';
import { incentivesRouter } from './modules/incentives/incentives.controller';
import { notificationsRouter } from './modules/notifications/notifications.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { providersRouter } from './modules/providers/providers.controller';
import { complianceRouter } from './modules/compliance/compliance.controller';
import { envConfig } from './config/env.config';

export const createApp = (): Application => {
  const app = express();

  // Standard Security & Body Parsers
  app.use(
    cors({
      origin: '*', // Configurable in production
      credentials: true,
    })
  );
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Regulatory & Statutory Compliance Headers (BCI Rule 36, DPDP Act 2023)
  app.use(complianceMiddleware);

  // Health Check Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: envConfig.appName,
      timestamp: new Date().toISOString(),
      bciComplianceMode: envConfig.compliance.bciComplianceMode,
      environment: envConfig.nodeEnv,
    });
  });

  // Core API Route Mounts
  const apiPrefix = envConfig.apiPrefix;
  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/onboarding`, onboardingRouter);
  app.use(`${apiPrefix}/admin/verification`, verificationRouter);
  app.use(`${apiPrefix}/bookings`, bookingsRouter);
  app.use(`${apiPrefix}/payments`, paymentsRouter);
  app.use(`${apiPrefix}/chat`, chatRouter);
  app.use(`${apiPrefix}/reviews`, reviewsRouter);
  app.use(`${apiPrefix}/incentives`, incentivesRouter);
  app.use(`${apiPrefix}/notifications`, notificationsRouter);
  app.use(`${apiPrefix}/admin`, adminRouter);
  app.use(`${apiPrefix}/providers`, providersRouter);
  app.use(`${apiPrefix}/discovery/providers`, providersRouter);
  app.use(`${apiPrefix}/compliance`, complianceRouter);
  app.use(`${apiPrefix}`, complianceRouter);

  // OpenAPI Swagger Interactive Specs (Served as JSON metadata)
  app.get(`${apiPrefix}/docs`, (req: Request, res: Response) => {
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'Incentive-Based Legal Marketplace India API',
        version: '1.0.0',
        description:
          'Production-grade RESTful API for verified legal service provider onboarding, BCI Rule 36 compliance, and citizen legal assistance.',
      },
      servers: [{ url: `http://localhost:${envConfig.port}${apiPrefix}` }],
      paths: {
        '/auth/otp/send': { post: { summary: 'Send OTP to Indian mobile number' } },
        '/auth/otp/verify': { post: { summary: 'Verify OTP & issue JWT session' } },
        '/auth/register': { post: { summary: 'Register Citizen or Legal Service Provider' } },
        '/auth/login': { post: { summary: 'Password login' } },
        '/auth/me': { get: { summary: 'Get current user identity, tier, & wallet' } },
        '/onboarding/status': { get: { summary: 'Get LSP onboarding wizard progress' } },
        '/onboarding/step-1': { post: { summary: 'Save basic details & location' } },
        '/onboarding/step-2': { post: { summary: 'Save professional credentials & court jurisdiction' } },
        '/onboarding/step-3/upload-url': { post: { summary: 'Generate presigned S3 upload URL' } },
        '/onboarding/step-3/confirm-document': { post: { summary: 'Register uploaded credential document' } },
        '/onboarding/step-4/submit': { post: { summary: 'Sign BCI Rule 36 consent & submit for review' } },
        '/admin/verification/queue': { get: { summary: 'List pending verifications (Admin/Verifier)' } },
        '/admin/verification/{id}/dossier': { get: { summary: 'Inspect full provider dossier' } },
        '/admin/verification/{id}/decide': { post: { summary: 'Approve or reject verification' } },
      },
    });
  });

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
};

