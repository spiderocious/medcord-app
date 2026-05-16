# Medcord Admin Web — Frontend Build Plan

> This document governs all work done in `apps/admin-web/`. Read it alongside
> `docs/rules-lessons.md` — every rule there applies here too. This plan adds
> admin-specific decisions on top.

---

## App context

| | |
|---|---|
| **App** | `apps/admin-web/` |
| **Port** | 5174 (`pnpm nx run admin-web:dev`) |
| **Backend base** | `http://localhost:8085` |
| **Admin API prefix** | `/admin/*` (not `/api/v1/*`) |
| **Auth model** | Same JWT as medcord-web (`POST /api/v1/auth/login`), but user must have `isAdmin: true`. No hospital context. |
| **Audience** | Medcord platform operators, not hospital staff |

---

## Rules — same as medcord-web, no exceptions

### meemaw — zero exceptions

| Banned | Required |
|---|---|
| `{cond && <X />}` | `<Show when={cond}><X /></Show>` |
| `{cond ? <X /> : <Y />}` | `<Show when={cond} fallback={<Y />}><X /></Show>` |
| `{items.map(...)}` | `<Repeat each={items as T[]}>{(item: T) => ...}</Repeat>` |
| `{isLoading ? ... : error ? ... : ...}` | `<Loadable loading error={error ?? undefined} loadingComponent errorComponent>` |

`error` prop on `<Loadable>` does NOT accept `null` — always `error ?? undefined`.
`<Repeat each>` requires a mutable array type — cast readonly arrays: `as T[]`.

### Design system (`@medcord/ui`)

Only two components exist: `AppButton` and `AppText`. Use them everywhere — no raw `<button>`, `<h1>`, `<p>` for primary actions or semantic text. `DrawerService` for all modals, confirmations, input modals, toasts.

`AppButton` props: `variant` (`primary` | `secondary` | `ghost` | `danger`), `loading`, `leadingIcon` (JSX element, e.g. `<IconPlus size={14} />`), `trailingIcon`.

`AppText` variants: `display-1`, `display-2`, `heading-1`, `heading-2`, `heading-3`, `body`, `body-sm`, `caption`.

### Icons — only use confirmed names

Import from `@icons` (maps to `packages/ui/src/icons/index.ts`). Check before using. Common traps:

| Wrong | Correct |
|---|---|
| `IconX` | `IconClose` |
| `IconAlertTriangle` | `IconAlert` |
| `IconTrash2` | `IconTrash` |
| `IconEdit2` | `IconEdit` |
| `IconPhone` | does not exist |
| `IconMail` | `IconSend` |

**Rule**: before using any icon name, grep `packages/ui/src/icons/index.ts` to confirm it exists.

### API client

```ts
// GET
const r = await apiClient.get('admin/stats').json<{ data: { stats: PlatformStats } }>();
return r.data.stats;

// POST/PATCH with body
const r = await apiClient.patch(`admin/hospitals/${id}`, { json: payload }).json<...>();

// 204 — drop .json() entirely
await apiClient.post(`admin/users/${id}/disable`);

// Error handling — never hardcode
onError: (err: unknown) => {
  DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
},
```

Note: admin endpoints are at `admin/...` (no `api/v1/` prefix) — confirmed from backend `app.use('/admin', router)`.

### Tailwind tokens

`forest-900`, `cream-50`, `charcoal-900`, `charcoal-700` — not CSS variables.

### Standard input class

```
mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed
```

### TypeScript

No `any`. Named exports only. All props interfaces declared in the same file with `readonly` fields.

### Quality gate (run after every screen)

```bash
pnpm nx run admin-web:typecheck
pnpm nx run admin-web:lint
pnpm nx run admin-web:build
```

All three must be zero-error before a screen is declared done.

---

## EP constants — add to `packages/api/src/endpoints.ts`

All admin endpoints must be added to the shared `EP` object in `packages/api/src/endpoints.ts`, following the same pattern as every other feature. Add this block at the end of the file before `} as const`:

```ts
// Admin — mounted at /admin (not /api/v1/)
ADMIN_STATS: 'admin/stats',
ADMIN_HOSPITALS: 'admin/hospitals',
ADMIN_HOSPITAL: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_HOSPITAL_UPDATE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_HOSPITAL_DELETE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_USERS: 'admin/users',
ADMIN_USER: (userId: string) => `admin/users/${userId}`,
ADMIN_USER_UPDATE: (userId: string) => `admin/users/${userId}`,
ADMIN_USER_DISABLE: (userId: string) => `admin/users/${userId}/disable`,
```

These are used in `apps/admin-web/` API hooks via `import { EP } from '@medcord/api'`.

---

## What can be borrowed directly from medcord-web

The following can be **copied verbatim or adapted** from `apps/medcord-web/src/`:

| Borrow from medcord-web | Use in admin-web | Notes |
|---|---|---|
| `shared/helpers/token-storage.ts` | Exact copy | uses `@medcord/core` TOKEN_KEYS, no app-specific logic |
| `features/auth/shared/parts/auth-layout.tsx` | Adapt | change `ROUTES.LOGIN` link to `ADMIN_ROUTES.LOGIN`, change logo subtitle to "Admin" |
| `features/auth/features/login/parts/login-form.tsx` | Adapt | remove "Forgot password?" link, change placeholder to `admin@medcord.com`, add caption "Platform admin access only." |
| `features/auth/api/use-me.ts` | Adapt | return type must be `AdminUser` not medcord-web's `User`; import from local `@shared/types/admin.ts` |
| Badge/pill styling patterns | Copy STATUS/PRIORITY/TYPE badge class string maps directly | |
| Loading spinner pattern | `<div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />` | |
| Table structure + `thead`/`tbody` pattern | Copy the `min-w-full divide-y` table skeleton exactly | |
| `UserMenu` pattern | Adapt | remove "My Hospitals" and "Security" links; show only user name/email + Sign out |
| `UserBootstrap` pattern | Adapt | after fetching `/me`, check `user.isAdmin === true`; if false, clear tokens + redirect to `ADMIN_ROUTES.LOGIN` |

