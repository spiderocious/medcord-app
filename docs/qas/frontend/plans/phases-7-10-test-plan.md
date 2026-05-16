# Test Plan — Phases 7, 8, 9, 10

**Prepared:** 2026-05-16  
**Ref:** cross-cutting-test-plan.md (applies to all tests here)  
**Source spec:** `docs/frontend-phases-7-10-spec.md`  
**QA handoff:** `docs/qas/frontend/qa-handoff-phases-7-10.md`  
**Seed user:** alice@medcord.test / Medcord123!  
**Screenshots →** `/Users/feranmi/codebases/2026/medcord-app/screenshots/`

---

## Pre-flight

Before running any tests:

1. Confirm backend is running: `curl http://localhost:8085/api/v1/health`
2. Confirm medcord-web is on 5173: open `http://localhost:5173`
3. Log in as `alice@medcord.test / Medcord123!`
4. Fetch live IDs — needed throughout the plan:
   ```
   curl http://localhost:8085/api/v1/hospitals         → hospitalId (HSP-*)
   curl http://localhost:8085/api/v1/hospitals/:id/patients  → patientId, patientCode
   curl http://localhost:8085/api/v1/hospitals/:id/labs?limit=5 → orderId, patientId (on order)
   curl http://localhost:8085/api/v1/hospitals/:id/assets?limit=5 → assetId
   ```
5. Resolve `activeHospitalId` workaround (BUG-CRIT-01 — `setActiveHospitalId` never called):
   ```js
   sessionStorage.setItem('medcord.active_hospital', '<HSP-ID-from-step-4>')
   ```
   Do this in the browser console after login, before navigating to any module screen. Every time browser session resets, reapply.
6. Confirm screenshots dir exists: `ls /Users/feranmi/codebases/2026/medcord-app/screenshots/`

---

## Phase 7 — Labs (Completion)

### L2 — Lab Orders Screen — row click navigation (updated behaviour)

**Route:** `/h/:slug/labs`  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx`

These tests require at least one lab order to exist. If none, create one via "New order" before running.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L2-01 | Table row has `onClick` | Each row is clickable (cursor-pointer) | `agent-browser snapshot` — check `tr` or row wrapper has click handler; `agent-browser screenshot --annotate` |
| L2-02 | Row click navigates to lab order detail | URL becomes `/h/:slug/labs/:orderId?patientId=<id>` | Click row via `agent-browser eval "document.querySelector('tbody tr').click()"`, then `agent-browser get url` |
| L2-03 | `patientId` query param is present and correct | URL contains `?patientId=<actualPatientId>` — not empty string | Check URL after navigation; also check that the order's `patientId` matches what's in the param |

**Bug to probe (L2-03):** Source shows `order.patientId` is used in the `onClick`. But previously the `CreateLabOrderForm` was passing `patientId=""` for hospital-wide orders. Orders created from the hospital-wide screen may have a blank `patientId`, which means the detail screen can't fetch from the backend (`GET .../patients//labs/:id` → 404). Verify whether any orders in the DB have blank `patientId`.

---

### L3 — Lab Order Detail Screen

