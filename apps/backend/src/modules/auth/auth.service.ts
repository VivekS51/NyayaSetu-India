import { v4 as uuidv4 } from 'uuid';
import { dbStore, UserRecord } from '../../config/database';
import { prisma } from '../../config/prisma';
import { SecurityUtils } from '../../common/utils/security.utils';
import { RoleType, AccountStatus, PointsType, UserSessionPayload } from '../../common/types';
import { envConfig } from '../../config/env.config';
import { SendOtpInput, VerifyOtpInput, RegisterInput, LoginWithPasswordInput, GoogleAuthInput } from './auth.dto';
import { notificationsService } from '../notifications/notifications.service';

export class AuthService {
  public async sendOtp(input: SendOtpInput): Promise<{ message: string; expiresInMinutes: number; mockOtp?: string }> {
    const formattedPhone = this.normalizePhone(input.phone);

    // Enforce OTP resend cooldown (minimum 30 seconds between requests for same mobile)
    const existingOtp = dbStore.otps.get(formattedPhone);
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsedMs = Date.now() - existingOtp.lastSentAt.getTime();
      if (elapsedMs < 30 * 1000) {
        const waitSec = Math.ceil((30 * 1000 - elapsedMs) / 1000);
        throw new Error(`Please wait ${waitSec} seconds before requesting another OTP.`);
      }
    }

    const otpCode = SecurityUtils.generateNumericOtp(6);
    const expiresAt = new Date(Date.now() + envConfig.sms.otpExpiryMinutes * 60 * 1000);

    dbStore.otps.set(formattedPhone, {
      code: otpCode,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    });

    // Dispatch real SMS via MSG91
    if (envConfig.msg91.authKey && envConfig.msg91.templateId) {
      await this.dispatchMsg91Otp(formattedPhone, otpCode);
    } else {
      console.log(`[SMS Gateway Simulated] OTP sent to ${SecurityUtils.maskPhoneNumber(formattedPhone)}: ${otpCode}`);
    }

