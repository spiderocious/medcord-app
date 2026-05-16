# Medcord — Frontend Build Plan

> Web app at `apps/web/`. Follows Feature-Sliced Design (FSD). Every feature ships with typecheck + lint + build passing clean before merge.

---

## Stack & Conventions

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite + TypeScript strict |
| Routing | React Router v6 (declarative + lazy) |
| Server state | TanStack Query v5 |
| Styling | Tailwind CSS v3 |
| Icons | `@icons` (lucide-react proxy) |
| UI primitives | `@medcord/ui` (AppButton, AppText, theme) |
| Utilities | meemaw-js |
| HTTP | `@medcord/api` (`apiClient`, `EP` endpoints) |
| Auth storage | `@medcord/core` `createTokenStorage` |

### Path Aliases (vite + tsconfig)

```
@app      → src/
@features → src/features/
@shared   → src/shared/
@medcord/ui → packages/ui/src/index.ts
@medcord/core → packages/core/src/index.ts
@medcord/api  → packages/api/src/index.ts
@icons    → packages/ui/src/icons/index.ts
```

### Architecture Rules

- No `any` in TypeScript — use interfaces, generics, discriminated unions.
- All props interfaces are `ReadonlyProps` — externalized same file.
- No default exports.
- No inline errors — prefer form field errors or inline alerts over toasts.
- No global state beyond React Query cache and a thin auth context.
- Guards redirect before rendering protected screens.
- Parts = screen-only sub-sections. Widgets = reusable inside a feature.
- Helpers = pure functions (`helpers/`). Utils = custom hooks (`utils/`).
- One API hook file per resource (`api/use-<resource>.ts`).

---

## Meemaw — Mandatory Usage Rules

`meemaw` is installed in `apps/medcord-web/`. **Every component must use meemaw primitives** — raw ternaries, `&&` short-circuits, and `.map()` in JSX are banned. No exceptions.

### Component Map (strict)

| Banned pattern | Required replacement | Import |
|---|---|---|
| `{cond && <X />}` | `<Show when={cond}><X /></Show>` | `meemaw` |
| `{cond ? <X /> : <Y />}` | `<Show when={cond} fallback={<Y />}><X /></Show>` | `meemaw` |
| Multi-branch ternary / role switches | `<Switch><Case when={...}> ... </Case><Default> ... </Default></Switch>` | `meemaw` |
| `{isLoading ? <Spinner /> : error ? <Err /> : <Content />}` | `<Loadable loading={...} error={error ?? undefined} loadingComponent={<Spinner />} errorComponent={<Err />}> ... </Loadable>` | `meemaw` |
| `{items.map(item => <Card key={item.id} />)}` | `<Repeat each={items}>{(item) => <Card key={item.id} />}</Repeat>` | `meemaw` |
| `{show ? null : <X />}` (hide/show) | `<Hidden when={!show}><X /></Hidden>` | `meemaw` |
| Long text truncation | `<Clamp lines={2}>{text}</Clamp>` | `meemaw` |
| Clipboard copy (IDs, codes, slugs) | `<CopyToClipboard text={value}>{({ copy }) => <button onClick={copy}>...</button>}</CopyToClipboard>` | `meemaw` |
| First-time / onboarding banners | `<ShowOnce id="unique-key">...</ShowOnce>` | `meemaw` |
| Deferred render after delay | `<Delayed ms={300}>...</Delayed>` | `meemaw` |

### Specific Enforcement

- **Screens**: always wrap the data fetch with `<Loadable>`. No manual `if (isLoading) return ...` at the top of render.
- **Lists**: every list rendered from an array uses `<Repeat>`. Never `.map()` in JSX.
- **Role/status branching**: `<Switch>` with `<Case>` blocks. No chained ternaries.
- **Optional UI sections** (badges, tags, empty states, error banners): `<Show>`.
- **Patient codes, hospital slugs, any copyable identifier**: `<CopyToClipboard>`.
- **Text cells in cards/tables that might overflow**: `<Clamp>`.

---

### Quality Gate — after every feature

```bash
pnpm nx run web:typecheck
pnpm nx run web:lint
pnpm nx run web:build
```

All three must pass with 0 errors before the feature is considered done.

---

## Feature Build Order

Build in this order — each depends on the one before it.

```
0. Foundation (routing skeleton, auth context, API client wiring)
1. Auth (register, login, 2FA, forgot password, reset password)
2. Workspace (hospital list, create hospital, workspace switcher)
3. Hospital Settings (profile, branding, modules, domain, billing, danger zone)
4. Staff (directory, invite, roles, org chart, suspend/reactivate)
5. Patients (registration, search, check-in, check-out, admission, transfer)
6. EMR (chart overview, vitals, medications, history, procedures, immunizations, documents, privacy)
7. Labs (order entry, state workflow, result sign-off)
8. Assets (registry, labeling, hierarchy, location tracking)
9. Review Queue (cross-cutting approvals and submissions)
10. Notifications (in-app notification center)
11. Global Search (cross-module)
12. Admin App (apps/admin-web — separate surface, deferred to after main app)
```

---

## Foundation (Phase 0)

Before any feature: wire the skeleton so every subsequent feature has the infrastructure it needs.

### Files to create / update

```
src/
├── app.tsx                     # root — wraps AppProviders + AppRoutes
├── app.provider.tsx            # QueryClient + BrowserRouter + AuthProvider
├── app.routes.tsx              # all lazy feature routes registered here
├── shared/
│   ├── constants/
│   │   ├── routes.ts           # ROUTES object (replaces packages/core/routes)
│   │   └── endpoints.ts        # EP object mapping to /api/v1 paths
│   ├── providers/
│   │   └── auth-provider.tsx   # AuthContext: user, tokens, hospital scope
│   ├── guards/
│   │   ├── auth-guard.tsx      # redirect → /login if no access token
│   │   └── hospital-guard.tsx  # redirect → /hospitals if no active hospital
│   ├── hooks/
│   │   ├── use-auth.ts         # reads AuthContext
│   │   └── use-hospital.ts     # reads active hospital from AuthContext
│   ├── helpers/
│   │   ├── token-storage.ts    # thin wrapper around @medcord/core createTokenStorage
│   │   └── api-error.ts        # parseApiError re-export + typed helpers
│   └── types/
│       ├── api.ts              # ApiResponse<T>, ApiError, PaginatedResponse<T>
│       ├── auth.ts             # User, Session, Token types
│       └── hospital.ts         # Hospital, HospitalRole, HospitalModule
```

