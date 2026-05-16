# Medcord Frontend — Cross-Cutting Test Plan

> **QA:** Claude
> **Version:** 1.0 — 2026-05-16
> **Status:** Reusable regression checklist. Reference this from every module plan.
> **Scope:** Applies to every screen, feature, and component in `apps/medcord-web`.
> **How to use:** Run this plan on any module before signing off execution. Every section is independent — start from any section. Failures here block the module from passing regardless of module-specific test results.

---

## Table of Contents

1. [Design System Components](#1-design-system-components)
   - 1.1 AppButton (primitives)
   - 1.2 AppText (primitives)
   - 1.3 DrawerService — Toasts & Modals
   - 1.4 Avatar & Pill system
   - 1.5 Button system (full)
   - 1.6 Cards
   - 1.7 Table
   - 1.8 Input components
   - 1.9 Feedback components
   - 1.10 Navigation components
   - 1.11 Skeleton & Empty states
   - 1.12 Tooltip
   - 1.13 Datetime components
   - 1.14 Selection components
   - 1.15 Banner (PatientBanner)
   - 1.16 Modal system
2. [meemaw Primitives](#2-meemaw-primitives)
3. [Color Tokens & Typography](#3-color-tokens--typography)
4. [Icon Usage](#4-icon-usage)
5. [Error & Success Patterns](#5-error--success-patterns)
6. [Confirmation Modals for Dangerous Actions](#6-confirmation-modals-for-dangerous-actions)
7. [TypeScript & Code Quality](#7-typescript--code-quality)
8. [Folder Structure & Architecture (FSD)](#8-folder-structure--architecture-fsd)
9. [Routing & Guards](#9-routing--guards)
10. [Accessibility](#10-accessibility)
11. [Performance](#11-performance)

---

## 1. Design System Components

All components below are exported from `@medcord/ui`. Every screen must use these — never reinvent buttons, text, modals, or any of these primitives with raw HTML.

---

### 1.1 AppButton (primitives)

**Variants:** `primary` | `secondary` | `ghost` | `danger`
**Props:** `variant`, `loading`, `leadingIcon`, `trailingIcon`, `disabled`

| ID | Check | Expected |
|---|---|---|
| DS-BTN-01 | All interactive buttons in the app | Must be `<AppButton>`, not raw `<button>` (exception: `role="switch"` toggles, meemaw `CopyToClipboard` internals) |
| DS-BTN-02 | `variant="primary"` renders | Deep forest green bg (`#1B4332`), cream text. Used for main CTAs. |
| DS-BTN-03 | `variant="secondary"` renders | Cream bg, forest text. Used for secondary actions. |
| DS-BTN-04 | `variant="ghost"` renders | Transparent, forest text. Used for low-emphasis actions. |
| DS-BTN-05 | `variant="danger"` renders | Burnt orange bg. Used for destructive irreversible actions only. |
| DS-BTN-06 | `loading` prop | Button shows "Loading…" text and is disabled while `loading={true}` |
| DS-BTN-07 | `leadingIcon` + `trailingIcon` | Icons render correctly inside button with appropriate spacing |
| DS-BTN-08 | Disabled state | Button non-interactive when `disabled` or `loading`. Cursor `not-allowed`. Opacity reduced. |
| DS-BTN-09 | No raw `<button>` with action styling | Search whole module for raw `<button>` elements used for user-facing actions — each must have a clear reason for not being AppButton |

---

### 1.2 AppText (primitives)

**Variants:** `display-1` | `display-2` | `heading-1` | `heading-2` | `heading-3` | `body` | `body-sm` | `caption`
**Default elements:** display-1/2 → `h1`, heading-1 → `h2`, heading-2 → `h3`, heading-3 → `h4`, body/body-sm → `p`, caption → `span`
**`as` prop** overrides the rendered element.

| ID | Check | Expected |
|---|---|---|
| DS-TXT-01 | All page headings | Use `<AppText variant="heading-1">` or `heading-2` — not raw `<h2>`, `<h3>` |
| DS-TXT-02 | Section labels, card headers | Use `<AppText variant="heading-3">` or `body-sm` as appropriate |
| DS-TXT-03 | Body text / descriptions | Use `<AppText variant="body">` or `body-sm` |
| DS-TXT-04 | Small labels, badges, captions | Use `<AppText variant="caption">` — renders as uppercase tracked `span` |
| DS-TXT-05 | `as` prop usage | When text renders as a semantic `p` but needs `caption` styling, use `as="p"`. Verify no mismatched semantics. |
| DS-TXT-06 | No raw text elements for visible content | No bare `<h1>`–`<h6>`, `<p>`, `<span>` with typography classes used as a substitute for AppText |

---

### 1.3 DrawerService — Toasts & Modals

**Toast types:** `success` | `error` | `warning` | `info`
**Modal kinds:** `feedback` | `confirmation` | `input` | `custom`
**Modal kinds (visual):** `success` | `error` | `warning` | `info`

#### Toast

| ID | Check | Expected |
|---|---|---|
| DS-TOAST-01 | Post-mutation success | `DrawerService.toast(msg, { type: 'success' })` — green left rule, "✓" glyph |
| DS-TOAST-02 | Post-mutation warning | `DrawerService.toast(msg, { type: 'warning' })` — amber rule, "!" glyph |
| DS-TOAST-03 | Post-mutation info | `DrawerService.toast(msg, { type: 'info' })` — ink rule, "·" glyph |
| DS-TOAST-04 | Error toast (mutation-level) | `DrawerService.toast(msg, { type: 'error' })` — red rule, "!" glyph. Only on mutation failure, never on form submit. |
| DS-TOAST-05 | Toast auto-dismisses | Toast disappears after ~4 seconds. No toast left visible indefinitely (unless `sticky: true` intentionally set). |
| DS-TOAST-06 | Toast has dismiss button | X button visible. Clicking it removes the toast immediately. |
| DS-TOAST-07 | Multiple toasts stack | If multiple toasts fire in sequence, they stack without overlapping. |
| DS-TOAST-08 | No toasts for form errors | Submitting a form with invalid data shows inline error — never a toast. |
| DS-TOAST-09 | No toasts for settings save | Settings forms show inline "Saved!" flash — not `DrawerService.toast`. |
| DS-TOAST-10 | `ModalHost` + `ToastHost` mounted | Both `<ModalHost />` and `<ToastHost />` must be rendered in the app root for modals/toasts to appear. |

#### Confirmation Modal

| ID | Check | Expected |
|---|---|---|
| DS-MODAL-CONF-01 | Modal fires before destructive action | Any suspend, remove, revoke, archive, or delete action must show `DrawerService.showConfirmationModal(...)` first |
| DS-MODAL-CONF-02 | `kind: 'warning'` styling | Amber accent left rule + amber confirm button |
| DS-MODAL-CONF-03 | `kind: 'error'` + `destructive: true` | Red accent left rule + red confirm button. Cancel sits on the left, confirm on the right (pushed by spacer). |
| DS-MODAL-CONF-04 | `kind: 'info'` (default) | Ink left rule, neutral confirm button. Used for non-destructive confirmations (resend invitation, reactivate). |
| DS-MODAL-CONF-05 | Cancel button | Clicking Cancel fires `onCancel` if provided, then dismisses. No action taken. |
| DS-MODAL-CONF-06 | Confirm button | Clicking Confirm fires `onConfirm` then dismisses. Action proceeds. |
| DS-MODAL-CONF-07 | Backdrop click dismisses | Clicking the backdrop (outside the modal) calls `dismissModal`. No action taken. |
| DS-MODAL-CONF-08 | Modal title and body text | Title must be specific (not generic "Are you sure?"). Body must name the entity and describe the consequence. |
| DS-MODAL-CONF-09 | `confirmButtonText` set | Button not showing generic "Confirm" — must match action ("Revoke", "Suspend", "Remove", "Resend", "Archive", etc.) |

#### Feedback Modal

| ID | Check | Expected |
|---|---|---|
| DS-MODAL-FB-01 | Used for informational messages | `DrawerService.showFeedbackModal(...)` fires where a non-actionable message needs presenting (no cancel button) |
| DS-MODAL-FB-02 | Close button visible | `showCloseButton: true` (default) — X button in header. Clicking closes. |
| DS-MODAL-FB-03 | Confirm / OK button present | Single action button. Closes modal on click. |

#### Input Modal

| ID | Check | Expected |
|---|---|---|
| DS-MODAL-INPUT-01 | Used where text input is needed in a modal | `DrawerService.showInputModal(...)` — e.g., typing a name to confirm an action |
| DS-MODAL-INPUT-02 | Input type correct | `inputType: 'text' | 'email' | 'password'` matches the field |
| DS-MODAL-INPUT-03 | Enter key submits | Pressing Enter in a single-line input triggers confirm |
| DS-MODAL-INPUT-04 | `multiline: true` for textarea | Multi-line input uses textarea (no Enter submit) |
| DS-MODAL-INPUT-05 | `stepLabel` shown when provided | Small monospace step label visible in header |

#### Custom Modal

| ID | Check | Expected |
|---|---|---|
| DS-MODAL-CUST-01 | Used for complex modal content | `DrawerService.showCustomModal(...)` used where none of the other modal types fit |
| DS-MODAL-CUST-02 | Content renders correctly | `contentFn()` renders inside modal body |
| DS-MODAL-CUST-03 | Close button dismisses | X in header calls `onClose` and dismisses |

---

### 1.4 Avatar & Pill System

**Components:** `PatientAvatar`, `StaffAvatar`, `AvatarStack`, `NotificationBadge`, `Pill`

#### PatientAvatar

| ID | Check | Expected |
|---|---|---|
| DS-AVT-PAT-01 | Used for patient identity | Circular avatar, paper-tinted (`#ECE3D6` bg, `#5C4B30` text), initials displayed |
| DS-AVT-PAT-02 | `critical` prop | `critical={true}` adds red ring (arterial red border + shadow). Never show critical patients without this indicator. |
| DS-AVT-PAT-03 | `size` variants | `xs`, `sm`, `md`, `lg`, `xl` — all size correctly at their respective pixel dimensions |
| DS-AVT-PAT-04 | `badge` prop | Number badge appears in top-right corner via `NotificationBadge`. Displays "99+" if count > 99. |
| DS-AVT-PAT-05 | Not raw `<div>` with initials | Patient avatars must use `PatientAvatar`, not ad-hoc inline-styled divs |

#### StaffAvatar

| ID | Check | Expected |
|---|---|---|
| DS-AVT-STAFF-01 | Used for staff identity | Square (4px radius), green-tinted by default. Role tag at bottom-right. On-shift dot at top-right. |
| DS-AVT-STAFF-02 | `role` prop | `md`, `rn`, `tech`, `pharm`, `admin`, `other` — each has distinct bg/text/border color. Role label (MD, RN, TC, RX, AD) shown as chip. |
| DS-AVT-STAFF-03 | `onShift` prop | `onShift={true}` shows green dot top-right. `onShift={false}` — no dot. |
| DS-AVT-STAFF-04 | `size` variants | `sm`, `md`, `lg`, `xl` — correct dimensions |
| DS-AVT-STAFF-05 | `badge` prop | Notification badge on top-right corner when provided |

#### AvatarStack

| ID | Check | Expected |
|---|---|---|
| DS-AVT-STACK-01 | Groups multiple avatars | Overlapping avatars with `[&>*+*]:-ml-2.5` offset and ring shadow |
| DS-AVT-STACK-02 | `overflow` count | When `overflow > 0`, shows "+N" circle after stack |

#### NotificationBadge

| ID | Check | Expected |
|---|---|---|
| DS-BADGE-01 | Standalone usage | Can be used on its own or inside Avatar |
| DS-BADGE-02 | `variant="danger"` | Red bg (default) — for alerts, unread counts |
| DS-BADGE-03 | `variant="ink"` | Ink/dark bg — for less urgent counts |
| DS-BADGE-04 | 99+ cap | Values > 99 display as "99+" |

#### Pill

| ID | Check | Expected |
|---|---|---|
| DS-PILL-01 | `variant="default"` | Hairline border, no fill. For general-purpose labels. |
| DS-PILL-02 | `variant="ok"` | Green tinted. For active/normal status. |
| DS-PILL-03 | `variant="warn"` | Amber tinted. For warning/pending status. |
| DS-PILL-04 | `variant="crit"` | Red tinted. For critical/suspended/error status. |
| DS-PILL-05 | `variant="low"` | Consult blue. For low-priority/advisory status. |
| DS-PILL-06 | `variant="ink"` | Dark filled. For primary/selected state. |
| DS-PILL-07 | `variant="outline"` | Ink border, no fill. For secondary emphasis. |
| DS-PILL-08 | `dot` prop | `dot={true}` shows a colored dot before the label. |
| DS-PILL-09 | Status badges use Pill | Active/Suspended staff status, invitation status, equipment status — all must use `<Pill>`, not ad-hoc inline spans |

---

### 1.5 Button System (full)

**Components from `@medcord/ui/button`:** `Button`, `IrreversibleButton`, `SplitButton`

These are the richer button components (the design system's primary button system). `AppButton` in primitives is the workspace-scoped version.

| ID | Check | Expected |
|---|---|---|
| DS-FULLBTN-01 | `Button` variants | `primary` (green), `secondary` (ink border), `quiet` (transparent). Correct visual for each. |
| DS-FULLBTN-02 | `Button` sizes | `sm`, `md`, `lg` — correct height (28px, 34px, 40px). |
| DS-FULLBTN-03 | `Button` `loading` state | Pulsing dot on left instead of left icon. Children still visible. |
| DS-FULLBTN-04 | `Button` `confirmed` state | Check icon + confirmed style (green-tinted), replaces loading/icon. |
| DS-FULLBTN-05 | `Button` `iconOnly` | Square button at appropriate size. No text. `aria-label` required. |
| DS-FULLBTN-06 | `IrreversibleButton` hold-to-confirm | Red fill rises left-to-right over `holdDuration` (default 1500ms). |
| DS-FULLBTN-07 | `IrreversibleButton` confirm fires | After full hold, "Confirmed" text shows. `onConfirm` callback fires. |
| DS-FULLBTN-08 | `IrreversibleButton` release resets | Releasing before full hold resets progress to 0. |
| DS-FULLBTN-09 | `SplitButton` primary action | Left side shows selected option label. Click fires `onSelect`. |
| DS-FULLBTN-10 | `SplitButton` dropdown | Chevron opens option list. Options selectable. `aria-expanded` updates. |
| DS-FULLBTN-11 | `SplitButton` selected option highlighted | Selected option has `bg-[var(--surface-sunken)]` background in dropdown. |

---

### 1.6 Cards

**Components:** `PatientCardCompact`, `PatientCardDefault`, `PatientCardExpanded`, `StaffCard`, `EquipmentCard`, `StatTile`

| ID | Check | Expected |
|---|---|---|
| DS-CARD-PAT-C-01 | `PatientCardCompact` renders | Name, meta row, initials avatar. `critical={true}` adds red left stripe. `statLabel` shown top-right. |
| DS-CARD-PAT-D-01 | `PatientCardDefault` renders | Avatar + name + demo text + marks (stamp or pill). Allergy band at bottom if `allergy` provided. |
| DS-CARD-PAT-E-01 | `PatientCardExpanded` renders | Larger avatar, name with nickname, IDs row, marks, vitals grid, allergy band. |
| DS-CARD-STAFF-01 | `StaffCard` renders | Square staff avatar with role chip, name, department, on-shift badge. Meta grid at bottom. |
| DS-CARD-EQUIP-01 | `EquipmentCard` renders | Icon square, name, serial, status pill. Alarm section if `alarm` provided. `out-of-service` adds red left stripe. |
| DS-CARD-STAT-01 | `StatTile` renders | Large serif number, mono label, unit, delta with direction color. |
| DS-CARD-STAT-02 | `StatTile` `valueVariant` | `warn` → amber value. `crit` → red value. `default` → ink. |
| DS-CARD-STAT-03 | `StatTile` delta direction | `up` → amber. `down` → green. `neutral` → muted. |

---

### 1.7 Table

**Component:** `Table`, `StatusPill`

| ID | Check | Expected |
|---|---|---|
| DS-TABLE-01 | Column headers | Mono-caps style. Sortable columns have chevron indicator. |
| DS-TABLE-02 | Sortable column click | `onSort` fires with column key. `sortDir` toggles `asc`/`desc`. Active sort column highlighted. |
| DS-TABLE-03 | Row density | `compact`, `regular`, `comfy` — padding changes. Density picker renders when `filterChips` present. |
| DS-TABLE-04 | Filter chips | Chip bar renders above table. Active chip has ink bg. Clicking chip fires `onFilterChange`. |
| DS-TABLE-05 | Selectable rows | Checkbox in header + each row. Select all, select individual, deselect. |
| DS-TABLE-06 | Bulk actions bar | When rows selected, ink toolbar shows with bulk action buttons. Count displayed. |
| DS-TABLE-07 | Critical row | `critical={true}` on row → red gradient from left. |
| DS-TABLE-08 | Selected row | `isSelected` → `shadow-[inset_2px_0_0_var(--text-primary)]` left indicator. |
| DS-TABLE-09 | Expandable row | Expand/collapse chevron renders. `expandedRow` content appears in full-width row below. |
| DS-TABLE-10 | Group separator | `groupLabel` + `groupAfterIndex` renders a labeled divider row at the correct position. |
| DS-TABLE-11 | Pagination | Page buttons render only when `pageCount > 1`. Active page highlighted in ink. |
| DS-TABLE-12 | `StatusPill` in table cells | Status values use `<StatusPill variant="ok|warn|crit|default">` — not ad-hoc spans. |
| DS-TABLE-13 | `Table` not replaced by ad-hoc grids | Staff directory, patient lists, lab results — wherever tabular data exists, check `<Table>` is used |

---

### 1.8 Input Components

**Components:** `LineField`, `LineTextarea`, `LineSelect`, `BlockInput`, `SearchInput`, `UnitToggle`

| ID | Check | Expected |
|---|---|---|
| DS-INPUT-LINE-01 | `LineField` renders | Mono label above, underline below, no box. Used for chart-style form fields. |
| DS-INPUT-LINE-02 | `LineField` status states | `status="error"` → red underline + red help text. `status="ok"` → green underline. `status="default"` → muted. |
| DS-INPUT-LINE-03 | `LineField` disabled | Dashed underline. Text muted. Not interactive. |
| DS-INPUT-LINE-04 | `LineField` readOnly | Dashed underline. Text slightly muted. Not editable. |
| DS-INPUT-LINE-05 | `LineTextarea` | Multi-line variant of LineField. Resize handle visible. |
| DS-INPUT-LINE-06 | `LineSelect` | Underline select with mono label. Options from `options` prop. |
| DS-INPUT-BLOCK-01 | `BlockInput` renders | Boxed input with sunken bg, border, prefix/suffix slots. |
| DS-INPUT-BLOCK-02 | `BlockInput` status | `error` → red border + red bg. `ok` → green border + green bg. |
| DS-INPUT-BLOCK-03 | `BlockInput` prefix/suffix | Text or icon renders on left/right inside the box. |
| DS-INPUT-SEARCH-01 | `SearchInput` renders | Full-width search bar with optional prefix label and keyboard hint. |
| DS-INPUT-TOGGLE-01 | `UnitToggle` renders | Two options (e.g. °F/°C). Active option bold and ink. |
| DS-INPUT-TOGGLE-02 | `UnitToggle` fires `onChange` | Clicking either option updates value and fires callback. |
| DS-INPUT-FORM-01 | Form fields use design system inputs | Login, register, invite, settings, search — all text inputs use `LineField`, `BlockInput`, or `SearchInput` |

---

### 1.9 Feedback Components

**Components:** `Toast`, `UndoStrip`, `OptimisticIndicator`, `ToastManager`, `useToast`, `PageBanner`, `Alert`, `ContextMenu`

| ID | Check | Expected |
|---|---|---|
| DS-FB-TOAST-01 | `Toast` component | Has variant glyph (·/✓/!/!), left rule color, title, optional description. Dismiss X button. |
| DS-FB-TOAST-02 | `Toast` actions | Action buttons inside toast (e.g. "Undo") render below description. |
| DS-FB-TOAST-03 | `Toast` progress bar | If `progress` prop provided, narrow bar at bottom shows progress. |
| DS-FB-TOAST-04 | `UndoStrip` | Ink bg strip with "Undo" button. Used for reversible destructive actions. |
| DS-FB-OPTIM-01 | `OptimisticIndicator` | Pulsing dot + "Saving…" text. Shown during optimistic mutations. |
| DS-FB-BANNER-01 | `PageBanner` renders | Full-width banner below topbar with stamp label, message, optional action, dismiss. |
| DS-FB-BANNER-02 | `PageBanner` variants | `info`, `ok`, `warn`, `crit`, `system` — each has distinct bg and stamp style. |
| DS-FB-ALERT-01 | `Alert` renders | Left 3px rule, stamp label, title, italic description. Four variants. |
| DS-FB-ALERT-02 | `Alert` `variant="crit"` | Red rule, red stamp, red text. Used for critical inline alerts. |
| DS-FB-ALERT-03 | `Alert` `variant="warn"` | Amber rule, amber stamp, amber text. |
| DS-FB-CTXMENU-01 | `ContextMenu` renders | Dropdown menu with items, optional glyphs, shortcuts, dividers, group labels. |
| DS-FB-CTXMENU-02 | `ContextMenu` closes on outside click | Clicking outside calls `onClose`. |
| DS-FB-CTXMENU-03 | `ContextMenu` danger item | `variant="danger"` renders item in red. |

---

### 1.10 Navigation Components

**Components:** `Topbar`, `Sidebar`, `Breadcrumb`, `CommandPalette`, `Drawer`, `ModuleLauncher`

| ID | Check | Expected |
|---|---|---|
| DS-NAV-TOPBAR-01 | `Topbar` renders | Tenant name/logo, search bar, role pill, notification bell, help, user profile. |
| DS-NAV-TOPBAR-02 | Notification badge on bell | If `notificationCount > 0`, red badge with count appears on bell. |
| DS-NAV-TOPBAR-03 | User profile shows `name` + `role` | Not email. Name = display name (e.g. "Alice Mensah"), role = "Doctor", "Admin" etc. |
| DS-NAV-SIDEBAR-01 | `Sidebar` renders | Sections with mono-caps labels. Nav items with ordinal, label, count. |
| DS-NAV-SIDEBAR-02 | Active item | `activeId` item has ink left border, bold label, sunken bg. |
| DS-NAV-SIDEBAR-03 | Alert count | `alert={true}` on nav item shows count in red. |
| DS-NAV-BREAD-01 | `Breadcrumb` renders | Dot-separated segments. Last segment is ink. Others are muted and hoverable. |
| DS-NAV-CMD-01 | `CommandPalette` renders when `open` | Overlay with find bar, groups, items with glyphs. |
| DS-NAV-CMD-02 | `CommandPalette` closes on Escape | `onClose` fires on Esc key. |
| DS-NAV-CMD-03 | `CommandPalette` closes on backdrop click | Clicking outside the palette calls `onClose`. |
| DS-NAV-DRAWER-01 | `Drawer` renders | Right-side panel with header (title, subtitle, avatar), body, footer. Closes on Esc or backdrop. |
| DS-NAV-DRAWER-02 | `Drawer` allergy band | `allergyText` prop renders red allergy band below header. |
| DS-NAV-MOD-01 | `ModuleLauncher` renders | Grid of module tiles. Active tile has ink bg icon. |
| DS-NAV-MOD-02 | `ModuleLauncher` tile click | `onClick` fires on tile. |

---

### 1.11 Skeleton & Empty States

**Components:** `SkLine`, `SkCircle`, `SkBlock`, `SkPatientRow`, `SkCard`, `SkVitalsStrip`, `EmptyState`, `TriadCard`, `ModuleEmptyCard`

| ID | Check | Expected |
|---|---|---|
| DS-SK-LINE-01 | `SkLine` sizes | `sm` (9px), `md` (12px), `lg` (18px). Animating skeleton gradient. |
| DS-SK-CIRCLE-01 | `SkCircle` | Circular skeleton at specified size. |
| DS-SK-BLOCK-01 | `SkBlock` | Full-width block skeleton at specified height. |
| DS-SK-ROW-01 | `SkPatientRow` | Circle avatar + two line skeletons + trailing line. Used in patient list loading. |
| DS-SK-CARD-01 | `SkCard` | Block + lines + short lines. Used in card loading. |
| DS-SK-VITALS-01 | `SkVitalsStrip` | Row of lines + block + bottom row. Used for vitals chart loading. |
| DS-SK-USAGE-01 | Skeleton used in loading states | Every `<Loadable>` or async screen shows a skeleton, not a blank page or a spinner div |
| DS-EMPTY-01 | `EmptyState` renders | Serif italic glyph/dash, title, optional description, optional action links. |
| DS-EMPTY-02 | `EmptyState variant="error"` | Red glyph "!", red text. Error styling. |
| DS-EMPTY-03 | `EmptyState` actions | Action links underline-style. Click fires `onClick`. |
| DS-EMPTY-04 | `ModuleEmptyCard` | Module-specific empty state with mono module label, glyph, title, description, action. |
| DS-TRIAD-01 | `TriadCard` loading state | Shows stamp "Loading" header. Children are skeleton content. |
| DS-TRIAD-02 | `TriadCard` empty state | Shows stamp "Empty". |
| DS-TRIAD-03 | `TriadCard` error state | Red border, red left rule, stamp "Error" in red. |

---

### 1.12 Tooltip

**Component:** `Tooltip`

| ID | Check | Expected |
|---|---|---|
| DS-TIP-01 | `Tooltip` renders on hover | Ink chip with white text. Arrow pointing to anchor. |
| DS-TIP-02 | `placement` options | `top`, `right`, `bottom`, `left` — tooltip appears on correct side |
| DS-TIP-03 | `shortcut` prop | Mono shortcut text renders inside tooltip after label. |
| DS-TIP-04 | `disabled={true}` | No tooltip shown. |
| DS-TIP-05 | Dismisses on mouse leave | Tooltip hides when mouse leaves the anchor. |
| DS-TIP-06 | Used for icon-only buttons | Any `<AppButton iconOnly>` or `<Button iconOnly>` must have a `<Tooltip>` wrapping it. |

---

### 1.13 Datetime Components

**Components:** `Calendar`, `DateRangePicker`, `TimePicker`, `TimeSlotGrid`, `RelativeTime`, `Duration`, `ShiftTimeline`

| ID | Check | Expected |
|---|---|---|
| DS-DT-CAL-01 | `Calendar` renders | Month grid, today circled, selected date filled (ink). Navigation arrows work. |
| DS-DT-CAL-02 | `markedDates` | Marked dates show a dot below the date. |
| DS-DT-CAL-03 | `unavailableDates` | Unavailable dates are muted and non-clickable. |
| DS-DT-RANGE-01 | `DateRangePicker` renders | Two months side-by-side. Range shows filled start, end, and filled in-between. |
| DS-DT-TIME-01 | `TimePicker` renders | Scrollable hour/minute wheels. Selected value shows above. |
| DS-DT-SLOT-01 | `TimeSlotGrid` renders | Hour labels + slot cells. Available, booked, blocked states distinct. |
| DS-DT-REL-01 | `RelativeTime` renders | Human-readable relative time (e.g. "2 hours ago"). Updates on interval if `live={true}`. |
| DS-DT-DUR-01 | `Duration` renders | Formatted duration string (e.g. "1h 30m"). |
| DS-DT-SHIFT-01 | `ShiftTimeline` renders | Horizontal bar with time blocks, shift segments colored by role. |

---

### 1.14 Selection Components

**Components:** `RadioGroup`, `CheckboxGroup`, `ToggleGroup`, `RatingScale`, `Combobox`

| ID | Check | Expected |
|---|---|---|
| DS-SEL-RADIO-01 | `RadioGroup` renders | Options with ink circle radio. Selected option filled. |
| DS-SEL-RADIO-02 | `RadioGroup` selection | Clicking option fires `onChange` with value. |
| DS-SEL-CHECK-01 | `CheckboxGroup` renders | Options with ink square checkbox. Selected checked. |
| DS-SEL-CHECK-02 | `CheckboxGroup` multi-select | Multiple items selectable independently. |
| DS-SEL-TOGGLE-01 | `ToggleGroup` renders | Segmented control. Active segment ink-filled. |
| DS-SEL-TOGGLE-02 | `ToggleGroup` selection | Clicking segment fires `onChange`. |
| DS-SEL-RATING-01 | `RatingScale` renders | Numeric scale (0–10 or custom). Selected value highlighted. |
| DS-SEL-COMBO-01 | `Combobox` renders | Input with dropdown list. Filtering works. |
| DS-SEL-COMBO-02 | `Combobox` keyboard navigation | Arrow keys move selection. Enter selects. Escape closes. |

---

### 1.15 Banner (PatientBanner)

**Component:** `PatientBanner`

| ID | Check | Expected |
|---|---|---|
| DS-BNR-01 | Renders as chart header | Full-bleed, attached to top of patient context pages. |
| DS-BNR-02 | Code status stamp | Etched into top border. "Full code" = ink outline. "DNR", "DNR·DNI", "CMO" = ink filled. |
| DS-BNR-03 | Precaution flags | Displayed top-right. `fall`, `npo`, `iso`, `aspir` each have distinct color. |
| DS-BNR-04 | Allergy band | `allergyVariant="allergy"` → red band with italic allergy text. `no-known` → muted. |
| DS-BNR-05 | Vitals rail | Vital columns with mono values, sparkline, status color (flagged=amber, critical=red). |
| DS-BNR-06 | Action shelf | Tabs + action buttons below allergy band. Active tab has underline. |
| DS-BNR-07 | Right column | Attending, service, bed, insurance rows. Mono label + ui value pairs. |

---

### 1.16 Modal System

**Component:** `Modal` (from `@medcord/ui/modal`)

| ID | Check | Expected |
|---|---|---|
| DS-MODAL-01 | Modal renders when `open={true}` | Backdrop + panel visible. |
| DS-MODAL-02 | Modal hides when `open={false}` | No DOM nodes rendered (portal removed). |
| DS-MODAL-03 | Backdrop click closes | `onClose` fires. |
| DS-MODAL-04 | Escape key closes | `onClose` fires on Esc. |
| DS-MODAL-05 | `Modal` vs `DrawerService.showConfirmationModal` | Use `Modal` for complex multi-field modal forms. Use `DrawerService` for simple confirmation/feedback patterns. |

---

## 2. meemaw Primitives

All meemaw imports from the `meemaw` package. Raw JSX equivalents are banned in this codebase.

| ID | Check | Expected |
|---|---|---|
| MM-REPEAT-01 | No raw `.map()` in JSX | Every list render uses `<Repeat each={...}>{(item) => ...}</Repeat>` |
| MM-REPEAT-02 | `ReadonlyArray` cast | If `each` is `ReadonlyArray<T>`, cast to `T[]` inside the prop: `each={items as Item[]}` |
| MM-REPEAT-03 | `key` prop inside Repeat | Each child element in `<Repeat>` has a unique `key` prop. |
| MM-SHOW-01 | No raw `&&` in JSX | Every `{condition && <X />}` replaced with `<Show when={condition}><X /></Show>` |
| MM-SHOW-02 | No ternary rendering | Every `{a ? <X /> : <Y />}` replaced with `<Switch><Case when={a}><X /></Case><Default><Y /></Default></Switch>` |
| MM-SWITCH-01 | `Switch`/`Case`/`Default` for multi-branch | Tab content, step content, status-based rendering — use `<Switch>` not repeated ternaries |
| MM-LOADABLE-01 | `<Loadable>` for async screens | Every screen that fetches data wraps content in `<Loadable loading={...} error={...} loadingComponent={...} errorComponent={...}>` |
| MM-LOADABLE-02 | `loadingComponent` is a skeleton | Must render a skeleton (from design system or custom) — not a blank div or spinner text |
| MM-LOADABLE-03 | `errorComponent` has `role="alert"` | Error component renders `<p role="alert" className="...bg-red-50 text-red-700...">` — not a generic div |
| MM-COPY-01 | `CopyToClipboard` from meemaw | Clipboard copy interactions use `<CopyToClipboard>` — not raw `navigator.clipboard.writeText` in JSX |
| MM-HIDDEN-01 | `Hidden` for screen-reader-only content | Visually hidden but accessible content uses `<Hidden>` |
| MM-CLAMP-01 | `Clamp` for line-clamped text | Truncated multi-line text uses `<Clamp lines={N}>` |
| MM-SHOWONCE-01 | `ShowOnce` for one-time renders | Content that renders once and persists uses `<ShowOnce>` |
| MM-DELAYED-01 | `Delayed` for deferred rendering | Content with intentional delay uses `<Delayed ms={N}>` |

---

## 3. Color Tokens & Typography

All colors must come from design tokens — never raw hex in className.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `forest-900` | `#1B4332` | Primary brand green — main backgrounds, button fills, borders |
| `forest-700` | `#2D5A3D` | Hover states on forest-900 |
| `cream-50` | `#F5EFE0` | Accent cream — secondary button bg, light surfaces |
| `charcoal-900` | `#1F2024` | Primary text |
| `charcoal-700` | `#3A3B40` | Secondary text, captions |
| `offwhite-50` | `#FAFAF7` | Page background, card bg |
| `orange-600` | `#C7522A` | Danger/destructive only |

CSS custom properties (used in design system components directly):
`--surface-raised`, `--surface-sunken`, `--surface-base`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border-default`, `--records-*`, `--danger-*`, `--warning-*`, `--consult-*`, `--neutral-0`

| ID | Check | Expected |
|---|---|---|
| CLR-01 | No raw hex in `className` | No `bg-[#1B4332]`, `text-[#3A3B40]`, `border-[#F5EFE0]` etc. in feature code. Only in `packages/ui` internals (acceptable there). |
| CLR-02 | Token usage for greens | Use `bg-forest-900`, `text-forest-900`, `border-forest-900/10` |
| CLR-03 | Token usage for text | Use `text-charcoal-900`, `text-charcoal-700` |
| CLR-04 | Token usage for cream | Use `bg-cream-50`, `text-cream-50` |
| CLR-05 | Orange only for danger | `orange-600` used only for destructive actions, never decorative |

### Typography

| ID | Check | Expected |
|---|---|---|
| TYP-01 | Font family — display/headings | Fraunces serif via `font-serif` |
| TYP-02 | Font family — body | Inter sans via `font-ui` or default sans |
| TYP-03 | Font family — mono data | System monospace via `font-mono` for IDs, codes, serial numbers, dates |
| TYP-04 | No custom font-size raw values in feature code | Use `AppText` variant classes, not `text-[19px]` in feature components |

---

## 4. Icon Usage

Icons come from `@icons` (the proxy at `packages/ui/src/icons/index.ts`). Never import directly from `lucide-react` in feature code.

| ID | Check | Expected |
|---|---|---|
| ICN-01 | Import from `@icons` | All icon imports in feature code: `import { IconX } from '@icons'` — not `import { X } from 'lucide-react'` |
| ICN-02 | Icon names exist in proxy | Before using any icon name, it must be in the proxy. Common mistakes: `IconMail` (use `IconSend`), `IconRefreshCw` (use `IconRefresh`), `IconX` (use `IconClose`), `IconSitemap` (use `IconNetwork`), `IconAlertTriangle` (use `IconAlert`), `IconTrash2` (use `IconTrash`), `IconEdit2` (use `IconEdit`) |
| ICN-03 | No emoji as icons | All icon uses must be SVG from `@icons` — never emoji characters in UI |
| ICN-04 | Icon size appropriate | Icons in buttons typically `size={14}` or `size={13}`. Nav icons `size={16}`. Standalone icons as needed. |
| ICN-05 | Icon-only elements have `aria-label` | Buttons with only an icon (no visible text) have `aria-label` describing the action. |

**Full available icon set:**

Navigation: `IconHome`, `IconChevronLeft/Right/Down/Up`, `IconMenu`, `IconClose`, `IconLogout`, `IconSettings`, `IconSearch`, `IconBell`, `IconFilters`, `IconMoreHorizontal`, `IconMoreVertical`, `IconArrowLeft`, `IconArrowRight`, `IconExternalLink`, `IconCopy`, `IconCheck`

People: `IconUser`, `IconUsers`, `IconUserPlus`, `IconUserCheck`, `IconUserX`, `IconShield`

Clinical: `IconHeartPulse`, `IconActivity`, `IconStethoscope`, `IconPill`, `IconFlask`, `IconSyringe`, `IconThermometer`, `IconClipboard`, `IconFileText`, `IconFilePlus`, `IconFileSearch`, `IconMicroscope`

Hospital: `IconBuilding`, `IconLayers`, `IconNetwork`, `IconQrCode`, `IconBarcode`, `IconScan`

Status: `IconAlert`, `IconAlertCircle`, `IconInfo`, `IconCheckCircle`, `IconXCircle`, `IconClock`, `IconRefresh`, `IconLoader`

Actions: `IconPlus`, `IconTrash`, `IconEdit`, `IconUpload`, `IconDownload`, `IconPrint`, `IconSend`, `IconEye`, `IconEyeOff`, `IconStar`, `IconLock`, `IconUnlock`

Assets: `IconMapPin`, `IconPackage`, `IconTag`

Misc: `IconChart`, `IconMap`

---

## 5. Error & Success Patterns

| ID | Check | Expected |
|---|---|---|
| ERR-01 | Form validation errors — inline | Field errors and form-level errors shown as `<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">`. Never as toast. |
| ERR-02 | API errors on form submit — inline | If backend rejects the form, error rendered inline below the form or in a banner — never a toast. |
| ERR-03 | Fetch errors — `errorComponent` | Data fetching failure shows the Loadable `errorComponent` — a dismissable alert or `<p role="alert">`. |
| ERR-04 | No swallowed errors | No `try/catch` that silently catches without rendering feedback to the user. |
| ERR-05 | No generic "Something went wrong" | Error messages name the problem. At minimum restate the action ("Failed to invite staff member") + any detail from the API response. |
| ERR-06 | 409 conflict errors | Duplicate email, duplicate slug, etc. — API 409 renders a specific message ("Email already in use") — not generic. |
| SUCCESS-01 | Post-mutation success toast | After confirmed action completes (suspend, remove, resend invite, etc.) — `DrawerService.toast` with `type: 'success'` or `type: 'info'`. |
| SUCCESS-02 | Settings save — inline flash | Settings form saves show a 3-second "Saved!" inline flash — not a toast, not a modal. |
| SUCCESS-03 | Invite sent — inline state | After sending an invitation, form shows "Invitation sent to X" inline — not a toast. |
| SUCCESS-04 | Navigate after remove | When a record is removed (e.g. remove staff), navigate away from the now-invalid detail page. |

---

## 6. Confirmation Modals for Dangerous Actions

This table catalogs every known dangerous action in the app and its required modal type.

| Action | Screen | Required Modal | kind | destructive |
|---|---|---|---|---|
| Suspend staff member | Staff Profile | `showConfirmationModal` | `'warning'` | `false` |
| Activate staff member | Staff Profile | `showConfirmationModal` | `'info'` (default) | `false` |
| Remove staff member | Staff Profile | `showConfirmationModal` | `'error'` | `true` |
| Revoke invitation | Staff Directory | `showConfirmationModal` | `'error'` | `true` |
| Resend invitation | Staff Directory | `showConfirmationModal` | `'info'` (default) | `false` |
| Archive hospital | Hospital Settings → Danger Zone | Inline name-confirm panel (intentional design, NOT modal) | — | — |
| Delete patient record | (future) | `showConfirmationModal` | `'error'` | `true` |
| Discharge patient | (future) | `showConfirmationModal` | `'warning'` | `false` |

| ID | Check | Expected |
|---|---|---|
| CONF-01 | Every row in table above | Verify each action triggers the correct modal type before the API call fires |
| CONF-02 | Confirm button text | Must name the action, not just "Confirm" |
| CONF-03 | Cancel fires no action | Cancelling closes the modal; no API call made |
| CONF-04 | API call inside `onConfirm` | Mutation only fires inside the `onConfirm` callback, not before modal |
| CONF-05 | Post-confirm toast | After `onConfirm` resolves, appropriate toast fires |
| CONF-06 | No confirmation for read actions | Viewing, searching, filtering — no modal |
| CONF-07 | No confirmation for reversible saves | Regular form saves — no modal. Only irreversible or high-impact actions. |

---

## 7. TypeScript & Code Quality

| ID | Check | Expected |
|---|---|---|
| TS-01 | No `any` type | `@typescript-eslint/no-explicit-any: error`. Use `unknown` + narrowing, or specific interfaces. |
| TS-02 | `import type` for type-only imports | `import type { Foo } from './foo'` — not `import { Foo }` when only using as a type. |
| TS-03 | No empty interfaces | `interface Foo extends Bar {}` is banned. Use `type Foo = Bar`. |
| TS-04 | Props interfaces `readonly` | All component prop interfaces use `readonly` on every field: `readonly name: string`. |
| TS-05 | Props interfaces externalized | Interface defined in the same file as component (not inline in function signature). |
| TS-06 | Named exports only | No `export default` in component files. |
| TS-07 | One component per file | Unless components are trivially small siblings (e.g. a `Row` + its `Cell`). |
| TS-08 | No unused imports | ESLint `unused-imports/no-unused-imports: error`. No dead imports. |
| TS-09 | `noUncheckedIndexedAccess` | Array access returns `T | undefined`. Use `?? fallback` or null check before use. |
| TS-10 | No `console.log` | `no-console: error`. Debug logs must be removed before merge. |
| TS-11 | Hyphenated file names | `staff-directory-screen.tsx` — not `StaffDirectoryScreen.tsx` or `staffDirectoryScreen.tsx`. |

---

## 8. Folder Structure & Architecture (FSD)

| ID | Check | Expected |
|---|---|---|
| FSD-01 | Feature folder shape | Each feature: `screen/`, `screen/parts/`, `api/`, `providers/`, `guards/`, `helpers/`, `shared/types/` as needed |
| FSD-02 | Screen file naming | `[feature-name]-screen.tsx` — e.g. `staff-directory-screen.tsx`, `hospital-settings-screen.tsx` |
| FSD-03 | API hook naming | `use-[resource].ts` — e.g. `use-staff-member.ts`, `use-hospital-by-slug.ts` |
| FSD-04 | Provider naming | `[feature-name]-provider.tsx` — e.g. `hospital-create-provider.tsx` |
| FSD-05 | Guard naming | `[feature-name]-guard.tsx` or `auth-guard.tsx` |
| FSD-06 | Parts vs components | Parts in `screen/parts/` are screen-specific. Cross-feature widgets in `shared/widgets/`. |
| FSD-07 | No cross-app imports | `apps/medcord-web` never imports from `apps/main-backend`. Shared code lives in `packages/`. |
| FSD-08 | Cross-feature shared in `shared/` | API hooks, types, constants used by 2+ features live in `shared/`, not inside one feature. |
| FSD-09 | Path aliases | `@shared/*`, `@features/*`, `@icons`, `@medcord/ui` — never `../../../../shared/foo`. |
| FSD-10 | Routes in constants | Route paths always from `ROUTES.*` constants — never inline `"/staff"` strings in Links. |
| FSD-11 | Endpoints in `EP` constants | API calls use endpoint constants from `@medcord/api` — never hand-written URL strings in components. |
| FSD-12 | Lazy route loading | All feature screens lazy-loaded via `React.lazy()` in `app.routes.tsx`. |

---

## 9. Routing & Guards

| ID | Check | Expected |
|---|---|---|
| ROUTE-01 | `AuthGuard` on protected routes | All `/h/*` and `/hospitals*` routes behind `AuthGuard`. Unauthenticated → redirect to `/login`. |
| ROUTE-02 | Reverse auth guard | Authenticated user visiting `/login` or `/register` → redirect to `/hospitals`. |
| ROUTE-03 | `HospitalShell` resolves slug | `/h/:slug/*` uses `HospitalShell` (or equivalent) to load hospital by slug before rendering. |
| ROUTE-04 | `HospitalGuard` / `activeHospitalId` | Guard checks `activeHospitalId`. Missing → redirect to `/hospitals`. |
| ROUTE-05 | Unknown slug | `/h/does-not-exist/dashboard` → error state, not blank page. |
| ROUTE-06 | Unknown staff ID | `/h/:slug/staff/nonexistent-id` → Loadable error component rendered. |
| ROUTE-07 | Logout redirect | Clearing tokens must call `navigate('/login')` AND invalidate/clear React Query cache. |
| ROUTE-08 | No stale cache after logout | After logout, revisiting a protected route should not show cached data from previous session. |

---

## 10. Accessibility

| ID | Check | Expected |
|---|---|---|
| A11Y-01 | `role="alert"` on errors | All inline error messages have `role="alert"` for screen reader announcement |
| A11Y-02 | `aria-label` on icon-only buttons | Every button with only an icon and no visible text has a descriptive `aria-label` |
| A11Y-03 | `role="switch"` + `aria-checked` | Toggle switches (e.g. module enable/disable) use `role="switch"` with `aria-checked={true|false}` |
| A11Y-04 | Form labels | All inputs have an associated `<label>` (explicit or via `aria-label`). Never a placeholder as the only label. |
| A11Y-05 | Focus management in modals | When a modal opens, focus moves inside the modal. When it closes, focus returns to the trigger. |
| A11Y-06 | `aria-expanded` on dropdowns | Disclosure buttons (split button chevron, sidebar toggles) have `aria-expanded` reflecting open state. |
| A11Y-07 | Keyboard navigable modals | Confirmation modal can be dismissed with Escape. Confirmed with Enter on confirm button. |
| A11Y-08 | Table semantics | Data tables use `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`. Not `div`-based grids for tabular data. |

---

## 11. Performance

| ID | Check | Expected |
|---|---|---|
| PERF-01 | Route-based code splitting | Each feature screen is lazy-loaded. Navigating between routes does not load unrelated code. |
| PERF-02 | React Query caching | Data is cached and not re-fetched unnecessarily. Query keys are specific enough to avoid stale data. |
| PERF-03 | No `useEffect` for data fetching | No bare `useEffect(() => fetch(...))`. All data via `useQuery` / `useMutation`. |
| PERF-04 | Query invalidation after mutation | After a mutation (create, update, delete), relevant query keys are invalidated so lists refresh. |
| PERF-05 | No unnecessary re-renders | Components don't re-render on every keystroke due to missing `useCallback` / `useMemo` on stable references. |

---

## Usage in Module Plans

When executing any module test plan, run this cross-cutting plan in parallel for that module's screens. Reference individual test IDs in bug reports:

```
Bug: CC-FSD-09 + DS-BTN-01 — Sidebar uses relative import `../../../shared` and wraps nav items with raw <button> instead of AppButton.
```

Failures in this plan are **blocking** — a module cannot pass QA if it violates these rules, regardless of feature-specific tests passing.
