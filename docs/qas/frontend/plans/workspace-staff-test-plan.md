# Medcord Frontend — Module 2 & 3 Test Plan

> **QA:** Claude
> **Date:** 2026-05-16
> **Modules:** 2 — Workspace · 3 — Staff
> **Environment:** `http://localhost:5176` · Backend `http://localhost:8085`
> **Credentials:** `alice@medcord.test` / `Medcord123!` (hospital_admin seed)

---

## Scope

### Module 2 — Workspace
- Hospital List screen
- Hospital Create screen (2-step flow)
- Hospital Dashboard screen
- Hospital Settings screen — all 6 tabs (General, Branding, Modules, Domain, Usage, Danger Zone)
- AppShell (Sidebar + Topbar) as navigational frame

### Module 3 — Staff
- Staff Directory screen (table, filters, pagination)
- Pending Invitations list (resend / revoke)
- Staff Invite screen (single invite + CSV upload)
- Staff Profile screen (view, suspend, activate, remove)
- Org Chart screen

---

## Rules Under Test

The following rules are checked on every screen. A dedicated section lists cross-cutting checks at the end.

| Rule | Expectation |
|---|---|
| **meemaw-REPEAT** | No raw `.map()` in JSX. Must use `<Repeat each={...}>{(item) => ...}</Repeat>` |
| **meemow-SHOW** | No raw `&&` or ternary rendering. Must use `<Show when={...}>` or `<Switch>`/`<Case>` |
| **meemaw-LOADABLE** | Async data shown with `<Loadable loading error loadingComponent errorComponent>` |
| **meemaw-OTHER** | `Hidden`, `Clamp`, `CopyToClipboard`, `ShowOnce`, `Delayed` used where appropriate |
| **AppButton** | All interactive buttons use `<AppButton variant="...">`. Raw `<button>` only allowed for role="switch" toggle semantics where AppButton is semantically wrong |
| **AppText** | All headings, labels, body text, captions use `<AppText variant="...">`. No raw `<h1-h6>`, `<p>`, `<span>` for text content |
| **Color tokens** | No raw hex (`bg-[#1B4332]`). Must use tokens: `forest-900`, `cream-50`, `charcoal-900`, `charcoal-700` |
| **Error display** | Form/mutation errors shown inline as `<p role="alert" className="...bg-red-50 text-red-700...">`. No toasts for errors |
| **Success/confirmation toasts** | Post-mutation success/info/warning feedback via `DrawerService.toast(msg, {type})` |
| **Confirmation modals** | Destructive or irreversible actions must trigger `DrawerService.showConfirmationModal(title, body, options)` before proceeding |
| **No default exports** | All components use named exports |
| **Props readonly** | All prop interfaces use `readonly` on all properties |
| **No `any`** | TypeScript strict — no `any` types |
| **FSD structure** | Files live under `screen/`, `parts/`, `api/`, `providers/`, `guards/`, `helpers/` as appropriate |

---

## Module 2 — Workspace

---

### 2.1 Hospital List Screen

**Route:** `/hospitals`
**Files:** `hospital-list-screen.tsx`, `hospital-card.tsx`

#### 2.1.1 Visual & Layout

| ID | Test | Expected |
|---|---|---|
| WS-HL-VIS-01 | Visit `/hospitals` when logged in | Full-page layout. No sidebar. Minimal topbar with logo + logout button only. No app shell frame. |
| WS-HL-VIS-02 | Page heading | "Your hospitals" (or similar) rendered with `AppText variant="heading-1"` or `heading-2` — not a raw `<h1>` |
| WS-HL-VIS-03 | "New hospital" / "Create" button | Rendered as `<AppButton variant="primary">` — not a raw `<button>` |
| WS-HL-VIS-04 | Hospital card layout | Each card shows: name, subdomain/slug, module badges, a type indicator. Consistent spacing and border. |
| WS-HL-VIS-05 | Module badges on card | Each module badge rendered inside `<Repeat>` — not `.map()` |
| WS-HL-VIS-06 | Color tokens on card | No raw hex values. Forest/charcoal/cream tokens only. |
| WS-HL-VIS-07 | Card click target | Entire card is clickable to navigate to `/h/:slug/dashboard`. Card wrapper must NOT use a raw `<button>` (unless semantically correct — verify it) |

#### 2.1.2 Loading & Error States

| ID | Test | Expected |
|---|---|---|
| WS-HL-LOAD-01 | Loading state | `<Loadable>` skeleton or spinner shown while hospitals fetch. No raw conditional rendering. |
| WS-HL-LOAD-02 | Error state | If fetch fails, `errorComponent` renders — `<p role="alert">` style error. No blank screen. |
| WS-HL-LOAD-03 | Empty state | When user has no hospitals, an empty state renders with an icon, description, and CTA to create first hospital. |

#### 2.1.3 Navigation