### AuthContext shape

```ts
interface AuthContextValue {
  user: User | null;
  activeHospitalId: string | null;
  accessToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setActiveHospital: (id: string) => void;
  logout: () => void;
}
```

### ROUTES constant (src/shared/constants/routes.ts)

```ts
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Workspace
  HOSPITALS: '/hospitals',
  HOSPITAL_CREATE: '/hospitals/new',

  // Hospital (all scoped to /h/:slug)
  HOSPITAL: (slug: string) => `/h/${slug}`,
  HOSPITAL_DASHBOARD: (slug: string) => `/h/${slug}/dashboard`,
  HOSPITAL_SETTINGS: (slug: string) => `/h/${slug}/settings`,
  HOSPITAL_STAFF: (slug: string) => `/h/${slug}/staff`,
  HOSPITAL_PATIENTS: (slug: string) => `/h/${slug}/patients`,
  HOSPITAL_EMR: (slug: string, patientCode: string) => `/h/${slug}/patients/${patientCode}/chart`,
  HOSPITAL_LABS: (slug: string) => `/h/${slug}/labs`,
  HOSPITAL_ASSETS: (slug: string) => `/h/${slug}/assets`,
  HOSPITAL_REVIEW_QUEUE: (slug: string) => `/h/${slug}/review`,
  HOSPITAL_NOTIFICATIONS: (slug: string) => `/h/${slug}/notifications`,
  HOSPITAL_SEARCH: (slug: string) => `/h/${slug}/search`,
} as const;
```

---

## Module 1 — Auth

### Screens

| Screen | Route | File |
|---|---|---|
| LoginScreen | `/login` | `auth/features/login/screen/login-screen.tsx` |
| RegisterScreen | `/register` | `auth/features/register/screen/register-screen.tsx` |
| ForgotPasswordScreen | `/forgot-password` | `auth/features/forgot-password/screen/forgot-password-screen.tsx` |
| ResetPasswordScreen | `/reset-password` | `auth/features/reset-password/screen/reset-password-screen.tsx` |
| Setup2faScreen | `/setup-2fa` | `auth/features/setup-2fa/screen/setup-2fa-screen.tsx` |
| Verify2faScreen (inline on login) | — | part of LoginScreen |

### FSD Structure

```
features/auth/
├── features/
│   ├── login/
│   │   ├── api/
│   │   │   └── use-login.ts
│   │   ├── screen/
│   │   │   └── login-screen.tsx
│   │   └── parts/
│   │       ├── login-form.tsx       # email + password + optional TOTP field
│   │       └── two-fa-step.tsx      # shown when totpRequired === true
│   ├── register/
│   │   ├── api/
│   │   │   └── use-register.ts
│   │   └── screen/
│   │       └── register-screen.tsx
│   │       parts/
│   │           └── register-form.tsx
│   ├── forgot-password/
│   │   ├── api/
│   │   │   └── use-forgot-password.ts
│   │   └── screen/
│   │       └── forgot-password-screen.tsx
│   └── reset-password/
│       ├── api/
│       │   └── use-reset-password.ts
│       └── screen/
│           └── reset-password-screen.tsx
├── shared/
│   └── parts/
│       └── auth-layout.tsx          # centered card shell used by all auth screens
└── auth.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint | Notes |
|---|---|---|---|
| `useLogin` | POST | `/api/v1/auth/login` | body: `{email, password, totpCode?}` → `{accessToken, refreshToken, totpRequired?}` |
| `useRegister` | POST | `/api/v1/auth/register` | body: `{name, email, password, phone?}` |
| `useForgotPassword` | POST | `/api/v1/auth/forgot-password` | body: `{email}` |
| `useResetPassword` | POST | `/api/v1/auth/reset-password` | body: `{token, newPassword}` |
| `useSetup2fa` (mutation) | POST | `/api/v1/auth/setup-2fa` | → `{secret, qrCodeUrl}` |
| `useVerify2fa` (mutation) | POST | `/api/v1/auth/verify-2fa` | body: `{totpCode}` |

### Parts breakdown

**LoginScreen:**
- `AuthLayout` (shared shell — logo, centered card)
- `LoginForm` — email + password fields, submit button, "Forgot password?" link
- `TwoFaStep` — TOTP input, shown after `totpRequired: true` response

**RegisterScreen:**
- `AuthLayout`
- `RegisterForm` — name, email, password, phone (optional), terms checkbox

**ForgotPasswordScreen / ResetPasswordScreen:**
- `AuthLayout`
- Inline form with field-level errors, success state shows confirmation message (no toast)

---

## Module 2 — Workspace & Hospital Management

### Screens

| Screen | Route | Notes |
|---|---|---|
| HospitalListScreen | `/hospitals` | lists all hospitals user belongs to |
| HospitalCreateScreen | `/hospitals/new` | multi-step: name/type/location → review → create |
| HospitalDashboardScreen | `/h/:slug/dashboard` | landing after selecting a hospital |
| HospitalSettingsScreen | `/h/:slug/settings` | settings tabs |

### FSD Structure

```
features/workspace/
├── features/
│   ├── hospital-list/
│   │   ├── api/
│   │   │   └── use-hospitals.ts
│   │   └── screen/
│   │       ├── hospital-list-screen.tsx
│   │       └── parts/
│   │           ├── hospital-card.tsx
│   │           └── workspace-switcher.tsx   # dropdown shown in app shell
│   └── hospital-create/
│       ├── api/
│       │   └── use-create-hospital.ts
│       ├── providers/
│       │   └── hospital-create-provider.tsx # step state
│       └── screen/
│           ├── hospital-create-screen.tsx
│           └── parts/
│               ├── step-basic-info.tsx       # name, type, location, contact
│               └── step-review.tsx
├── workspace.routes.ts
```

```
features/hospital-settings/
├── api/
│   ├── use-hospital.ts
│   └── use-update-hospital.ts
├── screen/
│   ├── hospital-settings-screen.tsx
│   └── parts/
│       ├── settings-general.tsx             # profile, logo, timezone
│       ├── settings-branding.tsx            # colors, ID card template
│       ├── settings-modules.tsx             # enable/disable modules
│       ├── settings-domain.tsx              # subdomain display + CNAME instructions
│       ├── settings-billing.tsx             # plan display + usage stats (placeholder)
│       └── settings-danger-zone.tsx         # transfer, archive, delete
└── hospital-settings.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint | Notes |
|---|---|---|---|
| `useHospitals` | GET | `/api/v1/hospitals` | lists all hospitals for current user |
| `useHospital(id)` | GET | `/api/v1/hospitals/:id` | single hospital detail |
| `useCreateHospital` | POST | `/api/v1/hospitals` | body: name, type, location, contact |
| `useUpdateHospital(id)` | PATCH | `/api/v1/hospitals/:id` | partial update |
| `useDeleteHospital(id)` | DELETE | `/api/v1/hospitals/:id` | danger zone |
| `useUploadLogo` | POST | `/api/v1/assets/upload` → then PATCH hospital | multipart |
| `useHospitalStats` | GET | `/api/v1/hospitals/:id/stats` | usage for billing tab |

