import { v4 as uuidv4 } from 'uuid';
import { dbStore, ProviderProfileRecord, ProviderCredentialRecord } from '../../config/database';
import { VerificationStatus, CredentialType, PointsType, ProviderType } from '../../common/types';
import {
  Step1BasicDetailsInput,
  Step2ProfessionalDetailsInput,
  Step3DocumentUploadInput,
  Step4StatutoryComplianceInput,
} from './onboarding.dto';

export class OnboardingService {
  public async getOnboardingStatus(userId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) {
      throw new Error('No provider profile associated with this account. Please register as an LSP.');
    }

    const credentials = dbStore.providerCredentials.filter((c) => c.providerProfileId === profile.id);
    const verificationRequest = dbStore.verificationRequests
      .filter((v) => v.providerProfileId === profile.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    // Compute wizard completion percentage
    let completedSteps = 0;
    if (profile.district && profile.state && profile.languagesSpoken.length > 0) completedSteps++;
    if (profile.primaryCourt && profile.practiceAreas.length > 0) completedSteps++;
    if (credentials.length > 0) completedSteps++;
    if (profile.complianceAccepted) completedSteps++;

    const progressPercentage = Math.round((completedSteps / 4) * 100);

    return {
      profileId: profile.id,
      verificationStatus: profile.verificationStatus,
      rejectionReason: profile.rejectionReason,
      completedSteps,
      progressPercentage,
      profile: {
        providerType: profile.providerType,
        state: profile.state,
        district: profile.district,
        pincode: profile.pincode,
        languagesSpoken: profile.languagesSpoken,
        bio: profile.bio,
        stateBarCouncil: profile.stateBarCouncil,
        barRegistrationNo: profile.barRegistrationNo,
        notaryAppointmentNo: profile.notaryAppointmentNo,
        enrolmentYear: profile.enrolmentYear,
        primaryCourt: profile.primaryCourt,
        experienceYears: profile.experienceYears,
        practiceAreas: profile.practiceAreas,
        consultationFeeINR: profile.consultationFeeINR,
        isAvailableForProBono: profile.isAvailableForProBono,
        complianceAccepted: profile.complianceAccepted,
      },
      uploadedCredentials: credentials.map((c) => ({
        id: c.id,
        credentialType: c.credentialType,
        certificateNumber: c.certificateNumber,
        issuingAuthority: c.issuingAuthority,
        documentUrl: c.documentUrl,
        isVerified: c.isVerified,
      })),
      latestVerificationRequest: verificationRequest || null,
    };
  }

  public async saveStep1(userId: string, input: Step1BasicDetailsInput) {
    const profile = this.getOrCreateProfile(userId, input.providerType);

    profile.providerType = input.providerType;
    profile.state = input.state;
    profile.district = input.district;
    profile.pincode = input.pincode;
    profile.languagesSpoken = input.languagesSpoken;
    profile.bio = input.bio || null;
    profile.updatedAt = new Date();

    return { message: 'Step 1 saved successfully', profileId: profile.id };
  }

