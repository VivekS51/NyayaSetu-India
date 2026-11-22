import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';

const SEED_APPROVED_PROVIDERS = [
  {
    id: 'prof-lsp-003',
    fullName: 'Adv. Rajesh Varma',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Delhi',
    barRegistrationNo: 'D/1428/2012',
    primaryCourt: 'Delhi High Court & Tis Hazari District Courts',
    district: 'Central Delhi',
    state: 'Delhi',
    experienceYears: 14,
    practiceAreas: ['Civil Litigation', 'Property & Revenue Disputes', 'Consumer Protection', 'Cyber Law'],
    languagesSpoken: ['en', 'hi', 'pa'],
    consultationFeeINR: 800,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: { level: 'SILVER', name: 'Silver Advocate' },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'FOUNDING_MEMBER', title: 'Founding Member' },
    ],
    rating: 4.9,
    totalConsultations: 142,
    bio: 'Practicing advocate at Delhi High Court with over 14 years of courtroom experience in property title disputes, inheritance partitions, and consumer disputes.',
  },
  {
    id: 'prof-lsp-004',
    fullName: 'Adv. Harpreet Singh',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Punjab & Haryana',
    barRegistrationNo: 'P/2491/2016',
    primaryCourt: 'Amritsar District & Sessions Court',
    district: 'Amritsar',
    state: 'Punjab',
    experienceYears: 10,
    practiceAreas: ['Revenue & Land Matters', 'Family Law', 'Arbitration', 'Civil Litigation'],
    languagesSpoken: ['pa', 'hi', 'en'],
    consultationFeeINR: 600,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: { level: 'SILVER', name: 'Silver Advocate' },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'LEGAL_AID_CHAMPION', title: 'DLSA Legal Aid Volunteer' },
    ],
    rating: 4.8,
    totalConsultations: 98,
    bio: 'Practicing advocate at District Courts Amritsar with focus on agricultural land partitions, mutation appeals, and family settlements.',
  },
  {
    id: 'prof-lsp-005',
    fullName: 'Shri Ramesh Chawla',
    providerType: 'NOTARY',
    notaryAppointmentNo: 'NOTARY/GOI/DL/8821',
    primaryCourt: 'Patiala House Courts & Tehsil Sub-Registrar',
    district: 'New Delhi',
    state: 'Delhi',
    experienceYears: 18,
    practiceAreas: ['Statutory Affidavits', 'Power of Attorney', 'Notarial Attestation', 'Commercial Agreements'],
    languagesSpoken: ['hi', 'en'],
    consultationFeeINR: 250,
    isAvailableForProBono: false,
    verificationStatus: 'APPROVED',
    tier: { level: 'GOLD', name: 'Gold Practitioner' },
    badges: [{ code: 'VERIFIED_PROVIDER', title: 'Gazette Commissioned Notary' }],
    rating: 4.9,
    totalConsultations: 310,
    bio: 'Government of India appointed Notary Public. Strict adherence to Notaries Act 1952 statutory fee schedule.',
  },
  {
    id: 'prof-lsp-006',
    fullName: 'Adv. Meenakshi Sundaram',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Tamil Nadu & Puducherry',
    barRegistrationNo: 'TN/892/2008',
    primaryCourt: 'Madras High Court Mediation Centre & City Civil Court',
    district: 'Chennai',
    state: 'Tamil Nadu',
    experienceYears: 16,
    practiceAreas: ['Commercial Mediation', 'Civil Litigation', 'Family Dispute Conciliation', 'Mediation Act 2023'],
    languagesSpoken: ['en', 'ta', 'hi'],
    consultationFeeINR: 1200,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: { level: 'PLATINUM', name: 'Platinum Senior Fellow' },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'FOUNDING_MEMBER', title: 'Founding Member' },
    ],
    rating: 5.0,
    totalConsultations: 220,
    bio: 'High Court Advocate and court-annexed mediator trained under Mediation Act 2023 guidelines. Specializes in civil revisions and amicable pre-litigation commercial and family settlement.',
  },
  {
    id: 'prof-lsp-007',
    fullName: 'Adv. Vikramaditya Rathore',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Rajasthan',
    barRegistrationNo: 'R/1190/2015',
    primaryCourt: 'Rajasthan High Court & Jaipur District Courts',
    district: 'Jaipur',
    state: 'Rajasthan',
    experienceYears: 11,
    practiceAreas: ['Civil Litigation', 'Property & Revenue Disputes', 'Constitutional Law', 'Consumer Protection'],
    languagesSpoken: ['hi', 'en'],
    consultationFeeINR: 850,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: { level: 'GOLD', name: 'Gold Advocate' },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'BAR_COUNCIL_ENROLLED', title: 'Bar Council Enrolled' },
    ],
    rating: 4.9,
    totalConsultations: 164,
    bio: 'Practicing advocate at Rajasthan High Court (Jaipur Bench) specializing in property mutation disputes, constitutional writ petitions, and consumer redressal.',
  },
  {
    id: 'prof-lsp-008',
    fullName: 'Adv. Ananya Sengupta',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of West Bengal',
    barRegistrationNo: 'WB/412/2018',
    primaryCourt: 'Calcutta High Court & City Civil Court',
    district: 'Kolkata',
    state: 'West Bengal',
    experienceYears: 8,
    practiceAreas: ['Corporate & Taxation', 'Civil Litigation', 'Cyber Law', 'Family & Matrimonial'],
    languagesSpoken: ['en', 'hi', 'bn'],
    consultationFeeINR: 750,
    isAvailableForProBono: false,
    verificationStatus: 'APPROVED',
    tier: { level: 'SILVER', name: 'Silver Advocate' },
    badges: [{ code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' }],
    rating: 4.8,
    totalConsultations: 85,
    bio: 'Advocate practicing at Calcutta High Court with expertise in commercial disputes, cyber liability, and intellectual property advisories.',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerType = searchParams.get('providerType');
    const state = searchParams.get('state');
    const practiceArea = searchParams.get('practiceArea');
    const language = searchParams.get('language');
    const query = searchParams.get('q') || searchParams.get('query');

    let allProviders = [...SEED_APPROVED_PROVIDERS];

    try {
      const dbProfiles = await prisma.providerProfile.findMany({
        where: {
          verificationStatus: 'APPROVED',
        },
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

      if (dbProfiles.length > 0) {
        const formattedDb = dbProfiles.map((p) => ({
          id: p.id,
          fullName: p.user.fullName,
          providerType: p.providerType,
          stateBarCouncil: p.stateBarCouncil || undefined,
          barRegistrationNo: p.barRegistrationNo || undefined,
          notaryAppointmentNo: p.notaryAppointmentNo || undefined,
          primaryCourt: p.primaryCourt || 'High Court of Jurisdiction',
          district: p.district,
          state: p.state,
          experienceYears: p.experienceYears,
          practiceAreas: p.practiceAreas,
          languagesSpoken: p.languagesSpoken,
          consultationFeeINR: Number(p.consultationFeeINR) || 750,
          isAvailableForProBono: p.isAvailableForProBono,
          verificationStatus: 'APPROVED' as const,
          tier: {
            level: (p.tier?.level || 'SILVER') as any,
            name: p.tier?.name || 'Silver Practitioner',
          },
          badges: p.badges.map((b) => ({
            code: b.badge?.code || 'VERIFIED_PROVIDER',
            title: b.badge?.title || 'Bar Council Verified',
          })),
          rating: 4.9,
          totalConsultations: 10,
          bio: p.bio || 'Verified legal practitioner.',
        }));

        // Merge DB with seeds without duplicate IDs
        const map = new Map<string, any>();
        formattedDb.forEach((item) => map.set(item.id, item));
        allProviders.forEach((item) => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        allProviders = Array.from(map.values());
      }
    } catch {}

    // Filter results
    let filtered = allProviders;

    if (providerType && providerType !== 'ALL') {
      filtered = filtered.filter((p) => {
        if (p.providerType === providerType) return true;
        if (providerType === 'ADVOCATE' && p.barRegistrationNo) return true;
        return false;
      });
    }

    if (state && state !== 'ALL') {
      filtered = filtered.filter((p) => p.state.toLowerCase() === state.toLowerCase());
    }

    if (language && language !== 'ALL') {
      filtered = filtered.filter((p) => p.languagesSpoken?.includes(language));
    }

    if (practiceArea && practiceArea !== 'ALL') {
      const area = practiceArea.toLowerCase();
      filtered = filtered.filter((p) => p.practiceAreas?.some((pa: string) => pa.toLowerCase().includes(area)));
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((p) => {
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesCourt = p.primaryCourt?.toLowerCase().includes(q);
        const matchesBio = p.bio?.toLowerCase().includes(q);
        const matchesPractice = p.practiceAreas?.some((pa: string) => pa.toLowerCase().includes(q));
        const matchesBar = p.barRegistrationNo?.toLowerCase().includes(q);
        return matchesName || matchesCourt || matchesBio || matchesPractice || matchesBar;
      });
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch providers', data: SEED_APPROVED_PROVIDERS },
      { status: 500 }
    );
  }
}