---

## Module 3 — Staff Profiles & Roles

### Screens

| Screen | Route | Notes |
|---|---|---|
| StaffDirectoryScreen | `/h/:slug/staff` | searchable/filterable list |
| StaffProfileScreen | `/h/:slug/staff/:staffId` | view + edit profile |
| StaffInviteScreen | `/h/:slug/staff/invite` | single invite + bulk CSV |
| OrgChartScreen | `/h/:slug/staff/org-chart` | hierarchy tree |

### FSD Structure

```
features/staff/
├── features/
│   ├── staff-directory/
│   │   ├── api/
│   │   │   ├── use-staff.ts              # paginated list
│   │   │   └── use-staff-invitations.ts
│   │   ├── screen/
│   │   │   ├── staff-directory-screen.tsx
│   │   │   └── parts/
│   │   │       ├── staff-table.tsx
│   │   │       ├── staff-filters.tsx     # role, department, status filters
│   │   │       └── invitation-row.tsx
│   │   └── utils/
│   │       └── use-staff-filter.ts
│   ├── staff-profile/
│   │   ├── api/
│   │   │   ├── use-staff-member.ts
│   │   │   └── use-update-staff.ts
│   │   └── screen/
│   │       ├── staff-profile-screen.tsx
│   │       └── parts/
│   │           ├── profile-header.tsx     # photo, name, role chip
│   │           ├── profile-info.tsx       # editable fields
│   │           ├── profile-permissions.tsx
│   │           └── profile-activity.tsx  # logins, key actions
│   ├── staff-invite/
│   │   ├── api/
│   │   │   └── use-invite-staff.ts
│   │   └── screen/
│   │       ├── staff-invite-screen.tsx
│   │       └── parts/
│   │           ├── invite-form.tsx        # email, role, department
│   │           └── csv-upload.tsx         # bulk CSV import
│   └── org-chart/
│       ├── api/
│       │   └── use-org-chart.ts
│       └── screen/
│           └── org-chart-screen.tsx
├── shared/
│   └── widgets/
│       └── staff-badge.tsx              # avatar + name + role chip, reused across modules
└── staff.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useStaff(hospitalId)` | GET | `/api/v1/hospitals/:id/staff` |
| `useStaffMember(hospitalId, staffId)` | GET | `/api/v1/hospitals/:id/staff/:staffId` |
| `useInviteStaff` | POST | `/api/v1/hospitals/:id/staff/invite` |
| `useBulkInviteStaff` | POST | `/api/v1/hospitals/:id/staff/invite/bulk` |
| `useUpdateStaff(hospitalId, staffId)` | PATCH | `/api/v1/hospitals/:id/staff/:staffId` |
| `useSuspendStaff` | POST | `/api/v1/hospitals/:id/staff/:staffId/suspend` |
| `useReactivateStaff` | POST | `/api/v1/hospitals/:id/staff/:staffId/reactivate` |
| `useRemoveStaff` | DELETE | `/api/v1/hospitals/:id/staff/:staffId` |
| `useInvitations(hospitalId)` | GET | `/api/v1/hospitals/:id/invitations` |
| `useResendInvitation` | POST | `/api/v1/hospitals/:id/invitations/:invId/resend` |
| `useRevokeInvitation` | DELETE | `/api/v1/hospitals/:id/invitations/:invId` |
| `useOrgChart(hospitalId)` | GET | `/api/v1/hospitals/:id/org-chart` |
| `useRoles(hospitalId)` | GET | `/api/v1/hospitals/:id/roles` |

---

## Module 4 — Patient Management

### Screens

| Screen | Route | Notes |
|---|---|---|
| PatientListScreen | `/h/:slug/patients` | search, recents, favorites |
| PatientRegisterScreen | `/h/:slug/patients/register` | multi-step registration |
| PatientProfileScreen | `/h/:slug/patients/:code` | demographics + actions |
| PatientIdCardScreen | `/h/:slug/patients/:code/id-card` | preview, print, issue |
| CheckInScreen | `/h/:slug/patients/check-in` | scan or manual lookup |

### FSD Structure