Do NOT borrow: `AuthProvider` (admin has a simpler context — no `activeHospitalId`), `AuthGuard`, `HospitalGuard`, `HospitalShell`, `Sidebar` nav-items (admin has its own shell), anything hospital-scoped.

---

## Architecture

```
apps/admin-web/src/
├── main.tsx                         (exists — configures apiClient)
├── app.tsx                          (exists)
├── app.provider.tsx                 (exists — add AuthProvider, UserBootstrap, ModalHost, ToastHost)
├── app.routes.tsx                   (exists — replace stub)
├── styles.css                       (exists)
│
├── shared/
│   ├── types/
│   │   └── admin.ts                 (PlatformStats, AdminHospital, AdminUser, MembershipSummary, AdminPaginatedResult)
│   ├── constants/
│   │   └── routes.ts                (ADMIN_ROUTES — local, not @medcord/core)
│   ├── helpers/
│   │   └── token-storage.ts        (copy from medcord-web — exact)
│   ├── hooks/
│   │   └── use-auth.ts              (thin wrapper around useAdminAuthContext)
│   ├── providers/
│   │   ├── auth-provider.tsx        (AdminAuthProvider — simpler than medcord-web, no activeHospitalId)
│   │   └── user-bootstrap.tsx      (fetches /me on mount, checks isAdmin, redirects if not)
│   ├── guards/
│   │   └── admin-guard.tsx          (token-only check — isAdmin redirect handled in UserBootstrap)
│   └── widgets/
│       └── admin-shell/
│           ├── admin-shell.tsx
│           └── parts/
│               ├── sidebar.tsx
│               ├── topbar.tsx
│               └── user-menu.tsx
│
└── features/
    ├── auth/
    │   ├── api/
    │   │   └── use-admin-auth.ts    (useAdminLogin, useAdminMe)
    │   └── screen/
    │       └── admin-login-screen.tsx
    ├── dashboard/
    │   ├── api/
    │   │   └── use-platform-stats.ts
    │   └── screen/
    │       └── admin-dashboard-screen.tsx
    ├── hospitals/
    │   ├── api/
    │   │   └── use-admin-hospitals.ts
    │   └── screen/
    │       ├── hospital-list-screen.tsx
    │       ├── hospital-detail-screen.tsx
    │       └── parts/
    │           └── hospital-modules-form.tsx
    └── users/
        ├── api/
        │   └── use-admin-users.ts
        └── screen/
            ├── user-list-screen.tsx
            ├── user-detail-screen.tsx
            └── parts/
                └── user-flags-form.tsx
```

---

## Routes

Admin routes live in `apps/admin-web/src/shared/constants/routes.ts` — **do not use `@medcord/core`'s ROUTES** (those are stale/wrong). Define a local `ADMIN_ROUTES` object:

```ts
export const ADMIN_ROUTES = {
  LOGIN:           '/admin/login',
  DASHBOARD:       '/admin',
  HOSPITALS:       '/admin/hospitals',
  HOSPITAL_DETAIL: (id: string) => `/admin/hospitals/${id}`,
  USERS:           '/admin/users',
  USER_DETAIL:     (id: string) => `/admin/users/${id}`,
} as const;
```

---

## Backend API reference (verified from source)

### Response envelope

All admin endpoints use the same `ResponseUtil` as the main API:

| Method | HTTP | Body | Frontend access |
|---|---|---|---|
| `ResponseUtil.ok(res, data)` | 200 | `{ data }` | `r.data` |
| `ResponseUtil.created(res, data)` | 201 | `{ data }` | `r.data` |
| `ResponseUtil.noContent(res)` | 204 | none | no `.json()` |

### Admin endpoints — verified from backend source

**Important**: these were verified by reading `admin.routes.ts` and `admin.service.ts` directly, not just the API docs.

---

#### `GET admin/stats`

Route: `ResponseUtil.ok(res, { stats })` where `stats` is the stats object.

```ts
// queryFn
const r = await apiClient.get(EP.ADMIN_STATS).json<{ data: { stats: PlatformStats } }>();
return r.data.stats;
```

---

#### `GET admin/hospitals`

Route: `ResponseUtil.ok(res, result)` where `result` is `PaginatedResult<IHospital>` = `{ items, total, page, limit, totalPages }` (flat — no extra wrapper key).

```ts
// queryFn
const r = await apiClient.get(EP.ADMIN_HOSPITALS, { searchParams }).json<{ data: AdminPaginatedResult<AdminHospital> }>();
return r.data; // → { items, total, page, limit, totalPages }
```

Query params: `q` (string), `isArchived` (`'true'` | `'false'` — string, URLSearchParams), `page` (number), `limit` (number, default 20).

