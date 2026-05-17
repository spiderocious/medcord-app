ALWAYS RECHECK THE PLAN, DONT DO WHAT I DONT ASK!!!!!!
For every phase/feature, run lint, typecheck, and build!
when done, write out the qa handoff notes for the frontend and the backend, seperately: see samples in 
/docs/qas

# Medcord — Gap Features Build Plan

> Fills the 5 gaps identified in `docs/product/gap-features.md`.
> Notifications real-time delivery is NOT in scope. Asset hierarchy and EMR inter-hospital chart export are NOT in scope.
> Read this alongside `docs/rules-lessons.md` — every rule there applies here too.

---

## Rules — Same as always, no exceptions

### meemaw — zero exceptions

| Banned | Required |
|---|---|
| `{cond && <X />}` | `<Show when={cond}><X /></Show>` |
| `{cond ? <X /> : <Y />}` | `<Show when={cond} fallback={<Y />}><X /></Show>` |
| `{items.map(...)}` | `<Repeat each={items as T[]}>{(item: T) => ...}</Repeat>` |
| `{isLoading ? ... : error ? ... : ...}` | `<Loadable loading error={error ?? undefined} loadingComponent errorComponent>` |

### API client

```ts
// GET
const r = await apiClient.get(EP.SOME_ENDPOINT).json<{ data: SomeType }>();
return r.data;

// POST/PATCH with body
const r = await apiClient.post(EP.SOME_ENDPOINT, { json: payload }).json<...>();

// 204 — no .json()
await apiClient.post(EP.SOME_ENDPOINT);

// onError — never hardcode strings
onError: (err: unknown) => {
  DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
},
```

### Quality gate — run after every gap feature

```bash
pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build
# For backend changes:
pnpm nx run main-backend:build
```

All must be zero-error before the feature is declared done.

---

## Build Order

| # | Gap | Backend? | Frontend? |
|---|---|---|---|
| 1 | Password Reset via Super-Admin Code | ✅ Yes (backend) | ✅ Yes (frontend redesign) |
| 2 | Lab Result Sign-Off | ✅ Yes (role guard) | ✅ Yes (sign-off panel) |
| 3 | Incoming Transfer Queue | No | ✅ Yes |
| 4 | Role Management Screen | No | ✅ Yes |
| 5 | Hospital-Wide Audit Log | No | ✅ Yes (+ 1 EP constant) |

Build in this order — backend changes first so the frontend always has working endpoints.

---

## Gap 1 — Password Reset via Super-Admin Code

### Context
No self-service email flow. A super-admin generates a 7-character alphanumeric code for a specific user. The user enters that code on the reset flow to verify identity, then sets a new password.

**3 new backend endpoints:**
- `POST api/v1/auth/generate-reset-code` — authenticated, super_admin only → generates + returns the code
- `POST api/v1/auth/verify-reset-code` — public → validates the code without consuming it
- `POST api/v1/auth/reset-password` — public → consumes the code + updates password

**Frontend flow redesign:** 3 screens replace the old 2-screen flow.

**Existing state:**
- `apps/main-backend/src/features/auth/auth.routes.ts` — no forgot/reset routes exist
- `apps/main-backend/src/features/auth/auth.service.ts` — no forgot/reset methods exist
- `packages/api/src/endpoints.ts` — has `AUTH_FORGOT_PASSWORD` (delete this) and `AUTH_RESET_PASSWORD` (keep, change shape)
- `apps/medcord-web/src/features/auth/api/use-forgot-password.ts` — delete
- `apps/medcord-web/src/features/auth/api/use-reset-password.ts` — update payload
- `apps/medcord-web/src/features/auth/features/forgot-password/screen/forgot-password-screen.tsx` — replace (remove email input)
- `apps/medcord-web/src/features/auth/features/reset-password/screen/reset-password-screen.tsx` — delete, replaced by two new screens
- `apps/medcord-web/src/shared/constants/routes.ts` — has `RESET_PASSWORD`, needs `RESET_PASSWORD_NEW`

---

### Part A — Backend

**Step 1 — Update auth model** (`apps/main-backend/src/features/auth/auth.model.ts`):

Add to `IUser` interface and user schema:
```ts
// IUser interface additions
passwordResetCode?: string;           // 7-char plaintext code
passwordResetCodeExpiresAt?: Date;

// schema additions
passwordResetCode: { type: String, index: true },
passwordResetCodeExpiresAt: { type: Date },
```

**Step 2 — Add zod schemas** (`apps/main-backend/src/features/auth/auth.schema.ts`):

```ts
export const GenerateResetCodeBody = z.object({ userId: z.string().min(1) });
export const VerifyResetCodeBody   = z.object({ code: z.string().min(1) });
export const ResetPasswordBody     = z.object({ code: z.string().min(1), password: z.string().min(8) });
```

**Step 3 — Add repo method** (`apps/main-backend/src/features/auth/auth.repo.ts`):

```ts
findByResetCode: async (code: string) => {
  return UserModel.findOne({
    passwordResetCode: code,
    passwordResetCodeExpiresAt: { $gt: new Date() },
  }).lean<IUser>();
},
```

**Step 4 — Add service methods** (`apps/main-backend/src/features/auth/auth.service.ts`):

