# Medcord Frontend — Agent Handoff

You are taking over frontend development for the Medcord web app. Read every section carefully before writing a single line of code.

---

## Repo

```
/Users/feranmi/codebases/2026/medcord-app/
```

Nx monorepo, pnpm workspace. The web app you are building is at:

```
apps/medcord-web/
```

Run the dev server:
```bash
pnpm nx run medcord-web:dev
```

Backend runs on `http://localhost:8085`. Frontend runs on `http://localhost:5173`.

---

## Documents — Read All of These First

| Document | Path | Purpose |
|---|---|---|
| **Frontend build plan** | `docs/frontend-build-plan.md` | Master spec: every module, every screen, FSD structure, API tables, meemaw rules, quality gate |
| **API docs** | `docs/api/api-docs/api-docs.md` | Full backend API reference |
| **Frontend handoff** | `docs/api/api-docs/frontend-handoff.md` | API response shapes, auth flow, error codes |
| **QA handoff** | `docs/api/api-docs/qa-handoff.md` | Test credentials, known issues |
| **Product MVP** | `docs/product/mvp.md` | What the product is, who it's for |
| **Frontend guide** | `docs/guides/frontend.md` | Project-specific conventions |
| **Rules** | `docs/guides/rules.md` | Hard rules enforced across the codebase |
| **Run guide** | `docs/guides/run.md` | How to start the dev stack |

---

## Design System

The design system package is `packages/ui/`. It is imported in the web app as `@medcord/ui`. It exports exactly **two components** plus theme utils:

- `AppButton` — all buttons, everywhere. Props: `variant` (`primary` | `secondary` | `ghost` | `danger`), `loading`, `leadingIcon`, `trailingIcon`. Never use a raw `<button>` styled with Tailwind for a primary action.
- `AppText` — all headings and body copy. Props: `variant` (`display-1`, `display-2`, `heading-1`, `heading-2`, `heading-3`, `body`, `body-sm`, `caption`), `as` (override element). Never use a raw `<h1>`, `<h2>`, `<p>` for text that should be semantic — use `AppText`.

Icons are imported from `@icons` (maps to `packages/ui/src/icons/index.ts`). See that file for the full list of exported icon names (all prefixed `Icon*`).

**The design system preview app** at `apps/design-system/` is a visual reference only — it shows you what components look like and how to use them. Its source (`apps/design-system/src/ui/`) contains richer components (LineField, Table, PatientCard, etc.) that are **local to the preview app and not importable** from `@medcord/ui`. Use them as a design reference, not as imports.

**For form inputs**: there is no shared input primitive yet. Follow the established pattern from `apps/medcord-web/src/features/auth/features/login/parts/login-form.tsx` — raw `<input>` with this Tailwind class string:

```
mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed
```

**Color tokens**: use the established Tailwind color aliases (`forest-900`, `cream-50`, `charcoal-900`, `charcoal-700`, etc.), not raw CSS variables like `var(--brand-600)`. The CSS variables exist in `src/styles.css` for advanced use but the Tailwind color names are what all existing screens use.

---

## meemaw — Mandatory

`meemaw` is installed in `apps/medcord-web/`. Every component must use meemaw primitives. **Raw ternaries, `&&` short-circuits, and `.map()` in JSX are banned.**

Real API (read the types, do not guess):

```tsx
// Conditional render
<Show when={condition} fallback={<FallbackJSX />}>
  <Content />
</Show>

// Multi-branch
<Switch>
  <Case when={role === 'admin'}><AdminView /></Case>
  <Case when={role === 'doctor'}><DoctorView /></Case>
  <Default><GuestView /></Default>
</Switch>

// Loading/error/content
<Loadable
  loading={isLoading}
  error={error ?? undefined}          // error prop does NOT accept null — use ?? undefined
  loadingComponent={<Skeleton />}
  errorComponent={<ErrorMsg />}
>
  <Content />
</Loadable>

// Lists — note: prop is `each`, children is a render function (NOT renderItem)
<Repeat each={items}>
  {(item: ItemType) => <Card key={item.id} item={item} />}
</Repeat>

// Responsive / conditional hide
<Hidden when={!isVisible}><SomeUI /></Hidden>

// Text truncation
<Clamp maxLines={2}>{text}</Clamp>

// Clipboard
<CopyToClipboard text={value}>
  {(copy, copied) => <button onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>}
</CopyToClipboard>
```

