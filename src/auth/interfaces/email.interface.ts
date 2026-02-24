export interface EmailService {
  sendVerificationEmail(
    to: string,
    token: string,
    firstName: string,
  ): Promise<void>;
  sendPasswordResetEmail?(
    to: string,
    token: string,
    firstName: string,
  ): Promise<void>;
  sendPasswordChangedEmail?(to: string, firstName: string): Promise<void>;
  sendKYCSubmittedEmail?(to: string, firstName: string): Promise<void>;
  sendKYCStatusChangeEmail?(
    to: string,
    firstName: string,
    status: string,
    rejectionReason?: string,
  ): Promise<void>;
}

export interface VerificationEmailData {
  firstName: string;
  verificationLink: string;
  expiryHours: number;
}