```ts
async generateResetCode(requesterId: string, { userId }: GenerateResetCodeBody) {
  // Verify requester is super_admin in at least one hospital where userId is a member
  const requesterMemberships = await staffRepo.findMembershipsByUserId(requesterId);
  const superAdminHospitalIds = requesterMemberships
    .filter(m => m.role === 'super_admin')
    .map(m => m.hospitalId);
  if (superAdminHospitalIds.length === 0) throw new ForbiddenError('Only super admins can generate reset codes');

  const targetMemberships = await staffRepo.findMembershipsByUserId(userId);
  const sharedHospital = targetMemberships.some(m => superAdminHospitalIds.includes(m.hospitalId));
  if (!sharedHospital) throw new ForbiddenError('User is not a member of your hospital');

  // Generate 7-char uppercase alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars
  let code = '';
  const bytes = crypto.randomBytes(7);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await authRepo.updateById(userId, {
    passwordResetCode: code,
    passwordResetCodeExpiresAt: expiresAt,
  });

  return { code };
},

async verifyResetCode({ code }: VerifyResetCodeBody) {
  const user = await authRepo.findByResetCode(code);
  if (!user) throw new BadRequestError('Invalid or expired reset code');
  return { valid: true };
},

async resetPassword({ code, password }: ResetPasswordBody) {
  const user = await authRepo.findByResetCode(code);
  if (!user) throw new BadRequestError('Invalid or expired reset code');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await authRepo.updateById(user.id, {
    passwordHash,
    passwordResetCode: undefined,
    passwordResetCodeExpiresAt: undefined,
  });
},
```

> Note: `staffRepo.findMembershipsByUserId` — check if this method exists in `staff.repo.ts`. If not, add it: `return MembershipModel.find({ userId }).lean()`.

**Step 5 — Register routes** (`apps/main-backend/src/features/auth/auth.routes.ts`):

```ts
import { GenerateResetCodeBody, VerifyResetCodeBody, ResetPasswordBody } from './auth.schema.js';

// Authenticated — super_admin only
router.post(
  '/generate-reset-code',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = GenerateResetCodeBody.parse(req.body);
    const result = await authService.generateResetCode(req.user!.id, body);
    return ResponseUtil.ok(res, result);
  }),
);

// Public
router.post(
  '/verify-reset-code',
  asyncHandler(async (req, res) => {
    const body = VerifyResetCodeBody.parse(req.body);
    const result = await authService.verifyResetCode(body);
    return ResponseUtil.ok(res, result);
  }),
);

// Public
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const body = ResetPasswordBody.parse(req.body);
    await authService.resetPassword(body);
    return ResponseUtil.noContent(res);
  }),
);
```

**Backend files to touch:**
- `apps/main-backend/src/features/auth/auth.model.ts`
- `apps/main-backend/src/features/auth/auth.schema.ts`
- `apps/main-backend/src/features/auth/auth.repo.ts`
- `apps/main-backend/src/features/auth/auth.service.ts`
- `apps/main-backend/src/features/auth/auth.routes.ts`
- `apps/main-backend/src/features/staff/staff.repo.ts` — add `findMembershipsByUserId` if missing

**Backend quality gate:** `pnpm nx run main-backend:build`

---

### Part B — Frontend: EP constants + API hooks

**`packages/api/src/endpoints.ts`:**
- Remove `AUTH_FORGOT_PASSWORD`
- Add:
```ts
AUTH_GENERATE_RESET_CODE: 'api/v1/auth/generate-reset-code',
AUTH_VERIFY_RESET_CODE:   'api/v1/auth/verify-reset-code',
```
- Keep `AUTH_RESET_PASSWORD: 'api/v1/auth/reset-password'` (endpoint path unchanged)

**Delete** `apps/medcord-web/src/features/auth/api/use-forgot-password.ts`

**Update** `apps/medcord-web/src/features/auth/api/use-reset-password.ts` — change payload shape:
```ts
export interface ResetPasswordPayload {
  readonly code: string;      // was: token
  readonly password: string;  // was: newPassword
}
// mutationFn body stays: await apiClient.post(EP.AUTH_RESET_PASSWORD, { json: payload })
// 204 — no .json()
```

**Create** `apps/medcord-web/src/features/auth/api/use-verify-reset-code.ts`:
```ts
export function useVerifyResetCode() {
  return useMutation({
    mutationFn: async (payload: { code: string }) => {
      const r = await apiClient
        .post(EP.AUTH_VERIFY_RESET_CODE, { json: payload })
        .json<{ data: { valid: boolean } }>();
      return r.data;
    },
  });
}
```

