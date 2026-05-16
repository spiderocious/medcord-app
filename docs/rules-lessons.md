# Medcord Frontend — Rules & Hard Lessons

Distilled from what was violated, broken, and discovered during the Module 2–3 build. Every rule here was learned by breaking it. Read before writing a single line.

---

## API Integration — The Most Critical Section

### 1. Trace the full response chain before writing any hook

Before writing a hook, trace this exact path:

1. Read the **route handler** — what does `ResponseUtil.ok(res, X)` pass?
2. Read the **service** — what does the method return?
3. Know the **envelope**: `ResponseUtil.ok(res, data)` → `{ data }`. So the frontend receives `response.data.X` only if the route wraps in `{ X }`.

Examples from real mistakes:

```ts
// Route: ResponseUtil.ok(res, result)  where result = { items, total, page, limit, totalPages }
// WRONG: r.data.data  /  r.data.meta.total
// RIGHT: r.data.items  /  r.data.total

// Route: ResponseUtil.ok(res, { hospital })
// WRONG: r.data  (gives { hospital })
// RIGHT: r.data.hospital
```

Never assume. Read it.

### 2. 204 responses have no body — never call `.json()` on them

`ResponseUtil.noContent` sends HTTP 204 with no body. Calling `.json()` on it throws.

```ts
// Routes that return 204: suspend, activate, remove member, revoke invitation, archive hospital

// WRONG
apiClient.post(EP.HOSPITAL_STAFF_SUSPEND(hospitalId, memberId)).json<unknown>()

// RIGHT
apiClient.post(EP.HOSPITAL_STAFF_SUSPEND(hospitalId, memberId))
```

Check every mutation. If the route handler calls `ResponseUtil.noContent`, drop `.json()`.

### 3. Read the backend model, not just the API docs

The API docs and build plan can be out of date. The backend model is truth.

Real mistake: `StaffMember` was typed with a `user: { name, email }` field. The actual `IHospitalMember` model has no `user` field — only `userId`. The `listMembers` query does no population. Every `member.user.name` crashed at runtime.

**Before typing a response shape, read:**
- `apps/main-backend/src/features/<module>/<module>.model.ts` — actual DB fields
- `apps/main-backend/src/features/<module>/<module>.repo.ts` — what queries return, whether any joins/population happen
- `apps/main-backend/src/features/<module>/<module>.service.ts` — what the service returns to the route
- `apps/main-backend/src/features/<module>/<module>.routes.ts` — what the route wraps it in

### 4. Optional fields from DB may be undefined even if the TypeScript type says otherwise

The frontend `Hospital` type declares `contact: HospitalContact`. But records created before contact was required have `contact` as undefined in the DB.

```ts
// WRONG — crashes if contact was never set
useState(hospital.contact.phone ?? '')

// RIGHT
useState(hospital.contact?.phone ?? '')
```

Defensive access (`?.`) on any nested object from an API response, unless you seeded the DB yourself and know every record has it.

### 5. EP constants may be wrong — verify before using

`EP.HOSPITAL_STAFF_REACTIVATE` pointed to `/reactivate` but the backend route is `/activate`. The EP file is not always kept in sync with the backend.

When an EP constant looks suspicious or a route fails, read the actual route file to confirm the path.

### 6. PaginatedResult shape — backend vs frontend types

The backend `PaginatedResult<T>` (from `service.types.ts`) is:
```ts
{ items: T[]; total: number; page: number; limit: number; totalPages: number }
```

The frontend `PaginatedResponse<T>` (from `shared/types/api.ts`) is:
```ts
{ data: T[]; meta: PaginatedMeta }
```

These are **different**. When a backend service returns `PaginatedResult`, that is what hits the route and gets wrapped in `{ data: ... }` by `ResponseUtil.ok`. So the frontend receives:

```ts
{ data: { items: T[]; total: number; page: number; limit: number; totalPages: number } }
```

Not `{ data: { data: T[]; meta: { total } } }`. Read the service return type.

---

## meemaw — What Gets Violated

### `<Repeat>` with ReadonlyArray

`Repeat`'s `each` prop expects a mutable array. `ReadonlyArray<T>` and `readonly T[]` cause a TypeScript error.

```tsx
// WRONG
<Repeat each={ROLE_OPTIONS}>  // ReadonlyArray<RoleOption>

// RIGHT
<Repeat each={ROLE_OPTIONS as RoleOption[]}>
```

### `&&` short-circuits are banned

Every `{condition && <JSX />}` must become `<Show when={condition}>`.