**Route:** `/h/:slug/labs/:orderId` (with `?patientId=<id>`)  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/labs/<orderId>?patientId=<patientId>`

#### Header & navigation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-01 | Screen renders test name as heading | `AppText variant="heading-2"` with test name | `agent-browser snapshot` |
| L3-02 | Test code and category shown as subtitle when present | Subtitle line below heading | `agent-browser eval "document.body.innerText"` |
| L3-03 | Priority badge renders correct style | ROUTINE = grey, URGENT = amber, STAT = red | `agent-browser screenshot` |
| L3-04 | Status badge renders | Status label visible; colour matches current status | Screenshot |
| L3-05 | Back button "Lab orders" navigates to lab list | Click → URL `/h/:slug/labs` | `agent-browser eval "document.querySelector('button').click()"` then `agent-browser get url` |
| L3-06 | Loading spinner shows while fetching | Spinner visible before order loads | Screenshot immediately on navigation |
| L3-07 | Error state shown on fetch failure | `<p role="alert">` with error message | Navigate with invalid orderId and valid patientId; check body text |

**Bug to probe (L3-07):** The screen uses `activeHospitalId` from `useAuth()` — if the sessionStorage workaround has not been applied, `activeHospitalId` is null, causing an empty hospitalId in the API call. This returns an error. Confirm the workaround resolves it.

#### StateStepper

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-08 | 7-step stepper renders all labels | "Awaiting Sample · Sample Received · Awaiting Test · In Progress · Awaiting Result · Result Ready · Released" all visible | `agent-browser eval "document.body.innerText"` |
| L3-09 | Current step highlighted with filled circle | The active step has a distinctive style (filled bg circle, white text) | `agent-browser screenshot` |
| L3-10 | Completed steps show checkmark icon | Steps before current step show `IconCheck` | Screenshot on an order with at least one completed transition |
| L3-11 | Future steps are greyed out | Steps after current have muted/grey style | Screenshot |
| L3-12 | "Advance status" button shown when status is not `result_released` | Button visible for all states except final | Check snapshot |
| L3-13 | "Advance status" button absent when status is `result_released` | Button does not render for released orders | Navigate to a released order, check snapshot |

#### Advance status modal

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-14 | Clicking "Advance status" opens modal | `document.body.childElementCount === 3` | Click button, eval body.childElementCount |
| L3-15 | Modal for `awaiting_sample` shows Sample Type and Sample Collected At fields | Two optional fields appear in modal | Use an order in `awaiting_sample` state |
| L3-16 | Modal for other states (e.g. `sample_received`) shows only Note field | Sample fields not present | Use an order in `sample_received` state |
| L3-17 | Advance button disabled when status is `awaiting_result` | Button has `disabled` attribute | Navigate to an `awaiting_result` order; check snapshot |
| L3-18 | Warning shown when status is `awaiting_result` | Text "Record the result before advancing" visible | `agent-browser eval "document.body.innerText"` |
| L3-19 | Advance modal cancel — no change | Close modal; status unchanged; stepper unchanged | Click cancel (`document.body.children[2].querySelectorAll('button')[0].click()`), check stepper |
| L3-20 | Advance modal confirm — success toast + stepper updates | Green toast fires; step advances | Confirm modal; check `document.body.childElementCount`, then toast text |
| L3-21 | **Bug to verify:** no `onError` handler in advance mutation | If API returns error, nothing shown to user — silent failure | Force error (bad orderId), submit advance — verify no error toast appears |

#### Order details card

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-22 | Patient ID shown in card | Text matches the patientId in URL query param | `agent-browser eval "document.body.innerText"` |
| L3-23 | Ordered by shown | Name/ID of creator visible | Check body text |
| L3-24 | Sample type shown when set | After advancing from `awaiting_sample` with a sample type, it appears in the card | Advance with sample type, check detail |
| L3-25 | Notes shown when present | Notes text visible | Create order with notes, verify in detail |
| L3-26 | Date created shown | ISO date or locale date visible | Check card |
| L3-27 | **Bug to probe:** `order.sampleCollectedAt!` non-null assertion | Line: `order.sampleCollectedAt!` — if the field is undefined and rendered, runtime crash. Verify: for an order with `sampleCollectedAt` undefined, does the card render without crashing? | Navigate to order in `sample_received` with no `sampleCollectedAt`; check for blank page or error |

#### Result panel

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-28 | Result panel visible when status is `awaiting_result` | Panel renders when order is in `awaiting_result` | Navigate to such an order; check snapshot |
| L3-29 | Result panel visible when status is `result_ready` | Panel renders | Same check |
| L3-30 | Result panel visible when status is `result_released` | Panel renders | Same check |
| L3-31 | Result panel NOT visible for early statuses | `awaiting_sample`, `sample_received`, `awaiting_test`, `in_progress` — no result panel | Check snapshot for an early-status order |
| L3-32 | "Record result" button shown when no result exists | Button visible in panel | Use an `awaiting_result` order with no result |
| L3-33 | "Record result" opens modal with correct fields | Modal has: value (required), unit, reference range, isAbnormal checkbox, notes, file attachment | Click button; check `childElementCount === 3`; check modal body text |
| L3-34 | isAbnormal checkbox toggleable | Check and uncheck | `agent-browser check <sel>`, `agent-browser uncheck <sel>` |
| L3-35 | Submit with empty value — no action | Nothing happens; modal stays open | Click submit with blank value |
| L3-36 | Submit valid result — success toast + panel updates | Toast fires; result value/unit/notes now shown in panel | Fill value "7.4", unit "mg/dL", submit; check toast and panel |
| L3-37 | isAbnormal=true shows Abnormal badge in result panel | Red "Abnormal" badge rendered | Record result with `isAbnormal` checked; check panel |
| L3-38 | **Bug to verify:** no `onError` handler in record result mutation | Silent failure on API error — nothing shown | Force error, submit result — verify no error toast |
| L3-39 | "Update result" button shown only when status is `result_ready` | Button present at `result_ready`, absent at `result_released` | Check both states |
| L3-40 | "Update result" opens pre-filled modal | Value, unit, notes pre-populated | Click Update; check modal fields |

#### State history timeline

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L3-41 | State history renders entries | At least the first `awaiting_sample` entry visible | `agent-browser eval "document.body.innerText"` |
| L3-42 | Entry shows from → to transition | Format "Awaiting Sample → Sample Received" or similar | Check text after advancing status |
| L3-43 | Entry shows timestamp | Date/time visible on each entry | Check text |
| L3-44 | Entries sorted newest first | Most recent transition at top | After multiple advances, check order |
| L3-45 | Note shown on entry when present | Note text visible if advance was submitted with a note | Advance with a note; check history |

---

### L4 — Lab Result Queue Screen

**Route:** `/h/:slug/labs/results`  
**File:** `apps/medcord-web/src/features/labs/features/lab-results/screen/lab-result-queue-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/labs/results`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L4-01 | Screen renders with heading | "Results ready" heading visible | `agent-browser snapshot` |
| L4-02 | Back button "Lab orders" navigates to lab list | URL → `/h/:slug/labs` | Click button, check URL |
| L4-03 | Table columns present: Test, Result, Priority, Patient, Date | All column headers visible | `agent-browser eval "document.body.innerText"` |
| L4-04 | Only orders with `result_ready` status shown | No orders with other statuses in table | Check table after filtering; compare to API response |
| L4-05 | Result value and unit shown in Result column | "7.4 mg/dL" format | Check after recording a result |
| L4-06 | Abnormal badge shown when `isAbnormal=true` | Red "Abnormal" badge visible | Check for order with abnormal result |
| L4-07 | Priority badge colour correct | ROUTINE = grey, URGENT = amber, STAT = red — all raw hex (document violation) | Screenshot |
| L4-08 | Row click navigates to lab order detail with patientId | URL: `/h/:slug/labs/:orderId?patientId=<id>` | Click row, check URL |
| L4-09 | Loading spinner shown while loading | Spinner visible on first render | Screenshot immediately |
| L4-10 | Error state shown on fetch failure | `role="alert"` error message | Disconnect backend, navigate — check alert |
| L4-11 | Empty state shown when no results ready | `IconFlask` icon + "No results ready for review." | Use hospital with no `result_ready` orders; check body |

**Bug to probe (L4-08):** Row click uses `{order.result && (...)}` — raw `&&` in JSX (meemaw violation). Document.

---

## Phase 8 — Assets (Completion)

### A4 — Asset Detail Screen — Print Label

**Route:** `/h/:slug/assets/:assetId`  
**File:** `apps/medcord-web/src/features/assets/features/asset-detail/screen/asset-detail-screen.tsx`

Navigate to any asset detail screen.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A4-01 | "Print label" button present in page header | `AppButton variant="secondary"` with `IconPrint` and "Print label" text, next to asset name | `agent-browser snapshot` |
| A4-02 | "Print label" button is positioned in header area | Button appears alongside asset name heading, not in a different section | Screenshot |
| A4-03 | Clicking "Print label" opens a new browser window | `window.open('', '_blank', ...)` is called; a new window appears | `agent-browser click <print-button-ref>` — a new tab/window should open |
| A4-04 | Print window content contains asset name | The opened window's HTML includes the asset name | Check via `agent-browser tab` then switch to new tab, `agent-browser eval "document.body.innerText"` |
| A4-05 | Print window content contains asset category | Category text present | Same as above |
| A4-06 | Print window contains asset tag when set | "Tag: TAG001" present (only if asset has a tag) | Use asset with a tag; check print window content |
| A4-07 | Print window contains asset ID | "ID: <assetId>" present | Check print window |
| A4-08 | Print window triggers print dialog | `window.onload` calls `window.print()` — the browser print dialog should open | Observe print dialog on click (may auto-open if popup not blocked) |
| A4-09 | Print window excludes sidebar, topbar, app chrome | Only the label content is in the window — no nav elements | Check print window source; it's a minimal HTML doc built from `el.innerHTML` |
| A4-10 | **Bug to probe:** popup blocker may prevent print window | `window.open` returning null is handled (early return) — but user sees no feedback | Click Print label; if popup blocked, verify no crash (just silently returns) |
| A4-11 | **Bug to probe:** `{data && (...)}` inside `<Loadable>` | `asset-detail-screen.tsx:65` — `{data && (...)}` is a meemaw violation. Document. | Source-level; functionally: if `data` is undefined post-load, screen renders nothing |

---

## Phase 9 — Review Queue

### R1 — Review Queue Screen

**Route:** `/h/:slug/review`  
**File:** `apps/medcord-web/src/features/review-queue/screen/review-queue-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/review`

#### Render & initial state

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R1-01 | Screen renders with "Review Queue" heading | `AppText variant="heading-2"` with "Review Queue" | `agent-browser snapshot` |
| R1-02 | Item count subtitle shown | "N item(s)" subtitle beneath heading | `agent-browser eval "document.body.innerText"` |
| R1-03 | Count is "0 items" when queue is empty | Zero-state subtitle correct | Check with no items |
| R1-04 | Loading spinner shown while fetching | Spinner visible on first render | Screenshot immediately on navigation |
| R1-05 | Error state shown on fetch failure | `<p role="alert">` with error message | Disconnect backend, navigate |
| R1-06 | Empty state: clipboard icon + "No items in the review queue." | `IconClipboard` and correct text | Navigate with empty queue or apply filter returning no results |
| R1-07 | Sidebar link "Review Queue" is always visible (no module gate) | Link present regardless of which modules are enabled | Check sidebar for hospital with labs/emr disabled |

#### Filters

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R1-08 | Status filter dropdown renders with all options | All / Pending / Approved / Rejected / Escalated | `agent-browser snapshot` |
| R1-09 | Type filter dropdown renders with all options | All / Lab result / Vitals / Medication / Document / Discharge / Transfer | `agent-browser snapshot` |
| R1-10 | Priority filter dropdown renders with all options | All / Routine / Urgent / STAT | `agent-browser snapshot` |
| R1-11 | Status filter — selecting "Pending" filters table | Only pending items shown; request includes `status=pending` | `agent-browser select <sel> pending`; check network request |
| R1-12 | Type filter — selecting "Lab result" filters table | Only `lab_result` type items shown | `agent-browser select <sel> lab_result` |
| R1-13 | Priority filter — selecting "STAT" filters table | Only stat priority items shown | Select STAT; verify table |
| R1-14 | Combined filters work | Items matching all three filters shown | Set all three, check results |
| R1-15 | Resetting filter to "All" restores full list | Select blank option in any filter; list restores | `agent-browser select <sel> ""` |
| R1-16 | **Bug to document:** filter dropdowns are raw `<select>` elements | Not using `LineSelect` or `BlockInput` from `@medcord/ui` — DS-INPUT violation | Source-level; document in report |

#### Table

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R1-17 | Table columns present: Title, Type, Priority, Patient, Submitted by, Date, Status | All 7 column headers visible | `agent-browser eval "document.body.innerText"` |
| R1-18 | Title column shows title + truncated summary | Title as bold text; summary in muted smaller text, truncated | Check a row with a long summary |
| R1-19 | Type badge colour-coded | Lab result = blue, Vitals = green, Medication = amber, Document = grey, Discharge = red, Transfer = purple | Screenshot; verify all colours against spec |
| R1-20 | Status badge colour-coded | Pending = amber, Approved = green, Rejected = red, Escalated = purple | Screenshot |
| R1-21 | Priority badge present | ROUTINE/URGENT/STAT styled same as labs | Screenshot |
| R1-22 | Status badge has dot indicator | Small circle dot inside badge | Check badge element structure |
| R1-23 | Row click navigates to review item detail | URL: `/h/:slug/review/:itemId` | `agent-browser eval "document.querySelector('tbody tr').click()"`, check URL |
| R1-24 | **Bug to document:** raw hex in `TYPE_STYLE`, `STATUS_STYLE`, `PRIORITY_STYLE` | All badge colours use raw hex (e.g. `#1e40af`, `#6d28d9`) — CLR-01 violation | Source-level; document |

