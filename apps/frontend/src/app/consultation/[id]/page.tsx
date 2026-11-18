'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatINR } from '../../../lib/utils';
import {
  ShieldCheck,
  Scale,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Send,
  Paperclip,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Star,
  Award,
  Download,
  Building,
  ArrowLeft,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderName: string;
  isMe: boolean;
  isSystem: boolean;
  content: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  isAadhaarSigned?: boolean;
  time: string;
}

export default function ConsultationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = (params?.id as string) || 'bk-seed-001';

  // Video call controls
  const [videoActive, setVideoActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [callJoined, setCallJoined] = useState(false);

  // Escrow & Booking Status
  const [status, setStatus] = useState<'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED'>('IN_PROGRESS');
  const [escrowReleased, setEscrowReleased] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-01',
      senderName: 'System',
      isMe: false,
      isSystem: true,
      content: '🔒 Secure Consultation Room initialized. All case documents are encrypted at rest under DPDP Act 2023.',
      time: '10:30 AM',
    },
    {
      id: 'msg-02',
      senderName: 'Sunita Devi (Client)',
      isMe: true,
      isSystem: false,
      content: 'Namaste Advocate Sir. I have attached the Tehsil land mutation copy for your review before our video call.',
      attachmentName: 'tehsil_khasra_mutation.pdf',
      attachmentUrl: '#',
      isAadhaarSigned: true,
      time: '10:31 AM',
    },
    {
      id: 'msg-03',
      senderName: 'Adv. Rajesh Varma',
      isMe: false,
      isSystem: false,
      content: 'Received Sunita ji. I have examined the Khasra entries. The partition suit has strong documentary backing. Let us start the video conference.',
      time: '10:32 AM',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('PROVIDER_NO_SHOW');
  const [disputeDesc, setDisputeDesc] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: 'You (Client)',
      isMe: true,
      isSystem: false,
      content: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);
    setInputMessage('');
  };

  const handleCompleteService = () => {
    setStatus('COMPLETED');
    setEscrowReleased(true);
    setShowReviewModal(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setShowReviewModal(false);
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('DISPUTED');
    setShowDisputeModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Consultation Room Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/providers"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white">Consultation Room • Ref: IN-LEG-2026-X89</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                End-to-End Encrypted
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Adv. Rajesh Varma (Delhi Bar Roll: D/1428/2012) • Client: Sunita Devi
            </p>
          </div>
        </div>

        {/* Escrow Status & Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Lock className="w-3.5 h-3.5 text-saffron-500" />
            <span className="text-slate-300">Escrow:</span>
            <span className="font-bold text-white">{formatINR(859)}</span>
            <span className={`text-[10px] font-bold ml-1 ${escrowReleased ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({escrowReleased ? 'Released' : 'Locked in Escrow'})
            </span>
          </div>

          {status !== 'COMPLETED' && status !== 'DISPUTED' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCompleteService}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed & Release</span>
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-400 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Dispute
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Service Completed</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Split Layout: Video Room (Left) + Encrypted Chat & Vault (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Video Conference Canvas */}
        <div className="lg:col-span-7 bg-slate-900 flex flex-col p-4 sm:p-6 justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Video Placeholder Box */}
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden min-h-[300px]">
            {!callJoined ? (
              <div className="text-center space-y-3 p-6 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-saffron-500/20 text-saffron-400 flex items-center justify-center mx-auto border border-saffron-500/30">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Join Secure Video Session</h3>
                <p className="text-xs text-slate-400">
                  Direct peer-to-peer WebRTC consultation bridge. No call recordings stored on platform without dual statutory consent.
                </p>
                <button
                  onClick={() => setCallJoined(true)}
                  className="px-6 py-2.5 bg-saffron-600 hover:bg-saffron-500 text-white rounded-xl text-xs font-bold shadow-lg transition-colors"
                >
                  Enter Video Conference
                </button>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-govnavy-800 border-2 border-saffron-500 text-white flex items-center justify-center mx-auto text-xl font-bold">
                    RV
                  </div>
                  <div className="text-sm font-bold text-white">Adv. Rajesh Varma</div>
                  <div className="text-xs text-emerald-400 flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected • Encrypted Video Stream</span>
                  </div>
                </div>

                {/* Self View Floating Box */}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-xs text-slate-400 shadow-xl">
                  Sunita Devi (You)
                </div>
              </div>
            )}
          </div>

          {/* Conference Control Toolbar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`p-3 rounded-xl border transition-colors ${
                  micActive
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-rose-900/50 border-rose-700 text-rose-300'
                }`}
                title="Toggle Microphone"
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setVideoActive(!videoActive)}
                className={`p-3 rounded-xl border transition-colors ${
                  videoActive
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-rose-900/50 border-rose-700 text-rose-300'
                }`}
                title="Toggle Camera"
              >
                {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Invoice:</span>
              <button
                onClick={() => alert('GST Tax Invoice INV-2026-0001 (CGST: ₹4.50, SGST: ₹4.50) downloaded successfully.')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>GST Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: In-App Chat & Confidential Document Exchange */}
        <div className="lg:col-span-5 bg-slate-950 flex flex-col justify-between h-[550px] lg:h-auto">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Confidential Case Vault</span>
            </div>
            <span className="text-slate-400 text-[11px]">DPDP Act 2023 Regulated</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.isSystem ? 'items-center text-center' : m.isMe ? 'items-end' : 'items-start'
                }`}
              >
                {m.isSystem ? (
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-400 max-w-sm text-[11px] leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className={`max-w-[85%] space-y-1 ${m.isMe ? 'text-right' : 'text-left'}`}>
                    <div className="text-[10px] text-slate-400 font-medium px-1">{m.senderName}</div>
                    <div
                      className={`p-3 rounded-2xl ${
                        m.isMe
                          ? 'bg-saffron-600 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                      }`}
                    >
                      <p className="leading-relaxed">{m.content}</p>

                      {/* Document Attachment Pill with Aadhaar eSign Tag */}
                      {m.attachmentName && (
                        <div className="mt-2 p-2 bg-slate-900/60 rounded-xl border border-white/10 flex items-center justify-between text-left">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                            <div className="overflow-hidden">
                              <div className="font-bold text-white text-[11px] truncate">{m.attachmentName}</div>
                              {m.isAadhaarSigned && (
                                <div className="text-[9px] text-emerald-400 font-bold flex items-center space-x-1">
                                  <span>✓ Aadhaar eSigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Download className="w-3.5 h-3.5 text-slate-300 ml-2 shrink-0 hover:text-white cursor-pointer" />
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 px-1">{m.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => alert('Secure Document Upload: Select PDF/Scanned Deed from your local storage to encrypt and share.')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Attach Document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message or legal query..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
            />

            <button
              type="submit"
              className="p-2 rounded-xl bg-saffron-600 hover:bg-saffron-500 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Verified Client Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Consultation Completed</h3>
              <p className="text-xs text-slate-400">
                Leave a verified review for <strong>Adv. Rajesh Varma</strong>. Verified reviews help maintain transparent justice delivery.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                  Select Rating (1 to 5 Stars)
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Objective Client Feedback
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your experience regarding legal clarity, punctuality, and responsiveness. (No promotional touting permitted)."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-500 text-white text-xs font-bold shadow"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Raise Service Dispute</h3>
            </div>
            <p className="text-xs text-slate-300">
              Raising a dispute immediately freezes the escrow funds (₹859.00). A platform grievance officer will inspect the call logs and audit logs within 24 hours.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason Code</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="PROVIDER_NO_SHOW">Provider Did Not Attend Scheduled Call</option>
                  <option value="INCOMPLETE_SERVICE">Service Incomplete / Document Not Delivered</option>
                  <option value="TECHNICAL_DISRUPTION">Severe Video / Audio Disruption</option>
                  <option value="OTHER">Other Disciplinary Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Provide context for the platform dispute committee..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Freeze Funds & Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

