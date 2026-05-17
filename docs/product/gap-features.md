# Medcord — Gap Features

> Features specified in `docs/product/mvp.md` that are not yet fully built.
> Notifications gap is intentionally deferred — not included here.
> Each section has enough detail for an agent to pick it up and execute without re-researching.

---

## Gap 1 — Password Reset via Super-Admin Code

### Status
Frontend screens exist but need to be redesigned. Backend routes do not exist.

### Design decision
There is no self-service "forgot password" email flow. Instead:
- A user who has forgotten their password contacts their hospital super-admin.
- The super-admin generates a one-time 7-character alphanumeric reset code for that user from inside the hospital staff management area.
- The user goes to the forgot-password page, is told to contact their admin, and clicks "I have a code" to proceed to a code-entry screen.
- On code entry, the backend validates the code; if valid the user is taken to a new-password screen.
- The new password + same code are submitted together; the backend marks the code used and updates the password.

### API design (3 endpoints)

#### `POST api/v1/auth/generate-reset-code` — super-admin only, authenticated
Body: `{ userId: string }` — the user whose password is being reset.

Response 200: `{ data: { code: string } }` — the 7-character code to hand to the user.

Behaviour:
- Caller must be authenticated (`authenticate` middleware) and have `role === 'super_admin'` in at least one hospital that the target user belongs to (`requireRole('super_admin')` scoped to the hospital).
- Generate a cryptographically random 7-character uppercase alphanumeric code (e.g. `A3K9PZ2`).
- Store it **plaintext** on the user record (short codes — hashing adds no real security here) with `expiresAt = now + 24 hours`. Overwrite any existing code.
- Return the code to the super-admin. It is only shown once.

#### `POST api/v1/auth/verify-reset-code` — public, no auth
Body: `{ code: string }`

Response 200: `{ data: { valid: true } }` — code exists and is not expired.
Response 400: error if code not found or expired.

Behaviour:
- Find user where `passwordResetCode === code` and `passwordResetCodeExpiresAt > now`.
- Do NOT mark used yet — the user still needs to set a new password.
- Return `{ valid: true }`. The code is passed forward on the client.

#### `POST api/v1/auth/reset-password` — public, no auth
Body: `{ code: string, password: string (min 8) }`

Response 204: noContent.

Behaviour:
- Find user where `passwordResetCode === code` and `passwordResetCodeExpiresAt > now`.
- If not found or expired: throw `BadRequestError('Invalid or expired reset code')`.
- Hash the new password with bcrypt (same SALT_ROUNDS as register).
- Clear `passwordResetCode` and `passwordResetCodeExpiresAt`.
- Update `passwordHash`.

### Backend changes

**`auth.model.ts` / user schema** — add two fields:
```ts
passwordResetCode?: string;          // 7-char plaintext code
passwordResetCodeExpiresAt?: Date;
```

**`auth.schema.ts`** — add three zod schemas:
```ts
export const GenerateResetCodeBody = z.object({ userId: z.string().min(1) });
export const VerifyResetCodeBody   = z.object({ code: z.string().min(1) });
export const ResetPasswordBody     = z.object({ code: z.string().min(1), password: z.string().min(8) });
```

**`auth.service.ts`** — add three methods:
- `generateResetCode(requesterId: string, userId: string)` — verify requester is super_admin in a shared hospital, generate and store code, return it
- `verifyResetCode({ code })` — look up code, throw if invalid/expired, return `{ valid: true }`
- `resetPassword({ code, password })` — verify code, update password, clear code

**`auth.routes.ts`** — register three new routes:
```
POST /generate-reset-code  → authenticate, requireRole('super_admin') → 200 { data: { code } }
POST /verify-reset-code    → public → 200 { data: { valid: true } }
POST /reset-password       → public → 204 noContent
```

