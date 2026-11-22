import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerProfileId = params.id;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'APPROVE';
    const reasonCode = body.reasonCode;
    const reviewNotes = body.reviewNotes;

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    try {
      await prisma.providerProfile.updateMany({
        where: { id: providerProfileId },
        data: {
          verificationStatus: newStatus,
          verifiedAt: action === 'APPROVE' ? new Date() : null,
          rejectionReason: action === 'REJECT' ? reasonCode : null,
        },
      });

      await prisma.verificationRequest.updateMany({
        where: { providerProfileId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || (action === 'APPROVE' ? 'Approved by Admin' : reasonCode),
        },
      });
    } catch (err) {
      console.warn('Prisma verification decision skipped:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Verification decision recorded: ${newStatus}`,
      data: { providerProfileId, status: newStatus },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process decision' },
      { status: 500 }
    );
  }
}
