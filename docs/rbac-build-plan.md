ALWAYS RECHECK THE PLAN, DONT DO WHAT I DONT ASK!!!!!!
For every phase/feature, run lint, typecheck, and build!
when done, write out the qa handoff notes for the frontend and the backend, separately: see samples in /docs/qas

# Medcord — RBAC Build Plan

> Full role-based access control: permission constants, default roles seeded per hospital,
> permissions baked into JWT, session revocation on permission change, and full frontend gating
> on every nav item, button, and action.
>
> Read alongside `docs/rules-lessons.md` — every rule there applies here.

---

## Rules — Same as always, no exceptions

### meemaw — zero exceptions

| Banned | Required |
|---|---|
| `{cond && <X />}` | `<Show when={cond}><X /></Show>` |
| `{cond ? <X /> : <Y />}` | `<Show when={cond} fallback={<Y />}><X /></Show>` |
| `{items.map(...)}` | `<Repeat each={items as T[]}>{(item: T) => ...}</Repeat>` |
| `{isLoading ? ... : error ? ... : ...}` | `<Loadable loading error={error ?? undefined} loadingComponent errorComponent>` |

### Dual enforcement — non-negotiable

**The backend is the source of truth. The frontend is a convenience layer only.**

Every permission check that matters MUST be enforced in both places:

| Layer | Role | What it does |
|---|---|---|
| **Backend** | Authoritative gatekeeper | Rejects any request the caller lacks permission for — regardless of what the UI shows or hides. No endpoint trusts the client. |
| **Frontend** | UX layer | Hides nav items, disables buttons, and prevents navigating to screens the user can't use — to avoid wasted round-trips and confusing errors. |

**The backend cannot rely on the frontend to not send a request. A user with DevTools or curl can call any endpoint directly.**

Concretely:
- Every write endpoint (POST / PATCH / DELETE) MUST have `requirePermission(PERMISSIONS.X)` as middleware, matching the permission in the table above.
- Every read endpoint that is not universally accessible (e.g. audit log, access log, role management) MUST also have a `requirePermission` guard.
- The frontend `can(PERMISSIONS.X)` check gates the UI only — it is never a substitute for a backend guard.
- If a permission check exists only on the frontend, that is a bug.
- If a permission check exists only on the backend, that is acceptable (the UI may show an unexpected 403 — fine). The reverse is not.

### No raw strings for roles or permissions — ever

```ts
// BANNED:
if (member.role === 'super_admin') ...
requireRole('super_admin', 'hospital_admin')
if (permissions.includes('lab.release')) ...

// REQUIRED:
if (member.role === ROLES.SUPER_ADMIN) ...
requirePermission(PERMISSIONS.STAFF_INVITE)
if (can(PERMISSIONS.LAB_RELEASE)) ...
```

All role and permission values must be imported from `@medcord/rbac` (the new shared package). No direct strings anywhere.

### API client

```ts
// GET
const r = await apiClient.get(EP.SOME_ENDPOINT).json<{ data: SomeType }>();
return r.data;

// POST/PATCH with body
const r = await apiClient.post(EP.SOME_ENDPOINT, { json: payload }).json<...>();

// 204 — no .json()
await apiClient.post(EP.SOME_ENDPOINT);

// onError
onError: (err: unknown) => {
  DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
},
```

### Quality gate — run after every phase

```bash
pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build
pnpm nx run main-backend:build
```

---

## Architecture Overview

```
packages/rbac/                    ← NEW shared package
  src/
    permissions.ts                ← PERMISSIONS POJO (const enum style)
    roles.ts                      ← ROLES POJO + DEFAULT_ROLE_PERMISSIONS map
    descriptions.ts               ← PERMISSION_DESCRIPTIONS map (English UI labels)
    index.ts                      ← re-exports everything

apps/main-backend/
  middlewares/
    require-permission.middleware.ts   ← replaces requireRole() everywhere
  features/hospitals/
    hospital.service.ts           ← seed default roles on create + on get
  features/staff/
    staff.model.ts                ← CustomRole model stays as-is
    staff.service.ts              ← listRoles returns seeded + custom together
  features/auth/
    auth.service.ts               ← login() now resolves + embeds permissions in JWT
    jwt.ts                        ← AccessTokenPayload gains permissions: string[]

apps/medcord-web/
  shared/
    hooks/
      use-permissions.ts          ← reads permissions from JWT/auth context
    types/
      staff.ts                    ← Role type updated
  features/staff/features/roles/
    screen/roles-screen.tsx       ← redesigned: system roles read-only, custom roles editable
    screen/parts/role-form.tsx    ← permission toggles grouped by feature
```

---

## Build Order

| Phase | Scope | Backend? | Frontend? |
|---|---|---|---|
| 1 | Shared `@medcord/rbac` package | N/A (package) | N/A (package) |
| 2 | Backend: JWT permissions + session revocation | ✅ | — |
| 3 | Backend: Default role seeding | ✅ | — |
| 4 | Backend: `requirePermission` middleware + swap all guards | ✅ | — |
| 5 | Backend: `GET /hospitals/:id/roles` returns all roles with descriptions | ✅ | — |
| 6 | Frontend: `usePermissions` hook + permission-gate all nav/buttons | — | ✅ |
| 7 | Frontend: Roles screen redesign (system read-only, custom editable, permission toggles) | — | ✅ |
| 8 | Frontend: Invite form role dropdown from API | — | ✅ |

Build backend phases 1–5 first, then frontend phases 6–8. Run quality gate after each phase.

---

## Phase 1 — Shared `@medcord/rbac` Package

### Goal
One canonical place for all permission strings, role identifiers, default role→permission maps, and English descriptions. Consumed by backend (Node, no React) and frontend (React). No framework dependencies.

### Step 1 — Create the package

```
packages/rbac/
  package.json
  tsconfig.json
  src/
    permissions.ts
    roles.ts
    descriptions.ts
    index.ts
```

