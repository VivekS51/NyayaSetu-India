export enum RoleType {
  CITIZEN = 'CITIZEN',
  LSP = 'LSP',
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
  DLSA_PARTNER = 'DLSA_PARTNER',
}

export enum ProviderType {
  ADVOCATE = 'ADVOCATE',
  ARBITRATOR = 'ARBITRATOR',
  MEDIATOR = 'MEDIATOR',
  NOTARY = 'NOTARY',
  DOCUMENT_WRITER = 'DOCUMENT_WRITER',
  LEGAL_CONSULTANT = 'LEGAL_CONSULTANT',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum VerificationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CredentialType {
  BAR_COUNCIL_ENROLMENT = 'BAR_COUNCIL_ENROLMENT',
  CERTIFICATE_OF_PRACTICE = 'CERTIFICATE_OF_PRACTICE',
  NOTARY_COMMISSION = 'NOTARY_COMMISSION',
  MEDIATOR_CERTIFICATE = 'MEDIATOR_CERTIFICATE',
  ARBITRATION_EMPANELMENT = 'ARBITRATION_EMPANELMENT',
  DOCUMENT_WRITER_LICENSE = 'DOCUMENT_WRITER_LICENSE',
  PHOTO_ID = 'PHOTO_ID',
}

export enum ServiceDeliveryMode {
  ONLINE_VIDEO = 'ONLINE_VIDEO',
  ONLINE_AUDIO = 'ONLINE_AUDIO',
  ONLINE_CHAT = 'ONLINE_CHAT',
  OFFLINE_IN_PERSON = 'OFFLINE_IN_PERSON',
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED_BY_CITIZEN = 'CANCELLED_BY_CITIZEN',
  CANCELLED_BY_PROVIDER = 'CANCELLED_BY_PROVIDER',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  CAPTURED_IN_ESCROW = 'CAPTURED_IN_ESCROW',
  RELEASED_TO_PROVIDER = 'RELEASED_TO_PROVIDER',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  PHONEPE = 'PHONEPE',
  UPI_DIRECT = 'UPI_DIRECT',
  SYSTEM_MOCK = 'SYSTEM_MOCK',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  RESOLVED_REFUNDED = 'RESOLVED_REFUNDED',
  RESOLVED_SETTLED = 'RESOLVED_SETTLED',
  REJECTED = 'REJECTED',
}

export enum TierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum PointsType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  EXPIRED = 'EXPIRED',
}

export interface UserSessionPayload {
  userId: string;
  phone: string;
  email?: string | null;
  roles: RoleType[];
  fullName: string;
  providerProfileId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp: string;
    disclaimer?: string;
    [key: string]: any;
  };
  errors?: any;
}