---

### R2 — Review Item Screen

**Route:** `/h/:slug/review/:itemId`  
**File:** `apps/medcord-web/src/features/review-queue/screen/review-item-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/review/<itemId>`

#### Render & navigation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R2-01 | Screen renders item title as heading | `AppText variant="heading-2"` with item title | `agent-browser snapshot` |
| R2-02 | Summary text shown when present | Summary text below title | `agent-browser eval "document.body.innerText"` |
| R2-03 | Back button "Review Queue" navigates back | URL → `/h/:slug/review` | Click back button, check URL |
| R2-04 | Loading spinner shown while loading | Spinner visible on navigation | Screenshot immediately |
| R2-05 | Error state shown on fetch failure | `<p role="alert">` with message | Navigate with invalid itemId |
| R2-06 | **Bug to probe:** `{item && (...)}` inside `<Loadable>` | `review-item-screen.tsx:112` — raw `&&` in JSX inside `<Show>` inside `<Loadable>` — meemaw violation | Document; functionally test that item loads correctly |

#### Metadata grid (left panel)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R2-07 | Type badge in metadata grid | Colour-coded type badge visible | Screenshot |
| R2-08 | Priority badge in metadata grid | ROUTINE/URGENT/STAT badge visible | Screenshot |
| R2-09 | Patient ID shown | Patient ID value in grid | `agent-browser eval "document.body.innerText"` |
| R2-10 | Reference ID shown | Reference ID (the linked resource) visible | Check body text |
| R2-11 | Submitted by shown | Staff ID or name visible | Check body text |
| R2-12 | Submitted at shown | Date/time visible | Check body text |