**EP constants** (`packages/api/src/endpoints.ts`) — replace existing `AUTH_FORGOT_PASSWORD` and `AUTH_RESET_PASSWORD` with:
```ts
AUTH_GENERATE_RESET_CODE: 'api/v1/auth/generate-reset-code',
AUTH_VERIFY_RESET_CODE:   'api/v1/auth/verify-reset-code',
AUTH_RESET_PASSWORD:      'api/v1/auth/reset-password',
```
Remove `AUTH_FORGOT_PASSWORD`.

### Frontend changes

The forgot-password flow is redesigned as a 3-step journey, all within the existing `/forgot-password` route. The reset-password route (`/reset-password`) is repurposed for the new-password step only.

**Step 1 — `forgot-password-screen.tsx`** (replace existing):
- Title: "Forgot your password?"
- Body copy: "Contact your hospital's super-admin to get a reset code. Once you have it, come back here."
- Single button: "I have a code" → navigates to `/reset-password`
- Footer link: "Back to Sign in"
- Remove the email input and the `useForgotPassword` hook entirely.

**Step 2 — new screen: `enter-code-screen.tsx`** at `/reset-password` (replaces existing reset-password screen):
- Title: "Enter your reset code"
- Subtitle: "Enter the 7-character code your admin gave you."
- Single input: code (uppercase, max 7 chars, auto-uppercase on input)
- "Continue" button → calls `useVerifyResetCode({ code })` → `POST api/v1/auth/verify-reset-code`
  - On success: navigate to `/reset-password/new?code=<code>` passing the code forward
  - On error: show inline error "That code is invalid or has expired."
- Footer link: "Back to forgot password"

**Step 3 — new screen: `new-password-screen.tsx`** at `/reset-password/new`:
- Title: "Choose a new password"
- Subtitle: "Make it strong — at least 8 characters."
- New password input (with show/hide eye toggle)
- Confirm password input (with show/hide eye toggle)
- Client-side validation: passwords must match, min 8 chars
- "Reset password" button → calls `useResetPassword({ code, password })` → `POST api/v1/auth/reset-password` with `{ code, password }`
  - Reads `code` from `useSearchParams()`
  - On success: show success state ("Password updated. Redirecting…") then navigate to login after 2s
  - On error: show inline error
- Footer link: "Back to Sign in"

**New ROUTES constants** (`apps/medcord-web/src/shared/constants/routes.ts`):
```ts
RESET_PASSWORD:     '/reset-password',       // step 2 — code entry
RESET_PASSWORD_NEW: '/reset-password/new',   // step 3 — new password
```

**`app.routes.tsx`** — update:
```tsx
<Route path={ROUTES.FORGOT_PASSWORD}     element={<Lazy><ForgotPasswordScreen /></Lazy>} />
<Route path={ROUTES.RESET_PASSWORD}      element={<Lazy><EnterCodeScreen /></Lazy>} />
<Route path={ROUTES.RESET_PASSWORD_NEW}  element={<Lazy><NewPasswordScreen /></Lazy>} />
```

**Super-admin: generate code** — exposed inside hospital settings or staff profile.

In `apps/medcord-web/src/features/staff/features/staff-profile/screen/staff-profile-screen.tsx` (or its `profile-actions.tsx` part), add a "Generate reset code" button visible only to `super_admin` users viewing another user's profile. On click:
- Calls `useGenerateResetCode(hospitalId, staffMember.userId)`
- On success: `DrawerService.showCustomModal('Reset code', ...)` displaying the code in large text with a `<CopyToClipboard>` and the message "Share this code with the staff member. It expires in 24 hours. It will not be shown again."

**New API hooks** (`apps/medcord-web/src/features/auth/api/`):
- Delete `use-forgot-password.ts`
- Create `use-verify-reset-code.ts` — calls `POST EP.AUTH_VERIFY_RESET_CODE` with `{ code }`
- Update `use-reset-password.ts` — payload changes to `{ code: string, password: string }`, calls `POST EP.AUTH_RESET_PASSWORD`
- Create `use-generate-reset-code.ts` — calls `POST EP.AUTH_GENERATE_RESET_CODE` with `{ userId }`, returns `{ code: string }`

