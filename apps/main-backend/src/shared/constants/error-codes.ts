export const ERROR_CODES = [
  'validation_error',
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'internal',
  // auth
  'invalid_credentials',
  'email_not_verified',
  'token_expired',
  'token_invalid',
  'two_factor_required',
  'two_factor_invalid',
  // hospital
  'hospital_not_found',
  'not_a_member',
  'module_disabled',
  // staff / invitations
  'invitation_not_found',
  'invitation_expired',
  'invitation_already_used',
  // patients
  'patient_not_found',
  'duplicate_patient',
  'patient_already_admitted',
  'patient_not_admitted',
  'transfer_not_found',
  // emr
  'chart_access_denied',
  // labs
  'lab_order_not_found',
  'invalid_state_transition',
  // assets
  'asset_not_found',
  // review
  'review_item_not_found',
  // notifications
  'notification_not_found',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
