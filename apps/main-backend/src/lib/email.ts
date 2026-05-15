// Stub email service. All methods are no-ops.
// When a real email provider is wired, replace the implementations here —
// no call sites need to change.

export interface WelcomeEmailPayload {
  to: string;
  name: string;
}

export interface EmailVerificationPayload {
  to: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetPayload {
  to: string;
  name: string;
  resetUrl: string;
}

export interface StaffInvitationPayload {
  to: string;
  inviterName: string;
  hospitalName: string;
  role: string;
  inviteUrl: string;
}

export interface CriticalLabResultPayload {
  to: string;
  providerName: string;
  patientName: string;
  testName: string;
  value: string;
}

export interface TransferRequestPayload {
  to: string;
  recipientName: string;
  patientName: string;
  fromHospital: string;
  reason: string;
}

export interface ReviewOutcomePayload {
  to: string;
  submitterName: string;
  resourceType: string;
  outcome: 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
}

export const emailService = {
  sendWelcome: (_payload: WelcomeEmailPayload): Promise<void> => Promise.resolve(),
  sendEmailVerification: (_payload: EmailVerificationPayload): Promise<void> => Promise.resolve(),
  sendPasswordReset: (_payload: PasswordResetPayload): Promise<void> => Promise.resolve(),
  sendStaffInvitation: (_payload: StaffInvitationPayload): Promise<void> => Promise.resolve(),
  sendCriticalLabResult: (_payload: CriticalLabResultPayload): Promise<void> => Promise.resolve(),
  sendTransferRequest: (_payload: TransferRequestPayload): Promise<void> => Promise.resolve(),
  sendReviewOutcome: (_payload: ReviewOutcomePayload): Promise<void> => Promise.resolve(),
};
