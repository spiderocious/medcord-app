// Centralised route table. Apps import from here so route strings have
// exactly one source of truth across web + admin + website surfaces.
export const ROUTES = {
  // Public marketing
  HOME: '/',
  PRICING: '/pricing',
  ABOUT: '/about',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // App
  DASHBOARD: '/dashboard',
  SIMULATOR: '/simulator',
  SIMULATOR_RACE: (raceId: string) => `/simulator/${raceId}`,
  CONSTITUENCY: '/constituency',
  WAR_ROOM: '/war-room',

  // Citizen reporter (Module 4)
  CITIZEN: '/citizen',
  CITIZEN_REPORT: '/citizen/report',

  // Admin
  ADMIN_LOGIN: '/admin/login',
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_RACES: '/admin/races',
} as const;