**`packages/rbac/package.json`:**
```json
{
  "name": "@medcord/rbac",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.build.json"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

**`packages/rbac/tsconfig.json`:** copy pattern from `packages/api/tsconfig.json`.

**`packages/rbac/tsconfig.build.json`:** copy pattern from `packages/api/tsconfig.build.json`.

### Step 2 — `src/permissions.ts`

```ts
export const PERMISSIONS = {
  // Staff
  STAFF_VIEW:         'staff.view',
  STAFF_INVITE:       'staff.invite',
  STAFF_UPDATE:       'staff.update',
  STAFF_SUSPEND:      'staff.suspend',
  STAFF_REMOVE:       'staff.remove',
  STAFF_ROLES_MANAGE: 'staff.roles.manage',

  // Patients
  PATIENT_VIEW:       'patient.view',
  PATIENT_CREATE:     'patient.create',
  PATIENT_UPDATE:     'patient.update',
  PATIENT_ADMIT:      'patient.admit',
  PATIENT_TRANSFER:   'patient.transfer',

  // EMR
  EMR_VIEW:                 'emr.view',
  EMR_VITALS_RECORD:        'emr.vitals.record',
  EMR_MEDICATIONS_VIEW:     'emr.medications.view',
  EMR_MEDICATIONS_WRITE:    'emr.medications.write',
  EMR_HISTORY_WRITE:        'emr.history.write',
  EMR_PROCEDURES_WRITE:     'emr.procedures.write',
  EMR_IMMUNIZATIONS_WRITE:  'emr.immunizations.write',
  EMR_DOCUMENTS_WRITE:      'emr.documents.write',
  EMR_ACCESS_LOG_VIEW:      'emr.access_log.view',
  EMR_BREAK_GLASS:          'emr.break_glass',

  // Labs
  LAB_VIEW:    'lab.view',
  LAB_CREATE:  'lab.create',
  LAB_PROCESS: 'lab.process',
  LAB_RELEASE: 'lab.release',

  // Assets
  ASSET_VIEW:   'asset.view',
  ASSET_CREATE: 'asset.create',
  ASSET_UPDATE: 'asset.update',
  ASSET_STATUS: 'asset.status',
  ASSET_MOVE:   'asset.move',
  ASSET_DELETE: 'asset.delete',

  // Review
  REVIEW_VIEW: 'review.view',
  REVIEW_ACT:  'review.act',

  // Workspace / Settings
  SETTINGS_VIEW:   'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  MODULES_MANAGE:  'modules.manage',
  AUDIT_VIEW:      'audit.view',
  SEARCH_USE:      'search.use',
  NOTIFICATIONS_VIEW: 'notifications.view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// All permissions as a flat array (used for validation and toggle UIs)
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
```

### Step 3 — `src/roles.ts`

```ts
import { PERMISSIONS, type Permission } from './permissions.js';

export const ROLES = {
  SUPER_ADMIN:         'super_admin',
  HOSPITAL_ADMIN:      'hospital_admin',
  DOCTOR:              'doctor',
  NURSE:               'nurse',
  NURSE_PRACTITIONER:  'nurse_practitioner',
  PHYSICIAN_ASSISTANT: 'physician_assistant',
  LAB_TECH:            'lab_tech',
  PHARMACIST:          'pharmacist',
  RECEPTION:           'reception',
  TECH:                'tech',
} as const;

export type SystemRole = (typeof ROLES)[keyof typeof ROLES];

// These are the only non-deletable, non-customisable roles.
// Custom roles created by the hospital are separate records in the DB.
export const SYSTEM_ROLES: SystemRole[] = Object.values(ROLES);

// Full permission set for each system role.
// super_admin permissions are not in this map — super_admin bypasses all checks.
export const DEFAULT_ROLE_PERMISSIONS: Record<Exclude<SystemRole, 'super_admin'>, Permission[]> = {
  hospital_admin: [
    PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_INVITE, PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_SUSPEND,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_DOCUMENTS_WRITE,
    PERMISSIONS.EMR_ACCESS_LOG_VIEW, PERMISSIONS.EMR_BREAK_GLASS,
    PERMISSIONS.LAB_VIEW,
    PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_STATUS, PERMISSIONS.ASSET_MOVE,
    PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT,
    PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  doctor: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
    PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_MEDICATIONS_WRITE,
    PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
    PERMISSIONS.EMR_IMMUNIZATIONS_WRITE, PERMISSIONS.EMR_DOCUMENTS_WRITE,
    PERMISSIONS.EMR_BREAK_GLASS,
    PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS, PERMISSIONS.LAB_RELEASE,
    PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  nurse: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
    PERMISSIONS.EMR_MEDICATIONS_VIEW,
    PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
    PERMISSIONS.EMR_IMMUNIZATIONS_WRITE,
    PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS,
    PERMISSIONS.REVIEW_VIEW,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  nurse_practitioner: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
    PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_MEDICATIONS_WRITE,
    PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
    PERMISSIONS.EMR_IMMUNIZATIONS_WRITE, PERMISSIONS.EMR_DOCUMENTS_WRITE,
    PERMISSIONS.EMR_BREAK_GLASS,
    PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS, PERMISSIONS.LAB_RELEASE,
    PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  physician_assistant: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
    PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_MEDICATIONS_WRITE,
    PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
    PERMISSIONS.EMR_IMMUNIZATIONS_WRITE, PERMISSIONS.EMR_DOCUMENTS_WRITE,
    PERMISSIONS.EMR_BREAK_GLASS,
    PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS, PERMISSIONS.LAB_RELEASE,
    PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  lab_tech: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_MEDICATIONS_VIEW,
    PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  pharmacist: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_MEDICATIONS_VIEW,
    PERMISSIONS.LAB_VIEW,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  reception: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  tech: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_STATUS, PERMISSIONS.ASSET_MOVE, PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
};
```

### Step 4 — `src/descriptions.ts`

```ts
import { PERMISSIONS, type Permission } from './permissions.js';
import { ROLES, type SystemRole } from './roles.js';

// English label shown in the UI alongside each permission toggle
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.STAFF_VIEW]:         'Can view the staff directory',
  [PERMISSIONS.STAFF_INVITE]:       'Can invite new staff members',
  [PERMISSIONS.STAFF_UPDATE]:       'Can update staff roles and details',
  [PERMISSIONS.STAFF_SUSPEND]:      'Can suspend or reactivate staff members',
  [PERMISSIONS.STAFF_REMOVE]:       'Can permanently remove staff members',
  [PERMISSIONS.STAFF_ROLES_MANAGE]: 'Can create and edit custom roles',

  [PERMISSIONS.PATIENT_VIEW]:       'Can view the patient list',
  [PERMISSIONS.PATIENT_CREATE]:     'Can register new patients',
  [PERMISSIONS.PATIENT_UPDATE]:     'Can update patient demographics',
  [PERMISSIONS.PATIENT_ADMIT]:      'Can admit and discharge patients',
  [PERMISSIONS.PATIENT_TRANSFER]:   'Can initiate and accept patient transfers',

  [PERMISSIONS.EMR_VIEW]:                 'Can open a patient\'s chart',
  [PERMISSIONS.EMR_VITALS_RECORD]:        'Can record vital signs',
  [PERMISSIONS.EMR_MEDICATIONS_VIEW]:     'Can view the medication list',
  [PERMISSIONS.EMR_MEDICATIONS_WRITE]:    'Can prescribe and update medications',
  [PERMISSIONS.EMR_HISTORY_WRITE]:        'Can add and edit medical history entries',
  [PERMISSIONS.EMR_PROCEDURES_WRITE]:     'Can record procedures',
  [PERMISSIONS.EMR_IMMUNIZATIONS_WRITE]:  'Can record immunizations',
  [PERMISSIONS.EMR_DOCUMENTS_WRITE]:      'Can upload and edit chart documents',
  [PERMISSIONS.EMR_ACCESS_LOG_VIEW]:      'Can view who accessed a patient\'s chart',
  [PERMISSIONS.EMR_BREAK_GLASS]:          'Can use emergency break-glass chart access',

  [PERMISSIONS.LAB_VIEW]:    'Can view lab orders',
  [PERMISSIONS.LAB_CREATE]:  'Can create new lab orders',
  [PERMISSIONS.LAB_PROCESS]: 'Can advance lab order status (collected → processing → ready)',
  [PERMISSIONS.LAB_RELEASE]: 'Can release lab results to the patient chart',

  [PERMISSIONS.ASSET_VIEW]:   'Can view the asset list',
  [PERMISSIONS.ASSET_CREATE]: 'Can add new assets',
  [PERMISSIONS.ASSET_UPDATE]: 'Can update asset information',
  [PERMISSIONS.ASSET_STATUS]: 'Can change asset status',
  [PERMISSIONS.ASSET_MOVE]:   'Can move assets between locations',
  [PERMISSIONS.ASSET_DELETE]: 'Can delete assets',

  [PERMISSIONS.REVIEW_VIEW]: 'Can view the review queue',
  [PERMISSIONS.REVIEW_ACT]:  'Can approve or reject items in the review queue',

  [PERMISSIONS.SETTINGS_VIEW]:      'Can view hospital settings',
  [PERMISSIONS.SETTINGS_UPDATE]:    'Can update hospital settings (name, branding, domain)',
  [PERMISSIONS.MODULES_MANAGE]:     'Can enable or disable feature modules',
  [PERMISSIONS.AUDIT_VIEW]:         'Can view the hospital-wide audit log',
  [PERMISSIONS.SEARCH_USE]:         'Can use global search',
  [PERMISSIONS.NOTIFICATIONS_VIEW]: 'Can view notifications',
};

// Groups for display in the permissions toggle UI
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Staff',
    permissions: [
      PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_INVITE, PERMISSIONS.STAFF_UPDATE,
      PERMISSIONS.STAFF_SUSPEND, PERMISSIONS.STAFF_REMOVE, PERMISSIONS.STAFF_ROLES_MANAGE,
    ],
  },
  {
    label: 'Patients',
    permissions: [
      PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
      PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    ],
  },
  {
    label: 'Medical Records (EMR)',
    permissions: [
      PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
      PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_MEDICATIONS_WRITE,
      PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
      PERMISSIONS.EMR_IMMUNIZATIONS_WRITE, PERMISSIONS.EMR_DOCUMENTS_WRITE,
      PERMISSIONS.EMR_ACCESS_LOG_VIEW, PERMISSIONS.EMR_BREAK_GLASS,
    ],
  },
  {
    label: 'Labs',
    permissions: [
      PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS, PERMISSIONS.LAB_RELEASE,
    ],
  },
  {
    label: 'Assets',
    permissions: [
      PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_UPDATE,
      PERMISSIONS.ASSET_STATUS, PERMISSIONS.ASSET_MOVE, PERMISSIONS.ASSET_DELETE,
    ],
  },
  {
    label: 'Review Queue',
    permissions: [PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT],
  },
  {
    label: 'Workspace & Settings',
    permissions: [
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.MODULES_MANAGE,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
    ],
  },
];

