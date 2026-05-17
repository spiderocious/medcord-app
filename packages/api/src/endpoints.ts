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
  AUTH_GENERATE_RESET_CODE: 'api/v1/auth/generate-reset-code',
  AUTH_VERIFY_RESET_CODE: 'api/v1/auth/verify-reset-code',
  AUTH_RESET_PASSWORD: 'api/v1/auth/reset-password',
  AUTH_SETUP_2FA: 'api/v1/auth/setup-2fa',
  AUTH_VERIFY_2FA: 'api/v1/auth/verify-2fa',
  AUTH_CHANGE_PASSWORD: 'api/v1/auth/me/password',
  AUTH_UPDATE_ME: 'api/v1/auth/me',

  // Hospitals — mounted at /api/v1/hospitals
  HOSPITALS: 'api/v1/hospitals',
  HOSPITAL: (id: string) => `api/v1/hospitals/${id}`,
  HOSPITAL_BRANDING: (id: string) => `api/v1/hospitals/${id}/branding`,
  HOSPITAL_MODULES: (id: string) => `api/v1/hospitals/${id}/modules`,
  HOSPITAL_DOMAIN: (id: string) => `api/v1/hospitals/${id}/domain`,
  HOSPITAL_USAGE: (id: string) => `api/v1/hospitals/${id}/usage`,
  HOSPITAL_TRANSFER_OWNERSHIP: (id: string) => `api/v1/hospitals/${id}/transfer-ownership`,
  HOSPITAL_UNITS: (id: string) => `api/v1/hospitals/${id}/units`,
  HOSPITAL_UNIT: (hospitalId: string, unitId: string) => `api/v1/hospitals/${hospitalId}/units/${unitId}`,

  // Staff — mounted at /api/v1/hospitals/:hospitalId
  HOSPITAL_STAFF: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/staff`,
  HOSPITAL_STAFF_ME: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/staff/me`,
  HOSPITAL_STAFF_MEMBER: (hospitalId: string, memberId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${memberId}`,
  HOSPITAL_STAFF_SUSPEND: (hospitalId: string, memberId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${memberId}/suspend`,
  HOSPITAL_STAFF_ACTIVATE: (hospitalId: string, memberId: string) =>
    `api/v1/hospitals/${hospitalId}/staff/${memberId}/activate`,

  // Invitations — mounted at /api/v1/hospitals/:hospitalId
  HOSPITAL_INVITATIONS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/invitations`,
  HOSPITAL_INVITATIONS_BULK: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/invitations/bulk`,
  HOSPITAL_INVITATION: (hospitalId: string, invId: string) =>
    `api/v1/hospitals/${hospitalId}/invitations/${invId}`,
  HOSPITAL_INVITATION_RESEND: (hospitalId: string, invId: string) =>
    `api/v1/hospitals/${hospitalId}/invitations/${invId}/resend`,
  INVITATION_GET: (token: string) => `api/v1/invitations/${token}`,
  INVITATION_ACCEPT: (token: string) => `api/v1/invitations/${token}/accept`,
  INVITATION_DECLINE: (token: string) => `api/v1/invitations/${token}/decline`,

  // Roles — mounted at /api/v1/hospitals/:hospitalId
  HOSPITAL_ROLES: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/roles`,
  HOSPITAL_ROLE: (hospitalId: string, roleId: string) =>
    `api/v1/hospitals/${hospitalId}/roles/${roleId}`,

  // Org chart & share — mounted at /api/v1/hospitals/:hospitalId
  HOSPITAL_ORG_CHART: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/org-chart`,
  HOSPITAL_SHARE: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/share`,

  // Patients — mounted at /api/v1/hospitals/:hospitalId/patients
  HOSPITAL_PATIENTS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/patients`,
  HOSPITAL_PATIENTS_RECENT: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/recent`,
  HOSPITAL_PATIENTS_FAVORITES: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/patients-favorites`,
  PATIENT: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}`,
  PATIENT_FAVORITE: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/favorite`,
  PATIENT_CHECKIN: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/checkin`,
  PATIENT_CHECKOUT: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/checkout`,
  PATIENT_ADMIT: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/admit`,
  PATIENT_DISCHARGE: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/discharge`,
  PATIENT_TRANSFER: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/transfer`,
  PATIENT_ID_CARD: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card`,
  PATIENT_ADMISSIONS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/admissions`,
  PATIENT_CHECK_INS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/check-ins`,
  PATIENT_LOOKUP: (patientCode: string) => `api/v1/patients/lookup/${patientCode}`,
  HOSPITAL_TRANSFERS_INCOMING: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/transfers/incoming`,
  HOSPITAL_TRANSFERS_OUTGOING: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/transfers/outgoing`,
  HOSPITAL_TRANSFER_ACCEPT: (hospitalId: string, transferId: string) =>
    `api/v1/hospitals/${hospitalId}/transfers/${transferId}/accept`,
  HOSPITAL_TRANSFER_DECLINE: (hospitalId: string, transferId: string) =>
    `api/v1/hospitals/${hospitalId}/transfers/${transferId}/decline`,

  // EMR — mounted at /api/v1/hospitals/:hospitalId/patients/:patientId
  CHART: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart`,
  CHART_VITALS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/vitals`,
  CHART_MEDICATIONS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/medications`,
  CHART_MEDICATION: (hospitalId: string, patientId: string, medId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/medications/${medId}`,
  CHART_HISTORY: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/history`,
  CHART_PROCEDURES: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/procedures`,
  CHART_IMMUNIZATIONS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/immunizations`,
  CHART_DOCUMENTS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/documents`,
  CHART_DOCUMENT: (hospitalId: string, patientId: string, docId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/documents/${docId}`,
  CHART_ACCESS_LOG: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/access-log`,
  CHART_BREAK_GLASS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/break-glass`,

  // Labs — mounted at /api/v1/hospitals/:hospitalId/patients/:patientId/labs
  PATIENT_LABS: (hospitalId: string, patientId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs`,
  PATIENT_LAB_ORDER: (hospitalId: string, patientId: string, orderId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs/${orderId}`,
  PATIENT_LAB_ORDER_ADVANCE: (hospitalId: string, patientId: string, orderId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs/${orderId}/advance`,
  PATIENT_LAB_ORDER_RESULT: (hospitalId: string, patientId: string, orderId: string) =>
    `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs/${orderId}/result`,
  HOSPITAL_LABS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/labs`,

  // Assets — mounted at /api/v1/hospitals/:hospitalId/assets
  HOSPITAL_ASSETS: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/assets`,
  HOSPITAL_ASSET: (hospitalId: string, assetId: string) =>
    `api/v1/hospitals/${hospitalId}/assets/${assetId}`,
  HOSPITAL_ASSET_STATUS: (hospitalId: string, assetId: string) =>
    `api/v1/hospitals/${hospitalId}/assets/${assetId}/status`,
  HOSPITAL_ASSET_MOVE: (hospitalId: string, assetId: string) =>
    `api/v1/hospitals/${hospitalId}/assets/${assetId}/move`,
  HOSPITAL_ASSET_PHOTOS: (hospitalId: string, assetId: string) =>
    `api/v1/hospitals/${hospitalId}/assets/${assetId}/photos`,
  HOSPITAL_ASSET_PHOTO: (hospitalId: string, assetId: string, fileKey: string) =>
    `api/v1/hospitals/${hospitalId}/assets/${assetId}/photos/${fileKey}`,

  // Notifications
  HOSPITAL_NOTIFICATIONS: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/notifications`,
  HOSPITAL_NOTIFICATIONS_READ_ALL: (hospitalId: string) =>
    `api/v1/hospitals/${hospitalId}/notifications/read-all`,
  NOTIFICATION_READ: (notifId: string) => `api/v1/notifications/${notifId}/read`,

  // Search
  HOSPITAL_SEARCH: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/search`,

  // Audit log
  HOSPITAL_AUDIT_LOG: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/audit-log`,

  // Admin — mounted at /admin (NOT /api/v1/)
  ADMIN_STATS: 'admin/stats',
  ADMIN_HOSPITALS: 'admin/hospitals',
  ADMIN_HOSPITAL: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
  ADMIN_HOSPITAL_UPDATE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
  ADMIN_HOSPITAL_DELETE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
  ADMIN_USERS: 'admin/users',
  ADMIN_USER: (userId: string) => `admin/users/${userId}`,
  ADMIN_USER_UPDATE: (userId: string) => `admin/users/${userId}`,
  ADMIN_USER_DISABLE: (userId: string) => `admin/users/${userId}/disable`,
} as const;