  public async saveStep2(userId: string, input: Step2ProfessionalDetailsInput) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) throw new Error('Provider profile not found. Please complete Step 1 first.');

    // Duplicate check for Bar Registration Number
    if (input.barRegistrationNo) {
      const duplicate = dbStore.providerProfiles.find(
        (p) => p.id !== profile.id && p.barRegistrationNo === input.barRegistrationNo
      );
      if (duplicate) {
        throw new Error(
          `Bar Council Registration No. "${input.barRegistrationNo}" is already registered on this platform. Please contact administrator if this is an error.`
        );
      }
    }

    profile.stateBarCouncil = input.stateBarCouncil || null;
    profile.barRegistrationNo = input.barRegistrationNo || null;
    profile.notaryAppointmentNo = input.notaryAppointmentNo || null;
    profile.enrolmentYear = input.enrolmentYear || null;
    profile.primaryCourt = input.primaryCourt;
    profile.experienceYears = input.experienceYears;
    profile.practiceAreas = input.practiceAreas;
    profile.consultationFeeINR = input.consultationFeeINR;
    profile.isAvailableForProBono = input.isAvailableForProBono;
    profile.updatedAt = new Date();

    return { message: 'Step 2 (Professional Credentials) saved successfully', profileId: profile.id };
  }

  public async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    fileSizeBytes?: number
  ) {
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Valid fileName is required.');
    }

    // 1. Path traversal and null byte attack prevention
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
      throw new Error('Malicious or illegal file name detected: Path traversal sequences are strictly prohibited.');
    }

    // 2. Prohibit dangerous and executable extensions
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.vbs', '.py', '.msi', '.bin'];
    const lowerName = fileName.toLowerCase();
    if (dangerousExtensions.some((ext) => lowerName.endsWith(ext) || lowerName.includes(ext + '.'))) {
      throw new Error('Executable or script files are strictly prohibited.');
    }

    // 3. Strict extension verification
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file extension ".${fileExtension}". Only .pdf, .jpg, .jpeg, and .png are allowed.`);
    }

    // 4. Allowed MIME types
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only PDF, JPEG, and PNG files are accepted for legal document verification.');
    }

    // 5. File size boundary checks
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSizeBytes !== undefined) {
      if (fileSizeBytes <= 0) {
        throw new Error('Empty file detected. File size must be greater than zero bytes.');
      }
      if (fileSizeBytes > MAX_FILE_SIZE) {
        throw new Error('File exceeds maximum allowable limit of 10 MB.');
      }
    }

    const sanitizedKey = `credentials/${userId}/${uuidv4()}.${fileExtension}`;
    const presignedUrl = `https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/${sanitizedKey}?signature=mock_presigned_sig_2026`;

    return {
      uploadUrl: presignedUrl,
      publicDocumentUrl: `https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/${sanitizedKey}`,
      expiresInSeconds: 900, // 15 mins
      serverSideEncryption: 'AES256',
    };
  }

  public async saveStep3Document(userId: string, input: Step3DocumentUploadInput) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) throw new Error('Provider profile not found.');

    const cleanCertNo = input.certificateNumber.trim().toLowerCase();

    // 1. Prevent duplicate document upload on the same provider profile
    const existingSame = dbStore.providerCredentials.find(
      (c) =>
        c.providerProfileId === profile.id &&
        c.credentialType === input.credentialType &&
        c.certificateNumber.trim().toLowerCase() === cleanCertNo
    );
    if (existingSame) {
      throw new Error(`Credential document with certificate number "${input.certificateNumber}" is already recorded.`);
    }

    // 2. Prevent duplicate upload of verified credentials already owned by another provider
    const duplicateOther = dbStore.providerCredentials.find(
      (c) =>
        c.providerProfileId !== profile.id &&
        c.credentialType === input.credentialType &&
        c.certificateNumber.trim().toLowerCase() === cleanCertNo &&
        c.isVerified
    );
    if (duplicateOther) {
      throw new Error(`Certificate number "${input.certificateNumber}" is already registered to another verified practitioner.`);
    }

    const credentialRecord: ProviderCredentialRecord = {
      id: uuidv4(),
      providerProfileId: profile.id,
      credentialType: input.credentialType,
      certificateNumber: input.certificateNumber.trim(),
      issuingAuthority: input.issuingAuthority.trim(),
      documentUrl: input.documentUrl,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      isVerified: false,
      createdAt: new Date(),
    };

    dbStore.providerCredentials.push(credentialRecord);

    return {
      message: 'Credential document registered successfully',
      credentialId: credentialRecord.id,
    };
  }

  public async saveStep4AndSubmit(userId: string, input: Step4StatutoryComplianceInput, clientIp?: string) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) throw new Error('Provider profile not found.');

    const credentials = dbStore.providerCredentials.filter((c) => c.providerProfileId === profile.id);
    if (credentials.length === 0) {
      throw new Error('At least one verification document (e.g. Enrolment Certificate) is required before submitting.');
    }

    const now = new Date();
    profile.complianceAccepted = true;
    profile.complianceAcceptedAt = now;
    profile.verificationStatus = VerificationStatus.PENDING;
    profile.rejectionReason = null;
    profile.updatedAt = now;

    // Create Verification Request Dossier for Admin Queue
    const requestId = uuidv4();
    dbStore.verificationRequests.push({
      id: requestId,
      providerProfileId: profile.id,
      submittedAt: now,
      reviewedAt: null,
      reviewedByUserId: null,
      status: VerificationStatus.PENDING,
      reviewNotes: null,
      ocrPayload: {
        detectedBarNo: profile.barRegistrationNo,
        detectedAuthority: profile.stateBarCouncil,
        confidenceScore: 0.94,
      },
    });

    // Reward Profile Completion Points (50 pts)
    const wallet = dbStore.wallets.find((w) => w.userId === userId);
    if (wallet) {
      wallet.rewardPointsBalance += 50;
      wallet.updatedAt = now;
      profile.totalPoints += 50;

      dbStore.pointsLedger.push({
        id: uuidv4(),
        walletId: wallet.id,
        points: 50,
        type: PointsType.CREDIT,
        referenceType: 'PROFILE_COMPLETION',
        referenceId: profile.id,
        description: 'Earned 50 points for 100% onboarding profile completion.',
        balanceAfter: wallet.rewardPointsBalance,
        createdAt: now,
      });
    }

    // Statutory Audit Trail for BCI Rule 36 & DPDP Act compliance
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId,
      action: 'LSP_ONBOARDING_SUBMITTED',
      resourceType: 'ProviderProfile',
      resourceId: profile.id,
      ipAddress: clientIp || null,
      userAgent: null,
      diffPayload: {
        providerType: profile.providerType,
        barRegistrationNo: profile.barRegistrationNo,
        bciRule36Consent: input.bciRule36Acknowledged,
        dpdpConsent: input.dpdpConsentAcknowledged,
      },
      createdAt: now,
    });

    return {
      message: 'Onboarding completed and dossier submitted for administrative verification.',
      verificationRequestId: requestId,
      status: VerificationStatus.PENDING,
      pointsEarned: 50,
    };
  }

  private getOrCreateProfile(userId: string, defaultType: ProviderType): ProviderProfileRecord {
    let profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = {
        id: uuidv4(),
        userId,
        providerType: defaultType,
        enrolmentYear: null,
        stateBarCouncil: null,
        barRegistrationNo: null,
        notaryAppointmentNo: null,
        primaryCourt: null,
        district: '',
        state: '',
        pincode: '',
        experienceYears: 0,
        languagesSpoken: ['en'],
        practiceAreas: [],
        bio: null,
        consultationFeeINR: 0,
        isAvailableForProBono: false,
        verificationStatus: VerificationStatus.DRAFT,
        rejectionReason: null,
        verifiedAt: null,
        complianceAccepted: false,
        complianceAcceptedAt: null,
        totalPoints: 0,
        tierId: 'tier-bronze-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbStore.providerProfiles.push(profile);
    }
    return profile;
  }
}