### Files to touch — backend
- `apps/main-backend/src/features/auth/auth.model.ts` — add `passwordResetCode`, `passwordResetCodeExpiresAt`
- `apps/main-backend/src/features/auth/auth.schema.ts` — add 3 zod schemas
- `apps/main-backend/src/features/auth/auth.repo.ts` — add `findByResetCode` method
- `apps/main-backend/src/features/auth/auth.service.ts` — add 3 methods
- `apps/main-backend/src/features/auth/auth.routes.ts` — register 3 new routes

### Files to touch — frontend
- `packages/api/src/endpoints.ts` — replace `AUTH_FORGOT_PASSWORD` with `AUTH_GENERATE_RESET_CODE` + `AUTH_VERIFY_RESET_CODE`, keep `AUTH_RESET_PASSWORD`
- `apps/medcord-web/src/shared/constants/routes.ts` — add `RESET_PASSWORD_NEW`
- `apps/medcord-web/src/features/auth/api/use-forgot-password.ts` — **delete**
- `apps/medcord-web/src/features/auth/api/use-verify-reset-code.ts` — create
- `apps/medcord-web/src/features/auth/api/use-reset-password.ts` — update payload shape
- `apps/medcord-web/src/features/auth/api/use-generate-reset-code.ts` — create
- `apps/medcord-web/src/features/auth/features/forgot-password/screen/forgot-password-screen.tsx` — replace (no email input, just info + "I have a code" button)
- `apps/medcord-web/src/features/auth/features/reset-password/screen/enter-code-screen.tsx` — create (replaces old reset-password-screen)
- `apps/medcord-web/src/features/auth/features/reset-password/screen/new-password-screen.tsx` — create
- `apps/medcord-web/src/features/auth/features/reset-password/screen/reset-password-screen.tsx` — **delete** (replaced by enter-code-screen + new-password-screen)
- `apps/medcord-web/src/app.routes.tsx` — update route registrations
- `apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-actions.tsx` — add "Generate reset code" button (super_admin only)