```
features/patients/
├── features/
│   ├── patient-list/
│   │   ├── api/
│   │   │   ├── use-patients.ts           # search + recent + favorites
│   │   │   └── use-favorite-patient.ts
│   │   ├── screen/
│   │   │   ├── patient-list-screen.tsx
│   │   │   └── parts/
│   │   │       ├── patient-search-bar.tsx
│   │   │       ├── patient-results.tsx
│   │   │       ├── recent-patients.tsx
│   │   │       └── favorite-patients.tsx
│   │   └── utils/
│   │       └── use-patient-search.ts    # debounced search hook
│   ├── patient-register/
│   │   ├── api/
│   │   │   └── use-register-patient.ts
│   │   ├── providers/
│   │   │   └── patient-register-provider.tsx  # multi-step form state
│   │   └── screen/
│   │       ├── patient-register-screen.tsx
│   │       └── parts/
│   │           ├── step-demographics.tsx
│   │           ├── step-emergency-contact.tsx
│   │           ├── step-guarantor.tsx
│   │           ├── step-preferences.tsx        # religious/cultural
│   │           ├── step-documents.tsx          # ID photo upload
│   │           └── duplicate-warning.tsx       # shown on name+DOB match
│   ├── patient-profile/
│   │   ├── api/
│   │   │   └── use-patient.ts
│   │   └── screen/
│   │       ├── patient-profile-screen.tsx
│   │       └── parts/
│   │           ├── patient-banner.tsx          # reused as chart banner in EMR
│   │           ├── demographics-section.tsx
│   │           ├── emergency-contacts.tsx
│   │           └── patient-actions.tsx         # check-in, check-out, admit, transfer
│   ├── patient-id-card/
│   │   ├── api/
│   │   │   └── use-patient-id-card.ts
│   │   └── screen/
│   │       ├── patient-id-card-screen.tsx
│   │       └── parts/
│   │           ├── id-card-preview.tsx
│   │           └── id-card-actions.tsx         # print, issue digital, reissue, deactivate
│   └── check-in/
│       ├── api/
│       │   └── use-check-in.ts
│       └── screen/
│           ├── check-in-screen.tsx
│           └── parts/
│               ├── qr-scanner.tsx              # camera barcode/QR scan
│               └── manual-lookup.tsx
├── shared/
│   └── widgets/
│       ├── patient-banner.tsx                  # persistent banner (also used in EMR)
│       └── patient-code-badge.tsx
└── patients.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `usePatients(hospitalId, query)` | GET | `/api/v1/hospitals/:id/patients?q=` |
| `usePatient(hospitalId, code)` | GET | `/api/v1/hospitals/:id/patients/:code` |
| `useRegisterPatient` | POST | `/api/v1/hospitals/:id/patients` |
| `useFavoritePatient` | POST/DELETE | `/api/v1/hospitals/:id/patients/:code/favorite` |
| `useRecentPatients(hospitalId)` | GET | `/api/v1/hospitals/:id/patients/recents` |
| `usePatientIdCard(hospitalId, code)` | GET | `/api/v1/hospitals/:id/patients/:code/id-card` |
| `useIssueIdCard` | POST | `/api/v1/hospitals/:id/patients/:code/id-card/issue` |
| `useCheckIn` | POST | `/api/v1/hospitals/:id/patients/:code/check-in` |
| `useCheckOut` | POST | `/api/v1/hospitals/:id/patients/:code/check-out` |
| `useAdmitPatient` | POST | `/api/v1/hospitals/:id/patients/:code/admit` |
| `useInitiateTransfer` | POST | `/api/v1/hospitals/:id/patients/:code/transfer` |
| `useDischarge` | POST | `/api/v1/hospitals/:id/patients/:code/discharge` |

---

## Module 5 — Medical Records (EMR)

### Screens

| Screen | Route | Notes |
|---|---|---|
| PatientChartScreen | `/h/:slug/patients/:code/chart` | chart shell with section tabs |
| VitalsScreen | `/h/:slug/patients/:code/chart/vitals` | table + trend graph |
| MedicationsScreen | `/h/:slug/patients/:code/chart/medications` | active meds + prescribe |
| HistoryScreen | `/h/:slug/patients/:code/chart/history` | diagnoses, procedures, family, social |
| ProceduresScreen | `/h/:slug/patients/:code/chart/procedures` | procedure records |
| ImmunizationsScreen | `/h/:slug/patients/:code/chart/immunizations` | immunization schedule |
| DocumentsScreen | `/h/:slug/patients/:code/chart/documents` | document repository |
| AuditLogScreen | `/h/:slug/patients/:code/chart/audit` | access log (super-admin/compliance) |

### FSD Structure

```
features/emr/
├── shared/
│   ├── widgets/
│   │   └── chart-banner.tsx            # patient banner used in all chart tabs
│   └── providers/
│       └── chart-provider.tsx          # active patient + active tab context
├── features/
│   ├── chart-shell/
│   │   ├── api/
│   │   │   └── use-chart-summary.ts
│   │   ├── guards/
│   │   │   └── chart-access-guard.tsx  # break-the-glass flow
│   │   └── screen/
│   │       ├── patient-chart-screen.tsx
│   │       └── parts/
│   │           ├── chart-tabs.tsx
│   │           └── chart-summary.tsx
│   ├── vitals/
│   │   ├── api/
│   │   │   ├── use-vitals.ts
│   │   │   └── use-record-vital.ts
│   │   └── screen/
│   │       ├── vitals-screen.tsx
│   │       └── parts/
│   │           ├── vitals-form.tsx
│   │           ├── vitals-table.tsx
│   │           ├── vitals-trend-chart.tsx
│   │           └── pediatric-growth-chart.tsx  # for patients < 18
│   ├── medications/
│   │   ├── api/
│   │   │   ├── use-medications.ts
│   │   │   └── use-prescribe.ts
│   │   └── screen/
│   │       ├── medications-screen.tsx
│   │       └── parts/
│   │           ├── medication-list.tsx
│   │           ├── prescribe-form.tsx        # drug, strength, route, frequency, duration
│   │           ├── drug-interaction-alert.tsx
│   │           └── medication-reconciliation.tsx
│   ├── history/
│   │   ├── api/
│   │   │   └── use-history.ts
│   │   └── screen/
│   │       ├── history-screen.tsx
│   │       └── parts/
│   │           ├── diagnoses-section.tsx     # ICD-10 coded
│   │           ├── procedures-section.tsx
│   │           ├── family-history.tsx
│   │           └── social-history.tsx
│   ├── procedures/
│   │   ├── api/
│   │   │   └── use-procedures.ts
│   │   └── screen/
│   │       ├── procedures-screen.tsx
│   │       └── parts/
│   │           ├── procedure-form.tsx        # CPT code, date, notes
│   │           └── preop-checklist.tsx
│   ├── immunizations/
│   │   ├── api/
│   │   │   └── use-immunizations.ts
│   │   └── screen/
│   │       ├── immunizations-screen.tsx
│   │       └── parts/
│   │           ├── immunization-list.tsx
│   │           └── vaccine-schedule.tsx      # upcoming/overdue by age
│   ├── documents/
│   │   ├── api/
│   │   │   ├── use-documents.ts
│   │   │   └── use-upload-document.ts
│   │   └── screen/
│   │       ├── documents-screen.tsx
│   │       └── parts/
│   │           ├── document-list.tsx
│   │           └── document-upload.tsx       # category, sensitive flag
│   └── audit-log/
│       ├── api/
│       │   └── use-chart-audit-log.ts
│       └── screen/
│           ├── audit-log-screen.tsx
│           └── parts/
│               ├── audit-filters.tsx
│               └── audit-table.tsx
└── emr.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useChartSummary(patientCode)` | GET | `/api/v1/emr/patients/:code/chart` |
| `useVitals(patientCode)` | GET | `/api/v1/emr/patients/:code/vitals` |
| `useRecordVital` | POST | `/api/v1/emr/patients/:code/vitals` |
| `useMedications(patientCode)` | GET | `/api/v1/emr/patients/:code/medications` |
| `usePrescribe` | POST | `/api/v1/emr/patients/:code/medications` |
| `useDiscontinueMedication` | DELETE | `/api/v1/emr/patients/:code/medications/:medId` |
| `useDrugInteractionCheck` | GET | `/api/v1/emr/drug-interactions?drugs=` |
| `useHistory(patientCode)` | GET | `/api/v1/emr/patients/:code/history` |
| `useAddDiagnosis` | POST | `/api/v1/emr/patients/:code/history/diagnoses` |
| `useProcedures(patientCode)` | GET | `/api/v1/emr/patients/:code/procedures` |
| `useAddProcedure` | POST | `/api/v1/emr/patients/:code/procedures` |
| `useImmunizations(patientCode)` | GET | `/api/v1/emr/patients/:code/immunizations` |
| `useRecordVaccine` | POST | `/api/v1/emr/patients/:code/immunizations` |
| `useDocuments(patientCode)` | GET | `/api/v1/emr/patients/:code/documents` |
| `useUploadDocument` | POST | `/api/v1/emr/patients/:code/documents` |
| `useChartAuditLog(patientCode)` | GET | `/api/v1/emr/patients/:code/access-log` |
| `useBreakTheGlass` | POST | `/api/v1/emr/patients/:code/access` | with reason |

---

## Module 6 — Labs

### Screens

| Screen | Route | Notes |
|---|---|---|
| LabOrderListScreen | `/h/:slug/labs` | queue of pending orders (lab tech view) |
| LabOrderDetailScreen | `/h/:slug/labs/:orderId` | state machine + result entry |
| LabResultQueueScreen | `/h/:slug/labs/results` | provider result acknowledgement queue |

### FSD Structure

```
features/labs/
├── shared/
│   └── helpers/
│       └── lab-state-label.ts          # human label for each state
├── features/
│   ├── lab-order-list/
│   │   ├── api/
│   │   │   └── use-lab-orders.ts       # filterable by status, patient
│   │   ├── screen/
│   │   │   ├── lab-order-list-screen.tsx
│   │   │   └── parts/
│   │   │       ├── order-table.tsx
│   │   │       ├── order-filters.tsx
│   │   │       └── create-order-button.tsx
│   │   └── utils/
│   │       └── use-order-filter.ts
│   ├── lab-order-detail/
│   │   ├── api/
│   │   │   ├── use-lab-order.ts
│   │   │   ├── use-advance-order-state.ts  # state machine transitions
│   │   │   └── use-submit-result.ts
│   │   └── screen/
│   │       ├── lab-order-detail-screen.tsx
│   │       └── parts/
│   │           ├── order-header.tsx
│   │           ├── state-stepper.tsx       # visual pipeline: awaiting → released
│   │           ├── specimen-receipt.tsx
│   │           ├── result-entry-form.tsx   # manual entry + flag High/Low/Critical
│   │           └── result-summary.tsx      # read-only view with reference ranges
│   └── lab-result-queue/
│       ├── api/
│       │   ├── use-pending-results.ts
│       │   └── use-acknowledge-result.ts
│       └── screen/
│           ├── lab-result-queue-screen.tsx
│           └── parts/
│               ├── result-card.tsx         # result with reference ranges + flags
│               └── acknowledge-button.tsx
└── labs.routes.ts
```

### Lab State Machine

States: `awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released`

Each transition is a separate API call (POST to `/state/advance`). The `StateStepper` part renders all 7 steps, highlights current.

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useLabOrders(hospitalId)` | GET | `/api/v1/hospitals/:id/labs/orders` |
| `useLabOrder(orderId)` | GET | `/api/v1/labs/orders/:id` |
| `useCreateLabOrder` | POST | `/api/v1/hospitals/:id/labs/orders` |
| `useAdvanceLabOrderState` | POST | `/api/v1/labs/orders/:id/state/advance` |
| `useSubmitLabResult` | POST | `/api/v1/labs/orders/:id/result` |
| `usePendingResults(hospitalId)` | GET | `/api/v1/hospitals/:id/labs/results/pending` |
| `useAcknowledgeResult` | POST | `/api/v1/labs/orders/:id/result/acknowledge` |
| `useSignOffResult` | POST | `/api/v1/labs/orders/:id/result/sign-off` |

