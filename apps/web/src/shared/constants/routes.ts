export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  SETUP_2FA: '/setup-2fa',

  // Workspace — hospital picker
  HOSPITALS: '/hospitals',
  HOSPITAL_CREATE: '/hospitals/new',

  // Hospital-scoped — all live under /h/:slug
  HOSPITAL: (slug: string) => `/h/${slug}`,
  HOSPITAL_DASHBOARD: (slug: string) => `/h/${slug}/dashboard`,
  HOSPITAL_SETTINGS: (slug: string) => `/h/${slug}/settings`,

  // Staff
  HOSPITAL_STAFF: (slug: string) => `/h/${slug}/staff`,
  HOSPITAL_STAFF_PROFILE: (slug: string, staffId: string) =>
    `/h/${slug}/staff/${staffId}`,
  HOSPITAL_STAFF_INVITE: (slug: string) => `/h/${slug}/staff/invite`,
  HOSPITAL_ORG_CHART: (slug: string) => `/h/${slug}/staff/org-chart`,

  // Patients
  HOSPITAL_PATIENTS: (slug: string) => `/h/${slug}/patients`,
  HOSPITAL_PATIENT_REGISTER: (slug: string) => `/h/${slug}/patients/register`,
  HOSPITAL_PATIENT_CHECK_IN: (slug: string) => `/h/${slug}/patients/check-in`,
  HOSPITAL_PATIENT_PROFILE: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}`,
  HOSPITAL_PATIENT_ID_CARD: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/id-card`,

  // EMR — chart tabs
  HOSPITAL_CHART: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart`,
  HOSPITAL_CHART_VITALS: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/vitals`,
  HOSPITAL_CHART_MEDICATIONS: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/medications`,
  HOSPITAL_CHART_HISTORY: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/history`,
  HOSPITAL_CHART_PROCEDURES: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/procedures`,
  HOSPITAL_CHART_IMMUNIZATIONS: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/immunizations`,
  HOSPITAL_CHART_DOCUMENTS: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/documents`,
  HOSPITAL_CHART_AUDIT: (slug: string, code: string) =>
    `/h/${slug}/patients/${code}/chart/audit`,

  // Labs
  HOSPITAL_LABS: (slug: string) => `/h/${slug}/labs`,
  HOSPITAL_LAB_ORDER: (slug: string, orderId: string) =>
    `/h/${slug}/labs/${orderId}`,
  HOSPITAL_LAB_RESULTS: (slug: string) => `/h/${slug}/labs/results`,

  // Assets
  HOSPITAL_ASSETS: (slug: string) => `/h/${slug}/assets`,
  HOSPITAL_ASSET_CREATE: (slug: string) => `/h/${slug}/assets/new`,
  HOSPITAL_ASSET_DETAIL: (slug: string, assetId: string) =>
    `/h/${slug}/assets/${assetId}`,

  // Review queue
  HOSPITAL_REVIEW_QUEUE: (slug: string) => `/h/${slug}/review`,
  HOSPITAL_REVIEW_ITEM: (slug: string, itemId: string) =>
    `/h/${slug}/review/${itemId}`,

  // Notifications & search
  HOSPITAL_NOTIFICATIONS: (slug: string) => `/h/${slug}/notifications`,
  HOSPITAL_SEARCH: (slug: string) => `/h/${slug}/search`,
} as const;
