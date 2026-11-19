import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_NEON_DB_URL =
  'postgresql://neondb_owner:npg_MYs4BmpHL0Ed@ep-blue-credit-bdfp4ylx-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const envConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Incentive-Based Legal Marketplace India',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  databaseUrl: process.env.DATABASE_URL || DEFAULT_NEON_DB_URL,
  jwt: {
    secret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'legaltech_dev_access_secret_2026',
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'legaltech_dev_access_secret_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'legaltech_dev_refresh_secret_2026',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '591061ACiMZyf3sdSa6afc971eP1',
    templateId: process.env.MSG91_TEMPLATE_ID || '6afc949984b612b5030babc2',
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || '',
  },
  sms: {
    provider: process.env.SMS_GATEWAY_PROVIDER || 'MSG91',
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    devMockOtp: process.env.DEV_MOCK_OTP || '123456',
  },
  s3: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'MOCK_KEY',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'MOCK_SECRET',
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'legal-marketplace-docs-in',
  },
  compliance: {
    bciComplianceMode: process.env.BCI_COMPLIANCE_MODE !== 'false',
    dpdpAuditLogEnabled: process.env.DPDP_AUDIT_LOG_ENABLED !== 'false',
    platformGstNumber: process.env.PLATFORM_GST_NUMBER || '07AAAAA0000A1Z5',
  },
};
