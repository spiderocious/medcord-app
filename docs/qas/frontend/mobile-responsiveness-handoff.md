# QA Handoff — Mobile Responsiveness

**Date:** 2026-05-17
**Build status:** Typecheck ✅ · Lint ✅
**Scope:** Mobile-first responsive layout across all medcord-web screens
**Test viewport:** 375px wide (iPhone SE) and 390px wide (iPhone 14) — primary mobile targets. Desktop verification at 1280px+.

---

## Overview

This pass makes every screen in medcord-web usable on mobile devices. Desktop layout is unchanged — all fixes use base (mobile-first) Tailwind classes with `sm:` / `md:` / `lg:` overrides for larger viewports.

---

## 1. AppShell — Sidebar Navigation

**Files changed:**
- `src/shared/widgets/app-shell/app-shell.tsx`
- `src/shared/widgets/app-shell/parts/sidebar.tsx`
- `src/shared/widgets/app-shell/parts/topbar.tsx`

**What changed:**
On mobile (`< md` / 768px), the sidebar is now hidden by default and becomes an off-canvas overlay drawer. A hamburger menu button appears in the topbar. Tapping the hamburger slides the sidebar in from the left. Tapping the backdrop or any nav link closes it. On desktop (`md+`), the sidebar is always visible — no change.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open any hospital screen on 375px viewport | Sidebar is NOT visible; hamburger `☰` appears in topbar on the left of "Medcord" |
| 2 | Tap the hamburger button | Sidebar slides in from left, dark backdrop covers the content area |
| 3 | Tap the backdrop | Sidebar closes, backdrop disappears |
| 4 | Tap the `×` button inside the sidebar | Sidebar closes |
| 5 | Tap any nav link (e.g. Patients) | Sidebar closes and navigates to the correct route |
| 6 | Resize to 768px+ | Hamburger disappears, sidebar is always visible, no backdrop, no `×` button |
| 7 | On desktop, the sidebar `×` button must NOT be visible | Confirmed hidden with `md:hidden` |

---

## 2. @medcord/ui — Table Component

**File changed:** `packages/ui/src/table/table.tsx`

**What changed:** The `<Table>` component now wraps the `<table>` element in an `overflow-x-auto` `<div>`. The table uses `min-w-full` instead of `w-full`. This affects all consumers of `<Table>` — currently the staff directory table.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Staff directory on 375px | Table scrolls horizontally, content is not truncated |
| 2 | All columns visible by scrolling | No column overflow outside the card boundary |
| 3 | On desktop 1280px | Table fills its container as before, no layout change |

---

## 3. Patient List Screen

**Files changed:**
- `src/features/patients/features/patient-list/screen/patient-list-screen.tsx`
- `src/features/patients/features/patient-list/screen/parts/patient-table.tsx`

**What changed (screen):** The header row (`Patients` heading + `Register patient` button) now stacks vertically on mobile and becomes a `flex-row` at `sm+`.

**What changed (table):** On mobile (`< md`), the table is hidden and replaced with tappable cards. Each card shows: patient name, patient code, admission status pill, DOB, and phone. On desktop `md+`, the original 5-column table is shown.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Patients on 375px | Heading appears above the Register button (stacked) |
| 2 | Scroll patient list on mobile | Card rows visible: name (bold), code (mono), status pill, DOB, phone |
| 3 | Tap a patient card | Navigates to patient profile |
| 4 | No horizontal table overflow on mobile | Table element is not rendered on mobile (`md:hidden`) |
| 5 | On desktop 1280px | 5-column table shown as before, cards hidden |

---

## 4. Lab Orders Screen

**File changed:** `src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx`

**What changed:** Header row stacks on mobile. On mobile (`< md`), table replaced with tappable cards showing: test name, test code, status pill, priority badge, ordered-by, date. Desktop table unchanged.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Lab orders on 375px | Header stacked; cards visible with test name, status pill, priority, ordered-by, date |
| 2 | Tap a lab order card | Navigates to lab order detail |
| 3 | Status pills render with correct colours on mobile cards | Same colours as desktop table |
| 4 | On desktop | 5-column table shown as before |

---

## 5. Asset List Screen

**File changed:** `src/features/assets/features/asset-list/screen/parts/asset-table.tsx`

**What changed:** On mobile (`< md`), table replaced with cards. Each card shows: asset name, model, status pill, category, location, tag. The Delete button is in a separate row at the bottom of each card (separated by a thin border). Desktop table unchanged.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Assets on 375px | Cards visible with name, status pill, category, location, tag |
| 2 | Tap asset name area | Navigates to asset detail |
| 3 | Tap Delete button on a card | Confirmation modal appears (destructive) |
| 4 | Delete button does NOT trigger navigation | `e.stopPropagation()` is already handled |
| 5 | On desktop | 6-column table shown as before |

---

## 6. Checked-In Patients Screen

**File changed:** `src/features/patients/features/patient-checkedin/screen/checkedin-patients-screen.tsx`

**What changed:** Header and filters stack on mobile. On mobile (`< md`), table replaced with cards. Each card shows: queue number (large), patient name (tappable link to profile), patient code, stage pill, department, check-in time, and Remove button for users with PATIENT_ADMIT permission.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Checked-In Patients on 375px | Cards visible: `#3` (large), name, code, stage pill, dept, time, Remove |
| 2 | Tap patient name | Navigates to patient profile |
| 3 | Tap Remove | Confirmation modal appears |
| 4 | Stage filter dropdown stacks above search input on mobile | Both inputs full-width |
| 5 | On desktop | 6-column table shown as before |

