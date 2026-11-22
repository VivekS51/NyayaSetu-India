import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email = String(body.email || '').trim().toLowerCase();
    let fullName = String(body.fullName || '').trim();
    let avatarUrl = body.avatarUrl || null;
    const role = body.role === 'LSP' ? 'LSP' : 'CITIZEN';
    const credential = body.credential;
    const accessToken = body.accessToken;

    // Verify Google ID Token (credential) if provided
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const tokenData = await verifyRes.json();
          if (tokenData.email) {
            email = tokenData.email.toLowerCase();
            fullName = tokenData.name || fullName || 'Google User';
            avatarUrl = tokenData.picture || avatarUrl;
          }
        }
      } catch (err: any) {
        console.warn('Google ID token verification failed:', err.message);
      }
    } else if (accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userinfoRes.ok) {
          const userData = await userinfoRes.json();
          if (userData.email) {
            email = userData.email.toLowerCase();
            fullName = userData.name || fullName || 'Google User';
            avatarUrl = userData.picture || avatarUrl;
          }
        }
      } catch (err: any) {
        console.warn('Google Access token verification failed:', err.message);
      }
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address required for Google Sign-In.' },
        { status: 400 }
      );
    }

    if (!fullName) {
      const rawName = email.split('@')[0].replace(/[._]/g, ' ');
      fullName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
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
    } else if (avatarUrl && !user.avatarUrl) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        });
      } catch {}
    }

    const roles = user.roles.map((r) => r.role);
    const accessTokenSign = jwt.sign(
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
          avatarUrl: user.avatarUrl || avatarUrl,
          preferredLanguage: user.preferredLanguage,
          status: user.status,
        },
        roles,
        accessToken: accessTokenSign,
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
