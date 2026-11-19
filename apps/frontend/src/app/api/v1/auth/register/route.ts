import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || '').trim();
    const rawPhone = String(body.phone || '').replace(/[\s\-\(\)]/g, '');
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const password = String(body.password || '');
    const role = body.role === 'LSP' ? 'LSP' : 'CITIZEN';
    const preferredLanguage = body.preferredLanguage || 'en';

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter your full legal name.' },
        { status: 400 }
      );
    }

    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    let cleanMobile = rawPhone.startsWith('+91')
      ? rawPhone.slice(3)
      : rawPhone.startsWith('91') && rawPhone.length === 12
      ? rawPhone.slice(2)
      : rawPhone;
    const formattedPhone = `+91${cleanMobile}`;

    // Check if user already exists
    let existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone: formattedPhone }, ...(email ? [{ email }] : [])],
      },
      include: { roles: true },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      // If it's an auto-created citizen profile, upgrade it seamlessly
      if (existing.fullName.startsWith('Citizen-')) {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName,
            passwordHash,
            email: email || existing.email,
            preferredLanguage,
            status: role === 'LSP' ? 'PENDING_VERIFICATION' : 'ACTIVE',
          },
          include: { roles: true },
        });

        const roles = updated.roles.map((r) => r.role);
        const accessToken = jwt.sign(
          { userId: updated.id, phone: updated.phone, email: updated.email, roles, fullName: updated.fullName },
          JWT_SECRET,
          { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign({ userId: updated.id }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({
          success: true,
          message: 'Account profile completed and activated successfully!',
          data: {
            user: {
              id: updated.id,
              phone: updated.phone,
              email: updated.email,
              fullName: updated.fullName,
              preferredLanguage: updated.preferredLanguage,
              status: updated.status,
            },
            roles,
            accessToken,
            refreshToken,
          },
        });
      }

      return NextResponse.json(
        { success: false, message: 'An account with this mobile number or email already exists. Please sign in with your password.' },
        { status: 400 }
      );
    }

    const userId = uuidv4();
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        phone: formattedPhone,
        email,
        passwordHash,
        fullName,
        preferredLanguage,
        status: role === 'LSP' ? 'PENDING_VERIFICATION' : 'ACTIVE',
        isPhoneVerified: false,
        isEmailVerified: !!email,
        roles: {
          create: { role },
        },
        wallet: {
          create: { monetaryBalanceINR: 0, rewardPointsBalance: 50 },
        },
      },
      include: { roles: true },
    });

    console.log(`[Vercel Serverless] Successfully saved registered user into Neon PostgreSQL: ${newUser.fullName} (${newUser.phone})`);

    const roles = newUser.roles.map((r) => r.role);
    const accessToken = jwt.sign(
      { userId: newUser.id, phone: newUser.phone, email: newUser.email, roles, fullName: newUser.fullName },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created and registered successfully in Neon PostgreSQL!',
        data: {
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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