---

## 7. Hospital List Screen

**File changed:** `src/features/workspace/features/hospital-list/screen/hospital-list-screen.tsx`

**What changed:**
- Topbar: email address hidden on mobile (shown at `sm+`), padding reduced to `px-4`
- Title + New hospital button: stacks vertically on mobile, flex-row at `sm+`
- Main content vertical padding reduced to `py-8` on mobile, `py-12` at `sm+`

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open hospital list on 375px | "Medcord" + Sign out button in topbar, email NOT visible |
| 2 | "Your workspaces" heading above "New hospital" button (stacked) | ✓ |
| 3 | On 640px+ | Email appears truncated in topbar; heading and button side-by-side |

---

## 8. Roles Screen

**File changed:** `src/features/staff/features/roles/screen/roles-screen.tsx`

**What changed:**
- Header row stacks on mobile
- Both system roles table and custom roles table now have `overflow-x-auto` wrappers and use `min-w-full`

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Roles on 375px | Header stacked; both tables scroll horizontally |
| 2 | Scroll system roles table | All columns (Name, Permissions, Members, actions) accessible |
| 3 | Scroll custom roles table | All columns (Name, Permissions, Members, Created, actions) accessible |
| 4 | On desktop | Tables fill container, no change |

---

## 9. Auth Layout

**File changed:** `src/features/auth/shared/parts/auth-layout.tsx`

**What changed:** Card padding is `p-6` on mobile, `p-8` at `sm+`.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Login on 375px | Form card has comfortable padding (not full-bleed on tiny screens) |
| 2 | Open Register on 375px | Same |
| 3 | On desktop | Card padding unchanged (`p-8`) |

---

## 10. Queue Board Screen

**File changed:** `src/features/queue/screen/queue-board-screen.tsx`

**What changed:**
- Header row stacks on mobile
- "Now serving" banner: active visit badges now `flex-wrap` so they don't overflow on narrow screens

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Queue Board on 375px | Header stacked |
| 2 | With 3+ active visits, the "Now serving" banner wraps to multiple lines | No horizontal overflow |
| 3 | Board columns (`grid lg:grid-cols-3`) appear as single column on mobile | ✓ already correct before this PR |

---

## 11. Patient Profile Header

**File changed:** `src/features/patients/features/patient-profile/screen/parts/profile-header.tsx`

**What changed:** The avatar+name group and the Favorite button now use `flex-wrap` so they don't get crushed on narrow screens.

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open patient profile on 375px with long patient name | Favorite button wraps to next line gracefully |
| 2 | Favorite / Unfavorite still works | ✓ |

---

## 12. Admitted Patients Screen

**File changed:** `src/features/patients/features/patient-admitted/screen/admitted-patients-screen.tsx`

**What changed:**
- Header row stacks on mobile
- Table enforces `min-w-[550px]` so it scrolls rather than squashing below the `overflow-x-auto` wrapper

**Test cases:**

| # | Action | Expected |
|---|---|---|
| 1 | Open Admitted Patients on 375px | Header stacked; table scrolls horizontally |
| 2 | All 4-5 columns visible by scrolling | No column text truncation |

---

## Screens NOT Changed (Already Responsive)

Confirm these are unaffected — no regressions expected:

| Screen | Why untouched |
|---|---|
| Login / Register / 2FA | `w-full` inputs, `max-w-md` card |
| Hospital Create wizard | Already had `sm:` breakpoints |
| Hospital Dashboard | Already responsive (`flex-col sm:flex-row`, grid) |
| Hospital Settings | Tabs already have `overflow-x-auto scrollbar-hide` |
| Patient Profile page (layout) | `grid lg:grid-cols-3` — single column below lg |
| EMR chart tabs | `overflow-x-auto` already in place |
| EMR chart overview | `grid sm:grid-cols-2 lg:grid-cols-3` |
| Lab order detail | Stepper already has `overflow-x-auto`, layout `grid lg:grid-cols-3` |
| Staff directory (header + filters) | Already `flex-col sm:flex-row` |
| Staff profile | `grid lg:grid-cols-[1fr_280px]` |
| Role view / edit | `grid lg:grid-cols-2` |
| Invite form | `grid sm:grid-cols-2` |
| Transfers screen | Tab nav + card list, `max-w-3xl` |
| Search screen | `max-w-3xl`, card results |
| All modals | `max-w-[calc(100vw-32px)]` clamping on `DrawerService` |

---

## Regression Focus Areas

These areas are most likely to have subtle regressions — pay extra attention:

1. **Sidebar on desktop** — must be always visible at 768px+, no hamburger button
2. **Patient table on desktop** — 5-column table must render exactly as before
3. **Lab orders table on desktop** — same
4. **Asset table on desktop** — same, including the Delete button positioning
5. **Roles tables on desktop** — no visual change expected, only overflow wrapper added

---

## Out of Scope

- [ ] Patient profile demographics form fields (already OK on mobile — `w-full` inputs)
- [ ] EMR vitals/medications inline tables — horizontally scrollable, acceptable for clinical staff
- [ ] Notification drawer mobile layout — deferred
- [ ] Review Queue screen mobile — no data yet in QA environment
