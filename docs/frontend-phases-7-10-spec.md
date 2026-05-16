# Frontend Implementation Spec — Phases 7, 8, 9, 10

> Read this file before touching a single line of code. Every section is derived from
> live backend source (routes, services, models) — not from API docs or build plan alone.
> API docs had 54 documented divergences (see `docs/qas/backend/report/api-diverge.md`).
> Trust only this file + the backend source code.

---

## Master Rules (Never Break These)

### meemaw — Zero exceptions

| Banned | Required |
|---|---|
| `{cond && <X />}` | `<Show when={cond}><X /></Show>` |
| `{cond ? <X /> : <Y />}` | `<Show when={cond} fallback={<Y />}><X /></Show>` |
| `{items.map(...)}` | `<Repeat each={items as T[]}>{(item: T) => ...}</Repeat>` |
| `{isLoading ? <Spinner /> : error ? <Err /> : <Content />}` | `<Loadable loading error={error ?? undefined} loadingComponent errorComponent>` |
| multi-branch ternary | `<Switch><Case when=...><Default>` |

Import all from `'meemaw'`. `error` prop on `<Loadable>` does NOT accept `null` — always `error ?? undefined`.

`<Repeat each={...}>` requires a mutable array type. Cast readonly arrays: `as T[]`.

### API client pattern (ky)

```ts
// GET with response body
const r = await apiClient.get('api/v1/...').json<{ data: { thing: T } }>();
return r.data.thing;

// GET returning PaginatedResult — backend returns { items, total, page, limit, totalPages } NOT { data: T[], meta: {} }
const r = await apiClient.get('api/v1/...').json<{ data: PaginatedResult<T> }>();
return r.data; // r.data.items, r.data.total, etc.

// POST/PATCH with body
const r = await apiClient.post('api/v1/...', { json: payload }).json<{ data: { thing: T } }>();
return r.data.thing;

// 204 — NO .json() call!
await apiClient.post('api/v1/...');
```

### Error handling — never hardcode

```ts
onError: (err: unknown) => {
  DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
},
```

### Icons — only use what exists

Available (prefixed `Icon*`):
`Home, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Menu, Close, Logout, Settings, Search, Bell, Filters, MoreHorizontal, MoreVertical, ArrowLeft, ArrowRight, ExternalLink, Copy, Check, User, Users, UserPlus, UserCheck, UserX, Shield, HeartPulse, Activity, Stethoscope, Pill, Flask, Syringe, Thermometer, Clipboard, FileText, FilePlus, FileSearch, Microscope, Building, Layers, Network, QrCode, Barcode, Scan, Alert, AlertCircle, Info, CheckCircle, XCircle, Clock, Refresh, Loader, Plus, Trash, Edit, Upload, Download, Print, Send, Eye, EyeOff, Star, Lock, Unlock, MapPin, Package, Tag, Chart, Map, Calendar, Link, Back, Forward`

**NOT available**: `IconMail`, `IconRefreshCw`, `IconX`, `IconSitemap`, `IconAlertTriangle`, `IconTrash2`, `IconEdit2`, `IconPhone`

### Design tokens (Tailwind)

Use `forest-900`, `cream-50`, `charcoal-900`, `charcoal-700` — not CSS variables like `var(--brand-600)`.

### PaginatedResult shape from backend

```ts
// What ALL list endpoints return (via PaginatedResult<T>)
{ items: T[]; total: number; page: number; limit: number; totalPages: number }
// Wrapped by ResponseUtil.ok → frontend receives: { data: { items, total, page, limit, totalPages } }
// Access as: r.data.items, r.data.total
```

### Standard input class

```
mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed
```

### File upload flow (file-service)

```
BASE_URL = https://go-file-service-production.up.railway.app

1. GET /get-upload-uri?ext=<ext>  → { key, uri, expires_in }
2. PUT uri  body=file  Content-Type=file.type
3. Save key (not uri — uri expires in 15 min)
4. When displaying: GET /get-file-uri?key=<key> → { uri }  (expires 1h, cached)
```

Rules:
- Call `/get-upload-uri` right before user submits (not at page load)
- Always `PUT`, never `POST` to storage
- `ext` has NO dot: pass `pdf` not `.pdf`
- `prefix`/`suffix` must be exactly 5 chars if used

```ts
// Shared helper — already exists in documents-screen.tsx, extract to shared helper if needed
async function uploadFileToService(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? '';
  const res = await fetch(`https://go-file-service-production.up.railway.app/get-upload-uri?ext=${ext}`);
  const { key, uri } = await res.json() as { key: string; uri: string };
  const upload = await fetch(uri, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!upload.ok) throw new Error('File upload failed.');
  return key;
}