#### Action panel — pending/escalated item

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R2-13 | Status badge shown in action panel | Large status badge in right panel | Screenshot |
| R2-14 | Note textarea shown for pending/escalated items | `<textarea>` with "Add a review note…" placeholder | `agent-browser snapshot` |
| R2-15 | Note textarea disabled while mutation in flight | `disabled` attr on textarea when `mutation.isPending` | Screenshot immediately after clicking action |
| R2-16 | "Approve" button present and is primary variant | `AppButton` (no variant specified = primary default) with `IconCheckCircle` | Snapshot |
| R2-17 | "Reject" button present and is danger variant | `AppButton variant="danger"` with `IconXCircle` | Snapshot |
| R2-18 | "Escalate" button present and is secondary variant | `AppButton variant="secondary"` with `IconAlert` | Snapshot |
| R2-19 | Clicking "Approve" acts immediately — no modal | No modal opens; mutation fires directly | Click Approve; `document.body.childElementCount` stays 2 |
| R2-20 | Approve success — toast shown + status badge updates | Green toast "Review action recorded."; badge changes to "Approved" | Complete approve, check toast and badge |
| R2-21 | Clicking "Reject" opens destructive confirmation modal | `childElementCount === 3`; modal has destructive styling | Click Reject, check modal |
| R2-22 | Reject modal cancel — no action | Modal closes; status unchanged | Click cancel (button index 1 in modal) |
| R2-23 | Reject modal confirm — mutation fires + toast | API called; toast shown; badge updates to "Rejected" | Confirm; check toast and badge |
| R2-24 | Clicking "Escalate" opens non-destructive confirmation modal | Modal opens (no destructive flag); confirm button not danger-styled | Click Escalate; check modal |
| R2-25 | Escalate modal confirm — mutation fires + toast | API called; badge → "Escalated" | Confirm; check |
| R2-26 | Error on action — toast with backend error message | `err instanceof Error ? err.message : 'Something went wrong.'` | Force error; check toast text is dynamic |
| R2-27 | All three action buttons disabled while mutation in flight | `loading={mutation.isPending}` on all three buttons | Screenshot immediately after clicking one |

#### Action panel — approved/rejected item

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| R2-28 | Action buttons NOT shown for approved/rejected items | Approve/Reject/Escalate buttons absent | Navigate to an approved item; check snapshot |
| R2-29 | "Reviewed by" shown when `reviewedBy` is set | Name/ID visible | Check approved item |
| R2-30 | "Reviewed at" shown when `reviewedAt` is set | Date/time visible | Check approved item |
| R2-31 | Review note shown when `reviewNote` is set | Note text visible | Approve with a note, check detail |
| R2-32 | "Reviewed by/at/note" absent for pending items | These fields not rendered when no review has happened | Check pending item right panel |
| R2-33 | `item.reviewedAt!` non-null assertion | `review-item-screen.tsx:224` — `new Date(item.reviewedAt!)` — crash if `reviewedAt` is undefined while `!canAct`. Verify by checking if a rejected item with no `reviewedAt` causes a blank page. | Navigate to rejected item with no reviewedAt |