**Create** `apps/medcord-web/src/features/auth/api/use-generate-reset-code.ts`:
```ts
export function useGenerateResetCode() {
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const r = await apiClient
        .post(EP.AUTH_GENERATE_RESET_CODE, { json: payload })
        .json<{ data: { code: string } }>();
      return r.data.code;
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

---

### Part C — Frontend: ROUTES constant + 3 screens

**`apps/medcord-web/src/shared/constants/routes.ts`** — add:
```ts
RESET_PASSWORD_NEW: '/reset-password/new',
```

**Screen 1 — Replace `forgot-password-screen.tsx`** (file stays, content replaced):

Title: "Forgot your password?". No email input. Just an info card and a CTA.

```tsx
export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Forgot your password?"
      footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <div className="space-y-5 text-center">
        <p className="text-sm text-charcoal-700">
          Contact your hospital's super-admin to get a reset code. Once you have one, click below.
        </p>
        <AppButton onClick={() => navigate(ROUTES.RESET_PASSWORD)} className="w-full">
          I have a code
        </AppButton>
      </div>
    </AuthLayout>
  );
}
```

**Screen 2 — Create `enter-code-screen.tsx`** at `apps/medcord-web/src/features/auth/features/reset-password/screen/enter-code-screen.tsx`:

Route: `/reset-password` (replaces old reset-password-screen at this path)

```tsx
export function EnterCodeScreen() {
  const navigate = useNavigate();
  const mutation = useVerifyResetCode();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ code: code.trim().toUpperCase() });
      navigate(`${ROUTES.RESET_PASSWORD_NEW}?code=${encodeURIComponent(code.trim().toUpperCase())}`);
    } catch {
      setError('That code is invalid or has expired. Check with your super-admin.');
    }
  }

  return (
    <AuthLayout
      title="Enter your reset code"
      subtitle="Enter the 7-character code your super-admin gave you."
      footerLink={{ label: 'Back to', to: ROUTES.FORGOT_PASSWORD, text: 'forgot password' }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reset-code" className="block text-sm font-medium text-charcoal-900">
            Reset code
          </label>
          <input
            id="reset-code"
            type="text"
            maxLength={7}
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm font-mono tracking-widest text-charcoal-900 uppercase placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
            placeholder="A3K9PZ2"
          />
        </div>
        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </Show>
        <AppButton type="submit" loading={mutation.isPending} className="w-full">
          Continue
        </AppButton>
      </form>
    </AuthLayout>
  );
}
```

**Screen 3 — Create `new-password-screen.tsx`** at `apps/medcord-web/src/features/auth/features/reset-password/screen/new-password-screen.tsx`:

Route: `/reset-password/new` — reads `code` from `useSearchParams()`.

```tsx
export function NewPasswordScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mutation = useResetPassword();
  const code = searchParams.get('code') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!code) { setError('Missing reset code. Go back and re-enter it.'); return; }
    try {
      await mutation.mutateAsync({ code, password });
      setDone(true);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2000);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900/10">
            <IconCheckCircle size={22} className="text-forest-900" />
          </div>
          <p className="text-sm text-charcoal-700">Your password has been reset. Redirecting you to sign in…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Make it strong — at least 8 characters."
      footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* New password */}
        <div>
          <label htmlFor="new-pw" className="block text-sm font-medium text-charcoal-900">New password</label>
          <div className="relative mt-1">
            <input id="new-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
              placeholder="Min. 8 characters" />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700" tabIndex={-1}>
              <Show when={showPw} fallback={<IconEye size={16} />}><IconEyeOff size={16} /></Show>
            </button>
          </div>
        </div>
        {/* Confirm password */}
        <div>
          <label htmlFor="confirm-pw" className="block text-sm font-medium text-charcoal-900">Confirm password</label>
          <div className="relative mt-1">
            <input id="confirm-pw" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
              placeholder="Repeat your password" />
            <button type="button" onClick={() => setShowConfirm(p => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700" tabIndex={-1}>
              <Show when={showConfirm} fallback={<IconEye size={16} />}><IconEyeOff size={16} /></Show>
            </button>
          </div>
        </div>
        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </Show>
        <AppButton type="submit" loading={mutation.isPending} className="w-full">Reset password</AppButton>
      </form>
    </AuthLayout>
  );
}
```

**Delete** `apps/medcord-web/src/features/auth/features/reset-password/screen/reset-password-screen.tsx`

---

### Part D — Frontend: app routes + super-admin generate code button

**`apps/medcord-web/src/app.routes.tsx`** — update the auth routes section:

```tsx
// Remove import for ResetPasswordScreen
// Add imports:
const EnterCodeScreen = lazy(() =>
  import('@features/auth/features/reset-password/screen/enter-code-screen.tsx')
    .then(m => ({ default: m.EnterCodeScreen }))
);
const NewPasswordScreen = lazy(() =>
  import('@features/auth/features/reset-password/screen/new-password-screen.tsx')
    .then(m => ({ default: m.NewPasswordScreen }))
);

// Routes:
<Route path={ROUTES.FORGOT_PASSWORD}     element={<Lazy><ForgotPasswordScreen /></Lazy>} />
<Route path={ROUTES.RESET_PASSWORD}      element={<Lazy><EnterCodeScreen /></Lazy>} />
<Route path={ROUTES.RESET_PASSWORD_NEW}  element={<Lazy><NewPasswordScreen /></Lazy>} />
```

**`apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-actions.tsx`** — add "Generate reset code" button:

- The profile actions component already has `currentUser` and `member` (the staff member being viewed). Check the file's existing props/structure before editing.
- Add a section (after existing actions, before destructive actions):
```tsx
<Show when={currentUser?.role === 'super_admin' && currentUser.id !== member.userId}>
  <div className="border-t border-forest-900/10 pt-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-2">
      Account
    </p>
    <AppButton
      variant="ghost"
      onClick={handleGenerateResetCode}
      loading={resetCodeMutation.isPending}
    >
      Generate reset code
    </AppButton>
  </div>