async function getFileUrl(key: string): Promise<string> {
  const res = await fetch(`https://go-file-service-production.up.railway.app/get-file-uri?key=${encodeURIComponent(key)}`);
  const { uri } = await res.json() as { uri: string };
  return uri;
}
```

---

## Phase 7 — Labs (Completion)

### What already exists

- `apps/medcord-web/src/features/labs/shared/types/lab.ts` — all types ✅
- `apps/medcord-web/src/features/labs/features/lab-orders/api/use-lab-orders.ts` — all hooks ✅  
  (`usePatientLabOrders`, `useHospitalLabOrders`, `useCreateLabOrder`, `useAdvanceLabStatus`, `useRecordLabResult`)
- `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx` — hospital-wide queue ✅

### What needs to be built

1. **`LabOrderDetailScreen`** — `/h/:slug/labs/:orderId` — BUT: the hospital-wide route is `/api/v1/hospitals/:hospitalId/labs` (no patient ID). The detail route on the backend is `GET /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId`. 

   **Critical backend reality**: The hospital-wide list endpoint returns `LabOrder` objects which include `patientId`. To open a detail from the hospital-wide list, we have the `hospitalId` + `patientId` + `orderId`. The URL can be `/h/:slug/labs/:orderId` but the screen needs to call the patient-scoped endpoint. Fetch the order from the hospital-wide list (already cached), or we need a new hook.

   **Solution**: Add `useGetLabOrder` hook that hits `GET /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId`. The `LabOrdersScreen` list rows will navigate to `/h/:slug/labs/${order.id}` and pass `patientId` as a query param: `/h/:slug/labs/${order.id}?patientId=${order.patientId}`.

2. **Route registration** — add `labs/:orderId` to `app.routes.tsx`

### Backend API — verified from source

#### GET single lab order
```
GET /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId
Route: lab.routes.ts line 54
Service: labService.get(hospitalId, patientId, orderId)
→ ResponseUtil.ok(res, { order })
→ Frontend receives: { data: { order: ILabOrder } }
```

#### PATCH update lab order (before release)
```
PATCH /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId
Service: labService.update — allowed while status !== 'result_released'
Body: { testName?, testCode?, category?, priority?, notes?, fileKey? }
→ ResponseUtil.ok(res, { order })
→ Frontend receives: { data: { order: ILabOrder } }
```

#### POST advance status
```
POST /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId/advance
EP: PATIENT_LAB_ORDER_ADVANCE
Body: { note?: string, sampleType?: string, sampleCollectedAt?: string }
→ ResponseUtil.ok(res, { order })
State machine: awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released
Special: sampleType + sampleCollectedAt only valid on awaiting_sample→sample_received transition
Guard: result must be recorded BEFORE advancing awaiting_result→result_ready (backend enforces)
```

#### POST record result
```
POST /api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId/result
EP: PATIENT_LAB_ORDER_RESULT
Body: { value: string (required), unit?, referenceRange?, isAbnormal: boolean (default false), notes?, fileKey? }
→ ResponseUtil.ok(res, { order })
Only allowed when status is 'awaiting_result' or 'result_ready'
Recording result auto-advances status to 'result_ready'
fileKey: optional — attach a result document via file service
```

### LabOrderDetailScreen spec

**File**: `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx`
**Route**: `/h/:slug/labs/:orderId` (with `?patientId=` query param)

**Layout**: Full page, not inside a layout component. `p-6 space-y-6`.

**Content sections**:

1. **Header bar**
   - Back arrow button (`AppButton variant="ghost" leadingIcon={<IconArrowLeft size={14} />}`) → navigates to `ROUTES.HOSPITAL_LABS(slug)`
   - Test name as `AppText variant="heading-2"`
   - Test code and category as subtitle if present
   - Priority badge (ROUTINE / URGENT / STAT) + Status badge

2. **StateStepper** — 7 steps, horizontal, shows current step highlighted
   - Steps (in order): Awaiting Sample · Sample Received · Awaiting Test · In Progress · Awaiting Result · Result Ready · Released
   - Current step: `forest-900` background circle, white text
   - Completed steps: checkmark icon, muted
   - Future steps: grey
   - "Advance status" button shown only if `order.status !== 'result_released'`
   - On click "Advance status": `DrawerService.showCustomModal` with optional Note field + optional Sample Type/Date fields (shown only if current status is `awaiting_sample`)
   - Special: if current status is `awaiting_result`, show a warning: "Record the result before advancing"

3. **Order details panel** (readonly card)
   - Patient ID, Ordered by, Sample type (if set), Sample collected at/by (if set), Notes
   - Date created

4. **Result panel** — shown when `order.result` is defined OR status is `awaiting_result`/`result_ready`/`result_released`
   - If no result yet: "Record result" button → modal with `RecordResultForm`
   - If result exists: show value, unit, reference range, abnormal badge, notes. File attachment link if `fileKey` exists (call `/get-file-uri` to get download URL).
   - "Update result" button if status is `result_ready` (not yet released)

5. **State history timeline** — list of all `stateHistory` entries, sorted oldest first
   - Each entry: `from → to`, changed by (user ID), date, note if present

**RecordResultForm** (inline modal):
```
Fields:
- value: string (required)
- unit: string (optional)
- referenceRange: string (optional)
- isAbnormal: boolean checkbox (default false)
- notes: string optional textarea
- file upload (optional — calls file service, stores fileKey)
  Using same pattern as documents-screen: hidden input, custom button trigger
