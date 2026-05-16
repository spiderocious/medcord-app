// Single source of truth for backend URL paths. Apps reach the server through
// the named constants here so a rename touches one line, not dozens.
export const EP = {
  HEALTH: 'api/v1/health',

  // Auth
  AUTH_LOGIN: 'api/v1/auth/login',
  AUTH_REGISTER: 'api/v1/auth/register',
  AUTH_REFRESH: 'api/v1/auth/refresh',
  AUTH_LOGOUT: 'api/v1/auth/logout',
  AUTH_ME: 'api/v1/auth/me',
  AUTH_FORGOT_PASSWORD: 'api/v1/auth/forgot-password',
  AUTH_RESET_PASSWORD: 'api/v1/auth/reset-password',
  AUTH_SETUP_2FA: 'api/v1/auth/setup-2fa',
  AUTH_VERIFY_2FA: 'api/v1/auth/verify-2fa',
  AUTH_CHANGE_PASSWORD: 'api/v1/auth/me/password',
  AUTH_UPDATE_ME: 'api/v1/auth/me',

  // Hospitals
  HOSPITALS: 'api/v1/hospitals',
  HOSPITAL: (id: string) => `api/v1/hospitals/${id}`,
  HOSPITAL_STATS: (id: string) => `api/v1/hospitals/${id}/stats`,

  // Staff
  HOSPITAL_STAFF: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/staff`,
  HOSPITAL_STAFF_MEMBER: (hospitalId: string, staffId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${staffId}`,
  HOSPITAL_STAFF_SUSPEND: (hospitalId: string, staffId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${staffId}/suspend`,
  HOSPITAL_STAFF_REACTIVATE: (hospitalId: string, staffId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${staffId}/reactivate`,

  // Invitations
  HOSPITAL_INVITATIONS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/invitations`,
  HOSPITAL_INVITATION_RESEND: (hospitalId: string, invId: string) =>
    `api/v1/hospitals/${hospitalId}/invitations/${invId}/resend`,
  HOSPITAL_INVITATION_REVOKE: (hospitalId: string, invId: string) =>
    `api/v1/hospitals/${hospitalId}/invitations/${invId}`,

  // Org chart & roles
  HOSPITAL_ORG_CHART: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/org-chart`,
  HOSPITAL_ROLES: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/roles`,

  // Patients
  HOSPITAL_PATIENTS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/patients`,
  HOSPITAL_PATIENTS_RECENTS: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/recents`,
  PATIENT: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}`,
  PATIENT_FAVORITE: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/favorite`,
  PATIENT_CHECK_IN: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/check-in`,
  PATIENT_CHECK_OUT: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/check-out`,
  PATIENT_ADMIT: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/admit`,
  PATIENT_DISCHARGE: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/discharge`,
  PATIENT_TRANSFER: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/transfer`,
  PATIENT_ID_CARD: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/id-card`,
  PATIENT_ID_CARD_ISSUE: (hospitalId: string, code: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${code}/id-card/issue`,

  // EMR
  CHART: (code: string) => `api/v1/emr/patients/${code}/chart`,
  VITALS: (code: string) => `api/v1/emr/patients/${code}/vitals`,
  MEDICATIONS: (code: string) => `api/v1/emr/patients/${code}/medications`,
  MEDICATION: (code: string, medId: string) =>
    `api/v1/emr/patients/${code}/medications/${medId}`,
  DRUG_INTERACTIONS: 'api/v1/emr/drug-interactions',
  HISTORY: (code: string) => `api/v1/emr/patients/${code}/history`,
  HISTORY_DIAGNOSES: (code: string) => `api/v1/emr/patients/${code}/history/diagnoses`,
  PROCEDURES: (code: string) => `api/v1/emr/patients/${code}/procedures`,
  IMMUNIZATIONS: (code: string) => `api/v1/emr/patients/${code}/immunizations`,
  DOCUMENTS: (code: string) => `api/v1/emr/patients/${code}/documents`,
  CHART_ACCESS: (code: string) => `api/v1/emr/patients/${code}/access`,
  CHART_AUDIT_LOG: (code: string) => `api/v1/emr/patients/${code}/access-log`,

  // Labs
  HOSPITAL_LAB_ORDERS: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/labs/orders`,
  LAB_ORDER: (orderId: string) => `api/v1/labs/orders/${orderId}`,
  LAB_ORDER_STATE_ADVANCE: (orderId: string) =>
    `api/v1/labs/orders/${orderId}/state/advance`,
  LAB_ORDER_RESULT: (orderId: string) => `api/v1/labs/orders/${orderId}/result`,
  LAB_ORDER_RESULT_ACKNOWLEDGE: (orderId: string) =>
    `api/v1/labs/orders/${orderId}/result/acknowledge`,
  LAB_ORDER_RESULT_SIGN_OFF: (orderId: string) =>
    `api/v1/labs/orders/${orderId}/result/sign-off`,
  HOSPITAL_LAB_PENDING_RESULTS: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/labs/results/pending`,

  // Assets
  HOSPITAL_ASSETS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/assets`,
  HOSPITAL_ASSETS_BULK: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/assets/bulk`,
  ASSET: (assetId: string) => `api/v1/assets/${assetId}`,
  ASSET_ARCHIVE: (assetId: string) => `api/v1/assets/${assetId}/archive`,
  ASSET_LOCATION: (assetId: string) => `api/v1/assets/${assetId}/location`,
  ASSET_LOCATION_HISTORY: (assetId: string) =>
    `api/v1/assets/${assetId}/location/history`,
  ASSET_LABEL: (assetId: string) => `api/v1/assets/${assetId}/label`,

  // Review queue
  HOSPITAL_REVIEW_QUEUE: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/review-queue`,
  REVIEW_ITEM: (itemId: string) => `api/v1/review-queue/${itemId}`,
  REVIEW_ITEM_APPROVE: (itemId: string) => `api/v1/review-queue/${itemId}/approve`,
  REVIEW_ITEM_REJECT: (itemId: string) => `api/v1/review-queue/${itemId}/reject`,
  REVIEW_ITEM_REQUEST_CHANGES: (itemId: string) =>
    `api/v1/review-queue/${itemId}/request-changes`,
  REVIEW_ITEM_CO_SIGN: (itemId: string) => `api/v1/review-queue/${itemId}/co-sign`,

  // Notifications
  HOSPITAL_NOTIFICATIONS: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/notifications`,
  HOSPITAL_NOTIFICATIONS_READ_ALL: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/notifications/read-all`,
  NOTIFICATION_READ: (notifId: string) => `api/v1/notifications/${notifId}/read`,

  // Search
  HOSPITAL_SEARCH: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/search`,

  // File upload (shared)
  FILE_UPLOAD: 'api/v1/assets/upload',
} as const;