</Show>
```
- `handleGenerateResetCode` calls `resetCodeMutation.mutate({ userId: member.userId })`, then on success:
```tsx
DrawerService.showCustomModal('Reset code generated', () => (
  <div className="space-y-4 text-center">
    <p className="text-sm text-charcoal-700">Share this code with the staff member. It expires in 24 hours and will not be shown again.</p>
    <CopyToClipboard text={code}>
      {({ copy }) => (
        <button onClick={copy} className="mx-auto block font-mono text-3xl font-bold tracking-widest text-forest-900 hover:opacity-70 transition-opacity">
          {code}
        </button>
      )}
    </CopyToClipboard>
    <p className="text-xs text-charcoal-700/60">Click the code to copy it</p>
  </div>
));
```

**Frontend files to touch:**
- `packages/api/src/endpoints.ts`
- `apps/medcord-web/src/shared/constants/routes.ts` — add `RESET_PASSWORD_NEW`
- `apps/medcord-web/src/features/auth/api/use-forgot-password.ts` — **delete**
- `apps/medcord-web/src/features/auth/api/use-verify-reset-code.ts` — **create**
- `apps/medcord-web/src/features/auth/api/use-generate-reset-code.ts` — **create**
- `apps/medcord-web/src/features/auth/api/use-reset-password.ts` — update payload shape
- `apps/medcord-web/src/features/auth/features/forgot-password/screen/forgot-password-screen.tsx` — **replace**
- `apps/medcord-web/src/features/auth/features/reset-password/screen/reset-password-screen.tsx` — **delete**
- `apps/medcord-web/src/features/auth/features/reset-password/screen/enter-code-screen.tsx` — **create**
- `apps/medcord-web/src/features/auth/features/reset-password/screen/new-password-screen.tsx` — **create**
- `apps/medcord-web/src/app.routes.tsx` — update route registrations
- `apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-actions.tsx` — add generate-code button

**Frontend quality gate:** `pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 2 — Lab Result Sign-Off

### Context
- Lab order state machine: `awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released`
- The `advance` endpoint has no role restriction on the final `result_ready → result_released` transition
- The lab order detail screen already exists at `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx`
- It already shows the result data, has an "Advance status" button, and a `RecordResultForm`
- The `useAdvanceLabStatus` mutation is already in `apps/medcord-web/src/features/labs/features/lab-orders/api/use-lab-orders.ts`
- `LabOrder` type (with `result?: LabResult`, `status: LabOrderStatus`, `orderedBy: string`, `resultReleasedBy?: string`) is at `apps/medcord-web/src/features/labs/shared/types/lab.ts`
- `useAuth()` from `@shared/hooks/use-auth.ts` gives `currentUser` with `.role`

### Part A — Backend: role guard on result release

**File:** `apps/main-backend/src/features/labs/lab.routes.ts`

In the `advance` route handler, add a role check before advancing. The transition from `result_ready` to `result_released` requires a prescriber role.

```ts
// In the advance route handler, after getting the order's current status:
const PRESCRIBER_ROLES = ['doctor', 'nurse_practitioner', 'physician_assistant'];

// Check currentStatus before advancing
const currentOrder = await labService.getOrder(hospitalId, orderId);
if (currentOrder.status === 'result_ready' && !PRESCRIBER_ROLES.includes(req.user!.role)) {
  throw new ForbiddenError('Only prescribers can release lab results');
}
```

Check the actual lab routes file first — the advance handler may already fetch the order. Avoid a double-fetch if possible by placing the check in `lab.service.ts` `advance()` method instead, where the current status is already known.

### Part B — Frontend: sign-off panel

The lab order detail screen needs a prominent "Release result" action when `status === 'result_ready'` that is only available to prescribers.

**What to add inside `LabOrderDetailScreen`** (in the result panel section that already exists):

After the existing result display (`order.result && ...`), add:

```tsx
// When result is ready and current user is a prescriber: show release button
// When result is ready and current user is NOT a prescriber: show "Awaiting sign-off" label
// When result is released: show released timestamp + who released it
```

**New part file:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx`

```tsx
interface ResultSignoffPanelProps {
  readonly order: LabOrder;
  readonly hospitalId: string;
}

// PRESCRIBER_ROLES must match backend
const PRESCRIBER_ROLES = ['doctor', 'nurse_practitioner', 'physician_assistant'];