### Quality gate
`pnpm nx run main-backend:build && pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 2 — Role Management Screen (Frontend)

### Status
Backend is fully built. Frontend has no screen to create or edit custom roles.

### What exists — backend
- `GET  /api/v1/hospitals/:hospitalId/roles` → `{ roles: ICustomRole[] }` — list all custom roles
- `POST /api/v1/hospitals/:hospitalId/roles` → body: `{ name, permissions: string[] }` → `{ role }` — create (super_admin only)
- `PATCH /api/v1/hospitals/:hospitalId/roles/:roleId` → body: `{ name?, permissions? }` → `{ role }` — update (super_admin only)
- Role type:
  ```ts
  interface ICustomRole {
    id: string;
    hospitalId: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- EP constants exist: `EP.HOSPITAL_ROLES(hospitalId)`, `EP.HOSPITAL_ROLE(hospitalId, roleId)`

### What needs to be built (frontend only)

**New feature folder:** `apps/medcord-web/src/features/staff/features/roles/`

```
roles/
├── api/
│   └── use-roles.ts          (useRoles, useCreateRole, useUpdateRole)
└── screen/
    ├── roles-screen.tsx       (list + inline create)
    └── parts/
        └── role-form.tsx      (shared create/edit form used inline)
```

**`use-roles.ts`:**
- `useRoles(hospitalId)` → GET `EP.HOSPITAL_ROLES(hospitalId)` → `r.data.roles`
- `useCreateRole(hospitalId)` → POST `EP.HOSPITAL_ROLES(hospitalId)` → `r.data.role` → invalidate `['roles', hospitalId]`
- `useUpdateRole(hospitalId, roleId)` → PATCH `EP.HOSPITAL_ROLE(hospitalId, roleId)` → `r.data.role` → invalidate same

**`roles-screen.tsx`:**
- Page heading "Roles" with subtitle "Custom roles for this hospital"
- Table of existing roles: Name, Permissions (count badge), Created
- "New role" button (super_admin only — gate by `currentUser.role`) opens an inline form or `DrawerService` input flow
- Each row has "Edit" button that opens edit form
- Empty state: "No custom roles yet."
- `<Loadable>` with spinner + error
- `<Repeat>` for table rows

**Route:** `/h/:slug/staff/roles`

**`app.routes.tsx`:** Add the new route under the hospital shell's staff section (same level as `/staff/directory`, `/staff/invite`, `/staff/org-chart`).

**Sidebar:** Add "Roles" nav entry in the Staff section of the sidebar — visible to `super_admin` and `hospital_admin` only (same gate as Invite).

### Files to touch
- `apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts` — create
- `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx` — create
- `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx` — create
- `apps/medcord-web/src/app.routes.tsx` — add roles route
- `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` — add Roles nav entry (role-gated)

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 3 — Incoming Transfer Queue (Frontend)

### Status
Backend is fully built. Frontend has no screen for a receiving hospital to see, accept, or decline incoming patient transfers.

### What exists — backend
- `GET  /api/v1/hospitals/:hospitalId/transfers/incoming` → `{ transfers: ITransfer[] }` — all pending incoming
- `POST /api/v1/hospitals/:hospitalId/transfers/:transferId/accept` → `{ transfer }` — links patient to this hospital
- `POST /api/v1/hospitals/:hospitalId/transfers/:transferId/decline` → `{ transfer }` — declines
- EP constants: `EP.HOSPITAL_TRANSFERS_INCOMING(hospitalId)`, `EP.HOSPITAL_TRANSFER_ACCEPT(hospitalId, transferId)`, `EP.HOSPITAL_TRANSFER_DECLINE(hospitalId, transferId)`

**ITransfer shape:**
```ts
interface ITransfer {
  id: string;
  patientId: string;
  fromHospitalId: string;
  toHospitalId: string;
  reason: string;
  department?: string;
  recordsPackage: {
    includeVitals: boolean;
    includeMedications: boolean;
    includeHistory: boolean;
    includeLabs: boolean;
    includeDocuments: boolean;
  };
  status: 'pending' | 'accepted' | 'declined';
  requestedBy: string;
  respondedBy?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### What needs to be built (frontend only)

**New feature folder:** `apps/medcord-web/src/features/patients/features/patient-transfers/`

```
patient-transfers/
├── api/
│   └── use-patient-transfers.ts   (useIncomingTransfers, useAcceptTransfer, useDeclineTransfer)
└── screen/
    ├── transfers-screen.tsx       (list of pending incoming transfers)
    └── parts/
        └── transfer-card.tsx      (single transfer row/card with accept + decline buttons)
```

**`use-patient-transfers.ts`:**
- `useIncomingTransfers(hospitalId)` → GET `EP.HOSPITAL_TRANSFERS_INCOMING(hospitalId)` → `r.data.transfers` — `queryKey: ['incoming-transfers', hospitalId]`, `staleTime: 30_000`, `refetchOnWindowFocus: true`
- `useAcceptTransfer(hospitalId)` → POST `EP.HOSPITAL_TRANSFER_ACCEPT(hospitalId, transferId)` — on success: invalidate `['incoming-transfers', hospitalId]`, toast `'Transfer accepted. Patient added to your hospital.'`
- `useDeclineTransfer(hospitalId)` → POST `EP.HOSPITAL_TRANSFER_DECLINE(hospitalId, transferId)` — on success: invalidate same, toast `'Transfer declined.'`

**`transfers-screen.tsx`:**
- Page heading "Incoming Transfers" with subtitle "Patients pending transfer to your hospital"
- List of pending transfers using `<Repeat>` with `<TransferCard>` for each
- Empty state: patients icon + "No pending transfers."
- `<Loadable>` with spinner + error

**`transfer-card.tsx`:**
- Shows: patient ID (`patientId`), reason, requesting hospital ID (`fromHospitalId`), department (if set), records package checkboxes (read-only — what's included), date requested
- Two buttons: "Accept" (`AppButton variant="primary"`) and "Decline" (`AppButton variant="danger"`)
- Accept: fires `useAcceptTransfer` immediately (no confirmation)
- Decline: `DrawerService.showConfirmationModal('Decline this transfer?', 'The requesting hospital will be notified.', { destructive: true, onConfirm: () => declineMutation.mutate(transfer.id) })`
- Both show loading state while in flight

**Route:** `/h/:slug/patients/transfers` — add to `app.routes.tsx`

**Sidebar / nav:** Add "Transfers" link in the Patients section of the sidebar — show a count badge on the nav item if `transfers.length > 0`. Conditionally visible based on hospital `modules` (always shown if patient management is active).

**Notification link:** The notification system already sends `transfer_received` and related notification types. When a user clicks a transfer notification, it should navigate to `/h/:slug/patients/transfers`.

### Files to touch
- `apps/medcord-web/src/features/patients/features/patient-transfers/api/use-patient-transfers.ts` — create
- `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx` — create
- `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/transfer-card.tsx` — create
- `apps/medcord-web/src/app.routes.tsx` — add transfers route
- `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` — add Transfers nav entry

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 4 — Lab Result Sign-Off (Frontend + Backend guard)

### Status
The 7-state lab order workflow exists. The `result_released` state exists. But there is no dedicated sign-off UI for ordering providers, and the backend `advance` endpoint has no role restriction on who can release results.

### What exists
- Backend: `POST /api/v1/hospitals/:hospitalId/lab-orders/:orderId/advance` — advances state machine one step. No role guard — any staff member can release.
- Backend: `POST /api/v1/hospitals/:hospitalId/lab-orders/:orderId/result` — records result data. No role guard.
- Frontend: `lab-orders-screen.tsx`, lab order detail screen — the "Advance" button exists but treats all states uniformly.
- EP constants: `EP.HOSPITAL_LAB_ORDER_ADVANCE`, `EP.HOSPITAL_LAB_ORDER_RESULT`

### Lab order states (7)
```
awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released
```

### What needs to be built

**Backend — add role guard on advance to `result_released`:**

In the `advance` route handler (or in `lab.service.ts`), before calling the advance:
- If `currentStatus === 'result_ready'` and `nextStatus === 'result_released'`:
  - Check that `req.user.role` is in `['doctor', 'nurse_practitioner', 'physician_assistant']` (PRESCRIBER_ROLES).
  - If not: throw `ForbiddenError('Only prescribers can release lab results')`.

**Frontend — dedicated sign-off UI on lab order detail:**

The lab order detail screen (`apps/medcord-web/src/features/labs/features/lab-orders/screen/`) needs to show different UI based on the order's current status:

- When `status === 'result_ready'`: show a prominent "Release Result" section
  - Display the result data (value, unit, reference range, flags) prominently
  - "Release to chart" `AppButton variant="primary"` — fires `advance` mutation
  - This triggers the final state change to `result_released`
  - On success: toast `'Result released to patient chart.'`
  - Only shown if `currentUser.role` is in PRESCRIBER_ROLES (doctors, NPs, PAs)
  - Non-prescribers see a read-only result display with "Awaiting sign-off by provider" label

- When `status === 'result_released'`: show result with a "Released" green badge, no action button

**Create a new part:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx`
- Props: `order: LabOrder`, `currentUserRole: string`
- Shows result details + release button (or read-only view for non-prescribers)

### Files to touch
- `apps/main-backend/src/features/labs/lab.routes.ts` — add role check before state `result_released`
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx` — integrate sign-off panel (or it's on the detail screen if one exists)
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx` — create

### Quality gate
`pnpm nx run main-backend:build && pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 5 — Hospital-Wide Audit Log Screen (Frontend)

### Status
Backend is built. The per-patient EMR access log screen exists. There is no hospital-wide audit log screen showing all system events.

### What exists — backend
- `GET /api/v1/hospitals/:hospitalId/audit-log` → `{ items, total, page, limit, totalPages }` (paginated)
- Query params: `action` (string filter by `AuditAction`), `actorId` (string), `page`, `limit` (max 100)
- No EP constant yet — needs to be added.

**IAuditLog shape:**
```ts
interface IAuditLog {
  id: string;
  hospitalId: string;
  actorId: string;
  actorRole?: string;
  action: AuditAction;   // e.g. 'patient.created', 'emr.accessed', 'lab.result_released', etc.
  resourceType: string;
  resourceId: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

**AuditAction values:** `patient.created`, `patient.updated`, `patient.admitted`, `patient.discharged`, `patient.transferred`, `emr.accessed`, `emr.break_glass`, `lab.created`, `lab.result_recorded`, `lab.result_released`, `member.invited`, `member.suspended`, `member.removed`, `hospital.updated`, `asset.created`, `asset.status_changed`, `review.acted`

### What needs to be built

**EP constant** in `packages/api/src/endpoints.ts`:
```ts
HOSPITAL_AUDIT_LOG: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/audit-log`,
```

**New feature:** `apps/medcord-web/src/features/workspace/features/audit-log/`

```
audit-log/
├── api/
│   └── use-audit-log.ts       (useAuditLog with pagination + filters)
└── screen/
    ├── audit-log-screen.tsx
    └── parts/
        └── audit-log-filters.tsx
```

**`use-audit-log.ts`:**
- `useAuditLog(hospitalId, filters)` → GET `EP.HOSPITAL_AUDIT_LOG(hospitalId)` with searchParams `{ action?, actorId?, page, limit: '50' }` → `r.data` (flat paginated result)
- `queryKey: ['audit-log', hospitalId, filters]`, `staleTime: 60_000`

**`audit-log-screen.tsx`:**
- Page heading "Audit Log" with subtitle "All system activity for this hospital"
- Filters: action dropdown (all AuditAction values as options), actor ID search input (debounced 300ms)
- Table columns: Action (formatted nicely e.g. "Patient created"), Resource Type, Resource ID, Actor ID, Role, IP Address, Date/Time
- Pagination: Prev/Next, "Page X of Y"
- Empty state: "No audit events found."
- `<Loadable>` + `<Repeat>`

**Route:** `/h/:slug/settings/audit-log` — add under hospital settings routes in `app.routes.tsx`

**Settings sidebar/tab:** Add "Audit Log" tab in hospital settings navigation. Visible to `super_admin` and `hospital_admin` only.

### Files to touch
- `packages/api/src/endpoints.ts` — add `HOSPITAL_AUDIT_LOG`
- `apps/medcord-web/src/features/workspace/features/audit-log/api/use-audit-log.ts` — create
- `apps/medcord-web/src/features/workspace/features/audit-log/screen/audit-log-screen.tsx` — create
- `apps/medcord-web/src/features/workspace/features/audit-log/screen/parts/audit-log-filters.tsx` — create
- `apps/medcord-web/src/app.routes.tsx` — add audit-log route
- Hospital settings navigation — add Audit Log tab/link

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Deferred (Not in this build)

| Gap | Reason deferred |
|---|---|
| Notifications (real-time) | Explicitly deferred by user |
| Asset hierarchy (parent-child) | Model change + significant scope; no backend support |
| EMR inter-hospital chart export | No backend support; large scope |
| Scan-to-check-in (dedicated screen) | Check-in via profile action is acceptable for MVP |