---

## Module 7 — Asset Registry

### Screens

| Screen | Route | Notes |
|---|---|---|
| AssetListScreen | `/h/:slug/assets` | filterable registry |
| AssetDetailScreen | `/h/:slug/assets/:assetId` | detail + hierarchy + location history |
| AssetCreateScreen | `/h/:slug/assets/new` | registration form |

### FSD Structure

```
features/assets/
├── features/
│   ├── asset-list/
│   │   ├── api/
│   │   │   └── use-assets.ts
│   │   └── screen/
│   │       ├── asset-list-screen.tsx
│   │       └── parts/
│   │           ├── asset-table.tsx
│   │           ├── asset-filters.tsx       # category, location, status
│   │           └── bulk-import.tsx         # CSV upload
│   ├── asset-detail/
│   │   ├── api/
│   │   │   ├── use-asset.ts
│   │   │   └── use-move-asset.ts
│   │   └── screen/
│   │       ├── asset-detail-screen.tsx
│   │       └── parts/
│   │           ├── asset-header.tsx
│   │           ├── asset-info.tsx
│   │           ├── asset-hierarchy.tsx     # parent/child tree
│   │           ├── asset-location.tsx      # current location + history
│   │           └── asset-label.tsx         # barcode/QR generate + print
│   └── asset-create/
│       ├── api/
│       │   └── use-create-asset.ts
│       └── screen/
│           ├── asset-create-screen.tsx
│           └── parts/
│               └── asset-form.tsx
└── assets.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useAssets(hospitalId)` | GET | `/api/v1/hospitals/:id/assets` |
| `useAsset(assetId)` | GET | `/api/v1/assets/:id` |
| `useCreateAsset` | POST | `/api/v1/hospitals/:id/assets` |
| `useUpdateAsset` | PATCH | `/api/v1/assets/:id` |
| `useArchiveAsset` | POST | `/api/v1/assets/:id/archive` |
| `useMoveAsset` | POST | `/api/v1/assets/:id/location` |
| `useBulkImportAssets` | POST | `/api/v1/hospitals/:id/assets/bulk` |
| `useGenerateAssetLabel` | GET | `/api/v1/assets/:id/label` | returns PDF or SVG |
| `useAssetLocationHistory(assetId)` | GET | `/api/v1/assets/:id/location/history` |

