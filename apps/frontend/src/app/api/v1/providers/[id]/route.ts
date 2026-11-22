import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const dbProfile = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        tier: true,
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (dbProfile) {
      return NextResponse.json({
        success: true,
        data: {
          id: dbProfile.id,
          fullName: dbProfile.user.fullName,
          providerType: dbProfile.providerType,
          stateBarCouncil: dbProfile.stateBarCouncil || undefined,
          barRegistrationNo: dbProfile.barRegistrationNo || undefined,
          notaryAppointmentNo: dbProfile.notaryAppointmentNo || undefined,
          primaryCourt: dbProfile.primaryCourt || 'High Court of Jurisdiction',
          district: dbProfile.district,
          state: dbProfile.state,
          experienceYears: dbProfile.experienceYears,
          practiceAreas: dbProfile.practiceAreas,
          languagesSpoken: dbProfile.languagesSpoken,
          consultationFeeINR: Number(dbProfile.consultationFeeINR) || 750,
          isAvailableForProBono: dbProfile.isAvailableForProBono,
          verificationStatus: dbProfile.verificationStatus,
          tier: {
            level: (dbProfile.tier?.level || 'SILVER') as any,
            name: dbProfile.tier?.name || 'Silver Practitioner',
          },
          badges: dbProfile.badges.map((b) => ({
            code: b.badge?.code || 'VERIFIED_PROVIDER',
            title: b.badge?.title || 'Bar Council Verified',
          })),
          rating: 4.9,
          totalConsultations: 10,
          bio: dbProfile.bio || 'Verified legal practitioner.',
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Provider profile not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