| ID | Test | Expected |
|---|---|---|
| WS-HL-NAV-01 | Click hospital card → dashboard | Navigates to `/h/:slug/dashboard` |
| WS-HL-NAV-02 | Click "Create" → create screen | Navigates to `/hospitals/new` |
| WS-HL-NAV-03 | Unauthenticated visit | Redirected to `/login` by `AuthGuard` |
| WS-HL-NAV-04 | Authenticated visit to `/login` | Should redirect to `/hospitals` (inverse auth guard — known FE-BUG-03 from auth module, verify still failing or fixed) |

---

### 2.2 Hospital Create Screen (2-Step Flow)

**Route:** `/hospitals/new`
**Files:** `hospital-create-screen.tsx`, `step-basic-info.tsx`, `step-review.tsx`, `HospitalCreateProvider`

#### 2.2.1 Step Indicator & Layout

| ID | Test | Expected |
|---|---|---|
| WS-HC-VIS-01 | Step indicator renders | Shows step 1 and step 2 dots/indicators. Active step highlighted. |
| WS-HC-VIS-02 | Step indicator uses `<Repeat>` | Step dots must NOT be rendered with raw `.map()`. Inspect DOM/source for meemaw compliance. |
| WS-HC-VIS-03 | Step 1 layout | Form card: name, slug/subdomain (auto-fill), type, contact fields (optional). Clear field labels. |
| WS-HC-VIS-04 | Step 2 layout | Read-only review card: all values from step 1 summarized. "Back" + "Create hospital" CTAs. |
| WS-HC-VIS-05 | AppText usage | All labels and headings use `<AppText>` — no raw `<h3>`, `<p>` for content |
| WS-HC-VIS-06 | AppButton usage | "Continue", "Back", "Create hospital" all use `<AppButton>` with appropriate variant |

#### 2.2.2 Step 1 — Basic Info

| ID | Test | Expected |
|---|---|---|
| WS-HC-S1-01 | Name field auto-generates slug | Type "General Hospital Lagos" → subdomain field auto-populates slug (e.g. `general-hospital-lagos`) |
| WS-HC-S1-02 | Slug is editable | User can manually edit subdomain after auto-fill |
| WS-HC-S1-03 | Empty name, click Continue | "Continue" button disabled or validation error shown. Form does not advance. |
| WS-HC-S1-04 | Empty slug, click Continue | Same — form does not advance without a slug |
| WS-HC-S1-05 | Type selection | Hospital type options render (likely clinic, general, etc.). Selecting one highlights it. `<Repeat>` used for type options (not `.map()`). |
| WS-HC-S1-06 | Contact fields optional | Submit step 1 with name + slug only, no contact info → should advance to step 2 |
| WS-HC-S1-07 | Validation error display | If client-side validation fires, error shown as inline `<p role="alert">` — not toast |

#### 2.2.3 Step 2 — Review & Create

| ID | Test | Expected |
|---|---|---|
| WS-HC-S2-01 | Review shows all step 1 values | Name, slug, type, contact (if provided) all visible. `<Show>` for optional contact. |
| WS-HC-S2-02 | Back button returns to step 1 | Data preserved — step 1 fields still filled |
| WS-HC-S2-03 | "Create hospital" happy path | Submits successfully → redirects to `/hospitals` or `/h/:slug/dashboard`. Toast or inline confirmation of creation? Verify behavior. |
| WS-HC-S2-04 | "Create hospital" API error | If backend rejects (e.g. duplicate slug), error rendered inline as `<p role="alert">` — NO toast for errors |
| WS-HC-S2-05 | Loading state on submit | Button shows loading/disabled while API call in-flight |
| WS-HC-S2-06 | Duplicate slug error | Use an existing hospital's subdomain → API returns conflict → error shown inline, not swallowed |

---

### 2.3 Hospital Dashboard Screen

**Route:** `/h/:slug/dashboard`
**Files:** `hospital-dashboard-screen.tsx`

#### 2.3.1 Visual & Layout

| ID | Test | Expected |
|---|---|---|
| WS-DB-VIS-01 | AppShell present | Sidebar + topbar visible. `<Outlet />` renders dashboard content. |
| WS-DB-VIS-02 | Stats grid | 4 stat cards (staff count, patient count, etc.) render in a grid. AppText for numbers and labels. |
| WS-DB-VIS-03 | Module nav cards | Staff and Patients cards always visible (not gated). EMR, Labs, Assets only shown if module is enabled. `<Show>` used for gated cards (not `&&`). |
| WS-DB-VIS-04 | Settings card | Always visible regardless of modules. |
| WS-DB-VIS-05 | Card color tokens | No raw hex on stat cards, nav cards, or any dashboard element. |

#### 2.3.2 Loading & Error States