**Gotcha**: `isArchived` is sent as a string `'true'`/`'false'` in query params (URLSearchParams always sends strings). The backend transforms it to boolean via zod. Omit the param entirely (don't send empty string) when the filter is "all".

---

#### `GET admin/hospitals/:hospitalId`

Route: `ResponseUtil.ok(res, data)` where `data = { hospital, memberCount }`.

```ts
// queryFn
const r = await apiClient.get(EP.ADMIN_HOSPITAL(hospitalId)).json<{ data: { hospital: AdminHospital; memberCount: number } }>();
return r.data; // → { hospital, memberCount }
```

---

#### `PATCH admin/hospitals/:hospitalId`

Route: `ResponseUtil.ok(res, { hospital })` — route wraps the updated hospital.

```ts
// mutationFn
const r = await apiClient.patch(EP.ADMIN_HOSPITAL_UPDATE(hospitalId), { json: payload }).json<{ data: { hospital: AdminHospital } }>();
return r.data.hospital;
```

Body (all optional): `{ isArchived?: boolean, modules?: { emr?: boolean, labs?: boolean, assets?: boolean, onlineConsultation?: boolean } }`

---

#### `DELETE admin/hospitals/:hospitalId`

Route: `ResponseUtil.noContent(res)` — 204, no body.

```ts
// mutationFn — no .json()
await apiClient.delete(EP.ADMIN_HOSPITAL_DELETE(hospitalId));
```

---

#### `GET admin/users`

Route: `ResponseUtil.ok(res, result)` where `result` is `PaginatedResult<IUser>` = flat `{ items, total, page, limit, totalPages }`.

```ts
// queryFn
const r = await apiClient.get(EP.ADMIN_USERS, { searchParams }).json<{ data: AdminPaginatedResult<AdminUser> }>();
return r.data; // → { items, total, page, limit, totalPages }
```

Query params: `q` (string), `isAdmin` (`'true'` | `'false'` — string), `page`, `limit`.

---

#### `GET admin/users/:userId`

Route: `ResponseUtil.ok(res, data)` where `data = { user, memberships }`.

```ts
// queryFn
const r = await apiClient.get(EP.ADMIN_USER(userId)).json<{ data: { user: AdminUser; memberships: MembershipSummary[] } }>();
return r.data; // → { user, memberships }
```

---

#### `PATCH admin/users/:userId`

Route: `ResponseUtil.ok(res, { user })` — route wraps the updated user.

```ts
// mutationFn
const r = await apiClient.patch(EP.ADMIN_USER_UPDATE(userId), { json: payload }).json<{ data: { user: AdminUser } }>();
return r.data.user;
```

Body (all optional): `{ isAdmin?: boolean, isEmailVerified?: boolean }`

---

#### `POST admin/users/:userId/disable`

Route: `ResponseUtil.noContent(res)` — 204, no body.

```ts
// mutationFn — no .json()
await apiClient.post(EP.ADMIN_USER_DISABLE(userId));
```

---

### Critical gotchas

1. **Admin base path is `admin/...` not `api/v1/admin/...`** — the backend registers it as `app.use('/admin', router)`.
2. **DELETE hospital is 204** — no `.json()`.
3. **POST disable user is 204** — no `.json()`.
4. **`isArchived` and `isAdmin` filters are string `'true'`/`'false'` in query params** but boolean in PATCH body — URLSearchParams always sends strings. Do not send the param at all when the filter is "All".
5. **`isAdmin` is NOT in the login response.** The login endpoint returns `{ user: Pick<User, 'id' | 'email' | 'name'>, tokens }`. The `isAdmin` field is only available after calling `GET /api/v1/auth/me`. The isAdmin check **must happen on the /me response**, never on the login response.
6. **No self-service admin promotion** — there is no endpoint to make yourself an admin. The first admin is seeded in the DB.

---

## Shared types

```ts
// apps/admin-web/src/shared/types/admin.ts

export interface PlatformStats {
  readonly hospitals: {
    readonly total: number;
    readonly active: number;
    readonly archived: number;
  };
  readonly users: {
    readonly total: number;
    readonly admins: number;
    readonly twoFactorEnabled: number;
  };
  readonly recentSignups: {
    readonly last7d: number;
    readonly last30d: number;
  };
  readonly recentHospitals: {
    readonly last7d: number;
    readonly last30d: number;
  };
}

export type HospitalModules = {
  readonly emr: boolean;
  readonly labs: boolean;
  readonly assets: boolean;
  readonly onlineConsultation: boolean;
};

export interface AdminHospital {
  readonly id: string;
  readonly name: string;
  readonly type: 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';
  readonly location: string;
  readonly contact?: { readonly phone?: string; readonly email?: string; readonly address?: string };
  readonly logoKey?: string;
  readonly subdomain: string;
  readonly customDomain?: string;
  readonly customDomainVerified: boolean;
  readonly modules: HospitalModules;
  readonly plan: string;
  readonly ownerId: string;
  readonly timezone: string;
  readonly locale: string;
  readonly isArchived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// AdminUser — distinct from medcord-web's User type. Includes isAdmin.
export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly photoKey?: string;
  readonly isEmailVerified: boolean;
  readonly isAdmin: boolean;
  readonly twoFactorEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MembershipSummary {
  readonly id: string;
  readonly hospitalId: string;
  readonly userId: string;
  readonly role: string;
  readonly status: string;
  readonly joinedAt: string;
}

export interface AdminPaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

---

## Auth & guards

### Critical: isAdmin is on /me, not on /login

The login response shape is `{ data: { user: { id, email, name }, tokens: { accessToken, refreshToken } } }`. **`isAdmin` is not present.** After storing tokens, the app must call `GET /api/v1/auth/me` to get the full `AdminUser` including `isAdmin`. The isAdmin check happens in `UserBootstrap` when the `/me` response arrives.

### AdminAuthProvider (`shared/providers/auth-provider.tsx`)

Simpler than medcord-web — no `activeHospitalId`, no hospital context. Holds:

```ts
interface AdminAuthContextValue {
  readonly user: AdminUser | null;
  readonly isAuthenticated: boolean;
  readonly setUser: (user: AdminUser) => void;
  readonly setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  readonly logout: () => void;
}
```

`logout()` — clears tokens via `tokenStorage.clearTokens()`, sets user to null, redirects to `ADMIN_ROUTES.LOGIN` via `window.location.href`.

Context exposed via `useAdminAuth()` at `shared/hooks/use-auth.ts`.

### UserBootstrap (`shared/providers/user-bootstrap.tsx`)

Calls `useAdminMe()` on mount (enabled only when token exists). When `/me` data arrives:
- If `user.isAdmin === true` → call `setUser(user)` → allow through
- If `user.isAdmin === false` → call `tokenStorage.clearTokens()` → `window.location.href = ADMIN_ROUTES.LOGIN`

This is the **one and only place** the isAdmin redirect happens. `AdminGuard` does NOT do the isAdmin check — it only checks for a token.

```tsx
// shared/providers/user-bootstrap.tsx
export function UserBootstrap({ children }: { readonly children: ReactNode }) {
  const { user, setUser } = useAdminAuth();
  const { data } = useAdminMe();

  useEffect(() => {
    if (data === undefined) return;
    if (data.isAdmin === false) {
      tokenStorage.clearTokens();
      window.location.href = ADMIN_ROUTES.LOGIN;
      return;
    }
    if (user === null) {
      setUser(data);
    }
  }, [data, user, setUser]);

  return <>{children}</>;
}
```

### AdminGuard (`shared/guards/admin-guard.tsx`)

Checks token only. isAdmin redirect is handled in `UserBootstrap` — do NOT duplicate it here.

```tsx
export function AdminGuard({ children }: { readonly children: ReactNode }) {
  const hasToken = tokenStorage.getAccess() !== null;
  if (!hasToken) return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  return <>{children}</>;
}
```

---

## `app.provider.tsx` — what to add

The current `app.provider.tsx` is missing `AuthProvider`, `UserBootstrap`, `ModalHost`, and `ToastHost`. The final version must be:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ModalHost, ToastHost } from '@medcord/ui';
import { AuthProvider } from '@shared/providers/auth-provider.tsx';
import { UserBootstrap } from '@shared/providers/user-bootstrap.tsx';

export function AppProviders({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UserBootstrap>{children}</UserBootstrap>
        </AuthProvider>
        <ModalHost />
        <ToastHost />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

`<ModalHost />` and `<ToastHost />` are required for `DrawerService.toast()` and `DrawerService.showConfirmationModal()` to work. Without them, all modals and toasts silently fail.

---

## Auth API hooks (`features/auth/api/use-admin-auth.ts`)

Two hooks in one file.

### `useAdminLogin`

Uses `EP.AUTH_LOGIN` (`api/v1/auth/login`) — same endpoint as medcord-web. Mutation only — no toast on success, error shown inline on the login screen.

```ts
// Login response shape: { data: { user: { id, email, name }, tokens: { accessToken, refreshToken } } }
// Note: isAdmin is NOT in this response. Only id/email/name are present.
export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const r = await apiClient
        .post(EP.AUTH_LOGIN, { json: payload })
        .json<{ data: { user: { id: string; email: string; name: string }; tokens: { accessToken: string; refreshToken: string } } }>();
      return r.data;
    },
  });
}
```

Login screen flow after `onSuccess`:
1. Call `setTokens(data.tokens)` to store tokens
2. Do NOT check `isAdmin` here — `isAdmin` is not in the response
3. Navigate to `ADMIN_ROUTES.DASHBOARD`
4. `UserBootstrap` will call `/me`, get `AdminUser`, check `isAdmin`, and redirect back to login if false

If the API returns 401 or 403: surface `err instanceof Error ? err.message : 'Something went wrong.'` as inline error on the form (not a toast).

### `useAdminMe`

Uses `EP.AUTH_ME` (`api/v1/auth/me`) — same endpoint as medcord-web. Returns `AdminUser` (includes `isAdmin`).

```ts
export function useAdminMe() {
  const hasToken = tokenStorage.getAccess() !== null;
  return useQuery({
    queryKey: ['admin', 'me'],
    enabled: hasToken,
    queryFn: async () => {
      const r = await apiClient.get(EP.AUTH_ME).json<{ data: { user: AdminUser } }>();
      return r.data.user; // AdminUser — includes isAdmin
    },
  });
}
```

---

## Admin Shell

`shared/widgets/admin-shell/admin-shell.tsx` — wraps all authenticated screens.

```
┌─────────────────────────────────────────┐
│ Topbar: "Medcord Admin"  [user menu]    │
├──────────┬──────────────────────────────┤
│ Sidebar  │  <Outlet />                  │
│          │                              │
│ Dashboard│                              │
│ Hospitals│                              │
│ Users    │                              │
└──────────┴──────────────────────────────┘
```

### Sidebar (`parts/sidebar.tsx`)

3 nav items — no module gating:

```ts
const NAV_ENTRIES = [
  { label: 'Dashboard', Icon: IconHome,     to: ADMIN_ROUTES.DASHBOARD },
  { label: 'Hospitals', Icon: IconBuilding, to: ADMIN_ROUTES.HOSPITALS },
  { label: 'Users',     Icon: IconUsers,    to: ADMIN_ROUTES.USERS     },
] as const;
```

Render with `<Repeat>` (not `.map()`):

```tsx
<Repeat each={NAV_ENTRIES as NavEntry[]}>
  {(entry: NavEntry) => (
    <li key={entry.to}>
      <NavLink to={entry.to} end={entry.to === ADMIN_ROUTES.DASHBOARD}
        className={({ isActive }) => [LINK_BASE, isActive ? LINK_ACTIVE : ''].join(' ')}>
        <entry.Icon size={16} />
        <span>{entry.label}</span>
      </NavLink>
    </li>
  )}