export function ResultSignoffPanel({ order, hospitalId }: ResultSignoffPanelProps) {
  const { currentUser } = useAuth();
  const advanceMutation = useAdvanceLabStatus(hospitalId, order.patientId, order.id);

  const isResultReady = order.status === 'result_ready';
  const isReleased = order.status === 'result_released';
  const isPrescriber = PRESCRIBER_ROLES.includes(currentUser?.role ?? '');

  // Only render when status is result_ready or result_released
  if (!isResultReady && !isReleased) return null;

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
        Sign-off
      </p>

      <Show
        when={isReleased}
        fallback={
          // result_ready
          <Show
            when={isPrescriber}
            fallback={
              <p className="text-sm text-charcoal-700/60">
                Awaiting sign-off by an ordering provider.
              </p>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-charcoal-700">
                Result is ready. Release it to the patient chart and notify the team.
              </p>
              <AppButton
                variant="primary"
                onClick={() => {
                  advanceMutation.mutate(
                    {},
                    {
                      onSuccess: () => {
                        DrawerService.toast('Result released to patient chart.', { type: 'success' });
                      },
                    },
                  );
                }}
                loading={advanceMutation.isPending}
              >
                Release to chart
              </AppButton>
            </div>
          </Show>
        }
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            Released
          </span>
          <Show when={order.resultReleasedAt !== undefined}>
            <span className="text-sm text-charcoal-700">
              {new Date(order.resultReleasedAt ?? '').toLocaleString()}
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
}
```

**Wire into `lab-order-detail-screen.tsx`:**

Import `ResultSignoffPanel` and add it in the left column below the result panel card:
```tsx
<ResultSignoffPanel order={order} hospitalId={hospitalId} />
```

Remove the existing "Advance status" button when `status === 'result_ready'` — the sign-off panel replaces it for prescribers. Non-prescribers cannot advance from `result_ready` at all (backend will reject, and the button is hidden on frontend). The "Advance status" button stays for all other states.

The condition for showing the `AdvanceStatusForm` button becomes:
```ts
const canAdvance = order.status !== 'result_released' && order.status !== 'result_ready';
// result_ready is handled by ResultSignoffPanel
```

### Files to touch
- `apps/main-backend/src/features/labs/lab.routes.ts` (or `lab.service.ts`) — add prescriber guard
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx` — create
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx` — import and wire

### Quality gate
`pnpm nx run main-backend:build && pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 3 — Incoming Transfer Queue

### Context
- Backend fully built: `GET /api/v1/hospitals/:hospitalId/transfers/incoming` → `{ transfers: ITransfer[] }`
- `POST /api/v1/hospitals/:hospitalId/transfers/:transferId/accept` → `{ transfer }`
- `POST /api/v1/hospitals/:hospitalId/transfers/:transferId/decline` → `{ transfer }`
- EP constants already exist: `EP.HOSPITAL_TRANSFERS_INCOMING`, `EP.HOSPITAL_TRANSFER_ACCEPT`, `EP.HOSPITAL_TRANSFER_DECLINE`
- `ITransfer` shape: `{ id, patientId, fromHospitalId, toHospitalId, reason, department?, recordsPackage: { includeVitals, includeMedications, includeHistory, includeLabs, includeDocuments }, status: 'pending' | 'accepted' | 'declined', requestedBy, respondedBy?, respondedAt?, createdAt, updatedAt }`
- No ROUTES constant for transfers yet — needs to be added
- Sidebar currently: Dashboard, Staff, Patients, Labs, Assets, Review Queue, Search, Settings — no Transfers item

### Frontend type to add

In `apps/medcord-web/src/shared/types/` or alongside the patient types, add:

```ts
export interface PatientTransfer {
  readonly id: string;
  readonly patientId: string;
  readonly fromHospitalId: string;
  readonly toHospitalId: string;
  readonly reason: string;
  readonly department?: string;
  readonly recordsPackage: {
    readonly includeVitals: boolean;
    readonly includeMedications: boolean;
    readonly includeHistory: boolean;
    readonly includeLabs: boolean;
    readonly includeDocuments: boolean;
  };
  readonly status: 'pending' | 'accepted' | 'declined';
  readonly requestedBy: string;
  readonly respondedBy?: string;
  readonly respondedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### Step 1 — Add ROUTES constant

`apps/medcord-web/src/shared/constants/routes.ts`:
```ts
HOSPITAL_TRANSFERS: (slug: string) => `/h/${slug}/patients/transfers`,
```

### Step 2 — API hook (`apps/medcord-web/src/features/patients/features/patient-transfers/api/use-patient-transfers.ts`)

```ts
export function useIncomingTransfers(hospitalId: string) {
  return useQuery({
    queryKey: ['incoming-transfers', hospitalId],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.HOSPITAL_TRANSFERS_INCOMING(hospitalId))
        .json<{ data: { transfers: PatientTransfer[] } }>();
      return r.data.transfers;
    },
  });
}