// Human-readable role names for display
export const ROLE_LABELS: Record<SystemRole, string> = {
  [ROLES.SUPER_ADMIN]:         'Super Admin',
  [ROLES.HOSPITAL_ADMIN]:      'Hospital Admin',
  [ROLES.DOCTOR]:              'Doctor',
  [ROLES.NURSE]:               'Nurse',
  [ROLES.NURSE_PRACTITIONER]:  'Nurse Practitioner',
  [ROLES.PHYSICIAN_ASSISTANT]: 'Physician Assistant',
  [ROLES.LAB_TECH]:            'Lab Technician',
  [ROLES.PHARMACIST]:          'Pharmacist',
  [ROLES.RECEPTION]:           'Receptionist',
  [ROLES.TECH]:                'Technician',
};
```

### Step 5 — `src/index.ts`

```ts
export * from './permissions.js';
export * from './roles.js';
export * from './descriptions.js';
```

### Step 6 — Wire into workspace

Add `@medcord/rbac` as a dependency to:
- `apps/main-backend/package.json` → `"@medcord/rbac": "workspace:*"`
- `apps/medcord-web/package.json` → `"@medcord/rbac": "workspace:*"`

Add path alias where needed. Check `apps/main-backend/tsconfig.json` for `paths` or `compilerOptions`. The package is resolved via workspace protocol — no alias needed if Node resolves it directly.

**Register in `nx.json` or `project.json`:** the `rbac` library must be buildable. Check `packages/api/project.json` for the pattern and replicate it in `packages/rbac/project.json`.

### Quality gate
```bash
pnpm nx run rbac:typecheck
pnpm nx run main-backend:build
pnpm nx run medcord-web:typecheck
```

---

## Phase 2 — Backend: Permissions in JWT + Session Revocation

### Goal
When a user logs in, their resolved permissions are embedded in the access token. If their role or a custom role's permissions change, their `tokenVersion` is bumped, making the old token invalid and forcing re-login.

### Current state
- `AccessTokenPayload` in `apps/main-backend/src/lib/jwt.ts` has: `{ sub, email, tokenVersion }`
- `auth.service.ts` `login()` builds tokens with `buildTokens(user.id, user.email, user.tokenVersion)`
- `hospitalScope` middleware resolves `req.hospitalMember.role` from DB on every request
- `requireRole()` checks `req.hospitalMember.role` against a list of roles

### Step 1 — Update `AccessTokenPayload` in `jwt.ts`

```ts
export interface AccessTokenPayload {
  sub: string;
  email: string;
  tokenVersion: number;
  // Map of hospitalId → array of permission strings for that hospital
  // super_admin gets empty array — it bypasses checks entirely
  hospitalPermissions: Record<string, string[]>;
}
```

No breaking change to `verifyAccessToken` — it just returns the same shape with the new field.

### Step 2 — Permission resolver utility

Create `apps/main-backend/src/lib/permissions.ts`:

```ts
import { PERMISSIONS, ROLES, DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS } from '@medcord/rbac';
import { CustomRoleModel } from '@features/staff/staff.model.js';
import type { IHospitalMember } from '@features/hospitals/hospital.model.js';

// Resolves the full permission set for a single hospital membership.
// super_admin: returns null (signal to bypass all checks)
// system role: reads from DEFAULT_ROLE_PERMISSIONS
// custom role slug: reads permissions from DB
export async function resolvePermissions(member: IHospitalMember): Promise<string[] | null> {
  if (member.role === ROLES.SUPER_ADMIN) return null; // bypass signal

  if (Object.values(ROLES).includes(member.role as any)) {
    // System role
    return DEFAULT_ROLE_PERMISSIONS[member.role as Exclude<typeof member.role, 'super_admin'>] ?? [];
  }

  // Custom role: look up by slug in the hospital's custom_roles collection
  const customRole = await CustomRoleModel.findOne({
    hospitalId: member.hospitalId,
    slug: member.role,
  }).lean();
  return customRole?.permissions ?? [];
}

// Resolves permissions for ALL hospitals the user is a member of.
// Returns a Record<hospitalId, string[]> — null means super_admin bypass for that hospital.
export async function resolveAllPermissions(
  memberships: IHospitalMember[],
): Promise<Record<string, string[] | null>> {
  const entries = await Promise.all(
    memberships.map(async (m) => [m.hospitalId, await resolvePermissions(m)] as const),
  );
  return Object.fromEntries(entries);
}
```

### Step 3 — Update `login()` in `auth.service.ts`

```ts
// Add import:
import { staffRepo } from '@features/staff/staff.repo.js';
import { resolveAllPermissions } from '@lib/permissions.js';
import { HospitalMemberModel } from '@features/hospitals/hospital.model.js';

// In login():
async login(body: LoginBody) {
  const user = await authRepo.findByEmail(body.email);
  if (!user) throw new InvalidCredentialsError();
  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();
  if (user.twoFactorEnabled) return { requiresTwoFactor: true };

  // Resolve permissions for all hospitals this user belongs to
  const memberships = await HospitalMemberModel.find({ userId: user.id, status: 'active' }).lean();
  const hospitalPermissions = await resolveAllPermissions(memberships);
  // null entries (super_admin) → store as special sentinel [] with a bypass flag per hospital
  // For simplicity: store null as the string '__super_admin__' and check that in middleware
  const permissionsMap: Record<string, string[]> = {};
  for (const [hid, perms] of Object.entries(hospitalPermissions)) {
    permissionsMap[hid] = perms ?? ['__super_admin__'];
  }

  const tokens = buildTokens(user.id, user.email, user.tokenVersion, permissionsMap);
  return { user: { id: user.id, email: user.email, name: user.name }, tokens };
},
```

> Note: if a user has no hospital memberships at login (brand new user), `permissionsMap` is `{}` — that's fine.

### Step 4 — Update `buildTokens` in `auth.service.ts`

```ts
const buildTokens = (
  userId: string,
  email: string,
  tokenVersion: number,
  hospitalPermissions: Record<string, string[]> = {},
) => ({
  accessToken: signAccessToken({ sub: userId, email, tokenVersion, hospitalPermissions }),
  refreshToken: signRefreshToken({ sub: userId, tokenVersion }),
});
```

Update all other call-sites of `buildTokens` (refresh flow) to also re-resolve permissions:

In `refresh()`:
```ts
const memberships = await HospitalMemberModel.find({ userId: dbUser.id, status: 'active' }).lean();
const resolved = await resolveAllPermissions(memberships);
const permissionsMap: Record<string, string[]> = {};
for (const [hid, perms] of Object.entries(resolved)) {
  permissionsMap[hid] = perms ?? ['__super_admin__'];
}
const tokens = buildTokens(dbUser.id, dbUser.email, dbUser.tokenVersion, permissionsMap);
```

### Step 5 — Session revocation when permissions change

Anywhere a staff member's role is changed (or a custom role's permissions are updated), bump the affected user's `tokenVersion`:

**In `staff.service.ts` — `updateMember()`:**
After updating the member record, if `body.role` was changed:
```ts
// bump the target user's tokenVersion
await authRepo.bumpTokenVersion(member.userId);
```

**In `staff.service.ts` — `updateRole()`:**
After updating the custom role's permissions, bump tokenVersion for every member of that hospital who has that role slug:
```ts
const affectedMembers = await HospitalMemberModel.find({
  hospitalId,
  role: roleSlug,  // the custom role's slug
}).lean();
await Promise.all(affectedMembers.map(m => authRepo.bumpTokenVersion(m.userId)));
```

`authRepo.bumpTokenVersion` should already exist (used for 2FA / password changes). If not, add:
```ts
bumpTokenVersion: (userId: string) =>
  UserModel.findOneAndUpdate({ id: userId }, { $inc: { tokenVersion: 1 } }).lean(),