</Repeat>
```

Active state: `bg-forest-900/10 text-forest-900`. Default: `text-charcoal-700 hover:bg-forest-900/5 hover:text-forest-900`.

Wordmark in sidebar header: `"Medcord Admin"` — bold, `text-forest-900`.

### Topbar (`parts/topbar.tsx`)

"Medcord Admin" wordmark on left. `UserMenu` on right. No search, no bell — not needed for admin.

### UserMenu (`parts/user-menu.tsx`)

Adapted from medcord-web's `UserMenu`. Shows initials avatar, user name dropdown. Inside dropdown: user name + email block, then Sign out button only. No "My Hospitals" or "Security" links.

```tsx
// Shows only:
// - user.name + user.email (display block)
// - Sign out button (calls logout())
```

---

## Screens — detailed spec

---

### Screen 1 — Admin Login

**Route:** `/admin/login`
**File:** `apps/admin-web/src/features/auth/screen/admin-login-screen.tsx`
**Layout:** `AuthLayout` (adapted from medcord-web)

**Adapted `AuthLayout`:**
- Logo link → `ADMIN_ROUTES.LOGIN`
- Logo text: `"Medcord"` with caption `"Admin"` below
- No footer link (no register/forgot password for admin)

**Adapted `AdminLoginForm`:**
- Remove "Forgot password?" link entirely
- Change placeholder to `admin@medcord.com`
- Add caption below the heading: `"Platform admin access only."`
- On error: show inline `<p role="alert">` with `err.message` — no toast

**Flow:**
1. User submits email + password
2. Call `useAdminLogin` mutation
3. On success: call `setTokens(data.tokens)` → navigate to `ADMIN_ROUTES.DASHBOARD`
   - Do NOT check `isAdmin` here — `UserBootstrap` handles it via `/me`
4. On error: show `err instanceof Error ? err.message : 'Something went wrong.'` as inline form error
5. If already authenticated (token exists + user in context + `user.isAdmin`): redirect to dashboard on mount

---

### Screen 2 — Dashboard

**Route:** `/admin`
**File:** `apps/admin-web/src/features/dashboard/screen/admin-dashboard-screen.tsx`
**Layout:** AdminShell

**API hook:** `usePlatformStats` in `features/dashboard/api/use-platform-stats.ts`

```ts
// GET admin/stats
// Route: ResponseUtil.ok(res, { stats })
// queryFn: r.data.stats
// queryKey: ['admin-stats']
// staleTime: 60_000, refetchOnWindowFocus: true
export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await apiClient.get(EP.ADMIN_STATS).json<{ data: { stats: PlatformStats } }>();
      return r.data.stats;
    },
  });
}
```

**Content:**

Stats grid — 6 tiles, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` gap-4:

| Tile | Value | Label |
|---|---|---|
| Total hospitals | `stats.hospitals.total` | "Hospitals" |
| Active hospitals | `stats.hospitals.active` | "Active" |
| Archived hospitals | `stats.hospitals.archived` | "Archived" |
| Total users | `stats.users.total` | "Users" |
| Platform admins | `stats.users.admins` | "Admins" |
| 2FA enabled | `stats.users.twoFactorEnabled` | "2FA enabled" |

Below the grid, two "recent activity" cards side by side (`grid-cols-2`):
- "New signups" — rows: "Last 7 days: X", "Last 30 days: X"
- "New hospitals" — rows: "Last 7 days: X", "Last 30 days: X"

Wrap entire content in `<Loadable>` with spinner + error.

---

### Screen 3 — Hospital List

**Route:** `/admin/hospitals`
**File:** `apps/admin-web/src/features/hospitals/screen/hospital-list-screen.tsx`
**Layout:** AdminShell

**API hook:** `useAdminHospitals` in `features/hospitals/api/use-admin-hospitals.ts`

```ts
// GET admin/hospitals?q=&isArchived=&page=&limit=20
// Route: ResponseUtil.ok(res, result) where result is PaginatedResult (flat)
// queryFn: r.data  (gives { items, total, page, limit, totalPages })
// queryKey: ['admin-hospitals', filters]
// staleTime: 30_000

interface HospitalsFilters {
  readonly q: string;
  readonly isArchived: 'all' | 'true' | 'false';
  readonly page: number;
}

export function useAdminHospitals(filters: HospitalsFilters) {
  return useQuery({
    queryKey: ['admin-hospitals', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = { page: String(filters.page), limit: '20' };
      if (filters.q.trim()) searchParams['q'] = filters.q.trim();
      if (filters.isArchived !== 'all') searchParams['isArchived'] = filters.isArchived;
      const r = await apiClient.get(EP.ADMIN_HOSPITALS, { searchParams })
        .json<{ data: AdminPaginatedResult<AdminHospital> }>();
      return r.data;
    },
  });
}
```