export function useAcceptTransfer(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const r = await apiClient
        .post(EP.HOSPITAL_TRANSFER_ACCEPT(hospitalId, transferId))
        .json<{ data: { transfer: PatientTransfer } }>();
      return r.data.transfer;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['incoming-transfers', hospitalId] });
      DrawerService.toast('Transfer accepted. Patient added to your hospital.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDeclineTransfer(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const r = await apiClient
        .post(EP.HOSPITAL_TRANSFER_DECLINE(hospitalId, transferId))
        .json<{ data: { transfer: PatientTransfer } }>();
      return r.data.transfer;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['incoming-transfers', hospitalId] });
      DrawerService.toast('Transfer declined.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

### Step 3 — Transfer card part (`apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/transfer-card.tsx`)

```ts
interface TransferCardProps {
  readonly transfer: PatientTransfer;
  readonly hospitalId: string;
}
```

Shows:
- Patient ID (with `<CopyToClipboard>` from meemaw)
- From hospital ID
- Reason for transfer
- Department (if set — use `<Show>`)
- Records package: four pills/badges showing which items are included (Vitals, Medications, History, Labs, Documents) — green if `true`, grey if `false`
- Date requested (`new Date(transfer.createdAt).toLocaleDateString()`)
- Two action buttons: **"Accept"** (`AppButton variant="primary"`) and **"Decline"** (`AppButton variant="danger"`)
  - Accept: calls `acceptMutation.mutate(transfer.id)` immediately (no confirmation modal)
  - Decline: `DrawerService.showConfirmationModal('Decline this transfer?', 'The requesting hospital will be notified.', { destructive: true, onConfirm: () => declineMutation.mutate(transfer.id) })`
  - Both show `loading` state while the respective mutation is pending

### Step 4 — Transfers screen (`apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx`)

- `useAuth()` for `activeHospitalId`
- `useIncomingTransfers(hospitalId)`
- Page heading "Incoming Transfers", subtitle "Patients pending transfer to your hospital"
- `<Loadable>` with spinner + error
- `<Repeat>` over transfers with `<TransferCard>`
- Empty state: `<IconHeartPulse size={32} />` + `"No pending transfers."`

### Step 5 — Wire routes and sidebar

**`apps/medcord-web/src/app.routes.tsx`:**
- Lazy import `TransfersScreen`
- Add route: `<Route path="patients/transfers" element={<Lazy><TransfersScreen /></Lazy>} />`
- This goes inside the hospital shell route group, alongside `patients`, `labs`, etc.

**`apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx`:**
- The sidebar currently builds nav entries from a flat `buildNavEntries()` function using a raw `.map()` call — fix to use `<Repeat>` if it isn't already (check the current file)
- Add a "Transfers" entry after "Patients":
  ```ts
  { label: 'Transfers', Icon: IconArrowsLeftRight, to: ROUTES.HOSPITAL_TRANSFERS(slug) },
  ```
- Check `packages/ui/src/icons/index.ts` for the correct icon name before using — `IconArrowsLeftRight` or equivalent. If it doesn't exist, use `IconArrowLeft` (confirmed to exist) or `IconRefresh`. **Never guess an icon name.**

### Files to touch
- `apps/medcord-web/src/shared/types/patient.ts` (or nearest patient types file) — add `PatientTransfer`
- `apps/medcord-web/src/shared/constants/routes.ts` — add `HOSPITAL_TRANSFERS`
- `apps/medcord-web/src/features/patients/features/patient-transfers/api/use-patient-transfers.ts` — create
- `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx` — create
- `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/transfer-card.tsx` — create
- `apps/medcord-web/src/app.routes.tsx` — add route
- `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` — add Transfers nav entry

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 4 — Role Management Screen

### Context
- Backend fully built: `GET /api/v1/hospitals/:hospitalId/roles` → `{ roles: ICustomRole[] }` and `POST`/`PATCH`
- `ICustomRole`: `{ id, hospitalId, name, permissions: string[], createdAt, updatedAt }`
- EP constants: `EP.HOSPITAL_ROLES(hospitalId)`, `EP.HOSPITAL_ROLE(hospitalId, roleId)`
- No ROUTES constant for roles yet
- No frontend files for role management exist at all
- Staff directory sidebar: Dashboard, Staff, Patients, Labs, Assets, Review Queue, Search, Settings — no Roles item

### Step 1 — Add ROUTES constant

`apps/medcord-web/src/shared/constants/routes.ts`:
```ts
HOSPITAL_ROLES: (slug: string) => `/h/${slug}/staff/roles`,
```

### Step 2 — Frontend type

Add in a types file accessible to the feature:
```ts
export interface CustomRole {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### Step 3 — API hooks (`apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts`)

```ts
export function useRoles(hospitalId: string) {
  return useQuery({
    queryKey: ['roles', hospitalId],
    staleTime: 60_000,
    queryFn: async () => {
      const r = await apiClient.get(EP.HOSPITAL_ROLES(hospitalId)).json<{ data: { roles: CustomRole[] } }>();
      return r.data.roles;
    },
  });
}

export function useCreateRole(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; permissions: string[] }) => {
      const r = await apiClient
        .post(EP.HOSPITAL_ROLES(hospitalId), { json: payload })
        .json<{ data: { role: CustomRole } }>();
      return r.data.role;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role created.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useUpdateRole(hospitalId: string, roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; permissions?: string[] }) => {
      const r = await apiClient
        .patch(EP.HOSPITAL_ROLE(hospitalId, roleId), { json: payload })
        .json<{ data: { role: CustomRole } }>();
      return r.data.role;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

### Step 4 — Role form part (`apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx`)

Props:
```ts
interface RoleFormProps {
  readonly hospitalId: string;
  readonly role?: CustomRole;       // if provided = edit mode; if undefined = create mode
  readonly onDone: () => void;      // called on success to close the form
}
```

- Text input: Role name (required, min 1 char)
- Permissions: for MVP, a free-text textarea where the user types one permission per line (comma-separated or newline-separated). Parse on save. This avoids needing a permissions registry for now.
- "Save" `AppButton` — calls `useCreateRole` or `useUpdateRole` depending on mode
- "Cancel" `AppButton variant="ghost"` — calls `onDone`
- Show loading state while saving

### Step 5 — Roles screen (`apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`)

- `useAuth()` for `activeHospitalId` and `currentUser`
- `useParams()` for `slug`
- `useRoles(hospitalId)`
- State: `editingRole: CustomRole | null` and `showCreateForm: boolean`
- Page heading "Roles" with subtitle "Custom roles for this hospital"
- "New role" `AppButton` — only shown if `currentUser.role === 'super_admin'` — sets `showCreateForm = true`
- `<Show when={showCreateForm}>` → inline `<RoleForm hospitalId={hospitalId} onDone={() => setShowCreateForm(false)} />`
- Table of roles: Name, Permissions (count badge e.g. "3 permissions"), Created
- Each row: "Edit" `AppButton variant="ghost"` — sets `editingRole = role` — only shown if `currentUser.role === 'super_admin'`
- `<Show when={editingRole !== null}>` → inline `<RoleForm hospitalId={hospitalId} role={editingRole} onDone={() => setEditingRole(null)} />`
- Empty state: `<IconClipboard size={32} />` (or nearest available icon) + `"No custom roles yet."`
- `<Loadable>` with spinner + error
- `<Repeat>` for table rows

### Step 6 — Wire routes and sidebar

**`apps/medcord-web/src/app.routes.tsx`:**
- Lazy import `RolesScreen`
- Add route: `<Route path="staff/roles" element={<Lazy><RolesScreen /></Lazy>} />` inside hospital shell group

**`apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx`:**
- Add "Roles" link under the Staff nav entry — visible only to `super_admin` and `hospital_admin`
- Since the sidebar receives `modules` prop but not `currentUser.role`, you may need to either pass `userRole` as a new prop to `Sidebar`, or check the role inside the `buildNavEntries` function using `useAuth()` inside the sidebar component
- Simplest approach: call `useAuth()` inside `buildNavEntries` or at the top of `Sidebar` and filter accordingly

### Files to touch
- `apps/medcord-web/src/shared/constants/routes.ts` — add `HOSPITAL_ROLES`
- `apps/medcord-web/src/shared/types/` — add `CustomRole` type (pick an appropriate types file or create `staff.ts`)
- `apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts` — create
- `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx` — create
- `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx` — create
- `apps/medcord-web/src/app.routes.tsx` — add route
- `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` — add Roles entry (role-gated)

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Gap 5 — Hospital-Wide Audit Log Screen

### Context
- Backend: `GET /api/v1/hospitals/:hospitalId/audit-log` → `{ items, total, page, limit, totalPages }` (paginated)
- Query params: `action` (optional, one of the AuditAction string values), `actorId` (optional), `page`, `limit` (max 100, default 20)
- No EP constant yet — must add one
- `IAuditLog`: `{ id, hospitalId, actorId, actorRole?, action: AuditAction, resourceType, resourceId, meta?, ipAddress?, userAgent?, createdAt }`
- Hospital settings screen at `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx` uses tabs defined in a `TABS` constant — add "Audit Log" there
- Currently 6 tabs: general, branding, modules, domain, usage, danger

### Step 1 — Add EP constant

`packages/api/src/endpoints.ts`:
```ts
HOSPITAL_AUDIT_LOG: (hospitalId: string) => `api/v1/hospitals/${hospitalId}/audit-log`,
```

### Step 2 — Frontend types

Add to a shared types file or alongside the audit log feature:
```ts
export type AuditAction =
  | 'patient.created'
  | 'patient.updated'
  | 'patient.admitted'
  | 'patient.discharged'
  | 'patient.transferred'
  | 'emr.accessed'
  | 'emr.break_glass'
  | 'lab.created'
  | 'lab.result_recorded'
  | 'lab.result_released'
  | 'member.invited'
  | 'member.suspended'
  | 'member.removed'
  | 'hospital.updated'
  | 'asset.created'
  | 'asset.status_changed'
  | 'review.acted';

export interface AuditLog {
  readonly id: string;
  readonly hospitalId: string;
  readonly actorId: string;
  readonly actorRole?: string;
  readonly action: AuditAction;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly meta?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: string;
}

export interface AuditLogResult {
  readonly items: readonly AuditLog[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

### Step 3 — API hook (`apps/medcord-web/src/features/workspace/features/audit-log/api/use-audit-log.ts`)

```ts
interface AuditFilters {
  readonly action?: AuditAction;
  readonly actorId?: string;
  readonly page: number;
}

export function useAuditLog(hospitalId: string, filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit-log', hospitalId, filters],
    staleTime: 60_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(filters.page),
        limit: '50',
      };
      if (filters.action) searchParams['action'] = filters.action;
      if (filters.actorId?.trim()) searchParams['actorId'] = filters.actorId.trim();
      const r = await apiClient
        .get(EP.HOSPITAL_AUDIT_LOG(hospitalId), { searchParams })
        .json<{ data: AuditLogResult }>();
      return r.data;
    },
  });
}
```

### Step 4 — Audit log tab part (`apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-audit-log.tsx`)

This is a new tab panel inside the hospital settings screen, matching the style of existing tab panels (`settings-general.tsx`, `settings-usage.tsx`, etc.).

Props:
```ts
interface SettingsAuditLogProps {
  readonly hospitalId: string;
}
```

Content:
- Filters row: action `<select>` (options: "All actions" + one option per `AuditAction`) + actor ID text input (debounced 300ms)
- `useAuditLog(hospitalId, filters)`
- `<Loadable>` with spinner + error
- Table columns: Action (formatted label — use a `AUDIT_ACTION_LABEL` map), Resource Type, Resource ID, Actor ID, Role, IP, Date/Time
- Pagination: Prev/Next buttons, "Page X of Y" label — same pattern as Hospital List in admin-web
- Empty state: "No audit events found."
- `<Repeat>` for table rows

**Action label map example:**
```ts
const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  'patient.created': 'Patient created',
  'patient.updated': 'Patient updated',
  'patient.admitted': 'Patient admitted',
  'patient.discharged': 'Patient discharged',
  'patient.transferred': 'Patient transferred',
  'emr.accessed': 'EMR accessed',
  'emr.break_glass': 'Break-glass access',
  'lab.created': 'Lab order created',
  'lab.result_recorded': 'Lab result recorded',
  'lab.result_released': 'Lab result released',
  'member.invited': 'Member invited',
  'member.suspended': 'Member suspended',
  'member.removed': 'Member removed',
  'hospital.updated': 'Hospital updated',
  'asset.created': 'Asset created',
  'asset.status_changed': 'Asset status changed',
  'review.acted': 'Review acted on',
};
```

### Step 5 — Wire into hospital settings screen

**`apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx`:**

1. Add `'audit'` to the `SettingsTab` type
2. Add to `TABS` array before the danger zone tab:
   ```ts
   { id: 'audit', label: 'Audit Log' },
   ```
3. Import `SettingsAuditLog` and add a `<Case when="audit">` inside the `<Switch>` that renders the tab content, passing `hospital.id` as `hospitalId`
4. The hospital object already comes from `useHospitalBySlug` which returns the full hospital shape

### Files to touch
- `packages/api/src/endpoints.ts` — add `HOSPITAL_AUDIT_LOG`
- `apps/medcord-web/src/shared/types/` — add `AuditLog`, `AuditAction`, `AuditLogResult` types
- `apps/medcord-web/src/features/workspace/features/audit-log/api/use-audit-log.ts` — create
- `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-audit-log.tsx` — create
- `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx` — add tab + wire

### Quality gate
`pnpm nx run medcord-web:typecheck && pnpm nx run medcord-web:lint && pnpm nx run medcord-web:build`

---

## Summary — Files Created / Modified

### New files
| File | Gap |
|---|---|
| `apps/medcord-web/src/features/auth/api/use-verify-reset-code.ts` | 1 |
| `apps/medcord-web/src/features/auth/api/use-generate-reset-code.ts` | 1 |
| `apps/medcord-web/src/features/auth/features/reset-password/screen/enter-code-screen.tsx` | 1 |
| `apps/medcord-web/src/features/auth/features/reset-password/screen/new-password-screen.tsx` | 1 |
| `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx` | 2 |
| `apps/medcord-web/src/features/patients/features/patient-transfers/api/use-patient-transfers.ts` | 3 |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx` | 3 |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/transfer-card.tsx` | 3 |
| `apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts` | 4 |
| `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx` | 4 |
| `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx` | 4 |
| `apps/medcord-web/src/features/workspace/features/audit-log/api/use-audit-log.ts` | 5 |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-audit-log.tsx` | 5 |

