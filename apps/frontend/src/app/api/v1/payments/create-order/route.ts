import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amountINR, bookingId } = body;
    const amount = Number(amountINR) || 859;
    const amountInPaise = Math.round(amount * 100);

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      'rzp_test_U1LQS9SWpsYSzm';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'RsAJYli5RETL15DPJYrsswJT';

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          bookingId: bookingId || 'bk-seed-001',
          statutoryCompliance:
            'Section 35 Advocates Act 1961 - 0% platform commission on advocate fee',
        },
      }),
    });

    if (rzpRes.ok) {
      const order = await rzpRes.json();
      return NextResponse.json({
        success: true,
        data: {
          gatewayOrderId: order.id, // Genuine Razorpay order ID (e.g. order_U3IT6gS335I655)
          amountINR: amount,
          currency: 'INR',
          gatewayKeyId: keyId,
          bookingId: bookingId || 'bk-seed-001',
        },
      });
    }

    const errJson = await rzpRes.json().catch(() => ({}));
    console.warn('Razorpay create-order failed:', errJson);
    return NextResponse.json(
      {
        success: false,
        message: errJson.error?.description || 'Failed to create Razorpay order',
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in create-order route:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