**Content:**

Header: `AppText variant="heading-2"` — "Hospitals". Subtitle: total count once loaded.

Filters row: search input (debounced 300ms) + archive select (All / Active / Archived).

Table columns:
| Column | Notes |
|---|---|
| Name | Bold, `subdomain` as muted caption below |
| Type | Plain text |
| Location | Plain text |
| Modules | 4 small pills: EMR · Labs · Assets · Consult — `bg-forest-900/10 text-forest-900` if enabled, `bg-charcoal-700/10 text-charcoal-700` if not |
| Status | Badge: "Active" (`bg-green-100 text-green-700`) or "Archived" (`bg-amber-100 text-amber-700`) |
| Created | `toLocaleDateString()` |

Row click → `navigate(ADMIN_ROUTES.HOSPITAL_DETAIL(hospital.id))`.

Pagination: Prev / Next buttons below table. Show "Page X of Y". Disable Prev on page 1, Next on last page.

Empty state: `<IconBuilding size={32} />` + `"No hospitals found."` — centred.

`<Loadable>` with spinner + error.

---

### Screen 4 — Hospital Detail

**Route:** `/admin/hospitals/:hospitalId`
**File:** `apps/admin-web/src/features/hospitals/screen/hospital-detail-screen.tsx`
**Layout:** AdminShell

**API hooks:** in `features/hospitals/api/use-admin-hospitals.ts`

```ts
// GET admin/hospitals/:hospitalId
// Route: ResponseUtil.ok(res, data) where data = { hospital, memberCount }
// queryFn: r.data  (gives { hospital, memberCount })
// queryKey: ['admin-hospital', hospitalId]
export function useAdminHospital(hospitalId: string) {
  return useQuery({
    queryKey: ['admin-hospital', hospitalId],
    queryFn: async () => {
      const r = await apiClient.get(EP.ADMIN_HOSPITAL(hospitalId))
        .json<{ data: { hospital: AdminHospital; memberCount: number } }>();
      return r.data; // { hospital, memberCount }
    },
  });
}

// PATCH admin/hospitals/:hospitalId
// Route: ResponseUtil.ok(res, { hospital })
// mutationFn: r.data.hospital
// onSuccess: invalidate ['admin-hospital', hospitalId] + ['admin-hospitals']
export function useUpdateAdminHospital(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { isArchived?: boolean; modules?: Partial<HospitalModules> }) => {
      const r = await apiClient.patch(EP.ADMIN_HOSPITAL_UPDATE(hospitalId), { json: payload })
        .json<{ data: { hospital: AdminHospital } }>();
      return r.data.hospital;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-hospital', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

// DELETE admin/hospitals/:hospitalId — 204, no .json()
// onSuccess: invalidate ['admin-hospitals'] + navigate to ADMIN_ROUTES.HOSPITALS
export function useDeleteAdminHospital(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(EP.ADMIN_HOSPITAL_DELETE(hospitalId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

**Content:**

Header: back button → `ADMIN_ROUTES.HOSPITALS`. Hospital name as `AppText variant="heading-2"`. Subdomain + status badge as subtitle.

Two-column layout (`lg:grid-cols-3`, left = `lg:col-span-2`, right = 1 col):

**Left — Info card (read-only):**
- Type, Location, Contact email/phone (if set, using `?.` access), Custom domain (if set), Owner ID, Plan, Timezone, Locale
- Member count stat: `"X members"` pill
- Created / Updated dates (`toLocaleDateString()`)

**Right — Actions card:**

*Modules form* (part: `parts/hospital-modules-form.tsx`):
- 4 checkboxes: EMR · Labs · Assets · Online Consultation
- Pre-filled from `hospital.modules`
- "Save modules" `AppButton` → `useUpdateAdminHospital` with `{ modules: {...} }`
- Toast on success: `'Modules updated.'`

*Archive / Restore section:*
- `isArchived === false`: "Archive hospital" `AppButton variant="danger"` → `DrawerService.showConfirmationModal('Archive this hospital?', 'Staff will lose access until it is restored.', { destructive: true, onConfirm: () => mutation.mutate({ isArchived: true }) })` → toast `'Hospital archived.'`
- `isArchived === true`: "Restore hospital" `AppButton variant="secondary"` → `mutation.mutate({ isArchived: false })` directly (no confirmation) → toast `'Hospital restored.'`

*Danger zone:*
- "Permanently delete" `AppButton variant="danger"` → `DrawerService.showConfirmationModal('Permanently delete this hospital?', 'This cannot be undone. Member, patient, and EMR data are not cascade-deleted.', { destructive: true, onConfirm: () => deleteMutation.mutate() })` → on success navigate to `ADMIN_ROUTES.HOSPITALS` (no toast — navigate immediately).

`<Loadable>` with spinner + error for initial load.

---

### Screen 5 — User List

**Route:** `/admin/users`
**File:** `apps/admin-web/src/features/users/screen/user-list-screen.tsx`
**Layout:** AdminShell

**API hook:** `useAdminUsers` in `features/users/api/use-admin-users.ts`

```ts
// GET admin/users?q=&isAdmin=&page=&limit=20
// Route: ResponseUtil.ok(res, result) where result is PaginatedResult (flat)
// queryFn: r.data  (gives { items, total, page, limit, totalPages })
// queryKey: ['admin-users', filters]