| ID | Test | Expected |
|---|---|---|
| WS-DB-LOAD-01 | Hospital data loading | If hospital is still loading, a loading state renders. Verify `<Loadable>` or equivalent is used — not raw `loading && <skeleton>` |
| WS-DB-LOAD-02 | Unknown slug | Visit `/h/does-not-exist/dashboard` → should error gracefully (not blank page) |

#### 2.3.3 Module Gating

| ID | Test | Expected |
|---|---|---|
| WS-DB-MOD-01 | Disable all optional modules | EMR, Labs, Assets nav cards hidden. Staff and Patients remain visible. |
| WS-DB-MOD-02 | Enable a module | After enabling (e.g. EMR) from Settings → Modules, nav card appears on dashboard. |

---

### 2.4 Hospital Settings Screen

**Route:** `/h/:slug/settings`
**Files:** `hospital-settings-screen.tsx`, `settings-*.tsx`

#### 2.4.1 Tab Navigation

| ID | Test | Expected |
|---|---|---|
| WS-ST-TAB-01 | All 6 tabs render | General, Branding, Modules, Domain, Usage, Danger Zone tabs visible |
| WS-ST-TAB-02 | Active tab highlighted | Active tab has distinct visual style (border, color). Inactive tabs clearly different. |
| WS-ST-TAB-03 | Tab buttons use `<AppButton>` | Tab nav must NOT use raw `.map()` + raw `<button>`. Must use `<Repeat>` + `<AppButton>` (or equivalent compliant pattern). **This is a known violation — verify.** |
| WS-ST-TAB-04 | Tab switching | Clicking each tab renders the correct content. No stale content from previous tab. |
| WS-ST-TAB-05 | Default tab | On first load, General tab is active by default. |

#### 2.4.2 Settings — General Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-GEN-01 | Fields pre-filled | Hospital name, contact email, phone shown with current values |
| WS-ST-GEN-02 | Edit and save | Modify name → click Save → "Saved!" inline flash appears (3s) then disappears. No toast. |
| WS-ST-GEN-03 | Save error | If backend rejects update → inline `<p role="alert">` error shown. Not a toast. |
| WS-ST-GEN-04 | Loading state on save | Save button shows loading while request in-flight |
| WS-ST-GEN-05 | AppButton for save | Save button is `<AppButton variant="primary">` |
| WS-ST-GEN-06 | AppText for labels | All field labels and section headings use `<AppText>` |

#### 2.4.3 Settings — Branding Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-BR-01 | Color pickers render | Primary and secondary color pickers visible |
| WS-ST-BR-02 | Live preview strip | Changing a color updates the preview strip in real-time without saving |
| WS-ST-BR-03 | Save branding | Click save → "Saved!" inline flash. No toast. |
| WS-ST-BR-04 | Save error | Inline error on failure, not toast |
| WS-ST-BR-05 | Color values | Preview strip uses the selected hex — but the component code itself must use color tokens for its own UI chrome (not for the live preview values, which are user data) |

#### 2.4.4 Settings — Modules Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-MOD-01 | Module rows render | Each available module shown as a row with name, description, toggle |
| WS-ST-MOD-02 | Toggle switch semantics | Toggle uses `role="switch"` with `aria-checked`. Using raw `<button role="switch">` here is acceptable — verify `aria-checked` is set correctly |
| WS-ST-MOD-03 | Toggle on → enabled | Click toggle for disabled module → optimistic update or API call → module shows as enabled |
| WS-ST-MOD-04 | Toggle off → disabled | Click toggle for enabled module → module shows as disabled |
| WS-ST-MOD-05 | Toggle error handling | If API fails, error shown inline. Toggle reverts to previous state. |
| WS-ST-MOD-06 | `<Repeat>` for module rows | Module rows rendered via `<Repeat>` — not `.map()` |

#### 2.4.5 Settings — Domain Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-DOM-01 | Subdomain visible | Current subdomain/slug displayed |
| WS-ST-DOM-02 | Domain verification badge | If domain verified: green badge. If unverified: yellow/red badge with instructions. |
| WS-ST-DOM-03 | DNS instructions shown | DNS record instructions visible. |
| WS-ST-DOM-04 | CopyToClipboard component | DNS value or domain string uses `<CopyToClipboard>` from meemaw — not a raw button with JS copy |
| WS-ST-DOM-05 | Copy interaction | Clicking copy shows feedback (meemaw CopyToClipboard handles this). |
| WS-ST-DOM-06 | Loadable wrapping | Domain data fetched async — `<Loadable>` used for loading/error states |
| WS-ST-DOM-07 | Update domain | If domain update is supported — test save + inline error/success pattern |

#### 2.4.6 Settings — Usage Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-USE-01 | Plan badge renders | Current plan (e.g. "Free", "Pro") shown as a badge |
| WS-ST-USE-02 | Usage bars render | Each usage category (staff count, etc.) shows a `UsageBar` component with current/max values |
| WS-ST-USE-03 | Loadable wrapping | Usage data fetched async — `<Loadable>` wraps the content |
| WS-ST-USE-04 | Usage bar visual | Bar fill proportional to usage. Color change near limit (if any). |
| WS-ST-USE-05 | AppText for labels | Usage labels and numbers use `<AppText>` |

