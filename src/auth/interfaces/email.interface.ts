export interface EmailService {
  sendVerificationEmail(to: string, token: string, firstName: string): Promise<void>;
}

export interface VerificationEmailData {
  firstName: string;
  verificationLink: string;
  expiryHours: number;
}