---

## Module 8 — Review Queue

Cross-cutting — appears as a tab in the app shell and also inline on individual record screens.

### Screens

| Screen | Route | Notes |
|---|---|---|
| ReviewQueueScreen | `/h/:slug/review` | all items awaiting my review |
| ReviewItemScreen | `/h/:slug/review/:itemId` | full context view + approve/reject |

### FSD Structure

```
features/review-queue/
├── api/
│   ├── use-review-queue.ts
│   ├── use-review-item.ts
│   └── use-review-action.ts       # approve, reject, request-changes, co-sign
├── screen/
│   ├── review-queue-screen.tsx
│   └── parts/
│       ├── queue-filters.tsx      # filter by item type (note, prescription, lab, transfer)
│       ├── queue-item-row.tsx
│       └── review-item-screen.tsx # full context + action panel
└── review-queue.routes.ts
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useReviewQueue(hospitalId)` | GET | `/api/v1/hospitals/:id/review-queue` |
| `useReviewItem(itemId)` | GET | `/api/v1/review-queue/:id` |
| `useApproveItem` | POST | `/api/v1/review-queue/:id/approve` |
| `useRejectItem` | POST | `/api/v1/review-queue/:id/reject` |
| `useRequestChanges` | POST | `/api/v1/review-queue/:id/request-changes` |
| `useCoSignItem` | POST | `/api/v1/review-queue/:id/co-sign` |

---

## Module 9 — Notifications

### Widget + Screen

The notification bell icon lives in the app shell header (`AppShell` → `NotificationBell` widget). Full list is a slide-over or dedicated screen.

```
features/notifications/
├── api/
│   ├── use-notifications.ts
│   └── use-mark-read.ts
├── screen/
│   └── notifications-screen.tsx
│       └── parts/
│           ├── notification-list.tsx
│           └── notification-item.tsx    # icon by type, relative timestamp
└── widgets/
    └── notification-bell.tsx           # badge count + popover preview
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useNotifications(hospitalId)` | GET | `/api/v1/hospitals/:id/notifications` |
| `useMarkNotificationRead` | POST | `/api/v1/notifications/:id/read` |
| `useMarkAllRead` | POST | `/api/v1/hospitals/:id/notifications/read-all` |

---

## Module 10 — Global Search

```
features/search/
├── api/
│   └── use-global-search.ts       # q param, returns patients + staff + assets + orders
├── screen/
│   ├── search-screen.tsx
│   └── parts/
│       ├── search-results-patients.tsx
│       ├── search-results-staff.tsx
│       ├── search-results-assets.tsx
│       └── search-results-labs.tsx
└── widgets/
    └── global-search-bar.tsx      # appears in AppShell header
```

### APIs consumed

| Hook | Method | Endpoint |
|---|---|---|
| `useGlobalSearch(hospitalId, q)` | GET | `/api/v1/hospitals/:id/search?q=` |

---

## App Shell (shared layout)

Every post-login screen inside a hospital uses `AppShell`. This is a shared component in `src/shared/`.

```
shared/
└── widgets/
    └── app-shell/
        ├── app-shell.tsx               # sidebar + topbar + <Outlet />
        ├── parts/
        │   ├── sidebar.tsx             # nav links per module
        │   ├── topbar.tsx              # hospital name, search bar, notifications, user menu
        │   ├── workspace-switcher.tsx  # hospital picker dropdown
        │   └── user-menu.tsx           # profile link, logout
        └── helpers/
            └── nav-items.ts            # sidebar items with icon + route
```

The sidebar adapts its items based on which modules are enabled for the active hospital (`useHospital` hook → `modules` array).

---

## Shared Reusable Components

Beyond `@medcord/ui` primitives — these are app-specific shared components.

