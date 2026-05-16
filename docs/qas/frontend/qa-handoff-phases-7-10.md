# QA Handoff — Phases 7, 8, 9, 10

**Date:** 2026-05-16  
**Build status:** Typecheck clean ✅ · Lint clean ✅ · Build clean ✅  
**Modules covered:** Labs completion (Phase 7), Assets completion (Phase 8), Review Queue (Phase 9), Notifications + Global Search (Phase 10)

---

## Phase 7 — Labs (Completion)

### Lab Orders Screen (updated)
**Route:** `/h/:slug/labs`  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx`  
**Sidebar:** Visible when `modules.labs === true`

On the Lab Orders screen: user must be able to:
- click any table row to navigate to the lab order detail page
- the URL navigated to must be `/h/:slug/labs/:orderId?patientId=<patientId>`

---

### Lab Order Detail Screen
**Route:** `/h/:slug/labs/:orderId` (with `?patientId=<patientId>` query param)  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx`

On the Lab Order Detail screen: user must be able to:
- see the test name as the page heading, with test code and category as a subtitle if present
- see a priority badge (ROUTINE / URGENT / STAT) and a status badge in the header
- see a 7-step state stepper showing: Awaiting Sample · Sample Received · Awaiting Test · In Progress · Awaiting Result · Result Ready · Released
  - the current step is highlighted with a filled circle
  - completed steps show a checkmark icon
  - future steps are greyed out
- click "Advance status" to open a modal
  - if current status is `awaiting_sample`, the modal shows optional Sample Type and Sample Collected At fields
  - if current status is `awaiting_result`, the advance button is disabled and a warning is shown: "Record the result before advancing"
  - on success, toast shown and stepper updates
- see an order details card showing: patient ID, ordered by, sample type (if set), sample collected at/by (if set), notes, date created
- see the result panel when status is `awaiting_result`, `result_ready`, or `result_released`
  - if no result recorded: see "Record result" button — clicking opens a modal with fields: result value (required), unit, reference range, isAbnormal checkbox, notes, optional file attachment
  - on successful result record, toast shown and panel updates
  - if result exists: see value, unit, reference range, Abnormal badge (red) if `isAbnormal` is true, notes
  - if status is `result_ready`: see "Update result" button which reopens the result form pre-filled
- see a state history timeline on the right panel showing: status transition (from → to), timestamp, and note if present — sorted newest first
- see a loading spinner while the order loads
- see an error message if the fetch fails
- click "Lab orders" (back button) to return to the lab orders list

---

### Lab Result Queue Screen
**Route:** `/h/:slug/labs/results`  
**File:** `apps/medcord-web/src/features/labs/features/lab-results/screen/lab-result-queue-screen.tsx`  
**Sidebar:** accessible via labs section

On the Lab Result Queue screen: user must be able to:
- see a table of all lab orders with status `result_ready`
- columns: Test, Result (value + unit), Abnormal badge (if applicable), Priority badge, Patient ID, Date
- click a row to navigate to the lab order detail page
- see a loading spinner while loading
- see an error message if the fetch fails
- see an empty state icon and message when no results are ready
- click "Lab orders" (back button) to return to the main lab orders list

---

## Phase 8 — Assets (Completion)

### Asset Detail Screen (updated)
**Route:** `/h/:slug/assets/:assetId`  
**File:** `apps/medcord-web/src/features/assets/features/asset-detail/screen/asset-detail-screen.tsx`

On the Asset Detail screen: user must now also be able to:
- see a "Print label" button in the page header (next to the asset name)
- clicking "Print label" opens a browser print dialog with a minimal label showing: asset name, category, asset tag (if set), and asset ID
- the print content must not include any sidebar, topbar, or app chrome — only the label content

---

## Phase 9 — Review Queue

### Review Queue Screen
**Route:** `/h/:slug/review`  
**File:** `apps/medcord-web/src/features/review-queue/screen/review-queue-screen.tsx`  
**Sidebar:** Visible always (no module gate)

On the Review Queue screen: user must be able to:
- see a page heading "Review Queue" with an item count subtitle
- filter items by status using a select: All / Pending / Approved / Rejected / Escalated
- filter items by type using a select: All / Lab result / Vitals / Medication / Document / Discharge / Transfer
- filter items by priority using a select: All / Routine / Urgent / STAT
- see a table with columns: Title (+ summary truncated), Type badge, Priority badge, Patient ID, Submitted by, Date, Status badge
- type badges must be colour-coded: Lab result (blue), Vitals (green), Medication (amber), Document (grey), Discharge (red), Transfer (purple)
- status badges must be colour-coded: Pending (amber), Approved (green), Rejected (red), Escalated (purple)
- click any row to navigate to the review item detail page
- see a loading spinner while loading
- see an error message if the fetch fails
- see a clipboard icon empty state with "No items in the review queue." when no items match

---

### Review Item Screen
**Route:** `/h/:slug/review/:itemId`  
**File:** `apps/medcord-web/src/features/review-queue/screen/review-item-screen.tsx`

