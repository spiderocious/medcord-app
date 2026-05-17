# Frontend QA Handoff — Patient History Panel

## Summary

The patient profile screen now shows two history panels below the demographics section:
- **Admission history** — every inpatient admission with dates, duration, department, assigned staff (clickable), and discharge notes
- **Check-in history** — every outpatient check-in visit with queue number, dates, duration, and department

Query cache is also kept fresh: admit/discharge invalidate admission history; checkin/checkout invalidate check-in history.

---

## Where to test

Navigate to: **Patients → [any patient] → patient profile screen**

The two new panels appear in the left column (`lg:col-span-2`), directly below the demographics / emergency contact / guarantor cards.

---

## Admission History panel

### Happy path

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F1 | Patient with prior admissions | Open any patient who has been admitted and discharged at least once | "Admission history" card visible; rows show admitted date, discharged date, duration badge (e.g. "2d"), department |
| F2 | Active (open) admission | Open a currently admitted patient | Row shows admitted date, no discharged date, "Active" label in amber |
| F3 | Assigned staff links | Any admission with `assignedTo` set | Staff ID rendered as clickable `EntityLink`; clicking navigates to that staff member's profile |
| F4 | Discharge notes visible | Any admission that has `dischargeNotes` | Notes text shown in grey below department; truncated if long |
| F5 | Multiple admissions | Patient with 3+ admissions | All rows listed; newest first |
| F6 | Duration < 1 hour | Admission where admitted/discharged same hour | Badge shows "< 1 hour" |
| F7 | Duration in hours | Stay < 24 hours | Badge shows e.g. "6h" |
| F8 | Duration in days | Stay ≥ 24 hours | Badge shows e.g. "3d" |

### Empty state

| # | Scenario | Expected |
|---|----------|----------|
| F9 | Patient with no admissions | "No admissions recorded." text shown inside the card |

### Loading / error states

| # | Scenario | Expected |
|---|----------|----------|
| F10 | Network slow | "Loading…" text shown while request in-flight |
| F11 | API returns error | "Failed to load admissions." error text shown |

### Live invalidation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F12 | Admit then view history | On patient profile, click Admit, submit the form | After mutation succeeds: admission history refetches automatically; new open admission row appears without page reload |
| F13 | Discharge then view history | Admit a patient, then discharge them on the same screen | After discharge mutation: history refetches; previously open admission now shows `dischargedAt` + duration badge |

---

## Check-in History panel

### Happy path

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F14 | Patient with prior check-ins | Open any patient with outpatient visit history | "Check-in history" card visible; rows show date, queue number, duration badge |
| F15 | Active (open) check-in | Patient currently checked in (stage != done) | Row shows checked-in date, "Active" label in amber, no check-out date |
| F16 | Completed check-in | Patient who has been checked out | Row shows both checked-in and checked-out dates + duration |
| F17 | Department shown | Check-in with department set | Department text visible below queue number |
| F18 | Multiple check-ins | Patient with 5+ visits | All rows listed; newest first |

### Empty state

| # | Scenario | Expected |
|---|----------|----------|
| F19 | Patient with no check-ins | "No check-ins recorded." shown inside the card |

### Live invalidation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F20 | Check-in then view history | On patient profile, click Check-in, submit | After mutation: check-in history refetches; new active visit row appears |
| F21 | Checkout then view history | While a visit is active, click Check-out | After mutation: open row updates with `checkedOutAt` and duration badge |

---

## EntityLink in admission rows (assigned staff)

| # | Scenario | Expected |
|---|----------|----------|
| F22 | Hover over staff ID link | Tooltip shows "Go to Staff member" |
| F23 | Click staff ID link | Navigates to `/hospitals/:slug/staff/:staffId` |
| F24 | Admission with no assignedTo | No link rendered; field row absent |

---

## Responsive layout

| # | Scenario | Expected |
|---|----------|----------|
| F25 | Mobile viewport (< lg) | Both history panels stack full-width below demographics |
| F26 | Desktop (≥ lg) | Both history panels stay in left 2/3 column |

---

## Regression checks

| # | Area | Expected unchanged |
|---|------|--------------------|
| F27 | Demographics card | Still renders correctly above the history panels |
| F28 | Emergency contact card | Still shows when present |
| F29 | Guarantor card | Still shows when present |
| F30 | ProfileActions sidebar | Admit / Check-in / Discharge / Transfer actions unaffected |
| F31 | ID Card panel | Still renders in right column |
| F32 | "View chart" button | Still navigates to EMR chart |

---

## Files changed

| File | Change |
|------|--------|
| `apps/medcord-web/src/features/patients/features/patient-profile/api/use-patient-history.ts` | New — `usePatientAdmissions`, `usePatientCheckIns` hooks |
| `apps/medcord-web/src/features/patients/features/patient-profile/api/use-patient.ts` | `useCheckin`/`useCheckout` invalidate `['patient-checkins',...]`; `useAdmit`/`useDischarge` invalidate `['patient-admissions',...]` |
| `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-history.tsx` | New — `ProfileHistory` component |
| `apps/medcord-web/src/features/patients/features/patient-profile/screen/patient-profile-screen.tsx` | Mounts `<ProfileHistory>` below `<ProfileDemographics>` |
| `apps/medcord-web/src/features/patients/shared/types/patient.ts` | Added `PatientAdmission` type |
| `packages/api/src/endpoints.ts` | Added `EP.PATIENT_ADMISSIONS`, `EP.PATIENT_CHECK_INS` |
