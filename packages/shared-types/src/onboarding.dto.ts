import { z } from 'zod';

export const basicDetailsSchema = z.object({
  providerType: z.enum([
    'ADVOCATE',
    'ARBITRATOR',
    'MEDIATOR',
    'NOTARY',
    'DOCUMENT_WRITER',
    'LEGAL_CONSULTANT',
  ]),
  state: z.string().min(2),
  district: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  languagesSpoken: z.array(z.string()).min(1),
  bio: z.string().max(1000).optional(),
});

export const professionalCredentialsSchema = z.object({
  providerType: z.string(),
  stateBarCouncil: z.string().optional(),
  barRegistrationNo: z.string().optional(),
  notaryAppointmentNo: z.string().optional(),
  enrolmentYear: z.number().optional(),
  primaryCourt: z.string().min(2),
  experienceYears: z.number().min(0),
  practiceAreas: z.array(z.string()).min(1),
  consultationFeeINR: z.number().min(0),
  isAvailableForProBono: z.boolean().default(false),
});

