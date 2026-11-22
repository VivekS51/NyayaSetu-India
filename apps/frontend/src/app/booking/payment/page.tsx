'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ApiClient,
  ProviderSummary,
  MOCK_PROVIDERS,
  loadRazorpayScript,
} from '../../../lib/api-client';
import { formatINR } from '../../../lib/utils';
import {
  ShieldCheck,
  Scale,
  Calendar,
  Clock,
  Video,
  CreditCard,
  Lock,
  Download,
  AlertCircle,
  CheckCircle2,
  Building,
  ArrowLeft,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const providerId = searchParams.get('providerId') || 'prof-lsp-003';
  const slotParam = searchParams.get('slot') || 'Tomorrow, 10:30 AM - 11:00 AM';
  const modeParam = searchParams.get('mode') || 'ONLINE_VIDEO';

  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(899);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const [paymentResult, setPaymentResult] = useState<{
    paymentId: string;
    orderId: string;
    bookingReference: string;
    amountINR: number;
    timestamp: string;
    conversationId: string;
    invoiceNumber: string;
  } | null>(null);

  useEffect(() => {
    const p = MOCK_PROVIDERS.find((item) => item.id === providerId) || MOCK_PROVIDERS[0];
    setProvider(p);
  }, [providerId]);

  useEffect(() => {
    if (isSuccess) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  if (!provider) {
    return <div className="text-center py-20 text-slate-500 text-sm">Loading payment checkout...</div>;
  }

  const advocateFee = provider.consultationFeeINR;
  const platformTechFee = 50;
  const gstAmount = 9;
  const totalAmount = advocateFee + platformTechFee + gstAmount;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePayWithRazorpay = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U1LQS9SWpsYSzm';
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || typeof (window as any).Razorpay === 'undefined') {
        setErrorMessage('Razorpay Checkout CDN unreachable. You may use "Instant Sandbox Escrow Lock" below.');
        setIsProcessing(false);
        return;
      }

      const booking = await ApiClient.createBooking({
        providerProfileId: provider.id,
        serviceTitle: `Legal Consultation (${modeParam.replace(/_/g, ' ')})`,
        deliveryMode: modeParam as any,
        scheduledStartTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        durationMinutes: 30,
      });

      const order = await ApiClient.createPaymentOrder(booking.id, 'RAZORPAY');

      const user = ApiClient.getStoredUser();
      const citizenName = user?.fullName || 'Citizen Client';
      const citizenPhone = user?.phone || '+919876543210';
      const citizenEmail = user?.email || 'citizen@nyayasetu.gov.in';

      const options = {
        key: razorpayKey,
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'NyayaSetu India',
        description: `Statutory Escrow: Consultation with ${provider.fullName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/929/929426.png',
        order_id: order.gatewayOrderId.startsWith('order_') ? order.gatewayOrderId : undefined,
        prefill: {
          name: citizenName,
          email: citizenEmail,
          contact: citizenPhone,
        },
        notes: {
          bookingReference: booking.bookingReference,
          providerId: provider.id,
          statutoryCompliance: 'Section 35 Advocates Act 1961 - 0% platform commission on legal fees',
          advocateFee: `${advocateFee}`,
          platformTechFee: `${platformTechFee}`,
          gst: `${gstAmount}`,
        },
        theme: {
          color: '#0A192F',
        },
        handler: async (response: any) => {
          try {
            const verification = await ApiClient.verifyPaymentCapture({
              bookingId: booking.id,
              gatewayOrderId: response.razorpay_order_id || order.gatewayOrderId,
              gatewayPaymentId: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
              signature: response.razorpay_signature,
              submittedAmountINR: totalAmount,
            });

            setPaymentResult({
              paymentId: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
              orderId: response.razorpay_order_id || order.gatewayOrderId,
              bookingReference: verification.bookingReference || booking.bookingReference,
              amountINR: totalAmount,
              timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              conversationId: verification.conversationId || 'bk-seed-001',
              invoiceNumber: verification.invoiceNumber || `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            });

            setIsSuccess(true);
            setIsProcessing(false);
          } catch (verifErr: any) {
            setErrorMessage(verifErr.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setErrorMessage('Payment window was dismissed. You can retry when ready.');
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', (failResponse: any) => {
        setIsProcessing(false);
        setErrorMessage(failResponse.error?.description || 'Payment was declined by issuing bank/gateway.');
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Razorpay initialization error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to initialize payment gateway.');
    }
  };

  const handleInstantSandboxPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const mockOrderId = `order_test_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const verification = await ApiClient.verifyPaymentCapture({
        bookingId: 'bk-seed-001',
        gatewayOrderId: mockOrderId,
        gatewayPaymentId: mockPaymentId,
        submittedAmountINR: totalAmount,
      });

      setTimeout(() => {
        setPaymentResult({
          paymentId: mockPaymentId,
          orderId: mockOrderId,
          bookingReference: verification.bookingReference || 'IN-LEG-ESC-2026-X89',
          amountINR: totalAmount,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          conversationId: verification.conversationId || 'bk-seed-001',
          invoiceNumber: verification.invoiceNumber || `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        setIsSuccess(true);
        setIsProcessing(false);
      }, 700);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Sandbox payment simulation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href={`/providers/${provider.id}`} className="hover:text-saffron-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800">Phase 4 Statutory Escrow Checkout</span>
        </div>

        {!isSuccess ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-govnavy-900">Statutory Escrow Payment</h1>
                <p className="text-xs text-slate-600">
                  Section 35 Advocates Act 1961 Mandated Escrow Protection
                </p>
              </div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start">
                <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Slot Lock: {formatTimer(countdownSeconds)}</span>
              </div>
            </div>

            {/* Provider & Appointment Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Practitioner</div>
                  <div className="text-sm font-bold text-govnavy-900">{provider.fullName}</div>
                  <div className="text-xs text-slate-600">{provider.primaryCourt}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Mode</div>
                  <div className="text-xs font-bold text-govnavy-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                    {modeParam.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600">Reserved Slot:</span>
                <span className="font-semibold text-slate-900">{slotParam}</span>
              </div>
            </div>

            {/* Statutory Compliance Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center space-x-2 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Statutory 0% Platform Commission Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Pursuant to Section 35 of the Advocates Act 1961, 100% of the advocate fee is transferred to the legal practitioner. The platform charges only a fixed infrastructure facilitation fee with 18% GST (SAC 998211). All funds remain safeguarded in escrow until consultation completion.
              </p>
            </div>

            {/* Detailed Fee Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Advocate Professional Consultation Fee:</span>
                <span className="font-semibold text-slate-900">{formatINR(advocateFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Platform Commission on Legal Fee:</span>
                <span className="text-emerald-700 font-bold">₹0 (0% Statutory Rule)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Technology Facilitation & Escrow Fee:</span>
                <span className="font-semibold">{formatINR(platformTechFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% on Technology Fee):</span>
                <span className="font-semibold">{formatINR(gstAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-base text-govnavy-900">
                <span>Total Amount to Lock in Escrow:</span>
                <span className="text-saffron-600">{formatINR(totalAmount)}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayWithRazorpay}
                className="w-full py-3.5 bg-govnavy-900 hover:bg-govnavy-800 disabled:bg-slate-400 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-saffron-400" />
                    <span>Launching Razorpay Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-saffron-400" />
                    <span>Pay {formatINR(totalAmount)} via Razorpay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleInstantSandboxPayment}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Instant Sandbox Escrow Lock (1-Click Test)</span>
              </button>
            </div>

            {/* Payment Modes Accepted */}
            <div className="pt-2 text-center space-y-1 text-xs text-slate-500">
              <div>Accepted Razorpay Sandbox Gateways:</div>
              <div className="flex items-center justify-center space-x-2 text-[11px] font-semibold text-slate-700">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">UPI (GPay / PhonePe)</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">Cards (Visa / RuPay)</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">Netbanking</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                Configured Key: {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U1LQS9SWpsYSzm'}
              </div>
            </div>

          </div>
        ) : (
          /* Payment Success & Escrow Confirmed View */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-govnavy-900">Payment Verified & Escrow Locked</h2>
              <p className="text-xs text-slate-600">
                Appointment successfully booked with <strong>{provider.fullName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Escrow Reference ID:</span>
                <span className="font-mono font-bold text-govnavy-900">
                  {paymentResult?.bookingReference || 'IN-LEG-ESC-2026-X89'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Razorpay Payment ID:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {paymentResult?.paymentId || 'pay_test_DEMO102'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Amount Deposited:</span>
                <span className="font-bold text-slate-900">{formatINR(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold text-slate-800">{slotParam}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Consultation Mode:</span>
                <span className="font-semibold text-slate-800">{modeParam.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-left text-xs text-emerald-900 flex items-start space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Statutory Protection:</strong> Funds will be safely retained in escrow and disbursed to the practitioner only upon consultation completion. You can raise a dispute in your Citizen Desk if any issue arises.
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href={`/consultation/${paymentResult?.conversationId || 'bk-seed-001'}`}
                className="w-full py-3.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-2xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <Video className="w-4 h-4" />
                <span>Enter Encrypted Consultation Room</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-govnavy-900 rounded-2xl text-xs font-bold border border-slate-300 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>View Statutory Tax Invoice (SAC 998211)</span>
              </button>

              <Link
                href="/citizen/dashboard"
                className="w-full py-2.5 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Citizen Case Desk</span>
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Statutory GST Tax Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-govnavy-900" />
                <h3 className="font-extrabold text-govnavy-900 text-sm">Statutory Tax Invoice (Advocates Act 1961)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Number:</span>
                <span className="font-bold text-govnavy-900">{paymentResult?.invoiceNumber || 'INV-2026-881920'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date of Supply:</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SAC Service Code:</span>
                <span className="font-bold">998211 (Legal Certification & Advisory)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform GSTIN:</span>
                <span>07AABCN9821M1Z5</span>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Advocate Fee (100% to Practitioner):</span>
                  <span>{formatINR(advocateFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Facilitation Fee:</span>
                  <span>{formatINR(platformTechFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (9% on Platform Fee):</span>
                  <span>{formatINR(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9% on Platform Fee):</span>
                  <span>{formatINR(gstAmount / 2)}</span>
                </div>
                <div className="border-t border-slate-400 pt-1 flex justify-between font-bold text-sm text-govnavy-900">
                  <span>Total Amount Paid (Escrow):</span>
                  <span>{formatINR(totalAmount)}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 leading-relaxed">
                Mandatory declaration under Section 35 Advocates Act 1961: No fee-sharing or commission is retained from professional legal fees. Full fee is held in escrow until client satisfaction.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 py-20 text-center text-xs text-slate-500">Loading statutory escrow checkout...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