---

## Phase 10 — Notifications

### N1 — Notifications Screen

**Route:** `/h/:slug/notifications`  
**File:** `apps/medcord-web/src/features/notifications/screen/notifications-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/notifications`

#### Render & initial state

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| N1-01 | Screen renders "Notifications" heading | `AppText variant="heading-2"` | `agent-browser snapshot` |
| N1-02 | Total count subtitle shown | "N notification(s)" subtitle | `agent-browser eval "document.body.innerText"` |
| N1-03 | Count subtitle hidden while loading | `<Show when={data !== undefined}>` — subtitle absent before data resolves | Screenshot immediately on navigation |
| N1-04 | Loading spinner shown while fetching | Spinner visible on first render | Screenshot immediately |
| N1-05 | Error state shown on fetch failure | `<p role="alert">` with error message | Disconnect backend, navigate |
| N1-06 | Empty state: bell icon + "You're all caught up." | `IconBell size={32}` + text | Navigate with zero notifications; check body |

#### Unread filter toggle

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| N1-07 | "Unread only" button shown by default | Button text is "Unread only" | Snapshot |
| N1-08 | Clicking "Unread only" filters to unread notifications | Request includes `unread=true`; button text changes to "Show all" | Click; check network requests + button text |
| N1-09 | Clicking "Show all" reverts to all notifications | Request drops `unread` param; button text reverts | Click again; check |

#### Mark all as read

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| N1-10 | "Mark all as read" button present | `AppButton variant="ghost"` visible | Snapshot |
| N1-11 | Button shows loading state while in flight | `loading={markAll.isPending}` — button text "Loading…" during request | Screenshot immediately after click |
| N1-12 | Success: "All notifications marked as read." toast | Green success toast fires | Check toast text after click |
| N1-13 | After mark all, unread dots disappear | All notification rows no longer show the blue dot | Check notification list after success |
| N1-14 | **Bug to verify: no error handler on `markAll`** | `useMarkAllNotificationsRead` has `onError` handler in source. Verify: force API error, click "Mark all as read" — error toast should fire. | Disconnect backend mid-flight; check for error toast |

#### Notification list

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| N1-15 | Each notification shows type icon | Icon matched to `notif.type` — see icon table | Check icons on various notification types |
| N1-16 | `lab_result_ready` → `IconFlask` | Flask icon on row | Check type-specific notification |
| N1-17 | `lab_result_abnormal` → `IconAlert` | Alert triangle icon | Same |
| N1-18 | `transfer_request` → `IconArrowRight` | Arrow right icon | Same |
| N1-19 | `transfer_accepted` → `IconCheckCircle` | Check circle icon | Same |
| N1-20 | `transfer_declined` → `IconXCircle` | X circle icon | Same |
| N1-21 | `review_item_submitted` → `IconClipboard` | Clipboard icon | Same |
| N1-22 | `review_item_acted` → `IconCheck` | Check icon | Same |
| N1-23 | `patient_admitted` → `IconHeartPulse` | Heart pulse icon | Same |
| N1-24 | `patient_discharged` → `IconUser` | User icon | Same |
| N1-25 | `vitals_out_of_range` → `IconActivity` | Activity icon | Same |
| N1-26 | `general` → `IconBell` | Bell icon | Same |
| N1-27 | Each notification shows title | Title text visible | `agent-browser eval "document.body.innerText"` |
| N1-28 | Each notification shows body text (truncated) | `truncate` class on body — single-line truncated text | Check a notification with long body |
| N1-29 | Relative time displayed | "just now" / "Xm ago" / "Xh ago" / locale date | Check time column |
| N1-30 | Unread notifications have blue dot | `h-2 w-2 rounded-full bg-[#2563eb]` dot visible on right | Check notification with `isRead=false` |
| N1-31 | Read notifications have no dot | Blue dot absent | Check notification with `isRead=true` |
| N1-32 | Read notifications are slightly muted | `opacity-70` on read rows | Screenshot; compare read vs unread rows |
| N1-33 | Clicking an unread notification marks it read | `markRead.mutate(notif.id)` fires; dot disappears | Click unread notification; check dot gone |
| N1-34 | Clicking a read notification does NOT call markRead | No mutation fired for already-read notifications | Click read notification; check network — no POST |
| N1-35 | **Bug to probe: unread dot uses raw hex `#2563eb`** | `bg-[#2563eb]` in notification item — CLR-01 violation | Source-level; document |

---

### N2 — Notification Bell (Topbar)

**File:** `apps/medcord-web/src/shared/widgets/app-shell/parts/topbar.tsx`

Test from any hospital screen that shows the topbar.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| N2-01 | Bell icon visible in topbar | `IconBell size={16}` in topbar | `agent-browser snapshot` |
| N2-02 | Red badge appears when unread count > 0 | `unreadCount > 0` → badge renders | Ensure at least one unread notification exists; check snapshot |
| N2-03 | Badge shows count when count ≤ 9 | "3" badge for 3 unread | Check badge text: `agent-browser eval "document.querySelector('[aria-label=Notifications] span')?.innerText"` |
| N2-04 | Badge shows "9+" when count > 9 | "9+" badge | If >9 unread notifications exist; check badge |
| N2-05 | Badge absent when unread count is 0 | No badge element rendered | Mark all as read; check topbar |
| N2-06 | Bell link navigates to notifications screen | Clicking bell → `/h/:slug/notifications` | Click bell, check URL |
| N2-07 | Badge polls every 60 seconds | `refetchInterval: 60_000` in `useNotificationBell` | Source-level; verify via `agent-browser network requests --filter notifications-bell` showing periodic fetches |
| N2-08 | Badge count decrements after marking all read | Click "Mark all as read" on notifications screen; return to any page; badge should disappear | Mark all read, navigate back, check topbar |

