import { NextRequest, NextResponse } from 'next/server';
import { prisma, serverOtps } from '@/lib/server-db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || '').replace(/[\s\-\(\)]/g, '');
    const enteredOtp = String(body.otp || '').trim();

    let cleanMobile = rawPhone.startsWith('+91')
      ? rawPhone.slice(3)
      : rawPhone.startsWith('91') && rawPhone.length === 12
      ? rawPhone.slice(2)
      : rawPhone;
    const formattedPhone = `+91${cleanMobile}`;

    const record = serverOtps.get(formattedPhone) || serverOtps.get(cleanMobile);
    const isMock = enteredOtp === '123456';
    const isMatch = record && record.code === enteredOtp;

    if (!isMatch && !isMock) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code. Please check your OTP or use 123456.' },
        { status: 400 }
      );
    }

    serverOtps.delete(formattedPhone);
    serverOtps.delete(cleanMobile);

    // Look for existing user in Neon PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: formattedPhone }, { phone: cleanMobile }],
      },
      include: { roles: true },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const newUserId = uuidv4();
      user = await prisma.user.create({
        data: {
          id: newUserId,
          phone: formattedPhone,
          fullName: `Citizen-${cleanMobile.slice(-4)}`,
          passwordHash: '$2a$10$eO0V4zQz2/wS60N8a81iYe2.4YQ0bM5yE9Z3v1fWfN2Yw7S6t9A.e',
          preferredLanguage: 'en',
          status: 'ACTIVE',
          isPhoneVerified: true,
          isEmailVerified: false,
          roles: {
            create: { role: 'CITIZEN' },
          },
          wallet: {
            create: { monetaryBalanceINR: 0, rewardPointsBalance: 25 },
          },
        },
        include: { roles: true },
      });
      console.log(`[Vercel Serverless] Auto-registered Citizen in Neon PostgreSQL: ${formattedPhone}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    const roles = user.roles.map((r) => r.role);
    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      roles,
      fullName: user.fullName,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified and session established',
      data: {
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
      },
    });
  } catch (error: any) {
    console.error('OTP Verify Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