```

### Step 6 — Update `hospitalScope` middleware

The middleware still does a DB membership lookup (for `memberId`, `status`). It no longer needs to pass `role` into the permission check — permissions are in the JWT. Update `req.hospitalMember` shape:

```ts
req.hospitalMember = {
  memberId: member.id,
  hospitalId: member.hospitalId,
  role: member.role,               // keep role for display/audit
  status: member.status,
  isSuperAdmin: permissionsMap.includes('__super_admin__'),
  permissions: new Set(permissionsMap),  // from JWT, not DB
};
```

Where `permissionsMap` comes from `req.user`'s decoded token:
```ts
// In hospitalScope, after finding the member:
const tokenPermissions = (req as any).tokenPayload?.hospitalPermissions?.[hospitalId] ?? [];
req.hospitalMember = {
  memberId: member.id,
  hospitalId: member.hospitalId,
  role: member.role,
  status: member.status,
  isSuperAdmin: tokenPermissions.includes('__super_admin__'),
  permissions: new Set<string>(tokenPermissions),
};
```

To make `req.tokenPayload` available, update `authenticate` middleware to store the decoded payload:
```ts
req.user = { id: payload.sub, email: payload.email, tokenVersion: payload.tokenVersion };
(req as any).tokenPayload = payload; // full decoded payload including hospitalPermissions
```

Or cleaner: extend `AuthUser`:
```ts
export interface AuthUser {
  id: string;
  email: string;
  tokenVersion: number;
  hospitalPermissions: Record<string, string[]>;
}
// then in authenticate:
req.user = {
  id: payload.sub,
  email: payload.email,
  tokenVersion: payload.tokenVersion,
  hospitalPermissions: payload.hospitalPermissions ?? {},
};
```

And in `hospitalScope`:
```ts
const tokenPermissions = req.user?.hospitalPermissions?.[hospitalId] ?? [];
```

Update the Express global declaration for `req.hospitalMember` to include `permissions: Set<string>` and `isSuperAdmin: boolean`.

### Files to touch (Phase 2)
- `apps/main-backend/src/lib/jwt.ts` — add `hospitalPermissions` to `AccessTokenPayload`
- `apps/main-backend/src/lib/permissions.ts` — **create**
- `apps/main-backend/src/features/auth/auth.service.ts` — update `login()`, `refresh()`, `buildTokens()`
- `apps/main-backend/src/features/staff/staff.service.ts` — bump `tokenVersion` in `updateMember()` and `updateRole()`
- `apps/main-backend/src/middlewares/auth.middleware.ts` — store full payload on `req.user`
- `apps/main-backend/src/middlewares/hospital-scope.middleware.ts` — populate `permissions` + `isSuperAdmin` from JWT

### Quality gate
```bash
pnpm nx run main-backend:build
```

---

## Phase 3 — Backend: Default Role Seeding

### Goal
Every hospital gets the 10 default system roles (as records in `custom_roles` collection) at creation time. Calling `GET /hospitals/:id` checks and seeds them if missing (so existing hospitals get them too).

### Context
- `custom_roles` collection already exists (`CustomRoleModel`)
- `ICustomRole` has: `{ id, hospitalId, name, slug, permissions: string[], createdAt, updatedAt }`
- We need one new field: `isSystem: boolean` — marks it as a default role that cannot be deleted

### Step 1 — Update `ICustomRole` model in `staff.model.ts`

Add to the interface and schema:
```ts
// Interface addition:
isSystem: boolean;          // true = one of the 10 default roles, cannot be deleted

// Schema addition:
isSystem: { type: Boolean, default: false },
```

### Step 2 — Create seeding utility `apps/main-backend/src/lib/seed-roles.ts`

```ts
import { ROLES, DEFAULT_ROLE_PERMISSIONS, ROLE_LABELS, PERMISSIONS, type SystemRole } from '@medcord/rbac';
import { newId } from '@lib/ids.js';
import { CustomRoleModel } from '@features/staff/staff.model.js';

const SYSTEM_ROLE_DEFS = (Object.values(ROLES) as SystemRole[]).map((role) => ({
  slug: role,
  name: ROLE_LABELS[role],
  permissions: role === ROLES.SUPER_ADMIN
    ? Object.values(PERMISSIONS) // super_admin seed has all perms but middleware bypasses
    : (DEFAULT_ROLE_PERMISSIONS[role as Exclude<SystemRole, 'super_admin'>] ?? []),
  isSystem: true,
}));

export async function seedDefaultRoles(hospitalId: string): Promise<void> {
  const existing = await CustomRoleModel.find({ hospitalId, isSystem: true }).lean();
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toCreate = SYSTEM_ROLE_DEFS.filter((def) => !existingSlugs.has(def.slug));
  if (toCreate.length === 0) return;

  await CustomRoleModel.insertMany(
    toCreate.map((def) => ({
      id: newId.role ? newId.role() : `role_${Math.random().toString(36).slice(2, 10)}`,
      hospitalId,
      name: def.name,
      slug: def.slug,
      permissions: def.permissions,
      isSystem: def.isSystem,
    })),
  );
}
```

> Check `apps/main-backend/src/lib/ids.ts` for the `newId` shape — add `role: () => ...` if it doesn't exist, following the existing pattern.

### Step 3 — Call `seedDefaultRoles` on hospital creation

In `apps/main-backend/src/features/hospitals/hospital.service.ts`, in `create()`:

```ts
import { seedDefaultRoles } from '@lib/seed-roles.js';

// After creating the hospital and the founding member:
await seedDefaultRoles(hospital.id);
```

### Step 4 — Call `seedDefaultRoles` on `GET /hospitals/:id`

In `hospital.service.ts`, in `get()`:

```ts
async get(hospitalId: string) {
  const hospital = await hospitalRepo.findById(hospitalId);
  if (!hospital) throw new NotFoundError('Hospital');
  // Ensure default roles exist (idempotent — no-op if already seeded)
  await seedDefaultRoles(hospitalId);
  return hospital;
},
```

> `seedDefaultRoles` is idempotent — it does nothing if all system roles already exist.

### Step 5 — Update `listRoles` in `staff.service.ts`

The existing `listRoles` only reads `custom_roles`. Now it reads everything in that collection (system + custom), returning all:

```ts
async listRoles(hospitalId: string) {
  const roles = await staffRepo.listRoles(hospitalId);
  return roles; // already includes isSystem field now
},
```

No change needed if `staffRepo.listRoles` does `CustomRoleModel.find({ hospitalId })` — all roles (system and custom) are in the same collection.

### Step 6 — Prevent deleting system roles

Add `DELETE /roles/:roleId` route (new endpoint). In the handler:
```ts
if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');
```

Add to `apps/main-backend/src/features/staff/staff.routes.ts`:
```ts
router.delete(
  '/roles/:roleId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.STAFF_ROLES_MANAGE),
  asyncHandler(async (req, res) => {
    await staffService.deleteRole(req.params['hospitalId'] as string, req.params['roleId'] as string);
    return ResponseUtil.noContent(res);
  }),
);
```

Add `deleteRole` to `staff.service.ts`:
```ts
async deleteRole(hospitalId: string, roleId: string) {
  const role = await staffRepo.findRoleById(hospitalId, roleId);
  if (!role) throw new NotFoundError('Role');
  if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');
  await staffRepo.deleteRole(hospitalId, roleId);
},
```

Add `findRoleById` and `deleteRole` to `staff.repo.ts` if they don't exist.

### New EP constant in `packages/api/src/endpoints.ts`

```ts
HOSPITAL_ROLE_DELETE: (hospitalId: string, roleId: string) =>
  `api/v1/hospitals/${hospitalId}/roles/${roleId}`,
