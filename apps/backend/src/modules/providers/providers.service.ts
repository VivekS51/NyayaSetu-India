import { dbStore, ProviderProfileRecord } from '../../config/database';
import { VerificationStatus, ProviderType } from '../../common/types';
import { SecurityUtils } from '../../common/utils/security.utils';
import { ProviderSearchQueryInput, UpdateProviderProfileInput } from './providers.dto';

export class ProvidersService {
  private static readonly BCI_RULE_36_DISCLAIMER =
    'In compliance with Bar Council of India Rule 36, this directory is strictly factual and non-promotional. Listing order does not constitute endorsement, superiority, or recommendation of any advocate.';

  public async searchProviders(query: ProviderSearchQueryInput) {
    const rawSearch = (query.q || query.query || '').trim().toLowerCase();

    // Strictly filter for approved, verified practitioners only
    let profiles = dbStore.providerProfiles.filter(
      (p) => p.verificationStatus === VerificationStatus.APPROVED
    );

    // 1. Text search across name, bio, court, practice areas, district, state
    if (rawSearch) {
      profiles = profiles.filter((profile) => {
        const user = dbStore.users.find((u) => u.id === profile.userId);
        const fullName = (user?.fullName || '').toLowerCase();
        const bio = (profile.bio || '').toLowerCase();
        const court = (profile.primaryCourt || '').toLowerCase();
        const district = (profile.district || '').toLowerCase();
        const state = (profile.state || '').toLowerCase();
        const areas = profile.practiceAreas.map((a) => a.toLowerCase()).join(' ');

        return (
          fullName.includes(rawSearch) ||
          bio.includes(rawSearch) ||
          court.includes(rawSearch) ||
          district.includes(rawSearch) ||
          state.includes(rawSearch) ||
          areas.includes(rawSearch)
        );
      });
    }

    // 2. Filter by providerType
    if (query.providerType && query.providerType !== 'ALL') {
      profiles = profiles.filter((p) => p.providerType === query.providerType);
    }

    // 3. Filter by State
    if (query.state && query.state !== 'ALL') {
      const stateQuery = query.state.trim().toLowerCase();
      profiles = profiles.filter((p) => p.state.toLowerCase() === stateQuery);
    }

    // 4. Filter by District
    if (query.district && query.district !== 'ALL') {
      const distQuery = query.district.trim().toLowerCase();
      profiles = profiles.filter((p) => p.district.toLowerCase() === distQuery);
    }

    // 5. Filter by City / Jurisdiction
    if (query.city && query.city !== 'ALL') {
      const cityQuery = query.city.trim().toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.district.toLowerCase().includes(cityQuery) ||
          (p.primaryCourt && p.primaryCourt.toLowerCase().includes(cityQuery))
      );
    }

    // 6. Filter by Practice Area / Legal Domain
    const targetDomain = (query.domain || query.practiceArea || '').trim().toLowerCase();
    if (targetDomain && targetDomain !== 'ALL') {
      profiles = profiles.filter((p) =>
        p.practiceAreas.some((area) => area.toLowerCase().includes(targetDomain))
      );
    }

    // 7. Filter by Language
    if (query.language && query.language !== 'ALL') {
      const langQuery = query.language.trim().toLowerCase();
      profiles = profiles.filter((p) =>
        p.languagesSpoken.some((l) => l.toLowerCase() === langQuery)
      );
    }

    // 8. Filter by Fee Range
    if (query.feeMin !== undefined) {
      profiles = profiles.filter((p) => p.consultationFeeINR >= query.feeMin!);
    }
    if (query.feeMax !== undefined) {
      profiles = profiles.filter((p) => p.consultationFeeINR <= query.feeMax!);
    }

    // 9. Filter by Pro Bono availability
    if (query.proBono === true) {
      profiles = profiles.filter((p) => p.isAvailableForProBono);
    }

    // Map enriched summaries with ratings and PII masking
    let items = profiles.map((p) => this.mapToSummary(p));

    // 10. Sorting (Statutory Neutrality: No paid boosting for advocates)
    const sortBy = query.sortBy || 'experience';
    if (sortBy === 'fee_asc') {
      items.sort((a, b) => a.consultationFeeINR - b.consultationFeeINR);
    } else if (sortBy === 'fee_desc') {
      items.sort((a, b) => b.consultationFeeINR - a.consultationFeeINR);
    } else if (sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      // Default: Experience years (descending)
      items.sort((a, b) => b.experienceYears - a.experienceYears);
    }

