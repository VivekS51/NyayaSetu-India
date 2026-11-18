import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { envConfig } from '../../config/env.config';
import { UserSessionPayload } from '../types';

export class SecurityUtils {
  private static readonly SALT_ROUNDS = 10;

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateAccessToken(payload: UserSessionPayload): string {
    return jwt.sign(payload, envConfig.jwt.accessSecret, {
      expiresIn: envConfig.jwt.accessExpiry as any,
    });
  }

  public static generateRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, envConfig.jwt.refreshSecret, {
      expiresIn: envConfig.jwt.refreshExpiry as any,
      jwtid: crypto.randomUUID(),
    });
  }

  public static verifyAccessToken(token: string): UserSessionPayload {
    return jwt.verify(token, envConfig.jwt.accessSecret) as UserSessionPayload;
  }

  public static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, envConfig.jwt.refreshSecret) as { userId: string };
  }

  public static generateNumericOtp(length: number = 6): string {
    if (envConfig.nodeEnv === 'development' || envConfig.nodeEnv === 'test') {
      return envConfig.sms.devMockOtp;
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  public static maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 10) return phone;
    const visibleStart = phone.slice(0, 3);
    const visibleEnd = phone.slice(-2);
    return `${visibleStart}******${visibleEnd}`;
  }

  public static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  public static maskAadhaar(aadhaar: string): string {
    const clean = aadhaar.replace(/[^0-9]/g, '');
    if (clean.length !== 12) return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }

  public static sanitizeHtml(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static generateAuditHash(payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  public static generateBookingReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `IN-LEG-${timestamp}-${random}`;
  }
}