interface UsersFilters {
  readonly q: string;
  readonly isAdmin: 'all' | 'true' | 'false';
  readonly page: number;
}

export function useAdminUsers(filters: UsersFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = { page: String(filters.page), limit: '20' };
      if (filters.q.trim()) searchParams['q'] = filters.q.trim();
      if (filters.isAdmin !== 'all') searchParams['isAdmin'] = filters.isAdmin;
      const r = await apiClient.get(EP.ADMIN_USERS, { searchParams })
        .json<{ data: AdminPaginatedResult<AdminUser> }>();
      return r.data;
    },
  });
}
```

**Content:**

Header: `AppText variant="heading-2"` — "Users". Subtitle: total count.

Filters row: search input (debounced 300ms) + admin select (All / Admins only / Non-admins).

Table columns:
| Column | Notes |
|---|---|
| Name | Bold, email as muted caption below |
| Email verified | Green check icon if true, red x icon if false |
| Admin | Badge "Admin" (`bg-purple-100 text-purple-700`) if `isAdmin`, otherwise nothing |
| 2FA | Badge "2FA on" (`bg-green-100 text-green-700`) if enabled, "2FA off" (`bg-charcoal-700/10 text-charcoal-700`) if not |
| Joined | `toLocaleDateString()` |

Row click → `navigate(ADMIN_ROUTES.USER_DETAIL(user.id))`.

Pagination: same Prev / Next pattern.

Empty state: `<IconUsers size={32} />` + `"No users found."`.

`<Loadable>` with spinner + error.

---

### Screen 6 — User Detail

**Route:** `/admin/users/:userId`
**File:** `apps/admin-web/src/features/users/screen/user-detail-screen.tsx`
**Layout:** AdminShell

**API hooks:** in `features/users/api/use-admin-users.ts`

```ts
// GET admin/users/:userId
// Route: ResponseUtil.ok(res, data) where data = { user, memberships }
// queryFn: r.data  (gives { user, memberships })
// queryKey: ['admin-user', userId]
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const r = await apiClient.get(EP.ADMIN_USER(userId))
        .json<{ data: { user: AdminUser; memberships: MembershipSummary[] } }>();
      return r.data; // { user, memberships }
    },
  });
}

