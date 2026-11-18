import { z } from 'zod';
import { ProviderType, CredentialType } from '../../common/types';

// Blacklist of promotional/tout language strictly prohibited under Bar Council of India Rule 36
const PROHIBITED_PROMOTIONAL_TERMS = [
  'best lawyer',
  'top lawyer',
  'no. 1 advocate',
  'guaranteed win',
  '100% success',
  'cheapest advocate',
  'undefeated counsel',
  'famous attorney',
];

export const step1BasicDetailsSchema = z.object({
  providerType: z.enum([
    ProviderType.ADVOCATE,
    ProviderType.ARBITRATOR,
    ProviderType.MEDIATOR,
    ProviderType.NOTARY,
    ProviderType.DOCUMENT_WRITER,
    ProviderType.LEGAL_CONSULTANT,
  ]),
  state: z.string().min(2, 'State name is required'),
  district: z.string().min(2, 'District is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Indian postal PIN code must be exactly 6 digits'),
  languagesSpoken: z.array(z.string()).min(1, 'Select at least one communication language'),
  bio: z
    .string()
    .max(1000, 'Factual bio cannot exceed 1000 characters')
    .refine(
      (text) => {
        if (!text) return true;
        const lower = text.toLowerCase();
        return !PROHIBITED_PROMOTIONAL_TERMS.some((term) => lower.includes(term));
      },
      {
        message:
          'BCI Rule 36 Violation: Subjective claims, rankings ("best lawyer", "guaranteed win"), and commercial touting are strictly prohibited for advocates.',
      }
    )
    .optional(),
});

export const step2ProfessionalDetailsSchema = z
  .object({
    providerType: z.enum([
      ProviderType.ADVOCATE,
      ProviderType.ARBITRATOR,
      ProviderType.MEDIATOR,
      ProviderType.NOTARY,
      ProviderType.DOCUMENT_WRITER,
      ProviderType.LEGAL_CONSULTANT,
    ]),
    stateBarCouncil: z.string().optional(),
    barRegistrationNo: z.string().optional(),
    notaryAppointmentNo: z.string().optional(),
    enrolmentYear: z.number().int().min(1960).max(new Date().getFullYear()).optional(),
    primaryCourt: z.string().min(2, 'Primary court or jurisdiction is required'),
    experienceYears: z.number().int().min(0, 'Experience years cannot be negative').max(60),
    practiceAreas: z.array(z.string()).min(1, 'Select at least one area of practice'),
    consultationFeeINR: z.number().min(0, 'Consultation fee cannot be negative'),
    isAvailableForProBono: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.providerType === ProviderType.ADVOCATE) {
        return !!data.stateBarCouncil && !!data.barRegistrationNo && !!data.enrolmentYear;
      }
      return true;
    },
    {
      message: 'Advocates must provide State Bar Council, Bar Registration No., and Year of Enrolment.',
      path: ['barRegistrationNo'],
    }
  )
  .refine(
    (data) => {
      if (data.providerType === ProviderType.NOTARY) {
        return !!data.notaryAppointmentNo;
      }
      return true;
    },
    {
      message: 'Notaries must provide official Notary Appointment/Commission Number.',
      path: ['notaryAppointmentNo'],
    }
  )
  .refine(
    (data) => {
      // Under Notaries Act 1952, verify state fee ceiling compliance
      if (data.providerType === ProviderType.NOTARY && data.consultationFeeINR > 500) {
        return false;
      }
      return true;
    },
    {
      message: 'Notaries Act 1952 Guardrail: Notary fees cannot exceed official state gazette ceilings (max INR 500 per notarial act).',
      path: ['consultationFeeINR'],
    }
  );

export const step3DocumentUploadSchema = z.object({
  credentialType: z.enum([
    CredentialType.BAR_COUNCIL_ENROLMENT,
    CredentialType.CERTIFICATE_OF_PRACTICE,
    CredentialType.NOTARY_COMMISSION,
    CredentialType.MEDIATOR_CERTIFICATE,
    CredentialType.ARBITRATION_EMPANELMENT,
    CredentialType.DOCUMENT_WRITER_LICENSE,
    CredentialType.PHOTO_ID,
  ]),
  certificateNumber: z.string().min(2, 'Certificate number is required'),
  issuingAuthority: z.string().min(2, 'Issuing authority is required'),
  documentUrl: z.string().url('Must be a valid secure URL'),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const step4StatutoryComplianceSchema = z.object({
  bciRule36Acknowledged: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge non-solicitation rules under BCI Rule 36.',
  }),
  truthfulnessDeclaration: z.boolean().refine((val) => val === true, {
    message: 'Declaration of truthfulness under Indian Oaths Act / BCI disciplinary rules is mandatory.',
  }),
  dpdpConsentAcknowledged: z.boolean().refine((val) => val === true, {
    message: 'Explicit consent under DPDP Act 2023 is required to verify your credentials.',
  }),
});

export const uploadUrlRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSizeBytes: z.number().int().optional(),
});

export type Step1BasicDetailsInput = z.infer<typeof step1BasicDetailsSchema>;
export type Step2ProfessionalDetailsInput = z.infer<typeof step2ProfessionalDetailsSchema>;
export type Step3DocumentUploadInput = z.infer<typeof step3DocumentUploadSchema>;
export type Step4StatutoryComplianceInput = z.infer<typeof step4StatutoryComplianceSchema>;
export type UploadUrlRequestInput = z.infer<typeof uploadUrlRequestSchema>;