| Component | Location | Used by |
|---|---|---|
| `PatientBanner` | `shared/widgets/patient-banner.tsx` | EMR chart (all tabs), Patient profile |
| `StaffBadge` | `shared/widgets/staff-badge.tsx` | Staff directory, Review queue, Audit log |
| `PatientCodeBadge` | `shared/widgets/patient-code-badge.tsx` | Patient list, chart, ID card |
| `StateStepper` | `shared/widgets/state-stepper.tsx` | Labs, transfers, prescriptions |
| `AppShell` | `shared/widgets/app-shell/` | All post-login screens |
| `NotificationBell` | `features/notifications/widgets/` | AppShell topbar |
| `GlobalSearchBar` | `features/search/widgets/` | AppShell topbar |
| `WorkspaceSwitcher` | `shared/widgets/app-shell/parts/` | AppShell sidebar |
| `FileUpload` | `shared/widgets/file-upload.tsx` | Documents, logo, patient photo, assets |
| `DataTable` | `shared/widgets/data-table.tsx` | Staff, patients, assets, lab orders |
| `EmptyState` | `shared/widgets/empty-state.tsx` | All list/table screens |
| `PageHeader` | `shared/widgets/page-header.tsx` | All screens (title + breadcrumb + actions) |
| `ConfirmDialog` | `shared/widgets/confirm-dialog.tsx` | Danger zone, delete, suspend |

---

## Shared Helpers and Hooks

| Name | Location | Purpose |
|---|---|---|
| `use-debounced-search` | `shared/utils/` | Debounced input for search bars |
| `use-pagination` | `shared/utils/` | Cursor/offset pagination state |
| `use-hospital-scope` | `shared/utils/` | Reads active hospital from context |
| `format-patient-code` | `shared/helpers/` | Formats raw code as `CAE-3F8K-2P9X` |
| `format-date` | `shared/helpers/` | Locale-aware date formatting |
| `format-relative-time` | `shared/helpers/` | "2 hours ago" labels |
| `get-initials` | `shared/helpers/` | Avatar fallback from name |

---

## Endpoints Master List (src/shared/constants/endpoints.ts)

```ts
export const EP = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password',
  AUTH_SETUP_2FA: '/api/v1/auth/setup-2fa',
  AUTH_VERIFY_2FA: '/api/v1/auth/verify-2fa',

  // Hospitals
  HOSPITALS: '/api/v1/hospitals',
  HOSPITAL: (id: string) => `/api/v1/hospitals/${id}`,
  HOSPITAL_STATS: (id: string) => `/api/v1/hospitals/${id}/stats`,
  HOSPITAL_STAFF: (id: string) => `/api/v1/hospitals/${id}/staff`,
  HOSPITAL_STAFF_MEMBER: (id: string, staffId: string) => `/api/v1/hospitals/${id}/staff/${staffId}`,
  HOSPITAL_INVITATIONS: (id: string) => `/api/v1/hospitals/${id}/invitations`,
  HOSPITAL_ORG_CHART: (id: string) => `/api/v1/hospitals/${id}/org-chart`,
  HOSPITAL_ROLES: (id: string) => `/api/v1/hospitals/${id}/roles`,

  // Patients
  HOSPITAL_PATIENTS: (id: string) => `/api/v1/hospitals/${id}/patients`,
  PATIENT: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}`,
  PATIENT_RECENTS: (id: string) => `/api/v1/hospitals/${id}/patients/recents`,
  PATIENT_CHECKIN: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/check-in`,
  PATIENT_CHECKOUT: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/check-out`,
  PATIENT_ADMIT: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/admit`,
  PATIENT_DISCHARGE: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/discharge`,
  PATIENT_TRANSFER: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/transfer`,
  PATIENT_ID_CARD: (id: string, code: string) => `/api/v1/hospitals/${id}/patients/${code}/id-card`,

  // EMR
  CHART: (code: string) => `/api/v1/emr/patients/${code}/chart`,
  VITALS: (code: string) => `/api/v1/emr/patients/${code}/vitals`,
  MEDICATIONS: (code: string) => `/api/v1/emr/patients/${code}/medications`,
  HISTORY: (code: string) => `/api/v1/emr/patients/${code}/history`,
  PROCEDURES: (code: string) => `/api/v1/emr/patients/${code}/procedures`,
  IMMUNIZATIONS: (code: string) => `/api/v1/emr/patients/${code}/immunizations`,
  DOCUMENTS: (code: string) => `/api/v1/emr/patients/${code}/documents`,
  CHART_AUDIT: (code: string) => `/api/v1/emr/patients/${code}/access-log`,
  DRUG_INTERACTIONS: '/api/v1/emr/drug-interactions',

  // Labs
  LAB_ORDERS: (id: string) => `/api/v1/hospitals/${id}/labs/orders`,
  LAB_ORDER: (orderId: string) => `/api/v1/labs/orders/${orderId}`,
  LAB_ORDER_STATE: (orderId: string) => `/api/v1/labs/orders/${orderId}/state/advance`,
  LAB_RESULT: (orderId: string) => `/api/v1/labs/orders/${orderId}/result`,
  LAB_PENDING_RESULTS: (id: string) => `/api/v1/hospitals/${id}/labs/results/pending`,

  // Assets
  ASSETS: (id: string) => `/api/v1/hospitals/${id}/assets`,
  ASSET: (assetId: string) => `/api/v1/assets/${assetId}`,
  ASSET_LOCATION: (assetId: string) => `/api/v1/assets/${assetId}/location`,
  ASSET_LABEL: (assetId: string) => `/api/v1/assets/${assetId}/label`,

  // Review Queue
  REVIEW_QUEUE: (id: string) => `/api/v1/hospitals/${id}/review-queue`,
  REVIEW_ITEM: (itemId: string) => `/api/v1/review-queue/${itemId}`,

  // Notifications
  NOTIFICATIONS: (id: string) => `/api/v1/hospitals/${id}/notifications`,
  NOTIFICATION: (notifId: string) => `/api/v1/notifications/${notifId}`,

  // Search
  SEARCH: (id: string) => `/api/v1/hospitals/${id}/search`,

  // Assets upload (shared)
  ASSET_UPLOAD: '/api/v1/assets/upload',
} as const;
```

