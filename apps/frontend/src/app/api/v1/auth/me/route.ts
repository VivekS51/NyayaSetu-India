import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'nyayasetu_production_jwt_secret_2026';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Bearer session token required.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Session expired or invalid. Please sign in again.' },
        { status: 401 }
      );
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid session payload.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        wallet: true,
        providerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found in registry.' },
        { status: 404 }
      );
    }

    const roles = user.roles.map((r) => r.role);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          preferredLanguage: user.preferredLanguage,
          status: user.status,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        roles,
        wallet: user.wallet
          ? {
              monetaryBalanceINR: Number(user.wallet.monetaryBalanceINR),
              rewardPointsBalance: user.wallet.rewardPointsBalance,
            }
          : { monetaryBalanceINR: 0, rewardPointsBalance: 25 },
        providerProfile: user.providerProfile || null,
      },
    });
  } catch (error: any) {
    console.error('Account /me Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve account details.' },
      { status: 500 }
    );
  }
}