Import all from `'meemaw'`.

---

## Architecture Rules

- **Feature-Sliced Design (FSD)**. All features live under `src/features/[name]/`. Structure: `features/`, `screen/`, `parts/`, `api/`, `providers/`, `guards/`, `helpers/`, `widgets/`.
- **No default exports** — named exports only.
- **All props interfaces are `ReadonlyProps`** — declared in the same file, all fields `readonly`.
- **No `any`** in TypeScript. Use generics, discriminated unions.
- **No inline errors** — use form-level `<p role="alert">` with `bg-red-50 text-red-700` (see `login-form.tsx`), never toasts.
- **One API hook per resource** — file named `api/use-<resource>.ts`.
- **Guards redirect before rendering** — `AuthGuard` for auth, `HospitalGuard` for hospital scope.

---

## Path Aliases

```
@app      → src/
@features → src/features/
@shared   → src/shared/
@medcord/ui   → packages/ui/src/index.ts
@medcord/core → packages/core/src/index.ts
@medcord/api  → packages/api/src/index.ts
@icons    → packages/ui/src/icons/index.ts
```

---

## API Client

Located at `packages/api/src/client.ts`. Exported as `apiClient` (a Proxy). **Must call `configureApiClient(baseUrl)` at boot before use** (already done in `apps/medcord-web/src/main.tsx`).

All endpoint paths are in `packages/api/src/endpoints.ts` as `EP.*`. Always use `EP` constants — never hardcode paths.

Response envelope from the backend:
```ts
{ data: T }          // success
{ error: { code: string; message: string } }  // error
```

Parse errors with `parseApiError(err)` from `@medcord/api`.

**Critical rule**: Before writing any API hook, read the actual backend route file at `apps/main-backend/src/features/<module>/<module>.routes.ts` to confirm the endpoint exists. Do NOT trust only the build plan or API docs — call it out if something is missing.

---

## Key Shared Files

| File | Purpose |
|---|---|
| `src/shared/types/hospital.ts` | `Hospital`, `HospitalModules`, `HospitalType`, `StaffRole` — matches backend model exactly |
| `src/shared/types/auth.ts` | `User`, `AuthTokens`, `LoginResponse`, etc. |
| `src/shared/types/api.ts` | `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>` |
| `src/shared/types/index.ts` | Barrel — re-exports all above |
| `src/shared/constants/routes.ts` | `ROUTES` object — all frontend routes, use always |
| `src/shared/providers/auth-provider.tsx` | `AuthContext` — `user`, `activeHospitalId`, `setUser`, `setTokens`, `setActiveHospitalId`, `logout` |
| `src/shared/hooks/use-auth.ts` | `useAuth()` — thin wrapper over `useAuthContext()` |
| `src/shared/helpers/token-storage.ts` | `tokenStorage` — `getAccess()`, `getRefresh()`, `setTokens()`, `clearTokens()` |
| `src/shared/guards/auth-guard.tsx` | Redirects to `/login` if no access token |
| `src/shared/widgets/app-shell/app-shell.tsx` | `AppShell` — sidebar + topbar + `<Outlet />`, takes `hospital: Hospital` prop |
| `src/app.routes.tsx` | All route registrations — add new routes here |
| `packages/api/src/endpoints.ts` | `EP` — every backend endpoint path |

---

## Hospital Type — Critical

The `Hospital` type in `src/shared/types/hospital.ts` matches the backend model exactly:

- Field is `subdomain` (NOT `slug`) — use `hospital.subdomain` for URL routing
- `modules` is an **object** `{ emr: boolean, labs: boolean, assets: boolean, onlineConsultation: boolean }` — NOT an array
- The `AppShell` sidebar already handles module-gated nav via `moduleKey` checks against this object

---

## What Is Already Built

### Module 0 — Foundation ✅
- `src/app.tsx`, `src/app.provider.tsx`, `src/app.routes.tsx`, `src/main.tsx`
- `AuthProvider`, `AuthGuard`, `HospitalGuard`
- `tokenStorage`, `useAuth`, `useHospitalSlug`
- `AppShell` with `Sidebar`, `Topbar`, `UserMenu`
- All shared types, constants, helpers