#### 2.4.7 Settings — Danger Zone Tab

| ID | Test | Expected |
|---|---|---|
| WS-ST-DZ-01 | Danger zone section visible | Red-tinted section or warning heading visible |
| WS-ST-DZ-02 | Archive button variant | "Archive hospital" button uses `<AppButton variant="danger">` |
| WS-ST-DZ-03 | Archive expand — inline confirmation | Clicking Archive expands an inline confirmation panel (NOT a DrawerService modal — this is intentional design, verify it's the in-place `Show` expand pattern) |
| WS-ST-DZ-04 | Name confirmation field | Inline confirmation requires typing hospital name exactly before enabling final confirm |
| WS-ST-DZ-05 | Confirm button disabled until name matches | "Confirm archive" button disabled until typed name === hospital name |
| WS-ST-DZ-06 | Successful archive | After confirming, hospital archived → redirect or empty state. Toast or inline confirmation? Verify. |
| WS-ST-DZ-07 | Cancel collapses panel | Clicking cancel/back hides the inline confirmation panel. No state leaked. |
| WS-ST-DZ-08 | `canDelete` gate | If `canDelete` is false, destructive action blocked or button not shown. Verify the guard logic works. |

---

### 2.5 AppShell — Sidebar & Topbar

**Files:** `app-shell.tsx`, `sidebar.tsx`, `topbar.tsx`

#### 2.5.1 Sidebar

| ID | Test | Expected |
|---|---|---|
| WS-SB-VIS-01 | Sidebar renders on all `/h/:slug/*` routes | Sidebar visible on dashboard, settings, and staff routes |
| WS-SB-VIS-02 | Nav items filtered by module | If EMR module disabled, EMR nav item hidden. `buildNavEntries()` filters correctly. |
| WS-SB-VIS-03 | Active nav link highlighted | Current route's nav item has active class (different color or bold). |
| WS-SB-VIS-04 | `<Repeat>` for nav links | Sidebar nav links rendered via `<Repeat>` — not raw `.map()`. **Known violation — verify.** |
| WS-SB-VIS-05 | Color tokens | Sidebar bg, text, active states use design tokens — not raw hex |
| WS-SB-NAV-01 | Click Staff nav → `/h/:slug/staff` | Navigates correctly |
| WS-SB-NAV-02 | Click Dashboard nav → `/h/:slug/dashboard` | Navigates correctly |
| WS-SB-NAV-03 | Click Settings nav → `/h/:slug/settings` | Navigates correctly |

#### 2.5.2 Topbar

| ID | Test | Expected |
|---|---|---|
| WS-TB-VIS-01 | Topbar renders | Search + notifications links + user menu visible |
| WS-TB-VIS-02 | User display | Topbar shows user's display name — NOT email. (Known bug from Auth report: L-HP-03. Verify if fixed or still broken.) |
| WS-TB-VIS-03 | Logout triggers navigation | Clicking logout → tokens cleared + redirect to `/login`. (Known bug FE-BUG-02. Verify if fixed or still broken.) |
| WS-TB-VIS-04 | AppText for any text content | If topbar renders text (username, labels), uses `<AppText>` |

---

## Module 3 — Staff

---

### 3.1 Staff Directory Screen

**Route:** `/h/:slug/staff`
**Files:** `staff-directory-screen.tsx`, `staff-table.tsx`, `staff-filters.tsx`

#### 3.1.1 Visual & Layout

| ID | Test | Expected |
|---|---|---|
| ST-DIR-VIS-01 | Page heading | "Staff" heading rendered with `<AppText variant="heading-1">` or `heading-2` |
| ST-DIR-VIS-02 | Filter bar renders | Search input, role select, status select visible above the table |
| ST-DIR-VIS-03 | Staff table renders | Table with columns: name/initials, role, status, department, action button |
| ST-DIR-VIS-04 | AppText in table | Role, name, department text use `<AppText>` — not raw `<td>` text |
| ST-DIR-VIS-05 | Status badge | Active members show green badge. Suspended members show red badge. Using design tokens. |
| ST-DIR-VIS-06 | `<Repeat>` for table rows | Staff rows rendered via `<Repeat each={members}>` — not `.map()` |
| ST-DIR-VIS-07 | View button per row | Each row has a "View" or profile link as `<AppButton variant="ghost">` |
| ST-DIR-VIS-08 | Pagination controls | Previous / Next buttons are `<AppButton>` — not raw `<button>` |
| ST-DIR-VIS-09 | "Invite staff" button | CTA button uses `<AppButton variant="primary">` |

#### 3.1.2 Filters

| ID | Test | Expected |
|---|---|---|
| ST-DIR-FLT-01 | Search by name | Type partial name → table updates to matching members |
| ST-DIR-FLT-02 | Filter by role | Select "Doctor" → table shows only doctors |
| ST-DIR-FLT-03 | Filter by status | Select "Suspended" → table shows only suspended members |
| ST-DIR-FLT-04 | Combined filters | Name search + role filter combined → table shows intersection |
| ST-DIR-FLT-05 | Clear filters button | After applying filters, a "Clear" button appears (via `<Show>`). Clicking it resets all filters. |
| ST-DIR-FLT-06 | Filter with no results | Empty state shown when filter matches no members. Not a blank table. |

#### 3.1.3 Pagination

| ID | Test | Expected |
|---|---|---|
| ST-DIR-PAG-01 | First page loads | Default: page 1, PAGE_SIZE=20 members shown (or fewer if less exist) |
| ST-DIR-PAG-02 | Next page | Click Next → page 2 loads. Table content changes. |
| ST-DIR-PAG-03 | Previous page | From page 2, click Previous → page 1 restored |
| ST-DIR-PAG-04 | Disable Next on last page | Next button disabled when on last page |
| ST-DIR-PAG-05 | Disable Previous on first page | Previous button disabled when on page 1 |

#### 3.1.4 Loading & Error States

| ID | Test | Expected |
|---|---|---|
| ST-DIR-LOAD-01 | Loading state | `<Loadable>` loading component renders while staff fetches |
| ST-DIR-LOAD-02 | Error state | Fetch error → `errorComponent` with `<p role="alert">` |
| ST-DIR-LOAD-03 | Empty directory | Hospital with no staff → empty state UI (icon + message + invite CTA) |

---

### 3.2 Pending Invitations List

**Component:** `InvitationList` in `invitation-row.tsx` (rendered on staff directory screen)

#### 3.2.1 Visual

| ID | Test | Expected |
|---|---|---|
| ST-INV-VIS-01 | Section renders only when pending exist | `<Show when={pending.length > 0}>` — invitation section hidden if no pending invitations |
| ST-INV-VIS-02 | Section header | "Pending invitations" label + count badge visible |
| ST-INV-VIS-03 | Invitation row layout | Email, role label, department (if set), Resend + Revoke buttons |
| ST-INV-VIS-04 | Role label from map | Role displayed as human label (e.g. "Doctor" not "doctor") |
| ST-INV-VIS-05 | `<Repeat>` for invitation rows | Rendered via `<Repeat>` — not `.map()` |
| ST-INV-VIS-06 | Resend button icon | `IconRefresh` icon + "Resend" label. `<AppButton variant="ghost">` |
| ST-INV-VIS-07 | Revoke button icon | `IconClose` icon + "Revoke" label. `<AppButton variant="ghost">` |

#### 3.2.2 Resend Invitation — Confirmation Modal

| ID | Test | Expected |
|---|---|---|
| ST-INV-RESEND-01 | Click Resend → modal appears | `DrawerService.showConfirmationModal` fires with title "Resend invitation?" |
| ST-INV-RESEND-02 | Modal body text | Body mentions recipient's email address |
| ST-INV-RESEND-03 | Modal has Resend + Cancel buttons | Both present. Cancel dismisses without action. |
| ST-INV-RESEND-04 | Confirm resend → API call | `resendMutation.mutateAsync(inv.id)` fires |
| ST-INV-RESEND-05 | Resend success toast | `DrawerService.toast("Invitation resent to X", { type: 'success' })` appears |
| ST-INV-RESEND-06 | Resend error toast | If API fails, `DrawerService.toast(message, { type: 'error' })` appears |
| ST-INV-RESEND-07 | Loading state on button | While resend in-flight, button shows `loading` state (`resendMutation.isPending && variables === inv.id`) |

#### 3.2.3 Revoke Invitation — Confirmation Modal

| ID | Test | Expected |
|---|---|---|
| ST-INV-REVOKE-01 | Click Revoke → modal appears | `DrawerService.showConfirmationModal` fires with title "Revoke invitation?" |
| ST-INV-REVOKE-02 | Modal is destructive style | Modal renders with `kind: 'error'` and `destructive: true` styling (red confirm button) |
| ST-INV-REVOKE-03 | Modal body text | Body mentions recipient's email and consequence ("will no longer be able to join") |
| ST-INV-REVOKE-04 | Confirm revoke → API call | `revokeMutation.mutateAsync(inv.id)` fires |
| ST-INV-REVOKE-05 | Revoke success toast | `DrawerService.toast("Invitation for X has been revoked.", { type: 'info' })` appears |
| ST-INV-REVOKE-06 | Revoke error toast | If API fails, error toast appears |
| ST-INV-REVOKE-07 | Loading state on button | While revoke in-flight, Revoke button shows loading (`revokeMutation.isPending && variables === inv.id`) |
| ST-INV-REVOKE-08 | Invitation disappears after revoke | After successful revoke, row is removed from pending list (via query invalidation) |

---

### 3.3 Staff Invite Screen

**Route:** `/h/:slug/staff/invite`
**Files:** `staff-invite-screen.tsx`, `invite-form.tsx`, `csv-upload.tsx`

#### 3.3.1 Layout

| ID | Test | Expected |
|---|---|---|
| ST-INV-SCR-VIS-01 | Screen renders with AppShell | Sidebar + topbar present. Back navigation available. |
| ST-INV-SCR-VIS-02 | Two sections | Single invite form + CSV upload section with a divider between them |
| ST-INV-SCR-VIS-03 | Hospital name in heading | Screen or form heading references the hospital name (from `useHospitalBySlug`) |
| ST-INV-SCR-VIS-04 | AppText headings | Section headings ("Invite by email", "Bulk invite via CSV") use `<AppText>` |

#### 3.3.2 Single Invite Form

| ID | Test | Expected |
|---|---|---|
| ST-INV-FORM-01 | Email required | Submitting with empty email → inline error. No API call. |
| ST-INV-FORM-02 | Role required | Submitting without selecting role → inline error. No API call. |
| ST-INV-FORM-03 | Department optional | Inviting without department → succeeds |
| ST-INV-FORM-04 | Unit optional | Inviting without unit → succeeds |
| ST-INV-FORM-05 | Invalid email format | Submitting `notanemail` → client-side validation error inline. No API call. |
| ST-INV-FORM-06 | Happy path — valid invite | Submit valid email + role → API call → inline "Invitation sent to X" success state shown |
| ST-INV-FORM-07 | Success state replaces form | After success, form is replaced or reset with success message inline (not a toast) |
| ST-INV-FORM-08 | Duplicate invite error | Inviting already-invited email → API error rendered inline as `<p role="alert">` |
| ST-INV-FORM-09 | Already-member error | Inviting existing staff member → API error rendered inline |
| ST-INV-FORM-10 | Loading state | Submit button shows loading while request in-flight |
| ST-INV-FORM-11 | AppButton for submit | "Send invitation" button is `<AppButton variant="primary">` |
| ST-INV-FORM-12 | Role options use `<Repeat>` | Role select options rendered via `<Repeat>` or select element (acceptable for native `<select>`) — not `.map()` in JSX |

#### 3.3.3 CSV Upload

| ID | Test | Expected |
|---|---|---|
| ST-INV-CSV-01 | Upload area visible | CSV upload input/dropzone visible |
| ST-INV-CSV-02 | Upload valid CSV | Upload a valid CSV → success feedback shown |
| ST-INV-CSV-03 | Upload invalid file type | Upload a `.txt` or `.pdf` → error shown inline. Not accepted. |
| ST-INV-CSV-04 | Upload malformed CSV | CSV with missing required columns → error shown |
| ST-INV-CSV-05 | Error display | CSV errors shown inline as `<p role="alert">` — not toast |

---

### 3.4 Staff Profile Screen

**Route:** `/h/:slug/staff/:staffId`
**Files:** `staff-profile-screen.tsx`, `profile-header.tsx`, `profile-info.tsx`, `profile-meta.tsx`

#### 3.4.1 Visual & Layout

| ID | Test | Expected |
|---|---|---|
| ST-PRF-VIS-01 | Back navigation | "Back to staff" button renders as `<AppButton variant="ghost">` with `IconArrowLeft`. Links to `/h/:slug/staff`. |
| ST-PRF-VIS-02 | `<Loadable>` wrapping | Content wrapped in `<Loadable>` with skeleton loading + error component |
| ST-PRF-VIS-03 | `<Show when={member !== undefined}>` | Member content gated by `<Show>` — not raw `&&` |
| ST-PRF-VIS-04 | Profile header color stripe | Green stripe for active, red stripe for suspended member |
| ST-PRF-VIS-05 | Avatar initials | Initials derived from member name using `getInitials()`. Fallback to role first 2 chars if name absent. |
| ST-PRF-VIS-06 | Status badge | Active → green pill "Active". Suspended → red pill "Suspended". Color tokens used. |
| ST-PRF-VIS-07 | Role + dept + unit in header | `<AppText variant="body-sm">` showing role · department · unit (with `Show` for optional fields) |
| ST-PRF-VIS-08 | Email in header | `<AppText variant="caption">` showing email or member ID fallback |
| ST-PRF-VIS-09 | Profile grid layout | `lg:grid-cols-[1fr_280px]` — info on left, meta on right |

#### 3.4.2 Loading & Error

| ID | Test | Expected |
|---|---|---|
| ST-PRF-LOAD-01 | Loading state | Skeleton pulses shown while profile loads |
| ST-PRF-LOAD-02 | Unknown staff ID | `/h/:slug/staff/nonexistent` → `errorComponent` renders: `<p role="alert">` "Could not load staff profile." |

#### 3.4.3 Suspend Staff — Confirmation Modal

| ID | Test | Expected |
|---|---|---|
| ST-PRF-SUSP-01 | Suspend button visible only when active | `<Show when={member.status === 'active'}>` — Suspend button hidden for suspended members |
| ST-PRF-SUSP-02 | Click Suspend → modal | `DrawerService.showConfirmationModal` fires: "Suspend staff member?" |
| ST-PRF-SUSP-03 | Modal kind is warning | Modal renders with `kind: 'warning'` styling |
| ST-PRF-SUSP-04 | Modal body | Body includes staff member's name and consequence ("will lose access immediately") |
| ST-PRF-SUSP-05 | Cancel → no action | Cancel dismisses modal, staff member status unchanged |
| ST-PRF-SUSP-06 | Confirm suspend → API + toast | `suspendMutation.mutateAsync(staffId)` fires → `DrawerService.toast("X has been suspended.", { type: 'warning' })` |
| ST-PRF-SUSP-07 | After suspend — UI updates | Profile header stripe turns red. Status badge changes to "Suspended". Suspend button hidden, Activate button appears. |
| ST-PRF-SUSP-08 | Suspend error | If API fails, `DrawerService.toast(message, { type: 'error' })` appears |

#### 3.4.4 Activate Staff — Confirmation Modal

| ID | Test | Expected |
|---|---|---|
| ST-PRF-ACT-01 | Activate button visible only when suspended | `<Show when={member.status === 'suspended'}>` — Activate hidden for active members |
| ST-PRF-ACT-02 | Click Activate → modal | `DrawerService.showConfirmationModal` fires: "Reactivate staff member?" |
| ST-PRF-ACT-03 | Modal is neutral (no warning/error kind) | Default modal style (no destructive styling) |
| ST-PRF-ACT-04 | Confirm activate → API + toast | `activateMutation.mutateAsync(staffId)` fires → `DrawerService.toast("X has been reactivated.", { type: 'success' })` |
| ST-PRF-ACT-05 | After activate — UI updates | Stripe turns green. Badge shows "Active". Activate hidden, Suspend appears. |
| ST-PRF-ACT-06 | Activate error | Error toast on failure |

#### 3.4.5 Remove Staff — Confirmation Modal (Destructive)

| ID | Test | Expected |
|---|---|---|
| ST-PRF-REM-01 | Remove button always visible | Remove button shown regardless of status (no `<Show>` gate) |
| ST-PRF-REM-02 | Click Remove → modal | `DrawerService.showConfirmationModal` fires: "Remove staff member?" |
| ST-PRF-REM-03 | Modal is destructive | `kind: 'error'`, `destructive: true` — red confirm button |
| ST-PRF-REM-04 | Modal body | Body includes name and "cannot be undone" language |
| ST-PRF-REM-05 | Cancel → no action | Modal dismissed, staff member not removed |
| ST-PRF-REM-06 | Confirm remove → API call | `removeMutation.mutateAsync(staffId)` fires |
| ST-PRF-REM-07 | After remove → navigate + toast | `navigate(ROUTES.HOSPITAL_STAFF(slug))` called. `DrawerService.toast("X has been removed.", { type: 'info' })` shown. |
| ST-PRF-REM-08 | Remove error | Error toast on failure. User stays on profile page. |

#### 3.4.6 Profile Info — Inline Edit

| ID | Test | Expected |
|---|---|---|
| ST-PRF-EDIT-01 | Edit mode toggle | "Edit" button visible. Clicking enters edit mode with form fields. |
| ST-PRF-EDIT-02 | Role, dept, unit, specialty editable | Fields shown in edit mode. Role uses a select. |
| ST-PRF-EDIT-03 | Save changes | Submit → inline "Saved!" state or success indicator. Not a toast. |
| ST-PRF-EDIT-04 | Save error | Inline `<p role="alert">` error — not a toast |
| ST-PRF-EDIT-05 | Cancel edit | Cancel returns to read-only view. Changes not saved. |
| ST-PRF-EDIT-06 | Role options use `<Repeat>` | Role select options rendered via `<Repeat>` — not `.map()` |

---

### 3.5 Org Chart Screen

**Route:** `/h/:slug/staff/org-chart`
**Files:** `org-chart-screen.tsx`

#### 3.5.1 Visual & Layout

| ID | Test | Expected |
|---|---|---|
| ST-ORG-VIS-01 | Screen renders with AppShell | Sidebar + topbar present |
| ST-ORG-VIS-02 | Top-level vs reports split | Screen shows top-level members separately from those with a `managerId` |
| ST-ORG-VIS-03 | MemberRow component | Each member row shows: initials avatar, name, role, department |
| ST-ORG-VIS-04 | `<Repeat>` for member rows | Member rows rendered via `<Repeat>` — not `.map()` |
| ST-ORG-VIS-05 | AppText for names/roles | Member name and role text use `<AppText>` |
| ST-ORG-VIS-06 | Empty state | If no staff, empty state shown (icon + message) — not blank page |

#### 3.5.2 Loading & Error

| ID | Test | Expected |
|---|---|---|
| ST-ORG-LOAD-01 | Loading state | `<Loadable>` renders skeleton while org data fetches |
| ST-ORG-LOAD-02 | Fetch error | `errorComponent` with `<p role="alert">` on fetch failure |

---

## Cross-Cutting Checks (Modules 2 & 3)

These are checked globally across all Module 2 and 3 screens.

| ID | Check | Expected |
|---|---|---|
| CC-MEEMAW-01 | No raw `.map()` in JSX | Every list rendering uses `<Repeat>`. Inspect: sidebar nav, tab nav, module rows, staff table, invitation list, org chart rows, step indicator, type options, role options. |
| CC-MEEMAW-02 | No raw `&&` or ternary in JSX | Conditional rendering uses `<Show>`, `<Switch>`/`<Case>`, or `<Hidden>`. |
| CC-MEEMAW-03 | `<Loadable>` for async data | Every screen that fetches data uses `<Loadable>` with explicit `loadingComponent` and `errorComponent`. |
| CC-MEEMAW-04 | `<CopyToClipboard>` from meemaw | Used in Domain settings — no raw `navigator.clipboard` in JSX. |
| CC-APPBUTTON-01 | No raw `<button>` for actions | All clickable buttons (CTAs, actions, nav) use `<AppButton>`. Exceptions: `role="switch"` toggle in Modules tab (semantic). |
| CC-APPTEXT-01 | No raw HTML text elements | All headings, labels, body text, captions use `<AppText variant="...">`. No raw `<h1>`–`<h6>`, `<p>`, `<span>` for visible text content. |
| CC-COLOR-01 | No raw hex in className | No `bg-[#...]`, `text-[#...]`, `border-[#...]`. Only design tokens. |
| CC-MODAL-01 | Confirmation modals for dangerous actions | Suspend, activate, remove staff, revoke/resend invitation all trigger `DrawerService.showConfirmationModal` before API call. |
| CC-TOAST-01 | Toasts for post-mutation feedback | After confirmed mutations (suspend/activate/remove/resend/revoke), `DrawerService.toast` fires with appropriate type. |
| CC-ERROR-01 | No toasts for errors | Form errors, validation errors, API errors on forms rendered as inline `<p role="alert">`. Never as toast. |
| CC-TOAST-02 | No toasts for form save success | Settings form saves show inline "Saved!" flash — not `DrawerService.toast`. |
| CC-FSD-01 | Folder structure | Each feature follows: `screen/`, `screen/parts/`, `api/`, `providers/`, `shared/types/`. No files in wrong layer. |
| CC-EXPORT-01 | Named exports only | No `export default` in any component file. |
| CC-READONLY-01 | Readonly props | All component interfaces use `readonly` on every property. |
| CC-GUARD-01 | Route guards functional | `/h/:slug/*` routes redirect to `/login` if unauthenticated. Redirect to `/hospitals` if no `activeHospitalId`. |
| CC-GUARD-02 | HospitalShell loads slug | Navigating to any `/h/:slug/*` route correctly resolves hospital by slug before rendering content. |
| CC-A11Y-01 | Role alerts on errors | All inline errors have `role="alert"` for screen reader accessibility. |
| CC-A11Y-02 | Button labels | All `<AppButton>` elements have meaningful text or `aria-label`. Icon-only buttons have `aria-label`. |

---

## Test Data

| Account | Role | Notes |
|---|---|---|
| `alice@medcord.test` / `Medcord123!` | hospital_admin | Primary test account. Has at least 1 hospital. |
| `bob@medcord.test` / `Medcord123!` | doctor | Staff member in alice's hospital |
| Invite target: `newstaff@medcord.test` | — | Use for invitation happy path (not in DB) |

> **Note:** If users don't exist or tokens are expired, run `node docs/qas/backend/scripts/restore-seed.mjs` — it is safe to re-run and will not wipe existing data.

---

## Test Count Summary

| Section | Tests |
|---|---|
| WS — Hospital List | 10 |
| WS — Hospital Create | 13 |
| WS — Hospital Dashboard | 7 |
| WS — Settings (all tabs) | 30 |
| WS — AppShell (Sidebar + Topbar) | 10 |
| ST — Staff Directory + Filters + Pagination | 18 |
| ST — Pending Invitations (resend + revoke) | 15 |
| ST — Staff Invite (form + CSV) | 15 |
| ST — Staff Profile (view + suspend + activate + remove + edit) | 25 |
| ST — Org Chart | 6 |
| Cross-cutting | 16 |
| **Total** | **165** |
