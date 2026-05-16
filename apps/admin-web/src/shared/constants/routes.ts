export const ADMIN_ROUTES = {
  LOGIN:           '/admin/login',
  DASHBOARD:       '/admin',
  HOSPITALS:       '/admin/hospitals',
  HOSPITAL_DETAIL: (id: string) => `/admin/hospitals/${id}`,
  USERS:           '/admin/users',
  USER_DETAIL:     (id: string) => `/admin/users/${id}`,
} as const;