```tsx
// WRONG
{error !== null && <p>{error}</p>}
{subtitle !== undefined && <AppText>{subtitle}</AppText>}

// RIGHT
<Show when={error !== null}><p>{error}</p></Show>
<Show when={subtitle !== undefined}><AppText>{subtitle}</AppText></Show>
```

### `.map()` in JSX is banned

```tsx
// WRONG
{options.map(o => <option key={o.value}>{o.label}</option>)}

// RIGHT
<Repeat each={options as Option[]}>
  {(o: Option) => <option key={o.value}>{o.label}</option>}
</Repeat>
```

---

## Icons — Use Only What Exists

The icon proxy at `packages/ui/src/icons/index.ts` exports a fixed set. Many intuitive names do not exist.

Common wrong guesses and their actual names:

| Wrong | Correct |
|---|---|
| `IconMail` | `IconSend` |
| `IconRefreshCw` | `IconRefresh` |
| `IconX` | `IconClose` |
| `IconSitemap` | `IconNetwork` |
| `IconAlertTriangle` | `IconAlert` |
| `IconTrash2` | `IconTrash` |
| `IconEdit2` | `IconEdit` |
| `IconPhone` | does not exist |

**Rule**: before using an icon name, grep `packages/ui/src/icons/index.ts` to confirm it exists.

---

## TypeScript — Common Violations

### Empty interface extending a supertype

```ts
// WRONG — triggers @typescript-eslint/no-empty-object-type
interface FooResponse extends ApiResponse<{ foo: Foo }> {}

// RIGHT
type FooResponse = ApiResponse<{ foo: Foo }>
```

### Referencing fields that don't exist on the model

Check the actual model interface before typing a frontend response shape. Do not derive types from the API docs alone — derive them from the backend model.

---

## Quality Gate Is Not Enough

Typecheck + lint + build passing does **not** mean the integration works. The quality gate catches type errors, not:

- Wrong `r.data.X` access paths
- `.json()` on 204 responses  
- Fields that are `undefined` at runtime despite passing TS checks
- Backend model fields that don't exist but were assumed

After the quality gate, manually verify every new hook by tracing its full response chain against the route + service + model.

---

## Response Shape Cheat Sheet

Read `ResponseUtil` in `apps/main-backend/src/lib/response.ts`:

| Method | HTTP status | Body | Frontend access |
|---|---|---|---|
| `ResponseUtil.ok(res, data)` | 200 | `{ data }` | `r.data` |
| `ResponseUtil.created(res, data)` | 201 | `{ data }` | `r.data` |
| `ResponseUtil.noContent(res)` | 204 | _(none)_ | don't call `.json()` |

When the route does `ResponseUtil.ok(res, { hospital })`, frontend receives `{ data: { hospital } }` → unwrap as `r.data.hospital`.

When the route does `ResponseUtil.ok(res, result)` where result is already a plain object, frontend receives `{ data: result }` → unwrap as `r.data`.

---

## File Organisation

- API hooks go in `features/<module>/api/use-<resource>.ts`
- One hook file per resource, not per action
- Mutations that operate on the same resource (update, suspend, activate, remove) live in the same file
- Types that come from the backend live in `features/<module>/shared/types/` — not inlined in hook files
- Screen parts go in `screen/parts/` — never put more than one non-trivial component in a parts file

---

## Error Handling — Never Hardcode Failure Messages

The ky HTTP client is configured in `packages/api/src/client.ts` to intercept every non-2xx response, read the backend `{ error: { code, message } }` envelope, and re-throw a plain `Error` whose `.message` is the exact backend string (e.g. "Cannot suspend yourself").

**Rule: every `.catch()` block must read `err.message`, never hardcode a fallback string.**

```ts
// WRONG — ignores the real backend message entirely
.catch(() => {
  DrawerService.toast('Failed to suspend staff member. Please try again.', { type: 'error' });
});

// RIGHT — surfaces whatever the backend actually said
.catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  DrawerService.toast(message, { type: 'error' });
});
```

This applies everywhere: `DrawerService` `onConfirm` callbacks, form submit handlers, inline mutation `.catch()` chains — any place an API call can fail. The ky layer does the hard work; the catch block just needs to pass `err.message` through.

---

## Before Declaring Anything Done

1. Read every backend route handler the feature touches
2. Trace every response shape from route → service → model
3. Check every mutation for 204 vs body response
4. Check every field access on API response data against the actual model
5. Run typecheck, lint, build — all green
6. Manually trace the UI flow: what happens on load, on submit, on error, on empty state