### Deleted files
| File | Reason | Gap |
|---|---|---|
| `apps/medcord-web/src/features/auth/api/use-forgot-password.ts` | Replaced by new flow | 1 |
| `apps/medcord-web/src/features/auth/features/reset-password/screen/reset-password-screen.tsx` | Replaced by enter-code + new-password screens | 1 |

### Modified files
| File | Change | Gap |
|---|---|---|
| `apps/main-backend/src/features/auth/auth.model.ts` | Add `passwordResetCode` + `passwordResetCodeExpiresAt` fields | 1 |
| `apps/main-backend/src/features/auth/auth.schema.ts` | Add GenerateResetCodeBody + VerifyResetCodeBody + ResetPasswordBody | 1 |
| `apps/main-backend/src/features/auth/auth.repo.ts` | Add `findByResetCode` | 1 |
| `apps/main-backend/src/features/auth/auth.service.ts` | Add `generateResetCode` + `verifyResetCode` + `resetPassword` | 1 |
| `apps/main-backend/src/features/auth/auth.routes.ts` | Register 3 new routes | 1 |
| `apps/main-backend/src/features/staff/staff.repo.ts` | Add `findMembershipsByUserId` if missing | 1 |
| `packages/api/src/endpoints.ts` | Remove `AUTH_FORGOT_PASSWORD`, add `AUTH_GENERATE_RESET_CODE` + `AUTH_VERIFY_RESET_CODE`, add `HOSPITAL_AUDIT_LOG` | 1, 5 |
| `apps/medcord-web/src/shared/constants/routes.ts` | Add `RESET_PASSWORD_NEW` + `HOSPITAL_TRANSFERS` + `HOSPITAL_ROLES` | 1, 3, 4 |
| `apps/medcord-web/src/features/auth/api/use-reset-password.ts` | Update payload: `token` → `code`, `newPassword` → `password` | 1 |
| `apps/medcord-web/src/features/auth/features/forgot-password/screen/forgot-password-screen.tsx` | Replace with info screen + "I have a code" CTA | 1 |
| `apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-actions.tsx` | Add "Generate reset code" button (super_admin only) | 1 |
| `apps/main-backend/src/features/labs/lab.routes.ts` (or `lab.service.ts`) | Add prescriber guard on result_released transition | 2 |
| `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx` | Wire ResultSignoffPanel, update canAdvance logic | 2 |
| `apps/medcord-web/src/shared/types/` | Add PatientTransfer, CustomRole, AuditLog types | 3, 4, 5 |
| `apps/medcord-web/src/app.routes.tsx` | Update reset-password routes, add transfers + roles + audit routes | 1, 3, 4 |
| `apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` | Add Transfers + Roles nav entries | 3, 4 |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx` | Add Audit Log tab | 5 |