```

### New hook needed

Add to `use-lab-orders.ts`:
```ts
useGetLabOrder(hospitalId, patientId, orderId) → useQuery
  GET PATIENT_LAB_ORDER(hospitalId, patientId, orderId)
  → r.data.order
  queryKey: ['lab-order', hospitalId, patientId, orderId]
```

### Updated LabOrdersScreen

Add `onClick` to each table row: navigate to `ROUTES.HOSPITAL_LAB_ORDER(slug, order.id) + ?patientId=${order.patientId}`.

### Route registration

In `app.routes.tsx`, add lazy import for `LabOrderDetailScreen` and add:
```tsx
<Route path="labs/results" element={<Lazy><LabResultQueueScreen /></Lazy>} />
<Route path="labs/:orderId" element={<Lazy><LabOrderDetailScreen /></Lazy>} />
```

Note: `labs/results` must come BEFORE `labs/:orderId` to avoid param capture.

### LabResultQueueScreen spec

**File**: `apps/medcord-web/src/features/labs/features/lab-results/screen/lab-result-queue-screen.tsx`
**Route**: `/h/:slug/labs/results`

This is a filtered view of lab orders with `status=result_ready` from the hospital-wide list. No separate backend endpoint — just filter the hospital labs list.

**Add** `useLabResultQueue(hospitalId)` hook:
```ts
// Calls HOSPITAL_LABS with status=result_ready
// Returns same LabOrderListResult shape
```

Content: Table of result-ready orders. Each row shows test name, patient ID, result value, isAbnormal badge (amber if true), date result recorded. Row click → navigates to lab detail.

---

## Phase 8 — Assets (Completion)

### What already exists

- All three core screens built ✅ (list, detail, create)
- All API hooks built ✅

### What needs to be built

1. **Barcode/QR label generation** — inline on detail screen, "Generate label" button
2. **EP constants** for labs detail — check EP file

### Backend reality for label

No label endpoint exists in the backend source code. The `EP.ASSET_LABEL` constant in `packages/api/src/endpoints.ts` points to `api/v1/assets/:assetId/label` — but there is NO route registered for this in `apps/main-backend/src/features/assets/`. **DO NOT call this endpoint.** It will 404.

**Alternative approach**: Generate a QR code client-side from the asset's `id` + `name` using the `qrcode` library, or just display a styled label card with `assetTag` / `id` that can be printed. No network call required.

**Implementation**: On `AssetDetailScreen`, add a "Print label" button that calls `window.print()` on a hidden printable `<div>` containing the asset tag, name, and a simple display of the ID. No external library needed.

### CSV Bulk Import

**Backend**: `POST /api/v1/hospitals/:hospitalId/assets/bulk` — NOT currently registered in `apps/main-backend/src/features/assets/`. Check before implementing.

```bash
# To verify: grep for 'bulk' in assets route file
```

Since the bulk endpoint doesn't exist in the backend yet, **skip the CSV import UI for now** — it would 404. Mark as deferred.

---

## Phase 9 — Review Queue

### Backend API — verified from source

All routes at `apps/main-backend/src/features/review-queue/index.ts`:

#### GET list
```
GET /api/v1/hospitals/:hospitalId/review-queue
Query params: status?, type?, priority?, page, limit
→ ResponseUtil.ok(res, result)  — result IS the PaginatedResult<IReviewItem> directly
→ Frontend receives: { data: { items, total, page, limit, totalPages } }
```

Note: route returns `result` directly (the PaginatedResult object), not `{ reviewItems }`. So frontend: `r.data.items`, `r.data.total`.

#### POST create item
```
POST /api/v1/hospitals/:hospitalId/review-queue
Body: { patientId, type, referenceId, title, summary?, priority? }
→ ResponseUtil.created(res, { item })
→ Frontend: r.data.item
```

type enum: `lab_result | vitals | medication | document | discharge | transfer`  
priority enum: `routine | urgent | stat`

#### GET single item
```
GET /api/v1/hospitals/:hospitalId/review-queue/:itemId
→ ResponseUtil.ok(res, { item })
→ Frontend: r.data.item
```

#### POST act on item
```
POST /api/v1/hospitals/:hospitalId/review-queue/:itemId/act
Body: { action: 'approve' | 'reject' | 'escalate', note?: string }
→ ResponseUtil.ok(res, { item })
→ Frontend: r.data.item
```

**Note from FIND-43/44 in divergence report**: The API docs were wrong — field names are `type` + `referenceId` (not `resourceType` + `resourceId`), and priority is `routine|urgent|stat` (not `low|normal|high|critical`). We've verified these directly from the backend source — our types are correct.

**No EP constants for review queue exist in `packages/api/src/endpoints.ts`**. Build using inline URL strings (or extend EP file — but we don't modify shared packages without checking). Use inline strings for now:

```ts
`api/v1/hospitals/${hospitalId}/review-queue`
`api/v1/hospitals/${hospitalId}/review-queue/${itemId}`
`api/v1/hospitals/${hospitalId}/review-queue/${itemId}/act`
```

### Types

```ts
// apps/medcord-web/src/features/review-queue/shared/types/review.ts

