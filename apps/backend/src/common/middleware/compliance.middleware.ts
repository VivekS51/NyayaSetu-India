import { Request, Response, NextFunction } from 'express';

export const complianceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Statutory disclaimers required by Indian LegalTech precedents
  res.setHeader(
    'X-Platform-Disclaimer',
    'Neutral technology directory. Platform does not offer legal advice or solicit clients.'
  );
  res.setHeader('X-BCI-Rule-36-Compliance', 'Active');
  res.setHeader('X-DPDP-Act-2023-Jurisdiction', 'India (Sovereign Storage)');

  // OWASP Top 10 Security Hardening Headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;"
  );

  next();
};

export const requireDpdpConsent = (req: Request, res: Response, next: NextFunction): void => {
  const consentHeader = req.headers['x-dpdp-consent'];
  const consentBody = req.body?.dpdpConsentAcknowledged;

  if (consentHeader !== 'granted' && consentBody !== true) {
    res.status(400).json({
      success: false,
      message:
        'DPDP Act 2023 Statutory Requirement: Explicit digital consent must be granted before processing personal and case data.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