---

## Phase 10 — Global Search

### S1 — Search Screen

**Route:** `/h/:slug/search`  
**File:** `apps/medcord-web/src/features/search/screen/search-screen.tsx`

Navigate directly: `http://localhost:5173/h/<slug>/search`

#### Input & debounce

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| S1-01 | Search input auto-focused on page load | Input has focus immediately | `agent-browser eval "document.activeElement.tagName"` → "INPUT" |
| S1-02 | No query: prompt text shown | "Start typing to search patients, assets, and lab orders." visible | `agent-browser eval "document.body.innerText"` |
| S1-03 | Typing < 2 chars shows no results | 1-character query does not trigger API call; no results shown | Type "a"; check no API call via network requests |
| S1-04 | Typing ≥ 2 chars triggers search after 300ms debounce | API call fires ~300ms after last keystroke | Type "Jo", wait 400ms; check `agent-browser network requests --filter search` |
| S1-05 | Inline spinner shown during search flight | `IconLoader` (animate-spin) appears next to input while loading | Screenshot immediately after typing |
| S1-06 | Spinner disappears after results arrive | `Show when={isLoading && debouncedQ.trim().length >= 2}` — spinner gone after data | Check after results load |
| S1-07 | Clearing query resets to prompt text | Delete all input text; prompt text re-appears | Fill then clear; check body |

**Bug to probe (S1-02):** The condition for showing the prompt is `debouncedQ.trim().length < 2 && query.length === 0` — this means if you type 1 character (query.length = 1), the prompt disappears AND no results appear (since debounced query is still empty). The screen shows a blank state for single-character queries. Verify: type one character; confirm neither prompt nor results are shown (blank state).

#### Results — Patients section

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| S1-08 | Patients section shown when results exist | "PATIENTS (N)" section header with `IconUser` | Type patient first name; check body |
| S1-09 | Patient row shows full name | `firstName + ' ' + lastName` | Check row text |
| S1-10 | Patient row shows patient code | `patientCode` value visible | Check row |
| S1-11 | Patient row shows date of birth | DOB formatted as locale date | Check row |
| S1-12 | Patient row shows admission status badge | Colour-coded badge: outpatient/admitted/discharged | Screenshot |
| S1-13 | Clicking patient row navigates to patient profile | URL: `/h/:slug/patients/:patientCode` | Click row; `agent-browser get url` |
| S1-14 | **Bug to probe: admission status uses raw hex** | `ADMISSION_STYLE` uses `#166534`, `#1e40af` — CLR-01 violation | Source-level; document |

#### Results — Assets section

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| S1-15 | Assets section shown when results exist | "ASSETS (N)" section header with `IconPackage` | Type asset name; check body |
| S1-16 | Asset row shows name | Asset name visible | Check row |
| S1-17 | Asset row shows category | Category visible below name | Check row |
| S1-18 | Asset row shows current location when set | Location visible (dot-separated with category) | Check row with located asset |
| S1-19 | Asset row shows status badge | Colour-coded badge: available/in_use/maintenance/retired | Screenshot |
| S1-20 | Asset status label uses `replace('_', ' ')` | "in use" not "in_use" in badge | Check row with in_use asset |
| S1-21 | Clicking asset row navigates to asset detail | URL: `/h/:slug/assets/:assetId` | Click row; check URL |
| S1-22 | **Bug to probe: asset status uses raw hex** | `ASSET_STATUS_STYLE` uses raw hex — CLR-01 violation | Source-level; document |

#### Results — Lab Orders section

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| S1-23 | Lab Orders section shown when results exist | "LAB ORDERS (N)" section header with `IconFlask` | Type test name; check body |
| S1-24 | Lab order row shows test name | Test name visible | Check row |
| S1-25 | Lab order row shows "Ordered by" text | "Ordered by <name>" visible below test name | Check row |
| S1-26 | Lab order row shows priority badge | ROUTINE/URGENT/STAT badge | Screenshot |
| S1-27 | Lab order row shows status badge with dot indicator | Status badge with dot | Check row |
| S1-28 | Lab order row shows alert icon when result is abnormal | `IconAlert size={12}` shown when `order.result?.isAbnormal === true` | Find abnormal result order; check row |
| S1-29 | Clicking lab order row navigates to detail with patientId | URL: `/h/:slug/labs/:orderId?patientId=<id>` | Click row; check URL |

#### Empty & error states

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| S1-30 | No results: "No results for 'X'. Try different keywords." | Exact text with the query shown | Type a nonsense query like "xzxzxzxzx"; wait; check body |
| S1-31 | Error state shown on API failure | `<p role="alert">` with error message | Disconnect backend; type a query; check alert |
| S1-32 | Sections not shown when no results in that type | If only patients match, Assets and Lab Orders sections absent | Search for patient-specific name; check no Assets section |