// PATCH admin/users/:userId
// Route: ResponseUtil.ok(res, { user })
// mutationFn: r.data.user
// onSuccess: invalidate ['admin-user', userId] + ['admin-users']
export function useUpdateAdminUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { isAdmin?: boolean; isEmailVerified?: boolean }) => {
      const r = await apiClient.patch(EP.ADMIN_USER_UPDATE(userId), { json: payload })
        .json<{ data: { user: AdminUser } }>();
      return r.data.user;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

// POST admin/users/:userId/disable — 204, no .json()
// onSuccess: invalidate ['admin-user', userId], toast 'All sessions disabled.'
export function useDisableAdminUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(EP.ADMIN_USER_DISABLE(userId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      DrawerService.toast('All sessions disabled.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
```

**Content:**

Header: back button → `ADMIN_ROUTES.USERS`. User name as `AppText variant="heading-2"`. Email as subtitle.

Two-column layout (`lg:grid-cols-3`, left = `lg:col-span-2`, right = 1 col):

**Left — User info card (read-only):**
- Email, Phone (if set, use `user.phone?.` access), Email verified badge, 2FA enabled badge, Admin badge
- Created / Updated dates

**Memberships table** (below info card):
- Columns: Hospital ID, Role, Status, Joined
- Render with `<Repeat>`
- "No memberships" empty state (no table at all — show a single `<p>`)

**Right — Actions card** (part: `parts/user-flags-form.tsx`):

*Platform flags:*
- Checkbox: "Platform admin" — `isAdmin`
- Checkbox: "Email verified" — `isEmailVerified`
- "Save flags" `AppButton` → `useUpdateAdminUser` with changed fields only
- Toast on success: `'User updated.'`
- Self-demotion guard: if `currentUser.id === userId` and the user is unchecking `isAdmin`, show a confirmation modal first: `"Remove your own admin access? You will be logged out and unable to return."` with `{ destructive: true, onConfirm: ... }`

*Session control:*
- "Disable all sessions" `AppButton variant="danger"` → `DrawerService.showConfirmationModal('Disable all sessions?', 'This will invalidate all active sessions for this user. They will need to log in again.', { destructive: true, onConfirm: () => disableMutation.mutate() })`

`<Loadable>` with spinner + error for initial load.

---

## Route registration (`app.routes.tsx`)

```tsx
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import { AdminGuard } from '@shared/guards/admin-guard.tsx';
import { AdminShell } from '@shared/widgets/admin-shell/admin-shell.tsx';

// Lazy imports — always use .then(m => ({ default: m.ScreenName })) pattern
const AdminLoginScreen = lazy(() =>
  import('@features/auth/screen/admin-login-screen.tsx').then((m) => ({ default: m.AdminLoginScreen }))
);
const AdminDashboardScreen = lazy(() =>
  import('@features/dashboard/screen/admin-dashboard-screen.tsx').then((m) => ({ default: m.AdminDashboardScreen }))
);
const HospitalListScreen = lazy(() =>
  import('@features/hospitals/screen/hospital-list-screen.tsx').then((m) => ({ default: m.HospitalListScreen }))
);
const HospitalDetailScreen = lazy(() =>
  import('@features/hospitals/screen/hospital-detail-screen.tsx').then((m) => ({ default: m.HospitalDetailScreen }))
);
const UserListScreen = lazy(() =>
  import('@features/users/screen/user-list-screen.tsx').then((m) => ({ default: m.UserListScreen }))
);
const UserDetailScreen = lazy(() =>
  import('@features/users/screen/user-detail-screen.tsx').then((m) => ({ default: m.UserDetailScreen }))
);

function Lazy({ children }: { readonly children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ADMIN_ROUTES.LOGIN} element={<Lazy><AdminLoginScreen /></Lazy>} />

      <Route element={<AdminGuard><AdminShell /></AdminGuard>}>
        <Route index element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
        <Route path={ADMIN_ROUTES.DASHBOARD}         element={<Lazy><AdminDashboardScreen /></Lazy>} />
        <Route path={ADMIN_ROUTES.HOSPITALS}         element={<Lazy><HospitalListScreen /></Lazy>} />
        <Route path={ADMIN_ROUTES.HOSPITAL_DETAIL(':hospitalId')} element={<Lazy><HospitalDetailScreen /></Lazy>} />
        <Route path={ADMIN_ROUTES.USERS}             element={<Lazy><UserListScreen /></Lazy>} />
        <Route path={ADMIN_ROUTES.USER_DETAIL(':userId')} element={<Lazy><UserDetailScreen /></Lazy>} />
      </Route>

      <Route path="*" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
```

`AdminShell` renders `<Outlet />` in its main content area — same pattern as medcord-web's `HospitalShell`.

---

## Build order

Build in this exact sequence. Do not skip ahead. Run the quality gate after each step.

| # | Task | Notes |
|---|---|---|
| 1 | Add EP constants to `packages/api/src/endpoints.ts` | 9 new ADMIN_* constants |
| 2 | Shared types | `shared/types/admin.ts` — PlatformStats, AdminHospital, AdminUser, MembershipSummary, AdminPaginatedResult |
| 3 | Routes constant | `shared/constants/routes.ts` — ADMIN_ROUTES (local, not @medcord/core) |
| 4 | Token storage | `shared/helpers/token-storage.ts` — exact copy from medcord-web |
| 5 | Auth provider | `shared/providers/auth-provider.tsx` — AdminAuthProvider, no activeHospitalId |
| 6 | use-auth hook | `shared/hooks/use-auth.ts` — thin wrapper around useAdminAuthContext |
| 7 | Auth API hooks | `features/auth/api/use-admin-auth.ts` — useAdminLogin, useAdminMe (returns AdminUser) |
| 8 | UserBootstrap | `shared/providers/user-bootstrap.tsx` — fetches /me, checks isAdmin, redirects if not |
| 9 | AdminGuard | `shared/guards/admin-guard.tsx` — token-only check, no isAdmin redirect |
| 10 | Wire `app.provider.tsx` | Add AuthProvider, UserBootstrap, ModalHost, ToastHost |
| 11 | Admin Shell | `shared/widgets/admin-shell/` — sidebar (Repeat, not map), topbar, user-menu, shell |
| 12 | Login screen | AuthLayout (adapted), AdminLoginForm (no forgot password), AdminLoginScreen |
| 13 | Wire `app.routes.tsx` | All routes, AdminGuard, AdminShell, lazy imports |
| 14 | Platform stats API | `features/dashboard/api/use-platform-stats.ts` |
| 15 | Dashboard screen | Stats tiles + recent activity cards |
| 16 | Admin hospitals API | useAdminHospitals, useAdminHospital, useUpdateAdminHospital, useDeleteAdminHospital |
| 17 | Hospital list screen | Table + filters (debounced) + pagination |
| 18 | Hospital detail screen | Info card + modules form + archive/restore + delete |
| 19 | Admin users API | useAdminUsers, useAdminUser, useUpdateAdminUser, useDisableAdminUser |
| 20 | User list screen | Table + filters (debounced) + pagination |
| 21 | User detail screen | Info card + memberships table + flags form + disable sessions |
| 22 | Final quality gate | typecheck + lint + build all green; trace every hook's response path |

---

## Confirmation modal patterns

All destructive actions must show `DrawerService.showConfirmationModal(title, body, { destructive: true, onConfirm: () => { ... } })` before firing the mutation:

| Action | Modal title | Modal body |
|---|---|---|
| Archive hospital | "Archive this hospital?" | "Staff will lose access until it is restored." |
| Permanently delete hospital | "Permanently delete this hospital?" | "This cannot be undone. Member, patient, and EMR data are not cascade-deleted." |
| Demote self from admin | "Remove your own admin access?" | "You will be logged out and unable to return." |
| Disable user sessions | "Disable all sessions?" | "This will invalidate all active sessions for this user. They will need to log in again." |

Non-destructive actions (restore hospital, promote to admin, verify email): act immediately — no confirmation modal.

---

## Toast patterns

| Action | Toast |
|---|---|
| Modules updated | `'Modules updated.'` success |
| Hospital archived | `'Hospital archived.'` success |
| Hospital restored | `'Hospital restored.'` success |
| Hospital deleted | No toast — navigate to `ADMIN_ROUTES.HOSPITALS` immediately |
| User flags saved | `'User updated.'` success |
| Sessions disabled | `'All sessions disabled.'` success |
| Any error | `err instanceof Error ? err.message : 'Something went wrong.'` error |
