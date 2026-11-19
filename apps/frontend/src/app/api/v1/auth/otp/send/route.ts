import { NextRequest, NextResponse } from 'next/server';
import { serverOtps } from '@/lib/server-db';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '591061ACiMZyf3sdSa6afc971eP1';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '6afc949984b612b5030babc2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || '').replace(/[\s\-\(\)]/g, '');

    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    let cleanMobile = rawPhone.startsWith('+91')
      ? rawPhone.slice(3)
      : rawPhone.startsWith('91') && rawPhone.length === 12
      ? rawPhone.slice(2)
      : rawPhone;

    const formattedPhone = `+91${cleanMobile}`;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    serverOtps.set(formattedPhone, {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });
    serverOtps.set(cleanMobile, {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    // Dispatch real SMS via MSG91
    if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID) {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        MSG91_TEMPLATE_ID
      )}&mobile=91${encodeURIComponent(cleanMobile)}&authkey=${encodeURIComponent(
        MSG91_AUTH_KEY
      )}&otp=${encodeURIComponent(otpCode)}&otp_length=6&otp_expiry=10`;

      console.log(`[Vercel Serverless OTP] Sending MSG91 OTP ${otpCode} to 91${cleanMobile}...`);
      try {
        const msgRes = await fetch(url, {
          method: 'POST',
          headers: {
            authkey: MSG91_AUTH_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            otp: otpCode,
            OTP: otpCode,
            var1: otpCode,
            code: otpCode,
          }),
        });
        const msgData = await msgRes.json();
        console.log(`[Vercel MSG91 Response]:`, msgData);
      } catch (err: any) {
        console.warn(`[MSG91 Gateway Warning]:`, err.message);
      }
    }

    const masked = formattedPhone.slice(0, 3) + ' ' + formattedPhone.slice(3, 5) + '•••• ••' + formattedPhone.slice(-2);
    return NextResponse.json({
      success: true,
      message: `OTP successfully dispatched to ${masked}`,
      data: {
        message: `OTP successfully dispatched to ${masked}`,
        expiresInMinutes: 5,
      },
    });
  } catch (error: any) {
    console.error('OTP Send Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch verification OTP.' },
      { status: 500 }
    );
  }
}