**Bug to probe (S1-07):** `Show when={debouncedQ.trim().length < 2 && query.length === 0}` — once query has any content, this evaluates to false even if debouncedQ is still "". The empty state/prompt disappears before results arrive. That's technically correct but creates a flicker. Document for UX review.

---

## Cross-Cutting Checks for Phases 7–10

Run these after completing functional tests for each phase.

### CC — meemaw Violations

| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-P7-01 | `lab-result-queue-screen.tsx` | `{order.result && (...)}` — raw `&&` in JSX (line ~100) | High |
| CC-P7-02 | `lab-order-detail-screen.tsx` | `{order && (...)}` inside `<Loadable>` | Medium |
| CC-P9-01 | `review-item-screen.tsx` | `{item && (...)}` inside `<Show when={item !== undefined}>` inside `<Loadable>` (line ~112) | High |
| CC-P10-01 | None found in notifications-screen.tsx | Uses `<Repeat>` and `<Show>` correctly | ✅ |
| CC-P10-02 | None found in search-screen.tsx | Uses `<Repeat>` and `<Show>` correctly | ✅ |
| CC-P10-03 | `topbar.tsx` | `{unreadCount > 0 && (...)}` — raw `&&` in JSX (line ~37) for badge rendering | High |

### CC — Color Token Violations

| ID | File | Tokens Used | Violation |
|----|------|-------------|-----------|
| CC-CLR-01 | `review-queue-screen.tsx` | `#1e40af`, `#bfdbfe`, `#eff6ff`, `#166534`, `#bbf7d0`, `#f0fdf4`, `#92400e`, `#fde68a`, `#fffbeb`, `#6d28d9`, `#ddd6fe`, `#f5f3ff` | All TYPE_STYLE + STATUS_STYLE use raw hex |
| CC-CLR-02 | `review-item-screen.tsx` | Same palette as above in TYPE_STYLE, STATUS_STYLE, PRIORITY_STYLE | Same |
| CC-CLR-03 | `lab-result-queue-screen.tsx` | `#92400e`, `#fde68a`, `#fffbeb` in PRIORITY_STYLE | Raw hex for urgent/stat |
| CC-CLR-04 | `search-screen.tsx` | `#166534`, `#bbf7d0`, `#f0fdf4`, `#1e40af`, `#bfdbfe`, `#eff6ff`, `#92400e`, `#fde68a`, `#fffbeb` in ADMISSION_STYLE, ASSET_STATUS_STYLE | Same pattern |
| CC-CLR-05 | `notifications-screen.tsx` | `bg-[#2563eb]` for unread dot | Raw hex blue for notification indicator |

### CC — FSD Structure Violations

| ID | File | Issue |
|----|------|-------|
| CC-FSD-01 | `lab-order-detail-screen.tsx` | `AdvanceStatusForm` and `RecordResultForm` defined inline in the screen file — should be `screen/parts/advance-status-form.tsx` and `screen/parts/record-result-form.tsx` |

### CC — Design System Component Violations

| ID | Check | Expected | File |
|----|-------|----------|------|
| CC-DS-01 | `review-queue-screen.tsx` filter selects | Raw `<select>` elements — not `LineSelect` from `@medcord/ui` (DS-INPUT-LINE-06 violation) | `review-queue-screen.tsx` |
| CC-DS-02 | `review-item-screen.tsx` note textarea | Raw `<textarea>` with manual className — not `LineTextarea` from `@medcord/ui` | `review-item-screen.tsx:174` |
| CC-DS-03 | `search-screen.tsx` search input | Raw `<input autoFocus>` — spec explicitly calls this out; not `SearchInput` from `@medcord/ui` | `search-screen.tsx:83` |
| CC-DS-04 | All screens — no `Table` component | All list/queue tables are hand-rolled `<table>` elements — not `<Table>` from `@medcord/ui` | All screens |

### CC — Critical Bug Catalogue

| ID | Bug | File | Severity |
|----|-----|------|----------|
| CC-BUG-01 | No `onError` handler in `useAdvanceLabStatus` mutation | Silent failure when advancing lab status | `lab-order-detail-screen.tsx` (inline form) | P1 |
| CC-BUG-02 | No `onError` handler in `useRecordLabResult` mutation | Silent failure when recording result | `lab-order-detail-screen.tsx` (inline form) | P1 |
| CC-BUG-03 | `order.sampleCollectedAt!` non-null assertion | Crash risk if `sampleCollectedAt` is undefined | `lab-order-detail-screen.tsx` | P1 |
| CC-BUG-04 | `hardcoded FILE_SERVICE` URL | `https://go-file-service-production.up.railway.app` in lab-order-detail-screen.tsx — no env var | `lab-order-detail-screen.tsx` | P2 |
| CC-BUG-05 | `item.reviewedAt!` non-null assertion | Crash risk if `reviewedAt` undefined on approved/rejected item | `review-item-screen.tsx:224` | P1 |
| CC-BUG-06 | BUG-CRIT-01 still applies | `activeHospitalId` null until sessionStorage workaround applied — all screens affected | All screens using `useAuth()` | P0 |
| CC-BUG-07 | Blank-state flicker in search screen | Single-character query removes prompt without showing results — blank state | `search-screen.tsx:103` | P3 |
| CC-BUG-08 | Popup blocker silently prevents print label | `window.open` returns null; no user feedback | `asset-detail-screen.tsx:26` | P3 |

### CC — Icon Import Check