```

(If `HOSPITAL_ROLE` already covers PATCH and DELETE via method, keep it as is — just note that DELETE uses the same path.)

### Files to touch (Phase 3)
- `apps/main-backend/src/features/staff/staff.model.ts` — add `isSystem` field
- `apps/main-backend/src/lib/seed-roles.ts` — **create**
- `apps/main-backend/src/lib/ids.ts` — add `role` id generator if missing
- `apps/main-backend/src/features/hospitals/hospital.service.ts` — call `seedDefaultRoles` in `create()` and `get()`
- `apps/main-backend/src/features/staff/staff.service.ts` — add `deleteRole()`
- `apps/main-backend/src/features/staff/staff.repo.ts` — add `findRoleById()`, `deleteRole()`
- `apps/main-backend/src/features/staff/staff.routes.ts` — add `DELETE /roles/:roleId`
- `packages/api/src/endpoints.ts` — add `HOSPITAL_ROLE_DELETE` if needed

### Quality gate
```bash
pnpm nx run main-backend:build
```

---

## Phase 4 — Backend: `requirePermission` Middleware + Swap All Guards

### Goal
Replace every `requireRole(...)` call with `requirePermission(PERMISSIONS.SOME_PERMISSION)`. `super_admin` bypasses all checks via `isSuperAdmin` flag. No role string appears in any route file.

### Enforcement contract

This table is the authoritative list of what the backend MUST enforce. Every row here must have a `requirePermission` guard (or equivalent service-level check) before this phase is done. The frontend mirrors these — but the backend does not trust the frontend.

| Endpoint | Method | Required permission |
|---|---|---|
| `/hospitals/:id/invitations` | POST | `PERMISSIONS.STAFF_INVITE` |
| `/hospitals/:id/invitations/bulk` | POST | `PERMISSIONS.STAFF_INVITE` |
| `/hospitals/:id/invitations` | GET | `PERMISSIONS.STAFF_INVITE` |
| `/hospitals/:id/invitations/:invId` | DELETE | `PERMISSIONS.STAFF_INVITE` |
| `/hospitals/:id/invitations/:invId/resend` | POST | `PERMISSIONS.STAFF_INVITE` |
| `/hospitals/:id/staff/:memberId` | PATCH | `PERMISSIONS.STAFF_UPDATE` |
| `/hospitals/:id/staff/:memberId/suspend` | POST | `PERMISSIONS.STAFF_SUSPEND` |
| `/hospitals/:id/staff/:memberId/activate` | POST | `PERMISSIONS.STAFF_SUSPEND` |
| `/hospitals/:id/staff/:memberId` | DELETE | `PERMISSIONS.STAFF_REMOVE` |
| `/hospitals/:id/roles` | POST | `PERMISSIONS.STAFF_ROLES_MANAGE` |
| `/hospitals/:id/roles/:roleId` | PATCH | `PERMISSIONS.STAFF_ROLES_MANAGE` |
| `/hospitals/:id/roles/:roleId` | DELETE | `PERMISSIONS.STAFF_ROLES_MANAGE` |
| `/hospitals/:id/patients/:pid/chart/vitals` | POST | `PERMISSIONS.EMR_VITALS_RECORD` |
| `/hospitals/:id/patients/:pid/chart/medications` | POST | `PERMISSIONS.EMR_MEDICATIONS_WRITE` |
| `/hospitals/:id/patients/:pid/chart/medications/:medId` | PATCH | `PERMISSIONS.EMR_MEDICATIONS_WRITE` |
| `/hospitals/:id/patients/:pid/chart/history` | PATCH | `PERMISSIONS.EMR_HISTORY_WRITE` |
| `/hospitals/:id/patients/:pid/chart/procedures` | POST | `PERMISSIONS.EMR_PROCEDURES_WRITE` |
| `/hospitals/:id/patients/:pid/chart/immunizations` | POST | `PERMISSIONS.EMR_IMMUNIZATIONS_WRITE` |
| `/hospitals/:id/patients/:pid/chart/documents` | POST | `PERMISSIONS.EMR_DOCUMENTS_WRITE` |
| `/hospitals/:id/patients/:pid/chart/documents/:docId` | PATCH | `PERMISSIONS.EMR_DOCUMENTS_WRITE` |
| `/hospitals/:id/patients/:pid/chart/access-log` | GET | `PERMISSIONS.EMR_ACCESS_LOG_VIEW` |
| `/hospitals/:id/patients/:pid/chart/break-glass` | POST | `PERMISSIONS.EMR_BREAK_GLASS` |
| `/hospitals/:id/patients/:pid/labs` | POST | `PERMISSIONS.LAB_CREATE` |
| `/hospitals/:id/patients/:pid/labs/:orderId/advance` | POST | `PERMISSIONS.LAB_PROCESS` (all transitions) + `PERMISSIONS.LAB_RELEASE` (service-level, only for `result_released` transition) |
| `/hospitals/:id/assets` | POST | `PERMISSIONS.ASSET_CREATE` |
| `/hospitals/:id/assets/:assetId` | PATCH | `PERMISSIONS.ASSET_UPDATE` |
| `/hospitals/:id/assets/:assetId/status` | POST | `PERMISSIONS.ASSET_STATUS` |
| `/hospitals/:id/assets/:assetId/move` | POST | `PERMISSIONS.ASSET_MOVE` |
| `/hospitals/:id/assets/:assetId` | DELETE | `PERMISSIONS.ASSET_DELETE` |
| `/hospitals/:id/audit-log` | GET | `PERMISSIONS.AUDIT_VIEW` |

> **Read endpoints not listed above** (patient list, lab list, asset list, staff list, etc.) are accessible to all active hospital members — no permission guard needed beyond `hospitalScope`.

> **The `result_released` transition on `/labs/:orderId/advance`** requires TWO checks: `requirePermission(PERMISSIONS.LAB_PROCESS)` at the route level (applies to all advance calls), and an additional `PERMISSIONS.LAB_RELEASE` check inside the service for the specific `result_released` transition. Both must exist.

### Step 1 — Create `require-permission.middleware.ts`

`apps/main-backend/src/middlewares/require-permission.middleware.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@lib/errors.js';
import type { Permission } from '@medcord/rbac';

export const requirePermission = (...permissions: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!req.hospitalMember) return next(new ForbiddenError('Not a member of this hospital'));

    // super_admin bypasses all permission checks
    if (req.hospitalMember.isSuperAdmin) return next();

    const hasAll = permissions.every((p) => req.hospitalMember!.permissions.has(p));
    if (!hasAll) return next(new ForbiddenError('You do not have permission to perform this action'));
    next();
  };
```

### Step 2 — Swap guards in all route files

**`staff.routes.ts`** — replace all `requireRole(...)`:

| Old guard | New guard |
|---|---|
| `requireRole('super_admin', 'hospital_admin')` on invitations | `requirePermission(PERMISSIONS.STAFF_INVITE)` |
| `requireRole('super_admin', 'hospital_admin')` on `PATCH /staff/:memberId` | `requirePermission(PERMISSIONS.STAFF_UPDATE)` |
| `requireRole('super_admin', 'hospital_admin')` on suspend | `requirePermission(PERMISSIONS.STAFF_SUSPEND)` |
| `requireRole('super_admin', 'hospital_admin')` on activate | `requirePermission(PERMISSIONS.STAFF_SUSPEND)` |
| `requireRole('super_admin', 'hospital_admin')` on delete | `requirePermission(PERMISSIONS.STAFF_REMOVE)` |
| `requireRole('super_admin')` on POST/PATCH roles | `requirePermission(PERMISSIONS.STAFF_ROLES_MANAGE)` |

**`emr.routes.ts`** — replace all `requireRole(...)`:

| Old guard | New guard |
|---|---|
| `requireRole(...PRESCRIBER_ROLES)` on POST medications | `requirePermission(PERMISSIONS.EMR_MEDICATIONS_WRITE)` |
| `requireRole(...PRESCRIBER_ROLES)` on PATCH medications | `requirePermission(PERMISSIONS.EMR_MEDICATIONS_WRITE)` |
| `requireRole(...CLINICAL_ROLES)` on PATCH history | `requirePermission(PERMISSIONS.EMR_HISTORY_WRITE)` |
| `requireRole(...CLINICAL_ROLES)` on POST procedures | `requirePermission(PERMISSIONS.EMR_PROCEDURES_WRITE)` |
| `requireRole(...CLINICAL_ROLES)` on POST immunizations | `requirePermission(PERMISSIONS.EMR_IMMUNIZATIONS_WRITE)` |
| `requireRole('super_admin', 'hospital_admin')` on GET access-log | `requirePermission(PERMISSIONS.EMR_ACCESS_LOG_VIEW)` |

**`lab.service.ts`** — replace the hardcoded PRESCRIBER_ROLES check on `result_released`:
```ts
// OLD (in advanceStatus service method):
const PRESCRIBER_ROLES = ['doctor', 'nurse_practitioner', 'physician_assistant'];
if (nextStatus === 'result_released' && !PRESCRIBER_ROLES.includes(userRole)) { ... }

// NEW: pass the member's permissions set instead of just the role string
// lab.routes.ts passes req.hospitalMember.permissions and isSuperAdmin:
if (nextStatus === 'result_released') {
  if (!isSuperAdmin && !permissions.has(PERMISSIONS.LAB_RELEASE)) {
    throw new ForbiddenError('You do not have permission to release lab results');
  }
}
```

Update the `advance` route in `lab.routes.ts` to pass `req.hospitalMember.permissions` and `req.hospitalMember.isSuperAdmin` into the service, or simply add `requirePermission(PERMISSIONS.LAB_RELEASE)` as middleware on only the `advance` route when `nextStatus === 'result_released'`.

Simplest approach: add `requirePermission(PERMISSIONS.LAB_RELEASE)` as a route-level guard only on the advance endpoint. The service-level check can be removed since the route already blocks it.

Wait — the advance endpoint handles ALL status transitions, not just `result_released`. So the guard can't go on the whole route. Keep the service-level check, but change it to use permissions:

In `lab.routes.ts` advance handler:
```ts
const body = AdvanceStatusBody.parse(req.body);
// Pass member's permission set to the service
const order = await labService.advanceStatus(
  hospitalId, patientId, orderId, body,
  req.hospitalMember!.permissions,
  req.hospitalMember!.isSuperAdmin,
);
```

In `lab.service.ts` `advanceStatus()`:
```ts
import { PERMISSIONS } from '@medcord/rbac';