export type ReviewItemType =
  | 'lab_result'
  | 'vitals'
  | 'medication'
  | 'document'
  | 'discharge'
  | 'transfer';

export type ReviewItemStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface ReviewItem {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly type: ReviewItemType;
  readonly referenceId: string;
  readonly title: string;
  readonly summary?: string;
  readonly priority: 'routine' | 'urgent' | 'stat';
  readonly status: ReviewItemStatus;
  readonly submittedBy: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly reviewNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReviewQueueResult {
  readonly items: readonly ReviewItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

### API hook

**File**: `apps/medcord-web/src/features/review-queue/api/use-review-queue.ts`

```ts
// useReviewQueue(hospitalId, filters) — GET list
//   queryKey: ['review-queue', hospitalId, filters]
//   returns ReviewQueueResult

// useReviewItem(hospitalId, itemId) — GET single
//   queryKey: ['review-item', hospitalId, itemId]
//   returns ReviewItem

// useActOnReviewItem(hospitalId, itemId) — POST act
//   mutationFn: (payload: { action, note? }) => ReviewItem
//   onSuccess: invalidate ['review-queue', hospitalId], ['review-item', hospitalId, itemId]
//   toast on success/error
```

### ReviewQueueScreen spec

**File**: `apps/medcord-web/src/features/review-queue/screen/review-queue-screen.tsx`
**Route**: `/h/:slug/review`

**Layout**: `p-6 space-y-6` — same pattern as LabOrdersScreen.

**Header**:
- `AppText variant="heading-2"` — "Review Queue"
- Subtitle: `{data?.total} item{data?.total !== 1 ? 's' : ''}`

**Filters** (above table):
- Status select: All / Pending / Approved / Rejected / Escalated
- Type select: All / Lab result / Vitals / Medication / Document / Discharge / Transfer
- Priority select: All / Routine / Urgent / STAT

**Table columns**: Title, Type badge, Priority badge, Patient, Submitted by, Date, Status badge

**Type badge styles**:
```ts
const TYPE_STYLE: Record<ReviewItemType, string> = {
  lab_result: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  vitals: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  medication: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  document: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  discharge: 'text-red-700 border-red-200 bg-red-50',
  transfer: 'text-[#6d28d9] border-[#ddd6fe] bg-[#f5f3ff]',
};

const TYPE_LABEL: Record<ReviewItemType, string> = {
  lab_result: 'Lab result',
  vitals: 'Vitals',
  medication: 'Medication',
  document: 'Document',
  discharge: 'Discharge',
  transfer: 'Transfer',
};
```

**Status badge styles**:
```ts
const STATUS_STYLE: Record<ReviewItemStatus, string> = {
  pending: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  approved: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  rejected: 'text-red-700 border-red-200 bg-red-50',
  escalated: 'text-[#6d28d9] border-[#ddd6fe] bg-[#f5f3ff]',
};
```

**Priority badge**: same styles as lab orders (routine/urgent/stat).

**Row click**: navigate to `ROUTES.HOSPITAL_REVIEW_ITEM(slug, item.id)`.

**Empty state**: `<IconClipboard size={32} />` + "No items in the review queue."

**Loadable** with spinner + error.

### ReviewItemScreen spec

**File**: `apps/medcord-web/src/features/review-queue/screen/review-item-screen.tsx`
**Route**: `/h/:slug/review/:itemId`

**Layout**: Two panels — left: item detail card (2/3 width), right: action panel (1/3 width). On mobile: stacked.

**Left panel — item detail**:
- Title as heading
- Summary text (if present)
- Metadata grid: Type, Priority, Patient ID, Reference ID, Submitted by, Submitted at

**Right panel — action panel**:
- Current status badge (large)
- If status is `pending` or `escalated`:
  - Note textarea (optional)
  - Three buttons: "Approve" (primary), "Reject" (danger), "Escalate" (secondary)
  - Each triggers `useActOnReviewItem` with the corresponding action
  - On confirm: show confirmation modal for destructive actions (reject/escalate)
  - Toast on success or error
- If status is `approved` / `rejected`:
  - Read-only: reviewed by, reviewed at, review note
  - No action buttons

**Back button**: `AppButton variant="ghost"` with `<IconArrowLeft size={14} />` → `ROUTES.HOSPITAL_REVIEW_QUEUE(slug)`

**LoadingState**: `Loadable` wrapping the whole page content.

**useParams**: `const { slug, itemId } = useParams<{ slug: string; itemId: string }>()`

### Route registration

In `app.routes.tsx`:
```tsx
// Add lazy imports:
const ReviewQueueScreen = lazy(() => import('@features/review-queue/screen/review-queue-screen.tsx').then(...))
const ReviewItemScreen = lazy(() => import('@features/review-queue/screen/review-item-screen.tsx').then(...))

// Add routes inside /h/:slug:
<Route path="review" element={<Lazy><ReviewQueueScreen /></Lazy>} />
<Route path="review/:itemId" element={<Lazy><ReviewItemScreen /></Lazy>} />
```

### Sidebar — Review Queue already wired

`apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx` already has:
```ts
{ label: 'Review Queue', Icon: IconClipboard, to: ROUTES.HOSPITAL_REVIEW_QUEUE(slug) },
```
No changes needed to sidebar.

---

## Phase 10 — Notifications

### Backend API — verified from source

All routes at `apps/main-backend/src/features/notifications/index.ts`.

#### GET list
```
GET /api/v1/hospitals/:hospitalId/notifications
Query: unread? (boolean — send '?unread=true'), page, limit
→ ResponseUtil.ok(res, result)  — result IS PaginatedResult<INotification> directly
→ Frontend receives: { data: { items, total, page, limit, totalPages } }
EP: HOSPITAL_NOTIFICATIONS(hospitalId)
```

#### POST mark single read
```
POST /api/v1/hospitals/:hospitalId/notifications/:notificationId/read
→ ResponseUtil.ok(res, { notification })
→ Frontend: r.data.notification
EP: None in EP file — use inline: `api/v1/hospitals/${hospitalId}/notifications/${notificationId}/read`
```

**IMPORTANT**: The EP file has `NOTIFICATION_READ: (notifId) => api/v1/notifications/${notifId}/read` — this is WRONG. The actual backend route is `/api/v1/hospitals/:hospitalId/notifications/:notificationId/read` (hospital-scoped). Do NOT use `EP.NOTIFICATION_READ`.

#### POST mark all read
```
POST /api/v1/hospitals/:hospitalId/notifications/read-all
→ ResponseUtil.noContent(res) — 204, NO .json() call!
EP: HOSPITAL_NOTIFICATIONS_READ_ALL(hospitalId)
```

### Types

```ts
// apps/medcord-web/src/features/notifications/shared/types/notification.ts

export type NotificationType =
  | 'lab_result_ready'
  | 'lab_result_abnormal'
  | 'transfer_request'
  | 'transfer_accepted'
  | 'transfer_declined'
  | 'review_item_submitted'
  | 'review_item_acted'
  | 'patient_admitted'
  | 'patient_discharged'
  | 'vitals_out_of_range'
  | 'general';

export interface Notification {
  readonly id: string;
  readonly hospitalId: string;
  readonly recipientId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly isRead: boolean;
  readonly readAt?: string;
  readonly createdAt: string;
}

export interface NotificationListResult {
  readonly items: readonly Notification[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

### API hook

**File**: `apps/medcord-web/src/features/notifications/api/use-notifications.ts`

```ts
// useNotifications(hospitalId, filters?) — GET paginated list
//   queryKey: ['notifications', hospitalId, filters]
//   filters: { unread?: boolean, page?: number, limit?: number }
//   returns NotificationListResult

// useMarkNotificationRead(hospitalId) — POST mark single
//   mutationFn: (notificationId: string) => Notification
//   onSuccess: invalidate ['notifications', hospitalId]
//   NO toast (silent, triggered by click)

// useMarkAllNotificationsRead(hospitalId) — POST mark all
//   mutationFn: () => void  (204 — no .json())
//   onSuccess: invalidate ['notifications', hospitalId]
//   toast: 'All notifications marked as read.'
```

### NotificationsScreen spec

**File**: `apps/medcord-web/src/features/notifications/screen/notifications-screen.tsx`
**Route**: `/h/:slug/notifications`

**Layout**: `p-6 space-y-4`

**Header**:
- `AppText variant="heading-2"` — "Notifications"
- `AppButton variant="ghost"` — "Mark all as read" → calls `useMarkAllNotificationsRead`, disabled while pending
- Unread toggle: `AppButton variant="ghost"` — toggles `?unread=true` filter

**List**: Divide-y card list. Each item is a `<button>` that:
1. Calls `useMarkNotificationRead(notificationId)` — marks it read
2. Navigates to the referenced resource (if `resourceType` + `resourceId` set — see navigation map below)

**Notification item display**:
```
[Icon by type] [Title]                [Time relative: "2h ago"]
              [Body text, truncated]  [Unread dot — blue if !isRead]
```

**Type → Icon mapping**:
```ts
const TYPE_ICON: Record<NotificationType, React.ComponentType<any>> = {
  lab_result_ready: IconFlask,
  lab_result_abnormal: IconAlert,
  transfer_request: IconArrowRight,
  transfer_accepted: IconCheckCircle,
  transfer_declined: IconXCircle,
  review_item_submitted: IconClipboard,
  review_item_acted: IconCheck,
  patient_admitted: IconHeartPulse,
  patient_discharged: IconUser,
  vitals_out_of_range: IconActivity,
  general: IconBell,
};
```

**Relative time**: format using `new Date(createdAt)` — display "just now" (<1m), "Xm ago" (<1h), "Xh ago" (<24h), date string (≥24h).

**Unread indicator**: `h-2 w-2 rounded-full bg-[#2563eb]` dot on right.

**Read items**: slightly muted (`opacity-70` or `bg-cream-50/40`).

**Empty state**: `<IconBell size={32} />` + "You're all caught up."

**Loadable** + error state.

**Route registration** in `app.routes.tsx`:
```tsx
const NotificationsScreen = lazy(() => import('@features/notifications/screen/notifications-screen.tsx').then(...))
// Add:
<Route path="notifications" element={<Lazy><NotificationsScreen /></Lazy>} />
```

### NotificationBell widget — update Topbar

**File**: `apps/medcord-web/src/shared/widgets/app-shell/parts/topbar.tsx`

The topbar already has a `<Link>` to notifications. Upgrade it to show an unread count badge.

**Pattern**:
- Add `useNotificationBell(hospitalId)` — minimal hook that fetches unread count
  - Calls `HOSPITAL_NOTIFICATIONS(hospitalId)?unread=true&limit=1&page=1` → use `r.data.total` as the unread count
  - `staleTime: 30_000` (30s), `refetchInterval: 60_000` (poll every 60s)
  - `queryKey: ['notifications-bell', hospitalId]`
- Show a red badge dot when `unreadCount > 0`
- Badge shows count if ≤ 9, else "9+"

```tsx
// In Topbar — need to pass hospitalId
// AppShell already has hospital prop, pass hospital.id to Topbar
```

**Topbar update**:
- Add `hospitalId: string` to `TopbarProps`
- Import and call `useNotificationBell(hospitalId)`
- Replace bare `<IconBell size={16} />` with relative-positioned wrapper + badge

**AppShell update**:
- Pass `hospitalId={hospital.id}` to `<Topbar>`

---

## Phase 10 — Global Search

### Backend API — verified from source

Route at `apps/main-backend/src/features/search/index.ts`:

```
GET /api/v1/hospitals/:hospitalId/search
Query: q (required, min 1, max 200), types? (csv: 'patients,assets,labs'), limit? (default 5, max 20)
→ ResponseUtil.ok(res, { results })
→ Frontend receives: { data: { results: { patients?: PatientDoc[], assets?: AssetDoc[], labs?: LabOrderDoc[] } } }
EP: HOSPITAL_SEARCH(hospitalId)
```

**Important**: `types` is a comma-separated string: `?types=patients,assets` or `?types=patients`. Default if omitted: all three (`patients`, `assets`, `labs`). Result keys are only present if that type was requested.

**Response shape**: `results` is an object with up to 3 keys. Each key is an array of raw Mongoose docs (lean). Patient docs have the same shape as `IPatient` (demographics, patientCode, etc.). Asset docs same as `IAsset`. Lab docs same as `ILabOrder`.

### Types

```ts
// apps/medcord-web/src/features/search/shared/types/search.ts
import type { Patient } from '@features/patients/shared/types/patient.ts';
import type { Asset } from '@features/assets/shared/types/asset.ts';
import type { LabOrder } from '@features/labs/shared/types/lab.ts';

export interface SearchResults {
  readonly patients?: readonly Patient[];
  readonly assets?: readonly Asset[];
  readonly labs?: readonly LabOrder[];
}
```

### API hook

**File**: `apps/medcord-web/src/features/search/api/use-search.ts`

```ts
// useGlobalSearch(hospitalId, q, limit?) — GET
//   Only enabled when q.trim().length >= 2
//   queryKey: ['search', hospitalId, q, limit]
//   Builds ?q=...&limit=...
//   Returns: SearchResults (r.data.results)
//   staleTime: 10_000 (10s)
```

### SearchScreen spec

**File**: `apps/medcord-web/src/features/search/screen/search-screen.tsx`
**Route**: `/h/:slug/search`

**Layout**: `p-6 space-y-6`

**Search bar**: Large input at top, autofocused on mount.
```tsx
<input
  autoFocus
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search patients, assets, lab orders…"
  className={INPUT_CLS + ' text-base'}
/>
```

**Debounce**: 300ms debounce on `query` before passing to `useGlobalSearch`. Use local state + `setTimeout` + cleanup in `useEffect`:
```ts
const [debouncedQ, setDebouncedQ] = useState('');
useEffect(() => {
  const t = setTimeout(() => setDebouncedQ(query), 300);
  return () => clearTimeout(t);
}, [query]);
```

**No-query state**: Show prompt: "Start typing to search patients, assets, and lab orders."

**Loading state**: Inline spinner (small) next to search bar, not full-page Loadable.

**Results sections** — shown below the search input, separated by section header:

**Patients section** (if `results.patients?.length`):
```
Header: "Patients" (N)
Each item: clickable row → ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode)
Display: Full name, patient code, DOB, admission status badge
```

**Assets section** (if `results.assets?.length`):
```
Header: "Assets" (N)
Each item: clickable row → ROUTES.HOSPITAL_ASSET_DETAIL(slug, asset.id)
Display: Name, category, status badge, current location
```

**Lab orders section** (if `results.labs?.length`):
```
Header: "Lab Orders" (N)
Each item: clickable row → ROUTES.HOSPITAL_LAB_ORDER(slug, order.id) + ?patientId=${order.patientId}
Display: Test name, priority badge, status badge, ordered by
```

**No results** (query is set, results are empty): "No results for "X". Try different keywords."

**Error state**: `<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">` with error message.

**Route registration** in `app.routes.tsx`:
```tsx
const SearchScreen = lazy(() => import('@features/search/screen/search-screen.tsx').then(...))
// Add:
<Route path="search" element={<Lazy><SearchScreen /></Lazy>} />
```

---

## File Structure — All Files to Create

### Phase 7 — Labs completion

```
apps/medcord-web/src/features/labs/features/lab-orders/
├── api/
│   └── use-lab-orders.ts          MODIFY — add useGetLabOrder hook
├── screen/
│   ├── lab-orders-screen.tsx      MODIFY — add row onClick with navigate
│   └── lab-order-detail-screen.tsx  CREATE
├── features/
│   └── lab-results/
│       └── screen/
│           └── lab-result-queue-screen.tsx  CREATE
```

### Phase 9 — Review Queue

```
apps/medcord-web/src/features/review-queue/
├── shared/
│   └── types/
│       └── review.ts              CREATE
├── api/
│   └── use-review-queue.ts        CREATE
└── screen/
    ├── review-queue-screen.tsx    CREATE
    └── review-item-screen.tsx     CREATE
```

### Phase 10 — Notifications

```
apps/medcord-web/src/features/notifications/
├── shared/
│   └── types/
│       └── notification.ts        CREATE
├── api/
│   └── use-notifications.ts       CREATE
└── screen/
    └── notifications-screen.tsx   CREATE
```

### Phase 10 — Search

```
apps/medcord-web/src/features/search/
├── shared/
│   └── types/
│       └── search.ts              CREATE
├── api/
│   └── use-search.ts              CREATE
└── screen/
    └── search-screen.tsx          CREATE
```

### Shared modifications

```
apps/medcord-web/src/app.routes.tsx           MODIFY — add new routes
apps/medcord-web/src/shared/widgets/app-shell/parts/topbar.tsx  MODIFY — add hospitalId prop + unread badge
apps/medcord-web/src/shared/widgets/app-shell/app-shell.tsx     MODIFY — pass hospitalId to Topbar
```

---

## Response Shape Reference (all verified from backend source)

| Endpoint | Route file / notes | Response shape |
|---|---|---|
| GET /hospitals/:id/review-queue | review-queue/index.ts line 20 | `{ data: { items, total, page, limit, totalPages } }` — PaginatedResult direct |
| POST /hospitals/:id/review-queue | review-queue/index.ts line 27 | `{ data: { item: ReviewItem } }` |
| GET /hospitals/:id/review-queue/:itemId | review-queue/index.ts line 38 | `{ data: { item: ReviewItem } }` |
| POST /hospitals/:id/review-queue/:itemId/act | review-queue/index.ts line 48 | `{ data: { item: ReviewItem } }` |
| GET /hospitals/:id/notifications | notifications/index.ts line 21 | `{ data: { items, total, page, limit, totalPages } }` |
| POST /hospitals/:id/notifications/:notifId/read | notifications/index.ts line 38 | `{ data: { notification: Notification } }` |
| POST /hospitals/:id/notifications/read-all | notifications/index.ts line 50 | **204 — no body, no .json()!** |
| GET /hospitals/:id/search | search/index.ts line 27 | `{ data: { results: { patients?, assets?, labs? } } }` |
| GET /hospitals/:id/patients/:pid/labs | lab.routes.ts line 23 | `{ data: { items, total, page, limit, totalPages } }` |
| GET /hospitals/:id/patients/:pid/labs/:oid | lab.routes.ts line 54 | `{ data: { order: LabOrder } }` |
| POST /hospitals/:id/patients/:pid/labs/:oid/advance | lab.routes.ts line 85 | `{ data: { order: LabOrder } }` |
| POST /hospitals/:id/patients/:pid/labs/:oid/result | lab.routes.ts line 103 | `{ data: { order: LabOrder } }` |

---

## Critical Gotchas — Re-read Before Each Module

1. **`read-all` notifications is 204 — drop `.json()`**
2. **`EP.NOTIFICATION_READ` is wrong** — use inline path with hospitalId
3. **Review queue has no EP constants** — use inline strings
4. **Search `types` param is CSV string** not an array
5. **Lab detail needs patientId** — get it from the order object or query param
6. **No label endpoint on backend** — generate QR/print client-side
7. **No bulk asset import endpoint** — skip for now
8. **`<Repeat each={readonlyArray as T[]}>` — always cast**
9. **`error ?? undefined` on Loadable** — never pass null
10. **`useNotificationBell` needs hospitalId** — update Topbar to accept it from AppShell
11. **Notification mark-read is silent** — no toast, just invalidate query
12. **Review queue `list` returns PaginatedResult directly** — `r.data.items` not `r.data.reviewItems`
13. **Search result patient objects** are raw DB docs — `patient.demographics.firstName` etc., same as IPatient shape
14. **`stateHistory[].changedAt`** is a Date on the backend but serialised as ISO string on the wire — treat as string in TypeScript

---

## Build Checklist

Before starting each module, re-read the relevant section above.
After completing each module:

- [ ] Read every API hook — verify response unwrapping matches the table above
- [ ] Check every mutation for 204 vs body
- [ ] Check all icon names against the icon list
- [ ] All JSX uses meemaw primitives — no `&&`, no `.map()`, no raw ternaries
- [ ] Error messages use `err instanceof Error ? err.message : 'Something went wrong.'`
- [ ] `pnpm nx run medcord-web:typecheck` — zero errors
- [ ] `pnpm nx run medcord-web:lint` — zero errors
- [ ] `pnpm nx run medcord-web:build` — zero errors