| ID | Check | Expected |
|----|-------|----------|
| CC-ICN-01 | No `from 'lucide-react'` in phase 7–10 files | All icons via `@icons` proxy |

Run:
```
grep -r "from 'lucide-react'" \
  apps/medcord-web/src/features/labs \
  apps/medcord-web/src/features/review-queue \
  apps/medcord-web/src/features/notifications \
  apps/medcord-web/src/features/search \
  apps/medcord-web/src/features/assets
```

Expected output: empty.

### CC — Confirmation Modal Catalogue

Verify all confirmation modals have the correct shape:

| Action | Screen | Expected | Destructive | Verified |
|--------|--------|----------|-------------|---------|
| Reject review item | ReviewItemScreen | `showConfirmationModal({ destructive: true })` | Yes | R2-21 |
| Escalate review item | ReviewItemScreen | `showConfirmationModal({ destructive: false })` | No | R2-24 |
| Advance lab status | LabOrderDetailScreen | `showCustomModal` (not a confirmation modal) | N/A | L3-14 |
| Record/update result | LabOrderDetailScreen | `showCustomModal` | N/A | L3-33 |

### CC — Route Registration Check

| ID | Route | Screen | Order | Verified |
|----|-------|--------|-------|---------|
| CC-RT-01 | `/h/:slug/labs/results` | LabResultQueueScreen | Before `labs/:orderId` | Navigate to URL |
| CC-RT-02 | `/h/:slug/labs/:orderId` | LabOrderDetailScreen | After `labs/results` | Navigate to URL |
| CC-RT-03 | `/h/:slug/review` | ReviewQueueScreen | — | Navigate |
| CC-RT-04 | `/h/:slug/review/:itemId` | ReviewItemScreen | — | Navigate |
| CC-RT-05 | `/h/:slug/notifications` | NotificationsScreen | — | Navigate |
| CC-RT-06 | `/h/:slug/search` | SearchScreen | — | Navigate |

**Critical:** `labs/results` MUST be registered before `labs/:orderId` — otherwise navigating to `/labs/results` matches `:orderId = "results"` and renders the detail screen. Verify by navigating to `/labs/results` and confirming the Lab Result Queue screen renders (not the detail screen).

---

## Test Execution Order

Execute in this order to build state for dependent tests:

1. **Pre-flight** — health check, login, sessionStorage workaround
2. **L2** — Lab orders row click (needs existing orders)
3. **L3** — Lab order detail (advance status to build stepper history)
4. **L3-28 to L3-40** — Result panel (order must be in `awaiting_result` — advance there first)
5. **L4** — Lab result queue (order must be in `result_ready` — record a result first)
6. **A4** — Asset print label (any asset will do)
7. **R1** — Review queue (create review items via API first if queue is empty)
8. **R2** — Review item (use a pending item; approve/reject/escalate in order)
9. **N1** — Notifications (mark-all-read last, as it destroys unread state)
10. **N2** — Notification bell (verify badge before and after N1-12)
11. **S1** — Search (use names/terms seeded from earlier test steps)
12. **CC** — Cross-cutting checks (run after all functional tests)

---

## Screenshots Naming Convention

```
phase7-lab-orders-row-click.png
phase7-lab-order-detail.png
phase7-lab-order-detail-stepper.png
phase7-lab-order-detail-advance-modal.png
phase7-lab-order-detail-advance-awaiting-result-warning.png
phase7-lab-order-detail-result-panel-empty.png
phase7-lab-order-detail-record-result-modal.png
phase7-lab-order-detail-result-panel-filled.png
phase7-lab-order-detail-state-history.png
phase7-lab-result-queue.png
phase7-lab-result-queue-empty.png

phase8-asset-detail-print-label-button.png
phase8-asset-detail-print-window.png

phase9-review-queue.png
phase9-review-queue-empty.png
phase9-review-queue-filters.png
phase9-review-queue-type-badges.png
phase9-review-queue-status-badges.png
phase9-review-item.png
phase9-review-item-pending-actions.png
phase9-review-item-reject-modal.png
phase9-review-item-escalate-modal.png
phase9-review-item-approved.png

phase10-notifications.png
phase10-notifications-empty.png
phase10-notifications-unread-filter.png
phase10-notifications-mark-all-loading.png
phase10-notification-bell-badge.png
phase10-notification-bell-no-badge.png
phase10-search-empty.png
phase10-search-results-patients.png
phase10-search-results-assets.png
phase10-search-results-labs.png
phase10-search-no-results.png
phase10-search-spinner.png
```

---

## Total Test Count

| Phase | Functional | Bug checks | CC | Total |
|-------|-----------|------------|-----|-------|
| Phase 7 — Lab Orders row click (L2) | 3 | 1 | — | 4 |
| Phase 7 — Lab Order Detail (L3) | 45 | 3 | — | 48 |
| Phase 7 — Lab Result Queue (L4) | 11 | 1 | — | 12 |
| Phase 8 — Asset Print Label (A4) | 9 | 2 | — | 11 |
| Phase 9 — Review Queue (R1) | 24 | 2 | — | 26 |
| Phase 9 — Review Item (R2) | 33 | 2 | — | 35 |
| Phase 10 — Notifications (N1) | 35 | 1 | — | 36 |
| Phase 10 — Notification Bell (N2) | 8 | — | — | 8 |
| Phase 10 — Search (S1) | 32 | 4 | — | 36 |
| Cross-cutting | — | — | 27 | 27 |
| **Total** | **200** | **16** | **27** | **243** |