async advanceStatus(
  hospitalId: string, patientId: string, orderId: string, body: AdvanceStatusBody,
  permissions: Set<string>, isSuperAdmin: boolean,
) {
  // ...existing status transition logic...
  if (nextStatus === 'result_released') {
    if (!isSuperAdmin && !permissions.has(PERMISSIONS.LAB_RELEASE)) {
      throw new ForbiddenError('You do not have permission to release lab results');
    }
  }
}
```

**`auth.routes.ts`** — `generate-reset-code` currently checks super_admin inside the service. That check can stay as a service-level check (it's auth-scoped, not hospital-scoped). No `requirePermission` needed here.

### Step 3 — Remove `requireRole` from all imports where it's no longer used

After swapping, `require-role.middleware.ts` can be kept but should no longer be imported in any route files. Do not delete the file — it can stay for reference — but ensure no route imports it anymore.

### Files to touch (Phase 4)
- `apps/main-backend/src/middlewares/require-permission.middleware.ts` — **create**
- `apps/main-backend/src/features/staff/staff.routes.ts` — swap guards
- `apps/main-backend/src/features/emr/emr.routes.ts` — swap guards
- `apps/main-backend/src/features/labs/lab.routes.ts` — update advance handler signature
- `apps/main-backend/src/features/labs/lab.service.ts` — update `advanceStatus` to use permissions set

### Quality gate
```bash
pnpm nx run main-backend:build
```

---

## Phase 5 — Backend: `GET /roles` Returns Full Role Metadata

### Goal
The frontend needs to know which roles are system roles (read-only), which are custom, what their permissions are, and the English descriptions for each permission. Return everything needed to render the roles screen and the invite form.

### Step 1 — Update `GET /roles` response shape

Currently returns `{ roles: ICustomRole[] }`. Update to return:

```ts
{
  data: {
    roles: Array<{
      id: string;
      name: string;
      slug: string;
      permissions: string[];         // permission keys
      isSystem: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    permissionDescriptions: Record<string, string>;  // PERMISSION_DESCRIPTIONS from @medcord/rbac
    permissionGroups: Array<{
      label: string;
      permissions: string[];
    }>;
  }
}
```

In `staff.service.ts` `listRoles()`:
```ts
import { PERMISSION_DESCRIPTIONS, PERMISSION_GROUPS } from '@medcord/rbac';

async listRoles(hospitalId: string) {
  const roles = await staffRepo.listRoles(hospitalId);
  return {
    roles,
    permissionDescriptions: PERMISSION_DESCRIPTIONS,
    permissionGroups: PERMISSION_GROUPS.map(g => ({ label: g.label, permissions: g.permissions })),
  };
},
```

In `staff.routes.ts` `GET /roles`:
```ts
const result = await staffService.listRoles(req.params['hospitalId'] as string);
return ResponseUtil.ok(res, result);
```

### Step 2 — Update `GET /hospitals/:id/staff/me` response

Also return the caller's resolved permission list so the frontend can cache it:

In `staff.service.ts` `getMyMembership()`:
```ts
import { resolvePermissions } from '@lib/permissions.js';
import { ROLES } from '@medcord/rbac';

async getMyMembership(hospitalId: string, userId: string) {
  const member = await staffRepo.findMember(hospitalId, userId);
  if (!member) throw new NotFoundError('Membership');
  const isSuperAdmin = member.role === ROLES.SUPER_ADMIN;
  const permissions = isSuperAdmin ? null : await resolvePermissions(member);
  return { ...member, permissions, isSuperAdmin };
},
```

> The frontend will use this as a fallback / secondary permission check, but the primary source is the JWT.

### Files to touch (Phase 5)
- `apps/main-backend/src/features/staff/staff.service.ts` — update `listRoles()` and `getMyMembership()`
- `apps/main-backend/src/features/staff/staff.routes.ts` — `GET /roles` response shape already correct if service returns the right thing

### Quality gate
```bash
pnpm nx run main-backend:build
```

---

## Phase 6 — Frontend: `usePermissions` Hook + Gate Everything

### Goal
Replace all `myMembership?.role === 'super_admin'` and hardcoded role checks in the frontend with a `can(PERMISSIONS.XYZ)` call backed by the JWT-embedded permissions.

### Step 1 — Read permissions from auth context

The JWT access token is decoded in `useAuth()`. Check `apps/medcord-web/src/shared/hooks/use-auth.ts` for how the token is stored/decoded.

If the JWT is decoded client-side (from localStorage or a cookie), add a `usePermissions(hospitalId)` hook that:
1. Decodes the stored access token
2. Reads `hospitalPermissions[hospitalId]`
3. Returns `{ can: (perm: Permission) => boolean, isSuperAdmin: boolean }`

Create `apps/medcord-web/src/shared/hooks/use-permissions.ts`:

```ts
import { useMemo } from 'react';
import { useAuth } from './use-auth.ts';
import type { Permission } from '@medcord/rbac';

export function usePermissions(hospitalId: string) {
  const { accessToken } = useAuth(); // adjust to match actual auth hook API

  return useMemo(() => {
    if (!accessToken) return { can: () => false, isSuperAdmin: false };

    // Decode JWT payload (no verification — client-side read only)
    const [, payloadB64] = accessToken.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    const perms: string[] = payload.hospitalPermissions?.[hospitalId] ?? [];
    const isSuperAdmin = perms.includes('__super_admin__');

    return {
      can: (permission: Permission): boolean => isSuperAdmin || perms.includes(permission),
      isSuperAdmin,
    };
  }, [accessToken, hospitalId]);
}
```

> Check `use-auth.ts` to find how the access token is exposed. If it's not currently exposed, add it to the auth context.

### Step 2 — Update sidebar (`sidebar.tsx`)

Import `PERMISSIONS` and `ROLES` from `@medcord/rbac`. Import `usePermissions`.

Replace `buildNavEntries` to gate each nav entry on a permission:

```ts
import { PERMISSIONS, ROLES } from '@medcord/rbac';
import { usePermissions } from '@shared/hooks/use-permissions.ts';

function buildNavEntries(slug: string, modules: HospitalModules, can: (p: Permission) => boolean): NavEntry[] {
  return [
    { label: 'Dashboard',     Icon: IconHome,       to: ROUTES.HOSPITAL_DASHBOARD(slug) },
    ...(can(PERMISSIONS.STAFF_VIEW)    ? [{ label: 'Staff',         Icon: IconUsers,      to: ROUTES.HOSPITAL_STAFF(slug) }] : []),
    ...(can(PERMISSIONS.STAFF_ROLES_MANAGE) ? [{ label: 'Roles', Icon: IconUsers, to: ROUTES.HOSPITAL_ROLES(slug) }] : []),
    ...(can(PERMISSIONS.PATIENT_VIEW) && modules.emr ? [{ label: 'Patients', Icon: IconHeartPulse, to: ROUTES.HOSPITAL_PATIENTS(slug) }] : []),
    ...(can(PERMISSIONS.PATIENT_TRANSFER) && modules.emr ? [{ label: 'Transfers', Icon: IconRefresh, to: ROUTES.HOSPITAL_TRANSFERS(slug) }] : []),
    ...(can(PERMISSIONS.LAB_VIEW) && modules.labs ? [{ label: 'Labs', Icon: IconFlask, to: ROUTES.HOSPITAL_LABS(slug) }] : []),
    ...(can(PERMISSIONS.ASSET_VIEW) && modules.assets ? [{ label: 'Assets', Icon: IconPackage, to: ROUTES.HOSPITAL_ASSETS(slug) }] : []),
    ...(can(PERMISSIONS.REVIEW_VIEW) ? [{ label: 'Review Queue', Icon: IconClipboard, to: ROUTES.HOSPITAL_REVIEW_QUEUE(slug) }] : []),
    ...(can(PERMISSIONS.SEARCH_USE) ? [{ label: 'Search', Icon: IconSearch, to: ROUTES.HOSPITAL_SEARCH(slug) }] : []),
    ...(can(PERMISSIONS.SETTINGS_VIEW) ? [{ label: 'Settings', Icon: IconSettings, to: ROUTES.HOSPITAL_SETTINGS(slug) }] : []),
  ];
}
```

In `Sidebar` component:
```tsx
const { activeHospitalId } = useAuth();
const { can } = usePermissions(activeHospitalId ?? '');
const entries = buildNavEntries(slug, modules, can);
```

Remove the old `useMyMembership` call from the sidebar (permissions come from the hook now).

### Step 3 — Gate buttons and actions across all screens

For every screen, replace role string checks with `can(PERMISSIONS.X)`. Use `usePermissions(hospitalId)` where `hospitalId` comes from `useAuth().activeHospitalId`.

Full list of changes:

**Staff directory screen:**
- "Invite staff" button → `<Show when={can(PERMISSIONS.STAFF_INVITE)}>`

**Staff profile screen (`profile-actions.tsx`):**
- Suspend button → `<Show when={can(PERMISSIONS.STAFF_SUSPEND) && ...}>`
- Activate button → `<Show when={can(PERMISSIONS.STAFF_SUSPEND) && ...}>`
- Remove button → `<Show when={can(PERMISSIONS.STAFF_REMOVE) && ...}>`
- Generate reset code → keep as `<Show when={isSuperAdmin && currentUserId !== member.userId}>` (not permission-based, super_admin only)

**EMR screens:**
- Medications: "Add medication" button → `<Show when={can(PERMISSIONS.EMR_MEDICATIONS_WRITE)}>`
- History: edit/update button → `<Show when={can(PERMISSIONS.EMR_HISTORY_WRITE)}>`
- Procedures: "Add procedure" button → `<Show when={can(PERMISSIONS.EMR_PROCEDURES_WRITE)}>`
- Immunizations: "Add immunization" button → `<Show when={can(PERMISSIONS.EMR_IMMUNIZATIONS_WRITE)}>`
- Documents: "Upload document" button → `<Show when={can(PERMISSIONS.EMR_DOCUMENTS_WRITE)}>`
- Vitals: "Record vitals" button → `<Show when={can(PERMISSIONS.EMR_VITALS_RECORD)}>`
- Access log tab → `<Show when={can(PERMISSIONS.EMR_ACCESS_LOG_VIEW)}>`
- Break-glass button → `<Show when={can(PERMISSIONS.EMR_BREAK_GLASS)}>`

**Lab screens:**
- "Create lab order" button → `<Show when={can(PERMISSIONS.LAB_CREATE)}>`
- Advance status button (non-release transitions) → `<Show when={can(PERMISSIONS.LAB_PROCESS)}>`
- `ResultSignoffPanel` "Release to chart" button → replace `PRESCRIBER_ROLES.includes(...)` with `can(PERMISSIONS.LAB_RELEASE)`

**Asset screens:**
- "Add asset" button → `<Show when={can(PERMISSIONS.ASSET_CREATE)}>`
- "Delete" button → `<Show when={can(PERMISSIONS.ASSET_DELETE)}>`
- "Change status" button → `<Show when={can(PERMISSIONS.ASSET_STATUS)}>`
- "Move" button → `<Show when={can(PERMISSIONS.ASSET_MOVE)}>`

**Review queue screen:**
- Approve/reject actions → `<Show when={can(PERMISSIONS.REVIEW_ACT)}>`

**Settings screen:**
- Entire settings screen is already behind a nav link gated on `PERMISSIONS.SETTINGS_VIEW`
- "Save" buttons in settings → `<Show when={can(PERMISSIONS.SETTINGS_UPDATE)}>`
- Modules tab → `<Show when={can(PERMISSIONS.MODULES_MANAGE)}>`
- Audit log tab → `<Show when={can(PERMISSIONS.AUDIT_VIEW)}>`

**Roles screen:**
- "New role" button → `<Show when={can(PERMISSIONS.STAFF_ROLES_MANAGE)}>`
- "Edit" button on rows → `<Show when={can(PERMISSIONS.STAFF_ROLES_MANAGE)}>`
- "Delete" button on custom roles → `<Show when={can(PERMISSIONS.STAFF_ROLES_MANAGE)}>`

### Files to touch (Phase 6)
- `apps/medcord-web/src/shared/hooks/use-permissions.ts` — **create**
- `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` — rebuild nav entry logic
- All screen files that currently have role string checks — remove them and replace with `can(PERMISSIONS.X)`
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx` — replace `PRESCRIBER_ROLES` check

### Quality gate
```bash
pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build
```

---

## Phase 7 — Frontend: Roles Screen Redesign

### Goal
The roles screen shows system roles (read-only, names not editable, permissions shown but locked) and custom roles (full create/edit/delete). The role create/edit form shows all permissions as toggle cards grouped by feature, with English labels from `PERMISSION_DESCRIPTIONS`.

### Current state
- `roles-screen.tsx` exists with inline create/edit forms (name + textarea for permissions)
- `role-form.tsx` exists with free-text permission input

Both files are replaced entirely.

### Step 1 — Update `use-roles.ts` API hook

The API now returns `{ roles, permissionDescriptions, permissionGroups }`. Update the hook to return all of it:

```ts
export interface RoleListResult {
  readonly roles: Role[];
  readonly permissionDescriptions: Record<string, string>;
  readonly permissionGroups: Array<{ label: string; permissions: string[] }>;
}

export function useRoles(hospitalId: string) {
  return useQuery({
    queryKey: ['roles', hospitalId],
    staleTime: 60_000,
    queryFn: async () => {
      const r = await apiClient.get(EP.HOSPITAL_ROLES(hospitalId)).json<{ data: RoleListResult }>();
      return r.data;
    },
  });
}
```

Add `useDeleteRole` mutation:
```ts
export function useDeleteRole(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(EP.HOSPITAL_ROLE(hospitalId, roleId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role deleted.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

Update the `Role` type in `apps/medcord-web/src/shared/types/staff.ts`:
```ts
export interface Role {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly slug: string;
  readonly permissions: readonly string[];
  readonly isSystem: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### Step 2 — Rewrite `role-form.tsx`

Replace the free-text textarea with grouped permission toggles.

```tsx
interface RoleFormProps {
  readonly hospitalId: string;
  readonly role?: Role;                   // undefined = create mode
  readonly permissionDescriptions: Record<string, string>;
  readonly permissionGroups: Array<{ label: string; permissions: string[] }>;
  readonly onDone: () => void;
}

export function RoleForm({ hospitalId, role, permissionDescriptions, permissionGroups, onDone }: RoleFormProps) {
  const createMutation = useCreateRole(hospitalId);
  const updateMutation = useUpdateRole(hospitalId, role?.id ?? '');

  const [name, setName] = useState(role?.name ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));

  const isEdit = role !== undefined;
  const isPending = createMutation.isPending || updateMutation.isPending;

  function toggle(permission: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  async function handleSave() {
    const permissions = Array.from(selected);
    if (isEdit) {
      await updateMutation.mutateAsync({ name: name.trim(), permissions });
    } else {
      await createMutation.mutateAsync({ name: name.trim(), permissions });
    }
    onDone();
  }

  return (
    <div className="space-y-5 rounded-xl border border-forest-900/10 bg-white p-5">
      <div>
        <label className="block text-sm font-medium text-charcoal-900 mb-1">Role name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Senior Nurse"
          className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-charcoal-900">Permissions</p>
        <Repeat each={permissionGroups as typeof permissionGroups}>
          {(group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">{group.label}</p>
              <Repeat each={group.permissions as string[]}>
                {(permission: string) => (
                  <label key={permission} className="flex items-start gap-3 cursor-pointer select-none">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected.has(permission)}
                        onChange={() => toggle(permission)}
                      />
                      <div className={[
                        'h-4 w-4 rounded border-2 transition-colors',
                        selected.has(permission)
                          ? 'border-forest-900 bg-forest-900'
                          : 'border-charcoal-700/30 bg-white',
                      ].join(' ')}>
                        <Show when={selected.has(permission)}>
                          <svg viewBox="0 0 12 10" fill="none" className="h-full w-full p-0.5">
                            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Show>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-charcoal-900">
                        {permissionDescriptions[permission] ?? permission}
                      </p>
                      <p className="text-xs text-charcoal-700/50 font-mono">{permission}</p>
                    </div>
                  </label>
                )}
              </Repeat>
            </div>
          )}
        </Repeat>
      </div>

      <div className="flex gap-2 pt-2">
        <AppButton onClick={() => void handleSave()} loading={isPending} disabled={!name.trim()}>
          {isEdit ? 'Save changes' : 'Create role'}
        </AppButton>
        <AppButton variant="ghost" onClick={onDone} disabled={isPending}>Cancel</AppButton>
      </div>
    </div>
  );
}
```

### Step 3 — Rewrite `roles-screen.tsx`

Two sections: system roles (read-only table) + custom roles (editable table with create/edit/delete).

```tsx
export function RolesScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const { can } = usePermissions(hospitalId);
  const { data, isLoading, error } = useRoles(hospitalId);
  const deleteMutation = useDeleteRole(hospitalId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const systemRoles = (data?.roles ?? []).filter((r) => r.isSystem);
  const customRoles = (data?.roles ?? []).filter((r) => !r.isSystem);
  const canManage = can(PERMISSIONS.STAFF_ROLES_MANAGE);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Roles</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            System roles are built-in and cannot be deleted. Custom roles are created by your hospital.
          </AppText>
        </div>
        <Show when={canManage && !showCreateForm}>
          <AppButton onClick={() => setShowCreateForm(true)}>New role</AppButton>
        </Show>
      </div>

      <Loadable loading={isLoading} error={error ?? undefined} loadingComponent={...} errorComponent={...}>
        {/* Create form */}
        <Show when={showCreateForm}>
          <RoleForm
            hospitalId={hospitalId}
            permissionDescriptions={data?.permissionDescriptions ?? {}}
            permissionGroups={data?.permissionGroups ?? []}
            onDone={() => setShowCreateForm(false)}
          />
        </Show>

        {/* System Roles — read-only */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">System Roles</p>
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-900/10 bg-cream-50">
                  <th className="...">Name</th>
                  <th className="...">Permissions</th>
                </tr>
              </thead>
              <tbody>
                <Repeat each={systemRoles as Role[]}>
                  {(role: Role) => (
                    <tr key={role.id} className="border-b border-forest-900/5 last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{role.name}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        <span className="text-xs text-charcoal-700/60">{role.permissions.length} permissions</span>
                      </td>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Roles — editable */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Custom Roles</p>
          <Show
            when={customRoles.length > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/60">No custom roles yet.</p>}
          >
            <div className="overflow-x-auto rounded-xl border border-forest-900/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-forest-900/10 bg-cream-50">
                    <th className="...">Name</th>
                    <th className="...">Permissions</th>
                    <th className="..."></th>
                  </tr>
                </thead>
                <tbody>
                  <Repeat each={customRoles as Role[]}>
                    {(role: Role) => (
                      <tr key={role.id} className="border-b border-forest-900/5 last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{role.name}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">
                          <span className="text-xs text-charcoal-700/60">{role.permissions.length} permissions</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Show when={canManage}>
                            <div className="flex justify-end gap-2">
                              <AppButton variant="ghost" onClick={() => setEditingRole(role)}>Edit</AppButton>
                              <AppButton
                                variant="ghost"
                                onClick={() => {
                                  DrawerService.showConfirmationModal(
                                    'Delete this role?',
                                    'Staff assigned this role will need to be reassigned.',
                                    { destructive: true, onConfirm: () => { deleteMutation.mutate(role.id); } },
                                  );
                                }}
                              >
                                Delete
                              </AppButton>
                            </div>
                          </Show>
                        </td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>
          </Show>
        </div>

        {/* Edit form */}
        <Show when={editingRole !== null}>
          <RoleForm
            hospitalId={hospitalId}
            role={editingRole!}
            permissionDescriptions={data?.permissionDescriptions ?? {}}
            permissionGroups={data?.permissionGroups ?? []}
            onDone={() => setEditingRole(null)}
          />
        </Show>
      </Loadable>
    </div>
  );
}
```

### Files to touch (Phase 7)
- `apps/medcord-web/src/shared/types/staff.ts` — update `Role` type (add `isSystem`, `slug`)
- `apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts` — update query return type, add `useDeleteRole`
- `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx` — full rewrite
- `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx` — full rewrite with permission toggles

### Quality gate
```bash
pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build
```

---

## Phase 8 — Frontend: Invite Form Role Dropdown from API

### Goal
The staff invite form currently hardcodes a list of role values. Replace it with a dropdown populated from `useRoles(hospitalId)`, which now returns both system roles and any custom roles the hospital has created.

### Current state
`apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx` (or similar path — verify) has a hardcoded `<select>` or set of radio buttons for role.

### Step 1 — Check the invite form file path and current role input

Read the file before editing. It likely has something like:
```tsx
const ROLES_OPTIONS = [
  { value: 'doctor', label: 'Doctor' },
  // ...
];
```

Replace with data from `useRoles(hospitalId)`:
```tsx
const { data: rolesData } = useRoles(hospitalId);
const roleOptions = (rolesData?.roles ?? [])
  .filter(r => r.slug !== ROLES.SUPER_ADMIN) // super_admin cannot be invited
  .map(r => ({ value: r.slug, label: r.name }));
```

The `<select>` element maps over `roleOptions`.

### Step 2 — Update `InviteBody` schema on the backend

The `role` field in `InviteBody` (in `staff.schema.ts`) is currently `z.enum([...STAFF_ROLES])`. Since custom role slugs can now be assigned, change to `z.string().min(1)` and validate against the hospital's actual role slugs in the service:

In `staff.service.ts` `invite()`:
```ts
// Validate the role slug exists for this hospital
const validRoles = await staffRepo.listRoles(hospitalId);
const validSlugs = validRoles.map(r => r.slug);
if (!validSlugs.includes(body.role)) throw new BadRequestError('Invalid role');
```

### Files to touch (Phase 8)
- `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx` (verify path) — replace hardcoded role list
- `apps/main-backend/src/features/staff/staff.schema.ts` — update `role` field in `InviteBody`
- `apps/main-backend/src/features/staff/staff.service.ts` — add role slug validation in `invite()`

### Quality gate
```bash
pnpm nx run main-backend:build
pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build
```

---

## Summary — Files Created / Modified

### New files
| File | Phase |
|---|---|
| `packages/rbac/package.json` | 1 |
| `packages/rbac/tsconfig.json` | 1 |
| `packages/rbac/tsconfig.build.json` | 1 |
| `packages/rbac/project.json` | 1 |
| `packages/rbac/src/permissions.ts` | 1 |
| `packages/rbac/src/roles.ts` | 1 |
| `packages/rbac/src/descriptions.ts` | 1 |
| `packages/rbac/src/index.ts` | 1 |
| `apps/main-backend/src/lib/permissions.ts` | 2 |
| `apps/main-backend/src/lib/seed-roles.ts` | 3 |
| `apps/main-backend/src/middlewares/require-permission.middleware.ts` | 4 |
| `apps/medcord-web/src/shared/hooks/use-permissions.ts` | 6 |

### Modified files
| File | Change | Phase |
|---|---|---|
| `packages/api/src/endpoints.ts` | Add `HOSPITAL_ROLE_DELETE` | 3 |
| `apps/main-backend/src/lib/jwt.ts` | Add `hospitalPermissions` to `AccessTokenPayload` | 2 |
| `apps/main-backend/src/features/auth/auth.service.ts` | Embed permissions in JWT at login + refresh | 2 |
| `apps/main-backend/src/middlewares/auth.middleware.ts` | Store full JWT payload on `req.user` | 2 |
| `apps/main-backend/src/middlewares/hospital-scope.middleware.ts` | Read permissions from JWT, set `isSuperAdmin` + `permissions` on `req.hospitalMember` | 2 |
| `apps/main-backend/src/features/staff/staff.model.ts` | Add `isSystem: boolean` to `ICustomRole` | 3 |
| `apps/main-backend/src/lib/ids.ts` | Add `role` id generator if missing | 3 |
| `apps/main-backend/src/features/hospitals/hospital.service.ts` | Call `seedDefaultRoles` in `create()` and `get()` | 3 |
| `apps/main-backend/src/features/staff/staff.service.ts` | Add `deleteRole()`, update `listRoles()` to return permission metadata, add role slug validation in `invite()`, bump `tokenVersion` in `updateMember()` + `updateRole()` | 2, 3, 4, 5, 8 |
| `apps/main-backend/src/features/staff/staff.repo.ts` | Add `findRoleById()`, `deleteRole()` | 3 |
| `apps/main-backend/src/features/staff/staff.routes.ts` | Swap all `requireRole` → `requirePermission`, add `DELETE /roles/:roleId` | 4 |
| `apps/main-backend/src/features/emr/emr.routes.ts` | Swap all `requireRole` → `requirePermission` | 4 |
| `apps/main-backend/src/features/labs/lab.routes.ts` | Update advance handler signature | 4 |
| `apps/main-backend/src/features/labs/lab.service.ts` | Use permissions set instead of role string for `lab.release` check | 4 |
| `apps/main-backend/src/features/staff/staff.schema.ts` | Loosen `role` field in `InviteBody` to `z.string()` | 8 |
| `apps/main-backend/src/shared/types/roles.types.ts` | Keep as-is — `STAFF_ROLES` array stays for backward compat, but no new usage | — |
| `apps/medcord-web/src/shared/types/staff.ts` | Update `Role` type (add `isSystem`, `slug`) | 7 |
| `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` | Use `can(PERMISSIONS.X)` for nav gating | 6 |
| `apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts` | Update return type, add `useDeleteRole` | 7 |
| `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx` | Full rewrite: system + custom sections | 7 |
| `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx` | Full rewrite: permission toggle cards | 7 |
| `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx` | Replace hardcoded role list with API data | 8 |
| All EMR, lab, asset, review, settings screen files that have role checks | Replace `role === 'super_admin'` etc. with `can(PERMISSIONS.X)` | 6 |

### Deleted files
None — `require-role.middleware.ts` stays (unused but kept for reference).