    return {
      message: `OTP successfully dispatched to ${SecurityUtils.maskPhoneNumber(formattedPhone)}`,
      expiresInMinutes: envConfig.sms.otpExpiryMinutes,
    };
  }

  private async dispatchMsg91Otp(formattedPhone: string, otpCode: string): Promise<void> {
    try {
      let cleanMobile = formattedPhone.replace(/\D/g, '');
      if (cleanMobile.length === 10) {
        cleanMobile = `91${cleanMobile}`;
      } else if (cleanMobile.startsWith('0') && cleanMobile.length === 11) {
        cleanMobile = `91${cleanMobile.slice(1)}`;
      }

      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(envConfig.msg91.templateId)}&mobile=${encodeURIComponent(cleanMobile)}&authkey=${encodeURIComponent(envConfig.msg91.authKey)}&otp=${encodeURIComponent(otpCode)}&otp_length=6&otp_expiry=10`;

      console.log(`[MSG91 Gateway] Dispatching OTP ${otpCode} to ${cleanMobile}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: envConfig.msg91.authKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          otp: otpCode,
          OTP: otpCode,
          var1: otpCode,
          code: otpCode,
        }),
      });

      const resData = (await response.json()) as any;
      console.log(`[MSG91 Gateway] Response for ${cleanMobile}:`, resData);

      if (resData.type === 'error') {
        console.warn(`[MSG91 Gateway Warning] ${resData.message}`);
      }
    } catch (err: any) {
      console.error(`[MSG91 Gateway Failure] Could not connect to MSG91: ${err.message}`);
    }
  }

  public async verifyOtp(input: VerifyOtpInput): Promise<{
    user: Partial<UserRecord>;
    roles: RoleType[];
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const formattedPhone = this.normalizePhone(input.phone);
    const otpRecord = dbStore.otps.get(formattedPhone);

    if (!otpRecord) {
      throw new Error('No OTP request found for this phone number. Please request an OTP first.');
    }

    if (new Date() > otpRecord.expiresAt) {
      dbStore.otps.delete(formattedPhone);
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (otpRecord.code !== input.otp && input.otp !== envConfig.sms.devMockOtp) {
      otpRecord.attempts++;
      if (otpRecord.attempts >= 3) {
        dbStore.otps.delete(formattedPhone);
        throw new Error('Too many invalid attempts. This OTP has been invalidated for security.');
      }
      throw new Error(`Invalid OTP. You have ${3 - otpRecord.attempts} attempt(s) remaining.`);
    }

    // OTP Verified - clear it
    dbStore.otps.delete(formattedPhone);

    // Look for existing user
    let user = dbStore.users.find((u) => u.phone === formattedPhone);
    let isNewUser = false;

    if (!user) {
      // Auto-register Citizen if user does not exist yet via OTP
      isNewUser = true;
      const newUserId = uuidv4();
      const defaultPasswordHash = await SecurityUtils.hashPassword(uuidv4());
      user = {
        id: newUserId,
        phone: formattedPhone,
        email: null,
        passwordHash: defaultPasswordHash,
        fullName: `Citizen-${formattedPhone.slice(-4)}`,
        preferredLanguage: 'en',
        status: AccountStatus.ACTIVE,
        isPhoneVerified: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbStore.users.push(user);

      // Assign Citizen Role
      dbStore.userRoles.push({
        id: uuidv4(),
        userId: newUserId,
        role: RoleType.CITIZEN,
        createdAt: new Date(),
      });

      // Initialize Wallet
      const walletId = uuidv4();
      dbStore.wallets.push({
        id: walletId,
        userId: newUserId,
        monetaryBalanceINR: 0,
        rewardPointsBalance: 25,
        updatedAt: new Date(),
      });

      // Welcome bonus points
      dbStore.pointsLedger.push({
        id: uuidv4(),
        walletId,
        points: 25,
        type: PointsType.CREDIT,
        referenceType: 'WELCOME_BONUS',
        referenceId: newUserId,
        description: 'Welcome gift: 25 initial loyalty points for platform signup.',
        balanceAfter: 25,
        createdAt: new Date(),
      });

      // Multi-channel welcome notification
      await notificationsService.triggerSignupNotification(newUserId);

      // Persist to Neon PostgreSQL Database
      try {
        await prisma.user.create({
          data: {
            id: newUserId,
            phone: formattedPhone,
            email: null,
            passwordHash: defaultPasswordHash,
            fullName: user.fullName,
            preferredLanguage: 'en',
            status: 'ACTIVE',
            isPhoneVerified: true,
            isEmailVerified: false,
            roles: {
              create: {
                role: 'CITIZEN',
              },
            },
            wallet: {
              create: {
                monetaryBalanceINR: 0,
                rewardPointsBalance: 25,
              },
            },
          },
        });
        console.log(`[Neon DB Sync] Persisted OTP user ${formattedPhone} to Neon PostgreSQL.`);
      } catch (dbErr: any) {
        console.error('[Neon DB Error] Could not persist OTP user:', dbErr.message);
      }
    } else {
      user.isPhoneVerified = true;
      user.updatedAt = new Date();

      // Update phone verification in Neon PostgreSQL
      try {
        await prisma.user.updateMany({
          where: { phone: formattedPhone },
          data: { isPhoneVerified: true },
        });
      } catch (dbErr: any) {
        console.error('[Neon DB Error] Could not update phone verification:', dbErr.message);
      }
    }

    const roles = dbStore.userRoles.filter((r) => r.userId === user!.id).map((r) => r.role);
    const providerProfile = dbStore.providerProfiles.find((p) => p.userId === user!.id);

    const sessionPayload: UserSessionPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      roles,
      fullName: user.fullName,
      providerProfileId: providerProfile?.id,
    };

    const accessToken = SecurityUtils.generateAccessToken(sessionPayload);
    const refreshToken = SecurityUtils.generateRefreshToken({ userId: user.id });

    // DPDP statutory audit entry
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: user.id,
      action: isNewUser ? 'USER_REGISTERED_OTP' : 'USER_LOGIN_OTP',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { phone: SecurityUtils.maskPhoneNumber(user.phone), roles },
      createdAt: new Date(),
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
      },
      roles,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  public async register(input: RegisterInput): Promise<{
    user: Partial<UserRecord>;
    roles: RoleType[];
    accessToken: string;
    refreshToken: string;
  }> {
    const formattedPhone = this.normalizePhone(input.phone);

    // Check unique constraints
    const existingPhone = dbStore.users.find((u) => u.phone === formattedPhone);
    if (existingPhone) {
      // If the user was auto-created during OTP login without completing profile, upgrade it
      if (existingPhone.fullName.startsWith('Citizen-')) {
        existingPhone.fullName = input.fullName.trim();
        existingPhone.passwordHash = await SecurityUtils.hashPassword(input.password);
        existingPhone.email = input.email ? input.email.toLowerCase().trim() : existingPhone.email;
        existingPhone.preferredLanguage = input.preferredLanguage;
        existingPhone.updatedAt = new Date();

        // Update in Neon PostgreSQL
        try {
          await prisma.user.updateMany({
            where: { phone: formattedPhone },
            data: {
              fullName: existingPhone.fullName,
              passwordHash: existingPhone.passwordHash,
              email: existingPhone.email,
              preferredLanguage: existingPhone.preferredLanguage,
            },
          });
        } catch (dbErr: any) {
          console.error('[Neon DB Error] Could not update user in Neon:', dbErr.message);
        }

        if (input.role === RoleType.LSP) {
          existingPhone.status = AccountStatus.PENDING_VERIFICATION;
          const hasLspRole = dbStore.userRoles.some((r) => r.userId === existingPhone.id && r.role === RoleType.LSP);
          if (!hasLspRole) {
            dbStore.userRoles.push({
              id: uuidv4(),
              userId: existingPhone.id,
              role: RoleType.LSP,
              createdAt: new Date(),
            });
          }
        }

        const roles = dbStore.userRoles.filter((r) => r.userId === existingPhone.id).map((r) => r.role);
        const providerProfile = dbStore.providerProfiles.find((p) => p.userId === existingPhone.id);

        const sessionPayload: UserSessionPayload = {
          userId: existingPhone.id,
          phone: formattedPhone,
          email: existingPhone.email,
          roles,
          fullName: existingPhone.fullName,
          providerProfileId: providerProfile?.id,
        };

        const accessToken = SecurityUtils.generateAccessToken(sessionPayload);
        const refreshToken = SecurityUtils.generateRefreshToken({ userId: existingPhone.id });

        return {
          user: {
            id: existingPhone.id,
            phone: existingPhone.phone,
            email: existingPhone.email,
            fullName: existingPhone.fullName,
            preferredLanguage: existingPhone.preferredLanguage,
            status: existingPhone.status,
          },
          roles,
          accessToken,
          refreshToken,
        };
      }
      throw new Error('A user with this mobile number already exists. Please log in.');
    }

    const normalizedEmail = input.email ? input.email.toLowerCase().trim() : null;
    if (normalizedEmail) {
      const existingEmail = dbStore.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (existingEmail) {
        throw new Error('A user with this email address already exists.');
      }
    }

    const userId = uuidv4();
    const passwordHash = await SecurityUtils.hashPassword(input.password);
    const now = new Date();

    const newUser: UserRecord = {
      id: userId,
      phone: formattedPhone,
      email: normalizedEmail,
      passwordHash,
      fullName: input.fullName.trim(),
      preferredLanguage: input.preferredLanguage,
      status: input.role === RoleType.LSP ? AccountStatus.PENDING_VERIFICATION : AccountStatus.ACTIVE,
      isPhoneVerified: false,
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.users.push(newUser);

    // Assign Role
    dbStore.userRoles.push({
      id: uuidv4(),
      userId,
      role: input.role,
      createdAt: now,
    });

    let providerProfileId: string | undefined;

    // If LSP, initialize draft profile
    if (input.role === RoleType.LSP) {
      providerProfileId = uuidv4();
      dbStore.providerProfiles.push({
        id: providerProfileId,
        userId,
        providerType: 'ADVOCATE' as any,
        enrolmentYear: null,
        stateBarCouncil: null,
        barRegistrationNo: null,
        notaryAppointmentNo: null,
        primaryCourt: null,
        district: '',
        state: '',
        pincode: '',
        experienceYears: 0,
        languagesSpoken: [input.preferredLanguage],
        practiceAreas: [],
        bio: null,
        consultationFeeINR: 0,
        isAvailableForProBono: false,
        verificationStatus: 'DRAFT' as any,
        rejectionReason: null,
        verifiedAt: null,
        complianceAccepted: false,
        complianceAcceptedAt: null,
        totalPoints: 0,
        tierId: 'tier-bronze-01',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize wallet
    const walletId = uuidv4();
    dbStore.wallets.push({
      id: walletId,
      userId,
      monetaryBalanceINR: 0,
      rewardPointsBalance: 50, // Welcome points
      updatedAt: now,
    });

    dbStore.pointsLedger.push({
      id: uuidv4(),
      walletId,
      points: 50,
      type: PointsType.CREDIT,
      referenceType: 'ONBOARDING_INITIAL',
      referenceId: userId,
      description: 'Account activation reward: 50 points credited.',
      balanceAfter: 50,
      createdAt: now,
    });

    // Record DPDP Consent
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId,
      action: 'DPDP_CONSENT_CAPTURED',
      resourceType: 'ConsentNotice',
      resourceId: userId,
      ipAddress: null,
      userAgent: null,
      diffPayload: { consentGranted: true, statutoryAct: 'DPDP Act 2023 Section 6' },
      createdAt: now,
    });

    const roles = [input.role];
    const sessionPayload: UserSessionPayload = {
      userId,
      phone: formattedPhone,
      email: newUser.email,
      roles,
      fullName: newUser.fullName,
      providerProfileId,
    };

    const accessToken = SecurityUtils.generateAccessToken(sessionPayload);
    const refreshToken = SecurityUtils.generateRefreshToken({ userId });

    // Multi-channel welcome notification
    await notificationsService.triggerSignupNotification(userId);

    // Persist to Neon PostgreSQL Database
    try {
      await prisma.user.create({
        data: {
          id: userId,
          phone: formattedPhone,
          email: normalizedEmail,
          passwordHash,
          fullName: newUser.fullName,
          preferredLanguage: newUser.preferredLanguage,
          status: newUser.status as any,
          isPhoneVerified: false,
          isEmailVerified: !!normalizedEmail,
          roles: {
            create: {
              role: input.role,
            },
          },
          wallet: {
            create: {
              monetaryBalanceINR: 0,
              rewardPointsBalance: 50,
            },
          },
        },
      });
      console.log(`[Neon DB Sync] Persisted registered user ${newUser.fullName} (${formattedPhone}) to Neon PostgreSQL.`);
    } catch (dbErr: any) {
      console.error('[Neon DB Error] Could not persist registered user:', dbErr.message);
    }

    return {
      user: {
        id: newUser.id,
        phone: newUser.phone,
        email: newUser.email,
        fullName: newUser.fullName,
        preferredLanguage: newUser.preferredLanguage,
        status: newUser.status,
      },
      roles,
      accessToken,
      refreshToken,
    };
  }

  public async loginWithPassword(input: LoginWithPasswordInput): Promise<{
    user: Partial<UserRecord>;
    roles: RoleType[];
    accessToken: string;
    refreshToken: string;
  }> {
    const cleanIdentifier = input.identifier.trim().toLowerCase();
    const attemptRecord = dbStore.loginAttempts.get(cleanIdentifier);
    if (attemptRecord?.lockedUntil && attemptRecord.lockedUntil > new Date()) {
      const waitSec = Math.ceil((attemptRecord.lockedUntil.getTime() - Date.now()) / 1000);
      throw new Error(`Account temporarily locked due to multiple failed login attempts. Please try again in ${waitSec} second(s).`);
    }

    const normalizedPhone = this.normalizePhone(input.identifier);
    let user = dbStore.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        u.phone === input.identifier ||
        u.phone === normalizedPhone
    );

    if (!user) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: cleanIdentifier, mode: 'insensitive' } },
              { phone: input.identifier },
              { phone: normalizedPhone },
            ],
          },
          include: { roles: true },
        });

        if (dbUser) {
          user = {
            id: dbUser.id,
            phone: dbUser.phone || normalizedPhone,
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            fullName: dbUser.fullName,
            preferredLanguage: dbUser.preferredLanguage,
            status: dbUser.status as any,
            isPhoneVerified: dbUser.isPhoneVerified,
            isEmailVerified: dbUser.isEmailVerified,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
          dbStore.users.push(user);
          for (const r of dbUser.roles) {
            dbStore.userRoles.push({
              id: r.id,
              userId: r.userId,
              role: r.role as any,
              createdAt: r.createdAt,
            });
          }
        }
      } catch (dbErr: any) {
        console.error('[Neon DB Query Error]:', dbErr.message);
      }
    }

    if (!user) {
      const count = (attemptRecord?.count || 0) + 1;
      const lockedUntil = count >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      dbStore.loginAttempts.set(cleanIdentifier, { count, lockedUntil });
      if (count >= 5) {
        throw new Error('Too many failed attempts. Account locked for 15 minutes.');
      }
      throw new Error('Invalid credentials provided.');
    }

    const isMatch = await SecurityUtils.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      const count = (attemptRecord?.count || 0) + 1;
      const lockedUntil = count >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      dbStore.loginAttempts.set(cleanIdentifier, { count, lockedUntil });
      if (count >= 5) {
        throw new Error('Too many failed attempts. Account locked for 15 minutes.');
      }
      throw new Error('Invalid credentials provided.');
    }

    // Reset failed login attempts on success
    dbStore.loginAttempts.delete(cleanIdentifier);

    if (user.status === AccountStatus.SUSPENDED) {
      throw new Error('Your account is currently suspended. Please contact platform grievance redressal.');
    }

    const roles = dbStore.userRoles.filter((r) => r.userId === user.id).map((r) => r.role);
    const providerProfile = dbStore.providerProfiles.find((p) => p.userId === user.id);

    const sessionPayload: UserSessionPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      roles,
      fullName: user.fullName,
      providerProfileId: providerProfile?.id,
    };

    const accessToken = SecurityUtils.generateAccessToken(sessionPayload);
    const refreshToken = SecurityUtils.generateRefreshToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
      },
      roles,
      accessToken,
      refreshToken,
    };
  }

  public async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (dbStore.revokedTokens.has(refreshToken)) {
        throw new Error('Refresh token has been revoked or already used.');
      }

      const decoded = SecurityUtils.verifyRefreshToken(refreshToken);
      const user = dbStore.users.find((u) => u.id === decoded.userId);

      if (!user || user.status === AccountStatus.SUSPENDED) {
        throw new Error('User account inactive');
      }

      // Rotate: revoke the used refresh token
      dbStore.revokedTokens.add(refreshToken);

      const roles = dbStore.userRoles.filter((r) => r.userId === user.id).map((r) => r.role);
      const providerProfile = dbStore.providerProfiles.find((p) => p.userId === user.id);

      const sessionPayload: UserSessionPayload = {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        roles,
        fullName: user.fullName,
        providerProfileId: providerProfile?.id,
      };

      const newAccessToken = SecurityUtils.generateAccessToken(sessionPayload);
      const newRefreshToken = SecurityUtils.generateRefreshToken({ userId: user.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      if (err.message.includes('revoked')) throw err;
      throw new Error('Invalid or expired refresh token. Please sign in again.');
    }
  }

  public async logout(userId: string, accessToken?: string, refreshToken?: string): Promise<{ message: string }> {
    if (accessToken) dbStore.revokedTokens.add(accessToken);
    if (refreshToken) dbStore.revokedTokens.add(refreshToken);

    dbStore.auditLogs.push({
      id: uuidv4(),
      userId,
      action: 'USER_LOGOUT',
      resourceType: 'UserSession',
      resourceId: userId,
      ipAddress: null,
      userAgent: null,
      diffPayload: { status: 'SESSION_REVOKED' },
      createdAt: new Date(),
    });

    return { message: 'Signed out successfully. Session tokens revoked.' };
  }

  public async requestPasswordReset(identifier: string): Promise<{ message: string; phone?: string }> {
    const clean = identifier.trim().toLowerCase();
    const normalized = this.normalizePhone(identifier);
    const user = dbStore.users.find(
      (u) => (u.email && u.email.toLowerCase() === clean) || u.phone === identifier || u.phone === normalized
    );

    if (!user) {
      return { message: 'If an account exists with this credential, a password reset OTP has been sent.' };
    }

    await this.sendOtp({ phone: user.phone, purpose: 'LOGIN' });
    return {
      message: 'Password reset OTP has been dispatched to your registered mobile number.',
      phone: SecurityUtils.maskPhoneNumber(user.phone),
    };
  }

  public async confirmPasswordReset(phone: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const formattedPhone = this.normalizePhone(phone);
    const user = dbStore.users.find((u) => u.phone === formattedPhone);
    if (!user) {
      throw new Error('User not found.');
    }

    // Verify OTP
    const otpRecord = dbStore.otps.get(formattedPhone);
    if (!otpRecord) {
      throw new Error('No OTP request found for this phone number. Please request an OTP first.');
    }
    if (new Date() > otpRecord.expiresAt) {
      dbStore.otps.delete(formattedPhone);
      throw new Error('OTP has expired. Please request a new one.');
    }
    if (otpRecord.code !== otp && otp !== envConfig.sms.devMockOtp) {
      throw new Error('Invalid OTP code.');
    }

    // Invalidate OTP immediately upon use
    dbStore.otps.delete(formattedPhone);

    // Update password
    user.passwordHash = await SecurityUtils.hashPassword(newPassword);
    user.updatedAt = new Date();

    // Audit log
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'UserAccount',
      resourceId: user.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { method: 'MOBILE_OTP_RESET' },
      createdAt: new Date(),
    });

    return { message: 'Password has been reset successfully. Please sign in with your new password.' };
  }

  public async googleAuth(input: GoogleAuthInput): Promise<{
    user: Partial<UserRecord>;
    roles: RoleType[];
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const normalizedEmail = input.email.toLowerCase().trim();
    let user = dbStore.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    let isNewUser = false;

    if (!user) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          include: { roles: true },
        });
        if (dbUser) {
          user = {
            id: dbUser.id,
            phone: dbUser.phone || '',
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            fullName: dbUser.fullName,
            avatarUrl: dbUser.avatarUrl,
            preferredLanguage: dbUser.preferredLanguage,
            status: dbUser.status as any,
            isPhoneVerified: dbUser.isPhoneVerified,
            isEmailVerified: dbUser.isEmailVerified,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
          dbStore.users.push(user);
          for (const r of dbUser.roles) {
            dbStore.userRoles.push({
              id: r.id,
              userId: r.userId,
              role: r.role as any,
              createdAt: r.createdAt,
            });
          }
        }
      } catch (err: any) {
        console.error('[Neon DB Error]:', err.message);
      }
    }

    if (!user) {
      isNewUser = true;
      const userId = uuidv4();
      const defaultPasswordHash = await SecurityUtils.hashPassword(uuidv4());
      const now = new Date();

      user = {
        id: userId,
        phone: `+91-GOOGLE-${userId.slice(0, 8)}`,
        email: normalizedEmail,
        passwordHash: defaultPasswordHash,
        fullName: input.fullName.trim(),
        avatarUrl: input.avatarUrl || null,
        preferredLanguage: 'en',
        status: AccountStatus.ACTIVE,
        isPhoneVerified: false,
        isEmailVerified: true,
        createdAt: now,
        updatedAt: now,
      };
      dbStore.users.push(user);

      dbStore.userRoles.push({
        id: uuidv4(),
        userId,
        role: input.role,
        createdAt: now,
      });

      const walletId = uuidv4();
      dbStore.wallets.push({
        id: walletId,
        userId,
        monetaryBalanceINR: 0,
        rewardPointsBalance: 50,
        updatedAt: now,
      });

      try {
        await prisma.user.create({
          data: {
            id: userId,
            email: normalizedEmail,
            phone: user.phone,
            passwordHash: defaultPasswordHash,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            preferredLanguage: 'en',
            status: 'ACTIVE',
            isPhoneVerified: false,
            isEmailVerified: true,
            roles: {
              create: {
                role: input.role,
              },
            },
            wallet: {
              create: {
                monetaryBalanceINR: 0,
                rewardPointsBalance: 50,
              },
            },
          },
        });
        console.log(`[Neon DB Sync] Persisted Google user ${normalizedEmail} to Neon PostgreSQL!`);
      } catch (dbErr: any) {
        console.error('[Neon DB Error] Failed to persist Google user:', dbErr.message);
      }
    }

    const roles = dbStore.userRoles.filter((r) => r.userId === user!.id).map((r) => r.role);
    const sessionPayload: UserSessionPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      roles,
      fullName: user.fullName,
    };

    const accessToken = SecurityUtils.generateAccessToken(sessionPayload);
    const refreshToken = SecurityUtils.generateRefreshToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
      },
      roles,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  public async getMe(userId: string) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const roles = dbStore.userRoles.filter((r) => r.userId === user.id).map((r) => r.role);
    const providerProfile = dbStore.providerProfiles.find((p) => p.userId === user.id);
    const wallet = dbStore.wallets.find((w) => w.userId === user.id);

    let tier = null;
    let badges: any[] = [];

    if (providerProfile) {
      tier = dbStore.tiers.find((t) => t.id === providerProfile.tierId);
      const earnedBadges = dbStore.providerBadges.filter((b) => b.providerProfileId === providerProfile.id);
      badges = earnedBadges.map((eb) => {
        const badgeDef = dbStore.badges.find((b) => b.id === eb.badgeId);
        return {
          ...badgeDef,
          awardedAt: eb.awardedAt,
        };
      });
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      roles,
      providerProfile: providerProfile
        ? {
            id: providerProfile.id,
            providerType: providerProfile.providerType,
            verificationStatus: providerProfile.verificationStatus,
            barRegistrationNo: providerProfile.barRegistrationNo,
            stateBarCouncil: providerProfile.stateBarCouncil,
            primaryCourt: providerProfile.primaryCourt,
            district: providerProfile.district,
            state: providerProfile.state,
            consultationFeeINR: providerProfile.consultationFeeINR,
            totalPoints: providerProfile.totalPoints,
            complianceAccepted: providerProfile.complianceAccepted,
            tier,
            badges,
          }
        : null,
      wallet: wallet
        ? {
            monetaryBalanceINR: wallet.monetaryBalanceINR,
            rewardPointsBalance: wallet.rewardPointsBalance,
          }
        : null,
    };
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    return cleaned;
  }
}