On the Review Item screen: user must be able to:
- see the item title as the page heading
- see the item summary text below the title (if present)
- see a metadata grid: Type badge, Priority badge, Patient ID, Reference ID, Submitted by, Submitted at
- see the current status badge in the right action panel
- if status is `pending` or `escalated`:
  - see an optional Note textarea
  - see three action buttons: "Approve" (primary), "Reject" (danger), "Escalate" (secondary)
  - clicking "Reject" must show a destructive confirmation modal before acting
  - clicking "Escalate" must show a confirmation modal before acting
  - clicking "Approve" acts immediately
  - on success, a toast is shown and the status badge updates
  - on error, a toast with the backend error message is shown
- if status is `approved` or `rejected`:
  - action buttons are not shown
  - reviewed by, reviewed at, and review note are shown (if set)
- see a loading spinner while loading
- see an error message if the fetch fails
- click "Review Queue" (back button) to return to the queue list

---

## Phase 10 — Notifications

### Notifications Screen
**Route:** `/h/:slug/notifications`  
**File:** `apps/medcord-web/src/features/notifications/screen/notifications-screen.tsx`

On the Notifications screen: user must be able to:
- see a page heading "Notifications" with a total count subtitle
- click "Unread only" toggle to filter to unread notifications only; clicking again reverts to "Show all"
- click "Mark all as read" to mark all notifications read — button shows loading while in flight — on success a success toast is shown
- see a list of notifications, each showing: type icon, title, body text (truncated), relative time ("just now", "Xm ago", "Xh ago", or date), and an unread dot (blue) if unread
- clicking a notification marks it as read (silently — no toast) and the unread dot disappears
- unread notifications have a blue dot indicator on the right; read notifications are slightly muted
- type icons must match: lab result ready → flask, lab result abnormal → alert triangle, transfer request → arrow right, transfer accepted → check circle, transfer declined → x circle, review item submitted → clipboard, review item acted → check, patient admitted → heart pulse, patient discharged → user, vitals out of range → activity, general → bell
- see an empty state with bell icon and "You're all caught up." when no notifications are present
- see a loading spinner while loading
- see an error message if the fetch fails

### Notification Bell (Topbar)
**File:** `apps/medcord-web/src/shared/widgets/app-shell/parts/topbar.tsx`

The notification bell in the topbar must:
- show a red badge when there are unread notifications
- the badge shows the count if ≤ 9, or "9+" if more
- the badge must update automatically — it polls every 60 seconds for unread count
- clicking the bell icon navigates to the notifications screen

---

## Phase 10 — Global Search

### Search Screen
**Route:** `/h/:slug/search`  
**File:** `apps/medcord-web/src/features/search/screen/search-screen.tsx`  
**Sidebar:** Visible always (no module gate)

On the Search Screen: user must be able to:
- see the search input auto-focused on page load
- type a query — results appear after a 300ms debounce once the query is ≥ 2 characters
- see a small inline spinner next to the input while a search is in flight
- see "Start typing to search patients, assets, and lab orders." before any query is entered
- see results grouped into three sections (only sections with results are shown):
  - **Patients** — each row shows: full name, patient code, date of birth, admission status badge (outpatient/admitted/discharged colour-coded)
  - **Assets** — each row shows: asset name, category, current location (if set), status badge (colour-coded)
  - **Lab Orders** — each row shows: test name, ordered by, priority badge, status badge, and an alert icon if the result is abnormal
- clicking a patient row navigates to the patient profile page
- clicking an asset row navigates to the asset detail page
- clicking a lab order row navigates to the lab order detail page (with `?patientId=` query param)
- see 'No results for "X". Try different keywords.' when a valid query returns no results
- see an error message if the search request fails

---

## Route Registration Summary

| Route | Screen |
|---|---|
| `/h/:slug/labs/results` | LabResultQueueScreen |
| `/h/:slug/labs/:orderId` | LabOrderDetailScreen |
| `/h/:slug/review` | ReviewQueueScreen |
| `/h/:slug/review/:itemId` | ReviewItemScreen |
| `/h/:slug/notifications` | NotificationsScreen |
| `/h/:slug/search` | SearchScreen |

**Note:** `labs/results` is registered BEFORE `labs/:orderId` to prevent the static segment from being captured as a param.

---

## Toast Behaviour to Verify

- Advancing lab status → success toast
- Recording/updating lab result → success toast (file upload failure → error toast before submission)
- Review item action (approve/reject/escalate) → success toast; failure → error toast with backend message
- Mark all notifications read → success toast
- All error toasts must use the backend error message (`err.message`), never a hardcoded string

## Confirmation Modal Behaviour to Verify

- Reject review item → destructive confirmation modal before acting
- Escalate review item → non-destructive confirmation modal before acting

## Notification Bell Behaviour to Verify

- Badge appears when unread count > 0
- Badge disappears (or decrements) after marking all as read
- Badge updates within ~60 seconds of new notifications arriving