---

## Build Sequence — Feature by Feature

### Phase 0 — Foundation

1. Update `src/shared/constants/routes.ts` with full ROUTES object
2. Create `src/shared/constants/endpoints.ts` with EP object
3. Create `src/shared/types/{api,auth,hospital}.ts`
4. Create `src/shared/providers/auth-provider.tsx`
5. Create `src/shared/guards/{auth-guard,hospital-guard}.tsx`
6. Create `src/shared/helpers/{token-storage,api-error}.ts`
7. Update `app.provider.tsx` to include `AuthProvider`
8. Scaffold `AppShell` with sidebar + topbar skeleton
9. Wire `app.routes.tsx` with all lazy routes registered (screens can be placeholder)
10. **Quality gate** ✓

### Phase 1 — Auth

1. Implement `LoginScreen` with `LoginForm` + `TwoFaStep`
2. Implement `RegisterScreen`
3. Implement `ForgotPasswordScreen` + `ResetPasswordScreen`
4. Wire `AuthGuard` — redirect to `/login` if no token
5. On login success: store tokens, fetch `/auth/me`, set user in context, redirect to `/hospitals`
6. **Quality gate** ✓

### Phase 2 — Workspace

1. Implement `HospitalListScreen` + `HospitalCard`
2. Implement `HospitalCreateScreen` (multi-step with `HospitalCreateProvider`)
3. Implement `WorkspaceSwitcher` widget
4. Implement `HospitalGuard` — redirect to `/hospitals` if no active hospital
5. Implement `AppShell` fully (sidebar nav links, topbar)
6. Implement `HospitalDashboardScreen` (placeholder stats tiles)
7. **Quality gate** ✓

### Phase 3 — Hospital Settings

1. Implement settings screen with tab navigation
2. Implement each settings part (general, branding, modules, domain, billing, danger zone)
3. Implement logo upload via `/api/v1/assets/upload`
4. **Quality gate** ✓

### Phase 4 — Staff

1. Implement `StaffDirectoryScreen` with search/filter
2. Implement `StaffProfileScreen`
3. Implement `StaffInviteScreen` (single + CSV bulk)
4. Implement `OrgChartScreen`
5. Implement suspend/reactivate/remove flows with `ConfirmDialog`
6. **Quality gate** ✓

### Phase 5 — Patients

1. Implement `PatientListScreen` with search, recents, favorites
2. Implement `PatientRegisterScreen` (multi-step with `PatientRegisterProvider`)
3. Implement `PatientProfileScreen` + `PatientBanner` widget
4. Implement `PatientIdCardScreen`
5. Implement `CheckInScreen` (QR scanner + manual)
6. Implement check-out, admit, discharge, transfer flows
7. **Quality gate** ✓

### Phase 6 — EMR

1. Implement `PatientChartScreen` shell + tab routing
2. Implement `ChartBanner` widget (persistent across all tabs)
3. Implement `VitalsScreen` + trend chart + pediatric growth chart
4. Implement `MedicationsScreen` + prescribe form + drug interaction alert
5. Implement `HistoryScreen`
6. Implement `ProceduresScreen` + pre-op checklist
7. Implement `ImmunizationsScreen` + schedule view
8. Implement `DocumentsScreen` + upload
9. Implement `AuditLogScreen`
10. Implement break-the-glass guard + reason modal
11. **Quality gate** ✓

### Phase 7 — Labs

1. Implement `LabOrderListScreen` (lab tech queue)
2. Implement `LabOrderDetailScreen` + `StateStepper`
3. Implement result entry form + High/Low/Critical flags
4. Implement `LabResultQueueScreen` for providers
5. **Quality gate** ✓

### Phase 8 — Assets

1. Implement `AssetListScreen` + filters + CSV bulk import
2. Implement `AssetDetailScreen` + hierarchy + location history
3. Implement `AssetCreateScreen`
4. Implement barcode/QR label generation
5. **Quality gate** ✓

### Phase 9 — Review Queue

1. Implement `ReviewQueueScreen` with item type filters
2. Implement `ReviewItemScreen` with full context + action panel
3. **Quality gate** ✓

### Phase 10 — Notifications + Search

1. Implement `NotificationBell` widget + `NotificationsScreen`
2. Implement `GlobalSearchBar` widget + `SearchScreen` with per-type result groups
3. **Quality gate** ✓

---

## Inter-Hospital Transfer Flow (Module 4.7)

Lives inside the EMR / Patients surface. The sending side is a modal/screen triggered from `PatientActions`. The receiving side is a queue tab on the `ReviewQueueScreen`.

```
features/patients/
└── features/
    └── inter-hospital-transfer/
        ├── api/
        │   ├── use-initiate-transfer.ts
        │   └── use-incoming-transfers.ts
        └── screen/
            └── parts/
                ├── transfer-initiate-form.tsx  # hospital search, reason, dept, records package
                └── transfer-receive-panel.tsx  # accept/decline at receiving hospital
```

---

## Admin App (apps/admin-web)

Separate Vite app. Builds after the main app is complete. Shares `@medcord/core`, `@medcord/api`, `@medcord/ui`.

Screens: platform-level hospital management, user management, platform audit logs, feature flags, billing overview.

No detailed plan here until the main app is done — this is Phase 12.

---

## Notes

- **Patient code format**: Use human-readable `CAE-3F8K-2P9X` style. Generate display in `format-patient-code` helper.
- **Module gating**: All modules are enabled by default (Pro plan). Gates are wired but always open. Check `hospital.modules` array when rendering sidebar nav links.
- **E-prescribing**: For MVP, prescriptions generate a PDF. No Surescripts integration.
- **Continuous vitals monitoring**: Not in scope (v2). No ICU-style streams.
- **Staff credentialing**: Not in scope (v2).
- **Patient consent for inter-hospital transfer**: Capture explicit in-app consent before sending records package.
- **Break-the-glass**: Any access to a restricted chart shows a modal requiring a reason. Access is logged and flagged. Handled in `ChartAccessGuard`.
