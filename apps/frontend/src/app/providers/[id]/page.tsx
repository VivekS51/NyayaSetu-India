'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  MapPin,
  Calendar,
  Globe,
  Award,
  AlertCircle,
  FileText,
  Clock,
  Video,
  MessageSquare,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Lock,
  Download,
  ExternalLink,
  Zap,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = (params?.id as string) || 'prof-lsp-003';

  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [selectedMode, setSelectedMode] = useState<'ONLINE_VIDEO' | 'ONLINE_CHAT' | 'OFFLINE_IN_PERSON'>('ONLINE_VIDEO');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow, 10:30 AM - 11:00 AM');
  
  // Phase 4 Booking Flow States
  // 'SELECT_SLOT' -> 'LOCKED_PAYMENT' -> 'PAYMENT_SUCCESS'
  const [bookingStep, setBookingStep] = useState<'SELECT_SLOT' | 'LOCKED_PAYMENT' | 'PAYMENT_SUCCESS'>('SELECT_SLOT');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(899); // 14m 59s
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
    let isMounted = true;
    const loadProvider = async () => {
      const p = await ApiClient.getProviderById(providerId);
      if (isMounted) {
        setProvider(p || MOCK_PROVIDERS[0]);
      }
    };
    loadProvider();
    return () => {
      isMounted = false;
    };
  }, [providerId]);

  // Countdown timer for 15-minute slot lock
  useEffect(() => {
    if (bookingStep !== 'LOCKED_PAYMENT') return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingStep]);

  if (!provider) {
    return <div className="text-center py-20 text-slate-500 text-sm">Loading factual profile...</div>;
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

  const handleProceedToLock = () => {
    setBookingStep('LOCKED_PAYMENT');
    setPaymentError(null);
  };

  /**
   * Primary Phase 4 Razorpay Checkout Integration
   * Uses Razorpay test key rzp_test_U1LQS9SWpsYSzm
   */
  const handlePayWithRazorpay = async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U1LQS9SWpsYSzm';
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || typeof (window as any).Razorpay === 'undefined') {
        // Fallback if Razorpay checkout script blocked by network or adblocker
        console.warn('Razorpay script could not be loaded directly. Offering instant sandbox bypass.');
        setPaymentError('Razorpay Checkout CDN unreachable. Use "Instant Sandbox Escrow Lock" below.');
        setIsProcessingPayment(false);
        return;
      }

      // Generate booking & payment order
      const booking = await ApiClient.createBooking({
        providerProfileId: provider.id,
        serviceTitle: `Legal Consultation (${selectedMode.replace(/_/g, ' ')})`,
        deliveryMode: selectedMode,
        scheduledStartTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        durationMinutes: 30,
      });

      const order = await ApiClient.createPaymentOrder(booking.id, 'RAZORPAY', totalAmount);

      const user = ApiClient.getStoredUser();
      const citizenName = user?.fullName || 'Citizen Client';
      const citizenPhone = user?.phone || '+919876543210';
      const citizenEmail = user?.email || 'citizen@nyayasetu.gov.in';

      // Only pass order_id if it is a genuine Razorpay-created order ID (e.g. order_U3IT6gS335I655)
      // Passing fake/client-generated order IDs causes Razorpay Checkout to reject the order with "Uh! oh! Something went wrong"
      const hasRealRazorpayOrderId = Boolean(
        order?.gatewayOrderId &&
        /^order_[a-zA-Z0-9]{14}$/.test(order.gatewayOrderId)
      );

      const options: any = {
        key: razorpayKey,
        amount: totalAmount * 100, // paise
        currency: 'INR',
        name: 'NyayaSetu India',
        description: `Statutory Escrow: Consultation with ${provider.fullName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/929/929426.png',
        ...(hasRealRazorpayOrderId ? { order_id: order.gatewayOrderId } : {}),
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
          color: '#0A192F', // Government Navy
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

            setBookingStep('PAYMENT_SUCCESS');
            setIsProcessingPayment(false);
          } catch (verifErr: any) {
            setPaymentError(verifErr.message || 'Payment verification failed');
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            setPaymentError('Payment window was closed before completion. You can retry anytime.');
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', (failResponse: any) => {
        setIsProcessingPayment(false);
        setPaymentError(failResponse.error?.description || 'Payment was declined by issuing bank/gateway.');
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Razorpay initialization error:', err);
      setIsProcessingPayment(false);
      setPaymentError(err.message || 'Failed to initialize payment gateway.');
    }
  };

  /**
   * Fast Instant Sandbox Escrow Lock
   * Instant verification for development, demo, and testing with the provided Razorpay test key
   */
  const handleInstantSandboxPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

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
        setBookingStep('PAYMENT_SUCCESS');
        setIsProcessingPayment(false);
      }, 700);
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(err.message || 'Sandbox test payment failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href="/providers" className="hover:text-saffron-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Legal Directory</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800">{provider.fullName}</span>
        </div>

        {/* Mandatory BCI Rule 36 Statutory Banner */}
        <div className="bg-govnavy-900 text-slate-300 p-4 rounded-2xl border border-govnavy-700 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-saffron-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-white font-bold">
              Bar Council of India Rule 36 Compliance Notice
            </div>
            <p className="leading-relaxed text-slate-300">
              This profile contains strictly factual, non-promotional information published in accordance with the
              amended Rule 36 of Bar Council of India Rules. It does not constitute legal advertisement, subjective ranking,
              or solicitation of work. The platform acts solely as a neutral technology infrastructure directory.
            </p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-govnavy-900">{provider.fullName}</h1>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>State Bar Roll Verified</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-govnavy-100 text-govnavy-800 text-xs font-bold">
                  {provider.providerType}
                </span>
              </div>

              {/* Verified Credentials Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                {provider.stateBarCouncil && (
                  <div className="flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>State Bar: <strong className="text-slate-800">{provider.stateBarCouncil}</strong></span>
                  </div>
                )}
                {provider.barRegistrationNo && (
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Enrolment Roll: <strong className="text-slate-800">{provider.barRegistrationNo}</strong></span>
                  </div>
                )}
                {provider.notaryAppointmentNo && (
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Notary Commission: <strong className="text-slate-800">{provider.notaryAppointmentNo}</strong></span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>District: <strong className="text-slate-800">{provider.district}, {provider.state}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Experience: <strong className="text-slate-800">{provider.experienceYears} Years Standing</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Languages: <strong className="text-slate-800">{provider.languagesSpoken.join(', ').toUpperCase()}</strong></span>
                </div>
              </div>

              {/* Earned Platform Trust Badges */}
              <div className="pt-2 flex flex-wrap gap-2">
                {provider.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200 text-xs font-semibold"
                  >
                    <Award className="w-3.5 h-3.5 text-saffron-600" />
                    <span>{badge.title}</span>
                  </span>
                ))}
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tier: {provider.tier.name}</span>
                </span>
              </div>
            </div>

            {/* Statutory Consultation Rate Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left md:text-right shrink-0 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Statutory Professional Fee</div>
              <div className="text-3xl font-extrabold text-govnavy-900">{formatINR(provider.consultationFeeINR)}</div>
              <div className="text-[11px] text-slate-500">Fixed rate • Protected by Escrow</div>
              {provider.isAvailableForProBono && (
                <div className="text-[11px] font-bold text-govgreen-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                  Pro-Bono / Legal Aid Volunteer
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Factual Statement & Practice Courts */}
          <div className="md:col-span-2 space-y-6">
            {/* Factual Statement */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Factual Practice Statement</h3>
              <p className="text-xs text-slate-700 leading-relaxed">{provider.bio}</p>
            </div>

            {/* Primary Courts of Practice */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Courts & Jurisdictions Admitted</h3>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                {provider.primaryCourt}
              </div>
            </div>

            {/* Practice Areas */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Statutory Areas of Practice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {provider.practiceAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-govgreen-600 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 35 Advocates Act Compliance Note */}
            <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200/70 text-xs text-amber-950 space-y-2">
              <div className="font-bold flex items-center space-x-2 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Statutory 0% Platform Fee on Professional Fees (Section 35 Mandate)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                NyayaSetu India does not deduct any commission or percentage fee from advocate professional fees,
                in strict compliance with Section 35 of the Advocates Act 1961. 100% of the advocate fee is held safely
                in statutory escrow until the consultation is delivered to your satisfaction.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Booking Card with Phase 4 Escrow Payment */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-5 sticky top-24">
              
              {/* Header with Step Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-govnavy-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-saffron-600" />
                  <span>
                    {bookingStep === 'SELECT_SLOT' && '1. Select Consultation'}
                    {bookingStep === 'LOCKED_PAYMENT' && '2. Statutory Escrow Payment'}
                    {bookingStep === 'PAYMENT_SUCCESS' && '3. Booking Confirmed'}
                  </span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {bookingStep === 'SELECT_SLOT' && 'Step 1 of 3'}
                  {bookingStep === 'LOCKED_PAYMENT' && 'Step 2 of 3'}
                  {bookingStep === 'PAYMENT_SUCCESS' && 'Step 3 of 3'}
                </span>
              </div>

              {/* STEP 1: SELECT CONSULTATION MODE & SLOT */}
              {bookingStep === 'SELECT_SLOT' && (
                <>
                  {/* Delivery Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Consultation Mode</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedMode('ONLINE_VIDEO')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'ONLINE_VIDEO'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-[10px]">Video Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('ONLINE_CHAT')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'ONLINE_CHAT'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px]">Chat / Docs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('OFFLINE_IN_PERSON')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'OFFLINE_IN_PERSON'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span className="text-[10px]">Chamber</span>
                      </button>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Select Available Slot</label>
                    <div className="space-y-1.5">
                      {[
                        'Tomorrow, 10:30 AM - 11:00 AM',
                        'Tomorrow, 02:00 PM - 02:30 PM',
                        'Thursday, 11:00 AM - 11:30 AM',
                        'Thursday, 04:30 PM - 05:00 PM',
                      ].map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors ${
                            selectedSlot === slot
                              ? 'bg-saffron-50 border-saffron-500 text-saffron-900 ring-1 ring-saffron-500'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot}</span>
                          </div>
                          {selectedSlot === slot && <CheckCircle2 className="w-4 h-4 text-saffron-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Advocate Consultation Fee:</span>
                      <span className="font-semibold">{formatINR(advocateFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Facilitation & Escrow:</span>
                      <span className="font-semibold">{formatINR(platformTechFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% on Platform Fee):</span>
                      <span className="font-semibold">{formatINR(gstAmount)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-govnavy-900 text-sm">
                      <span>Total Escrow Amount:</span>
                      <span className="text-saffron-600">{formatINR(totalAmount)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToLock}
                    className="w-full py-3 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Proceed to Secure Booking</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* STEP 2: SLOT LOCKED & PHASE 4 ESCROW PAYMENT */}
              {bookingStep === 'LOCKED_PAYMENT' && (
                <div className="space-y-4">
                  {/* Slot Locked Banner with Countdown Timer */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center space-y-1.5">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-950">Slot Temporarily Locked</h4>
                    <p className="text-[11px] text-emerald-800">
                      <strong>{selectedSlot}</strong> via <strong>{selectedMode.replace(/_/g, ' ')}</strong>
                    </p>
                    <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Lock expires in: {formatTimer(countdownSeconds)}</span>
                    </div>
                  </div>

                  {/* Escrow Reference Tag */}
                  <div className="p-2.5 bg-govnavy-900 text-white rounded-xl text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Escrow Reference:</span>
                    <span className="font-mono font-bold text-amber-300">IN-LEG-ESC-2026-X89</span>
                  </div>

                  {/* Statutory Section 35 Fee Breakdown */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 pb-1 border-b border-slate-200 flex items-center justify-between">
                      <span>Statutory Payment Breakdown</span>
                      <span className="text-emerald-700 font-semibold lowercase">sec 35 compliant</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Professional Legal Fee:</span>
                      <span className="font-semibold text-slate-900">{formatINR(advocateFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Platform Commission:</span>
                      <span className="text-emerald-700 font-bold">₹0 (0% Statutory Mandate)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Tech Fee:</span>
                      <span>{formatINR(platformTechFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% on Tech Fee):</span>
                      <span>{formatINR(gstAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-govnavy-900 text-sm">
                      <span>Total Escrow Deposit:</span>
                      <span className="text-saffron-600">{formatINR(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Payment Error Alert */}
                  {paymentError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">{paymentError}</div>
                    </div>
                  )}

                  {/* PRIMARY ACTION: Razorpay Checkout Gateway Modal */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handlePayWithRazorpay}
                      className="w-full py-3 bg-govnavy-900 hover:bg-govnavy-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isProcessingPayment ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-saffron-400" />
                          <span>Connecting to Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-saffron-400" />
                          <span>Pay {formatINR(totalAmount)} via Razorpay</span>
                        </>
                      )}
                    </button>

                    {/* Quick Sandbox 1-Click Test Button */}
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handleInstantSandboxPayment}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Instant Sandbox Escrow Lock (1-Click Test)</span>
                    </button>
                  </div>

                  {/* Payment Channels Icons */}
                  <div className="pt-1 text-center space-y-1.5">
                    <div className="text-[10px] text-slate-500 font-medium">
                      Accepted Payment Channels (Razorpay Sandbox):
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-600 font-semibold">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">UPI / QR</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Cards</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Netbanking</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Key: {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U1LQS9SWpsYSzm'}
                    </div>
                  </div>

                  {/* Back or Edit Slot */}
                  <button
                    type="button"
                    onClick={() => setBookingStep('SELECT_SLOT')}
                    className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 font-medium pt-1 cursor-pointer"
                  >
                    ← Change consultation time or mode
                  </button>
                </div>
              )}

              {/* STEP 3: PAYMENT SUCCESS & STATUTORY ESCROW CONFIRMED */}
              {bookingStep === 'PAYMENT_SUCCESS' && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-govnavy-900">Payment Successful & Escrow Locked</h4>
                    <p className="text-xs text-slate-600">
                      Your consultation with <strong>{provider.fullName}</strong> is officially confirmed.
                    </p>
                  </div>

                  {/* Transaction Metadata Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 text-[11px]">
                      <span className="text-slate-500">Escrow Reference:</span>
                      <span className="font-mono font-bold text-govnavy-900">
                        {paymentResult?.bookingReference || 'IN-LEG-ESC-2026-X89'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Razorpay Payment ID:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {paymentResult?.paymentId || 'pay_test_DEMO102'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Amount Deposited:</span>
                      <span className="font-bold text-slate-900">{formatINR(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Scheduled Time:</span>
                      <span className="font-semibold text-slate-800">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Consultation Mode:</span>
                      <span className="font-semibold text-slate-800">{selectedMode.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Statutory Safe Guarantee */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-[11px] text-emerald-900 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Funds will only be released to the practitioner after your consultation concludes. You are entitled to 100% refund in case of non-attendance.
                    </span>
                  </div>

                  {/* Next Step Primary Actions */}
                  <div className="space-y-2 pt-1">
                    <Link
                      href={`/consultation/${paymentResult?.conversationId || 'bk-seed-001'}`}
                      className="w-full py-3 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Enter Encrypted Consultation Room</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-govnavy-900 rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View Statutory Tax Invoice (SAC 998211)</span>
                    </button>

                    <Link
                      href="/citizen/dashboard"
                      className="w-full py-2 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>Go to Citizen Case Desk</span>
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
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
