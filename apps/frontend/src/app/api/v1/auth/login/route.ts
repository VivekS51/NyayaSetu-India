import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both mobile/email and your password.' },
        { status: 400 }
      );
    }

    const clean = identifier.replace(/[\s\-\(\)]/g, '');
    let cleanMobile = clean.startsWith('+91')
      ? clean.slice(3)
      : clean.startsWith('91') && clean.length === 12
      ? clean.slice(2)
      : clean;
    const formattedPhone = `+91${cleanMobile}`;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { phone: formattedPhone },
          { phone: cleanMobile },
          { phone: clean },
        ],
      },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this identifier. Please register first.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid password. Please check your credentials.' },
        { status: 400 }
      );
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
      message: 'Sign in successful',
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
      },
    });
  } catch (error: any) {
    console.error('Password Login Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
