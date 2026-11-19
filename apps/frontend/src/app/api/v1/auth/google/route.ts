import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.fullName || '').trim() || 'Citizen';
    const avatarUrl = body.avatarUrl || null;
    const role = body.role === 'LSP' ? 'LSP' : 'CITIZEN';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address required for Google Sign-In.' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { roles: true },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const userId = uuidv4();
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          fullName,
          avatarUrl,
          phone: `+91-GOOGLE-${userId.slice(0, 8)}`,
          passwordHash: '$2a$10$eO0V4zQz2/wS60N8a81iYe2.4YQ0bM5yE9Z3v1fWfN2Yw7S6t9A.e',
          preferredLanguage: 'en',
          status: 'ACTIVE',
          isPhoneVerified: false,
          isEmailVerified: true,
          roles: {
            create: { role },
          },
          wallet: {
            create: { monetaryBalanceINR: 0, rewardPointsBalance: 50 },
          },
        },
        include: { roles: true },
      });
      console.log(`[Vercel Serverless] Created Google user in Neon PostgreSQL: ${email}`);
    }

    const roles = user.roles.map((r) => r.role);
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, email: user.email, roles, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
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
    console.error('Google Auth Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
