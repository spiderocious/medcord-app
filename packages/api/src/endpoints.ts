// Single source of truth for backend URL paths. Apps reach the server through
// the named constants here so a rename touches one line, not dozens.
export const EP = {
  HEALTH: 'api/v1/health',

  AUTH_LOGIN: 'api/v1/auth/login',
  AUTH_REGISTER: 'api/v1/auth/register',
  AUTH_REFRESH: 'api/v1/auth/refresh',
  AUTH_LOGOUT: 'api/v1/auth/logout',
  AUTH_ME: 'api/v1/me',

  // Module 0 — Simulator
  SIMULATOR_RACES: 'api/v1/simulator/races',
  SIMULATOR_RACE: (id: string) => `api/v1/simulator/races/${id}`,
  SIMULATOR_SCENARIOS: 'api/v1/simulator/scenarios',
  SIMULATOR_SCENARIO: (id: string) => `api/v1/simulator/scenarios/${id}`,
  SIMULATOR_RUN: 'api/v1/simulator/run',

  // Module 1 — Voter Data
  CONSTITUENCY: (id: string) => `api/v1/constituencies/${id}`,
  POLLING_UNITS: (constituencyId: string) =>
    `api/v1/constituencies/${constituencyId}/polling-units`,

  // Module 4 — War Room
  WAR_ROOM_FEED: (raceId: string) => `api/v1/war-room/${raceId}/feed`,
  WAR_ROOM_SUBMISSIONS: 'api/v1/war-room/submissions',
  CITIZEN_REPORT: 'api/v1/citizen/report',
} as const;