### Module 1 — Auth ✅ (screens exist, some APIs not on backend yet)
| Screen | Route | Status |
|---|---|---|
| `LoginScreen` | `/login` | ✅ working |
| `RegisterScreen` | `/register` | ✅ working |
| `ForgotPasswordScreen` | `/forgot-password` | ⚠️ screen exists, backend endpoint `POST /api/v1/auth/forgot-password` is NOT implemented |
| `ResetPasswordScreen` | `/reset-password` | ⚠️ screen exists, backend endpoint `POST /api/v1/auth/reset-password` is NOT implemented |
| `Setup2faScreen` | `/setup-2fa` | ✅ working |

### Module 2 — Workspace (Partial) 🔶
| Screen | Route | Status |
|---|---|---|
| `HospitalListScreen` | `/hospitals` | ✅ built — shell-free picker, `Loadable`+`Show`+`Repeat`, `AppButton`, `AppText` |
| `HospitalCreateScreen` | `/hospitals/new` | ✅ built — single-page form, `AppButton`, pattern-matched inputs |
| `HospitalDashboardScreen` | `/h/:slug/dashboard` | ❌ not started — currently shows `PlaceholderScreen` |
| `HospitalSettingsScreen` | `/h/:slug/settings` | ❌ not started |

The `/h/:slug/*` catch-all in `app.routes.tsx` currently renders `PlaceholderScreen`. When you build dashboard/settings, replace that catch-all with individual named routes.

---

## What To Build Next

Work through `docs/frontend-build-plan.md` in order. **Do not skip ahead.**

### Immediate next: finish Module 2
1. `HospitalDashboardScreen` — landing screen after selecting a hospital. Show hospital name, enabled modules as nav cards, quick stats (`GET /api/v1/hospitals/:id` for detail, `GET /api/v1/hospitals/:id/stats` for stats — confirm both exist in the route file before coding).
2. `HospitalSettingsScreen` — tabbed settings: General, Branding, Modules, Domain, Danger Zone. Read `apps/main-backend/src/features/hospitals/hospital.routes.ts` and `hospital.schema.ts` for exact patch shapes.

### Then Module 3 — Staff
Full list of screens and APIs in `docs/frontend-build-plan.md` under "Module 3". Read `apps/main-backend/src/features/staff/staff.routes.ts` and `staff.schema.ts` before writing any hook.

---

## Quality Gate — Run After Every Feature

```bash
pnpm nx run medcord-web:typecheck
pnpm nx run medcord-web:lint
pnpm nx run medcord-web:build
```

All three must pass with zero errors. Do not report a feature done until all three are green.

---

## QA Credentials

Live seed state is in `docs/qas/scripts/.state.json`. Test user credentials (email/password `password123` for all):

- `alice@medcord.test` — has hospitals seeded
- `bob@medcord.test`
- `carol@medcord.test`

QA scripts to call the API directly live in `docs/qas/scripts/`. Run them to verify endpoint responses before building against them.

---

## Design System Preview

To see what any component should look like, run:

```bash
pnpm nx run design-system:dev
```

Browse `apps/design-system/src/ui/` to read how each component is structured, what props it takes, and what it renders. Use this as design reference. Source files are in subdirs: `button/`, `input/`, `card/`, `navigation/`, `registration/`, `table/`, `feedback/`, `banner/`, `staff/`, `modal/`, `drawer/`, etc.

---

## Rules That Were Violated by the Previous Agent — Do Not Repeat

1. **Always read the backend route file before writing any API hook.** The previous agent called `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` — both 404 because they don't exist on the backend.
2. **Use `AppButton` for every button.** The previous agent wrote raw `<button>` elements with inline Tailwind instead of `AppButton`.
3. **Use `AppText` for every heading and body text.** The previous agent wrote raw `<h1>`, `<p>` tags.
4. **Do not use CSS variables (`var(--brand-600)`) for color.** Use the Tailwind aliases (`forest-900`, `cream-50`, `charcoal-900`, etc.) that the rest of the codebase uses.
5. **Do not declare a module done when screens are missing.** Module 2 has 4 screens; only 2 were built.
6. **Never build without being asked.** Wait for explicit approval before starting work if a plan review was requested.
7. **No subagents.** All work is done directly — no Agent tool calls.
8. **meemaw API is strict** — `error` prop on `<Loadable>` does NOT accept `null`, use `error ?? undefined`. `<Repeat>` uses prop `each` not `items`, and `children` is a render function not `renderItem`.