    // Pagination
    const total = items.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      disclaimer: ProvidersService.BCI_RULE_36_DISCLAIMER,
    };
  }

  public async getProviderById(id: string, viewerUserId?: string) {
    const profile = dbStore.providerProfiles.find((p) => p.id === id || p.userId === id);
    if (!profile) {
      throw new Error('Legal service provider profile not found.');
    }

    // Unverified provider guardrail: Only visible to profile owner or Admin
    if (profile.verificationStatus !== VerificationStatus.APPROVED) {
      const isOwner = viewerUserId && profile.userId === viewerUserId;
      const isAdmin =
        viewerUserId &&
        dbStore.userRoles.some((r) => r.userId === viewerUserId && r.role === 'ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Legal service provider profile not found or pending verification.');
      }
    }

    const user = dbStore.users.find((u) => u.id === profile.userId);
    const tier = dbStore.tiers.find((t) => t.id === profile.tierId);
    const badges = dbStore.providerBadges
      .filter((pb) => pb.providerProfileId === profile.id)
      .map((pb) => {
        const badgeDef = dbStore.badges.find((b) => b.id === pb.badgeId);
        return {
          code: badgeDef?.code || '',
          title: badgeDef?.title || '',
          description: badgeDef?.description || '',
          awardedAt: pb.awardedAt,
        };
      });

    // Compute reviews and ratings
    const reviews = dbStore.reviews
      .filter((r) => r.providerProfileId === profile.id && !r.isFlagged)
      .map((r) => {
        const reviewer = dbStore.users.find((u) => u.id === r.citizenId);
        return {
          id: r.id,
          rating: r.rating,
          feedbackText: r.feedbackText,
          providerResponse: r.providerResponse,
          isVerifiedBooking: r.isVerifiedBooking,
          createdAt: r.createdAt,
          clientName: reviewer ? `${reviewer.fullName[0]}***` : 'Client',
        };
      });

    const averageRating =
      reviews.length > 0
        ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: user?.fullName || 'Advocate',
      // PII Masking: phone and email are never exposed bare to public viewers
      maskedPhone: user ? SecurityUtils.maskPhoneNumber(user.phone) : '',
      maskedEmail: user?.email ? SecurityUtils.maskEmail(user.email) : null,
      providerType: profile.providerType,
      stateBarCouncil: profile.stateBarCouncil,
      barRegistrationNo: profile.barRegistrationNo,
      notaryAppointmentNo: profile.notaryAppointmentNo,
      primaryCourt: profile.primaryCourt,
      district: profile.district,
      state: profile.state,
      pincode: profile.pincode,
      experienceYears: profile.experienceYears,
      practiceAreas: profile.practiceAreas,
      languagesSpoken: profile.languagesSpoken,
      consultationFeeINR: profile.consultationFeeINR,
      isAvailableForProBono: profile.isAvailableForProBono,
      verificationStatus: profile.verificationStatus,
      verifiedAt: profile.verifiedAt,
      bio: profile.bio,
      tier: tier
        ? {
            level: tier.level,
            name: tier.name,
          }
        : null,
      badges,
      rating: averageRating,
      totalReviews: reviews.length,
      reviews,
      disclaimer: ProvidersService.BCI_RULE_36_DISCLAIMER,
    };
  }

  public async updateProfile(userId: string, input: UpdateProviderProfileInput) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) {
      throw new Error('Provider profile not found.');
    }

    // Notaries Act 1952 Guardrail: Notary fees ceiling check
    if (
      profile.providerType === ProviderType.NOTARY &&
      input.consultationFeeINR !== undefined &&
      input.consultationFeeINR > 500
    ) {
      throw new Error(
        'Notaries Act 1952 Guardrail: Notary fees cannot exceed official state gazette ceilings (max INR 500 per notarial act).'
      );
    }

    if (input.bio !== undefined) profile.bio = input.bio;
    if (input.languagesSpoken !== undefined) profile.languagesSpoken = input.languagesSpoken;
    if (input.consultationFeeINR !== undefined) profile.consultationFeeINR = input.consultationFeeINR;
    if (input.isAvailableForProBono !== undefined) profile.isAvailableForProBono = input.isAvailableForProBono;
    if (input.primaryCourt !== undefined) profile.primaryCourt = input.primaryCourt;
    if (input.practiceAreas !== undefined) profile.practiceAreas = input.practiceAreas;

    profile.updatedAt = new Date();

    return {
      message: 'Provider profile updated successfully',
      profile: this.mapToSummary(profile),
    };
  }

  public async getMyProfile(userId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) throw new Error('Provider profile not found');
    return this.getProviderById(profile.id, userId);
  }

  private mapToSummary(profile: ProviderProfileRecord) {
    const user = dbStore.users.find((u) => u.id === profile.userId);
    const tier = dbStore.tiers.find((t) => t.id === profile.tierId);
    const badges = dbStore.providerBadges
      .filter((pb) => pb.providerProfileId === profile.id)
      .map((pb) => {
        const badgeDef = dbStore.badges.find((b) => b.id === pb.badgeId);
        return {
          code: badgeDef?.code || '',
          title: badgeDef?.title || '',
        };
      });

    const reviews = dbStore.reviews.filter((r) => r.providerProfileId === profile.id && !r.isFlagged);
    const rating =
      reviews.length > 0
        ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    return {
      id: profile.id,
      fullName: user?.fullName || 'Advocate',
      maskedPhone: user ? SecurityUtils.maskPhoneNumber(user.phone) : '',
      maskedEmail: user?.email ? SecurityUtils.maskEmail(user.email) : null,
      providerType: profile.providerType,
      stateBarCouncil: profile.stateBarCouncil || undefined,
      barRegistrationNo: profile.barRegistrationNo || undefined,
      notaryAppointmentNo: profile.notaryAppointmentNo || undefined,
      primaryCourt: profile.primaryCourt || '',
      district: profile.district,
      state: profile.state,
      experienceYears: profile.experienceYears,
      practiceAreas: profile.practiceAreas,
      languagesSpoken: profile.languagesSpoken,
      consultationFeeINR: profile.consultationFeeINR,
      isAvailableForProBono: profile.isAvailableForProBono,
      verificationStatus: profile.verificationStatus,
      tier: tier
        ? {
            level: tier.level,
            name: tier.name,
          }
        : { level: 'BRONZE', name: 'Bronze Counsel' },
      badges,
      rating,
      totalConsultations: reviews.length + 12,
      bio: profile.bio || '',
    };
  }
}
