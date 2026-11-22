import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { providerProfileId, serviceTitle, deliveryMode, scheduledStartTime } = body;

    const bookingId = `bk-live-${Date.now()}`;
    const bookingReference = `IN-LEG-ESC-2026-X${Math.floor(10 + Math.random() * 90)}`;

    return NextResponse.json({
      success: true,
      data: {
        id: bookingId,
        bookingReference,
        citizenId: 'usr-citizen-default',
        providerProfileId: providerProfileId || 'prof-lsp-003',
        serviceTitle: serviceTitle || 'Legal Consultation',
        deliveryMode: deliveryMode || 'ONLINE_VIDEO',
        scheduledStartTime: scheduledStartTime || new Date(Date.now() + 86400000).toISOString(),
        scheduledEndTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
        bookingStatus: 'PENDING_PAYMENT',
        totalAmountINR: 859,
        providerEarningsINR: 800,
        platformFeeINR: 50,
        gstAmountINR: 9,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to initialize booking' },
      { status: 500 }
    );
  }
}
