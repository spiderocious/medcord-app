# Phase 4/5/6 Implementation Spec
## Pattern-match this file before writing any code for any feature in phases 4, 5, or 6.

**Rule**: Before starting each feature, re-read the relevant section of this file. Every API path, response unwrap, request body field, icon name, and meemaw pattern is pre-verified here against the actual backend source. Do not guess.

---

## 0. MANDATORY CHECKLIST BEFORE EVERY FEATURE

- [ ] Re-read this spec section for the feature
- [ ] Confirm EP constants are correct against route mount (they are WRONG for patients/EMR/labs — use inline paths below)
- [ ] Identify which mutations return 204 (no `.json()`) vs body (`.json<T>()`)
- [ ] Confirm icon names against the verified icon list below
- [ ] No `.map()` in JSX — use `<Repeat each={arr as T[]}>`
- [ ] No `&&` in JSX — use `<Show when={...}>`
- [ ] No raw ternaries in JSX — use `<Show fallback={}>` or `<Switch><Case>`
- [ ] All data-fetching screens wrapped in `<Loadable>`
- [ ] All props interfaces are `readonly`, named `*Props`, declared in same file
- [ ] Named exports only — no default exports
- [ ] ReadonlyArray cast for `<Repeat>`: `<Repeat each={items as Item[]}>`

---

## 1. VERIFIED ICON NAMES

Only these exist. Do not guess or use synonyms.

```
Navigation: IconHome, IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp,
            IconMenu, IconClose, IconLogout, IconSettings, IconSearch, IconBell,
            IconFilters, IconMoreHorizontal, IconMoreVertical, IconArrowLeft, IconArrowRight,
            IconExternalLink, IconCopy, IconCheck

People: IconUser, IconUsers, IconUserPlus, IconUserCheck, IconUserX, IconShield

Clinical: IconHeartPulse, IconActivity, IconStethoscope, IconPill, IconFlask, IconSyringe,
          IconThermometer, IconClipboard, IconFileText, IconFilePlus, IconFileSearch, IconMicroscope

Hospital: IconBuilding, IconLayers, IconNetwork, IconQrCode, IconBarcode, IconScan

Status: IconAlert, IconAlertCircle, IconInfo, IconCheckCircle, IconXCircle, IconClock,
        IconRefresh, IconLoader

Actions: IconPlus, IconTrash, IconEdit, IconUpload, IconDownload, IconPrint, IconSend,
         IconEye, IconEyeOff, IconStar, IconLock, IconUnlock

Assets: IconMapPin, IconPackage, IconTag

Misc: IconChart, IconMap, IconCalendar, IconLink
```

**WRONG names to never use**:
- ❌ `IconMail` → use `IconSend`
- ❌ `IconX` → use `IconClose`
- ❌ `IconTrash2` → use `IconTrash`
- ❌ `IconEdit2` → use `IconEdit`
- ❌ `IconRefreshCw` → use `IconRefresh`
- ❌ `IconAlertTriangle` → use `IconAlert`
- ❌ `IconPhone` → does NOT exist
- ❌ `IconSitemap` → use `IconNetwork`

---

## 2. EP CONSTANTS — CRITICAL WARNINGS

The `EP` constants in `packages/api/src/endpoints.ts` are WRONG for several modules. **Always hardcode the correct path as a string** for the following:

### Patients EP — EP constants are WRONG
Correct mount: `app.use('/api/v1/hospitals/:hospitalId/patients', patientRoutes)`

| Action | Correct path | EP constant | Match? |
|---|---|---|---|
| List/Search patients | `api/v1/hospitals/${hospitalId}/patients` | `EP.HOSPITAL_PATIENTS(hospitalId)` | ✅ OK |
| Recent patients | `api/v1/hospitals/${hospitalId}/patients/recent` | `EP.HOSPITAL_PATIENTS_RECENTS` → `/recents` | ❌ WRONG (use `recent` not `recents`) |
| Favorites list | `api/v1/hospitals/${hospitalId}/patients-favorites` | none | hardcode |
| Get patient | `api/v1/hospitals/${hospitalId}/patients/${patientId}` | `EP.PATIENT(hospitalId, code)` | uses `code` as 2nd arg — OK if passing patientId |
| Update patient | same PATCH | `EP.PATIENT` | ✅ OK |
| Check-in | `api/v1/hospitals/${hospitalId}/patients/${patientId}/checkin` | `EP.PATIENT_CHECK_IN` → `/check-in` | ❌ WRONG (no hyphen) |
| Check-out | `api/v1/hospitals/${hospitalId}/patients/${patientId}/checkout` | `EP.PATIENT_CHECK_OUT` → `/check-out` | ❌ WRONG (no hyphen) |
| Admit | `api/v1/hospitals/${hospitalId}/patients/${patientId}/admit` | `EP.PATIENT_ADMIT` | ✅ OK |
| Discharge | `api/v1/hospitals/${hospitalId}/patients/${patientId}/discharge` | `EP.PATIENT_DISCHARGE` | ✅ OK |
| Transfer | `api/v1/hospitals/${hospitalId}/patients/${patientId}/transfer` | `EP.PATIENT_TRANSFER` | ✅ OK |
| Favorite (add) | `api/v1/hospitals/${hospitalId}/patients/${patientId}/favorite` | `EP.PATIENT_FAVORITE` | ✅ OK |
| Favorite (remove) | same DELETE | `EP.PATIENT_FAVORITE` | ✅ OK |
| ID card get | `api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card` | `EP.PATIENT_ID_CARD` | ✅ OK |
| ID card issue | `api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card` POST | `EP.PATIENT_ID_CARD_ISSUE` → `/id-card/issue` | ❌ WRONG (no `/issue` suffix) |
| ID card deactivate | `api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card` DELETE | `EP.PATIENT_ID_CARD` | ✅ OK |

### EMR EP — ALL EP constants are WRONG
Correct mount: `app.use('/api/v1/hospitals/:hospitalId/patients/:patientId', emrRoutes)`
EP file has `api/v1/emr/patients/${code}/...` — completely wrong prefix.

**Always use hardcoded strings for EMR**:
```ts
const EMR_BASE = (hospitalId: string, patientId: string) =>
  `api/v1/hospitals/${hospitalId}/patients/${patientId}`;
```

| Action | Correct path |
|---|---|
| Chart summary | `${EMR_BASE}/chart` GET |
| List vitals | `${EMR_BASE}/chart/vitals` GET |
| Record vitals | `${EMR_BASE}/chart/vitals` POST |
| List medications | `${EMR_BASE}/chart/medications` GET |
| Add medication | `${EMR_BASE}/chart/medications` POST |
| Update medication | `${EMR_BASE}/chart/medications/${medId}` PATCH |
| Get history | `${EMR_BASE}/chart/history` GET |
| Update history | `${EMR_BASE}/chart/history` PATCH |
| List procedures | `${EMR_BASE}/chart/procedures` GET |
| Add procedure | `${EMR_BASE}/chart/procedures` POST |
| List immunizations | `${EMR_BASE}/chart/immunizations` GET |
| Add immunization | `${EMR_BASE}/chart/immunizations` POST |
| List documents | `${EMR_BASE}/chart/documents` GET |
| Add document | `${EMR_BASE}/chart/documents` POST |
| Update document | `${EMR_BASE}/chart/documents/${docId}` PATCH |
| Access log | `${EMR_BASE}/chart/access-log` GET |
| Break glass | `${EMR_BASE}/chart/break-glass` POST |

### Labs EP — ALL EP constants are WRONG
Correct mount: `app.use('/api/v1/hospitals/:hospitalId/patients/:patientId/labs', labRoutes)`
EP file has `api/v1/hospitals/${hospitalId}/labs/orders` and `api/v1/labs/orders/${orderId}` — wrong.

**Always use hardcoded strings for Labs**:
```ts
const LABS_BASE = (hospitalId: string, patientId: string) =>
  `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs`;
```

| Action | Correct path |
|---|---|
| List lab orders (patient) | `${LABS_BASE}/` GET |
| Create lab order | `${LABS_BASE}/` POST |
| Get lab order | `${LABS_BASE}/${orderId}` GET |
| Update lab order | `${LABS_BASE}/${orderId}` PATCH |
| Advance status | `${LABS_BASE}/${orderId}/advance` POST |
| Record result | `${LABS_BASE}/${orderId}/result` POST |
| Hospital-wide labs | `api/v1/hospitals/${hospitalId}/labs` GET |

### Assets EP — OK to use
Correct mount: `app.use('/api/v1/hospitals/:hospitalId/assets', assetRoutes)`
EP `HOSPITAL_ASSETS(hospitalId)` is correct.

---

## 3. FILE UPLOAD SERVICE

Base URL: `https://go-file-service-production.up.railway.app`

### Flow (always this sequence)
```ts
// Step 1: get upload URI (call right before upload, not at page load)
const res = await fetch(`https://go-file-service-production.up.railway.app/get-upload-uri?ext=jpg`)
const { key, uri } = await res.json()
// key = permanent identifier to save to DB. uri = expires in 15min.

// Step 2: PUT file directly to uri (NOT to our API)
await fetch(uri, {
  method: 'PUT',
  body: file,  // raw File object
  headers: { 'Content-Type': file.type },
})

// Step 3: save key to our backend (e.g. patient.photoKey, asset.photos[].fileKey)

// Step 4: get view URL when displaying (call fresh each time, don't cache URI)
const { uri: viewUri } = await (
  await fetch(`https://go-file-service-production.up.railway.app/get-file-uri?key=${encodeURIComponent(key)}`)
).json()
// uri expires in 1 hour; service handles caching
```

### Rules
- **Save key, not URI** — key is permanent, URI expires
- `ext` has no dot: `jpg` not `.jpg`
- `prefix`/`suffix` EXACTLY 5 chars (not 4, not 6) — validate before calling
- PUT not POST — never `method: 'POST'` to the signed URL
- Call `/get-upload-uri` right before user submits (not at page load)

### Utility function to put in `shared/helpers/file-upload.ts`
```ts
const FILE_SERVICE = 'https://go-file-service-production.up.railway.app'

export async function getUploadUri(ext: string): Promise<{ key: string; uri: string }> {
  const res = await fetch(`${FILE_SERVICE}/get-upload-uri?ext=${ext}`)
  return res.json() as Promise<{ key: string; uri: string }>
}

export async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? ''
  const { key, uri } = await getUploadUri(ext)
  await fetch(uri, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  return key
}

export async function getFileUri(key: string): Promise<string> {
  const res = await fetch(`${FILE_SERVICE}/get-file-uri?key=${encodeURIComponent(key)}`)
  const { uri } = await res.json() as { uri: string }
  return uri
}
```

---

## 4. PHASE 5 — PATIENTS

### FSD File Structure
```
src/features/patients/
  shared/types/patient.ts      ← Patient, Transfer, IdCard types (from backend model)
  features/
    patient-list/
      api/use-patients.ts       ← usePatients, useRecentPatients, useFavoritePatients
      screen/patient-list-screen.tsx
      screen/parts/patient-table.tsx
      screen/parts/patient-filters.tsx
      screen/parts/recent-card.tsx
    patient-register/
      api/use-register-patient.ts
      screen/patient-register-screen.tsx
      screen/parts/demographics-form.tsx
      screen/parts/emergency-contact-form.tsx
      screen/parts/guarantor-form.tsx
      screen/parts/photo-upload.tsx
      screen/parts/duplicate-warning.tsx
    patient-profile/
      api/use-patient.ts          ← usePatient, useUpdatePatient, useCheckin, useCheckout,
                                     useAdmit, useDischarge, useTransfer,
                                     useFavoritePatient, useIdCard, useIssueIdCard, useDeactivateIdCard
      screen/patient-profile-screen.tsx
      screen/parts/profile-header.tsx    ← photo, name, code, admissionStatus
      screen/parts/profile-demographics.tsx
      screen/parts/profile-actions.tsx   ← checkin/checkout/admit/discharge/transfer
      screen/parts/id-card-panel.tsx
```

### Shared Types (from backend model — read patient.model.ts)
```ts
// src/features/patients/shared/types/patient.ts

export interface PatientDemographics {
  readonly firstName: string;
  readonly lastName: string;
  readonly preferredName?: string;
  readonly dateOfBirth: string;  // ISO string from backend
  readonly sex: 'male' | 'female' | 'other';
  readonly gender?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly religion?: string;
  readonly culturalPreferences?: string;
}

export interface EmergencyContact {
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
}

export interface Guarantor {
  readonly name: string;
  readonly relationship: string;
  readonly phone?: string;
  readonly address?: string;
}

export interface IdCard {
  readonly isActive: boolean;
  readonly issuedAt?: string;
  readonly reissuedAt?: string;
}

export interface Patient {
  readonly id: string;
  readonly patientCode: string;
  readonly registeredByHospitalId: string;
  readonly registeredByUserId: string;
  readonly demographics: PatientDemographics;
  readonly emergencyContact?: EmergencyContact;
  readonly guarantor?: Guarantor;
  readonly photoKey?: string;
  readonly documentKeys: readonly string[];
  readonly idCard: IdCard;
  readonly admissionStatus: 'outpatient' | 'admitted' | 'discharged';
  readonly currentHospitalId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Transfer {
  readonly id: string;
  readonly patientId: string;
  readonly fromHospitalId: string;
  readonly toHospitalId: string;
  readonly reason: string;
  readonly department?: string;
  readonly recordsPackage: {
    readonly includeVitals: boolean;
    readonly includeMedications: boolean;
    readonly includeHistory: boolean;
    readonly includeLabs: boolean;
    readonly includeDocuments: boolean;
  };
  readonly status: 'pending' | 'accepted' | 'declined';
  readonly requestedBy: string;
  readonly respondedBy?: string;
  readonly respondedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### API Hooks — use-patients.ts (list/recent/favorites)

```ts
// ALL response shapes verified against patient.routes.ts + patient.service.ts

// GET /api/v1/hospitals/:hospitalId/patients?q=&page=&limit=
// Service returns PaginatedResult<IPatient>: { items, total, page, limit, totalPages }
// Route: ResponseUtil.ok(res, result)  → frontend receives { data: { items, total, page, limit, totalPages } }
// Unwrap: r.data.items, r.data.total
type PatientListResult = { items: readonly Patient[]; total: number; page: number; limit: number; totalPages: number }
type PatientListResponse = { data: PatientListResult }

// GET /api/v1/hospitals/:hospitalId/patients/recent
// Route: ResponseUtil.ok(res, { patients })  → { data: { patients } }
// Unwrap: r.data.patients
type RecentResponse = { data: { patients: readonly Patient[] } }

// GET /api/v1/hospitals/:hospitalId/patients-favorites
// Route: ResponseUtil.ok(res, { patients })  → { data: { patients } }
// Unwrap: r.data.patients
// NOTE: path is 'patients-favorites' (hyphen, NOT '/patients/favorites')
type FavoritesResponse = { data: { patients: readonly Patient[] } }
```

### API Hooks — use-patient.ts (single patient)

```ts
// GET /api/v1/hospitals/:hospitalId/patients/:patientId
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }
// Unwrap: r.data.patient
type PatientResponse = { data: { patient: Patient } }

// PATCH /api/v1/hospitals/:hospitalId/patients/:patientId
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }
// Unwrap: r.data.patient  [200, HAS BODY]

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/checkin
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }  [200, HAS BODY]
// Body: { department?: string; assignedTo?: string }

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/checkout
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }  [200, HAS BODY]
// Body: none

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/admit
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }  [200, HAS BODY]
// Body: { department: string (required); assignedTo?: string; notes?: string }

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/discharge
// Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }  [200, HAS BODY]
// Body: { notes?: string; followUpDate?: string }

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/transfer
// Route: ResponseUtil.created(res, { transfer })  → { data: { transfer } }  [201, HAS BODY]
// Unwrap: r.data.transfer
// Body: { toHospitalId: string; reason: string; department?: string; recordsPackage?: {...} }

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/favorite
// Route: ResponseUtil.noContent(res)  → 204, NO BODY, do NOT call .json()

// DELETE /api/v1/hospitals/:hospitalId/patients/:patientId/favorite
// Route: ResponseUtil.noContent(res)  → 204, NO BODY

// GET /api/v1/hospitals/:hospitalId/patients/:patientId/id-card
// Service returns { patient, idCard }; Route: ResponseUtil.ok(res, data) → { data: { patient, idCard } }
// Unwrap: r.data.patient, r.data.idCard
type IdCardResponse = { data: { patient: Patient; idCard: IdCard } }

// POST /api/v1/hospitals/:hospitalId/patients/:patientId/id-card
// IMPORTANT: path is /id-card (no /issue suffix) — EP.PATIENT_ID_CARD_ISSUE is WRONG
// Service returns updated patient; Route: ResponseUtil.ok(res, { patient })  → { data: { patient } }
// Unwrap: r.data.patient  [200, HAS BODY]

// DELETE /api/v1/hospitals/:hospitalId/patients/:patientId/id-card
// Route: ResponseUtil.noContent(res)  → 204, NO BODY
```

### Register Patient

```ts
// POST /api/v1/hospitals/:hospitalId/patients
// Route: ResponseUtil.created(res, result)  where result = { patient, possibleDuplicates }
// → { data: { patient, possibleDuplicates } }  [201, HAS BODY]
// Unwrap: r.data.patient, r.data.possibleDuplicates
type RegisterResponse = { data: { patient: Patient; possibleDuplicates: readonly Patient[] } }

// Body shape (from patient.schema.ts):
interface RegisterPatientPayload {
  demographics: {
    firstName: string; lastName: string; preferredName?: string;
    dateOfBirth: string; // ISO date
    sex: 'male' | 'female' | 'other'; gender?: string;
    address?: string; phone?: string; email?: string;
    religion?: string; culturalPreferences?: string;
  };
  emergencyContact?: { name: string; relationship: string; phone: string };
  guarantor?: { name: string; relationship: string; phone?: string; address?: string };
  photoKey?: string;       // from file service
  documentKeys?: string[]; // from file service, default []
}
```

### Patient Photo Upload
- Use `uploadFile(file)` helper → returns `key`
- Set `photoKey: key` in register payload
- To display: use `getFileUri(patient.photoKey)` → returns signed URL

---

## 5. PHASE 6 — EMR

### FSD File Structure
```
src/features/emr/
  shared/types/emr.ts            ← Vitals, Medication, MedicalHistory, Procedure, Immunization, ChartDocument, AccessLog types
  features/
    chart-overview/
      api/use-chart-summary.ts   ← useChartSummary
      screen/chart-overview-screen.tsx
      screen/parts/summary-card.tsx
    vitals/
      api/use-vitals.ts          ← useVitals, useRecordVitals
      screen/vitals-screen.tsx
      screen/parts/vitals-form.tsx
      screen/parts/vitals-history.tsx
    medications/
      api/use-medications.ts     ← useMedications, useAddMedication, useUpdateMedication
      screen/medications-screen.tsx
      screen/parts/medication-form.tsx
      screen/parts/medication-list.tsx
    history/
      api/use-history.ts         ← useHistory, useUpdateHistory
      screen/history-screen.tsx
      screen/parts/history-form.tsx
    procedures/
      api/use-procedures.ts      ← useProcedures, useAddProcedure
      screen/procedures-screen.tsx
      screen/parts/procedure-form.tsx
    immunizations/
      api/use-immunizations.ts   ← useImmunizations, useAddImmunization
      screen/immunizations-screen.tsx
      screen/parts/immunization-form.tsx
    documents/
      api/use-documents.ts       ← useDocuments, useAddDocument, useUpdateDocument
      screen/documents-screen.tsx
      screen/parts/document-upload.tsx   ← uses file service
    access-log/
      api/use-access-log.ts      ← useAccessLog, useBreakGlass
      screen/access-log-screen.tsx
```

### Shared Types (from emr.model.ts)
```ts
// src/features/emr/shared/types/emr.ts

export interface Vitals {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly recordedBy: string;
  readonly bp_systolic?: number;
  readonly bp_diastolic?: number;
  readonly hr?: number;
  readonly rr?: number;
  readonly temp?: number;
  readonly spo2?: number;
  readonly weight?: number;
  readonly height?: number;
  readonly painScore?: number;
  readonly bmi?: number;
  readonly isOutOfRange: boolean;
  readonly outOfRangeFields: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MedicationStatus = 'active' | 'discontinued' | 'on_hold';

export interface Medication {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly drug: string;     // field is 'drug', NOT 'name'
  readonly strength?: string; // field is 'strength', NOT 'dosage'
  readonly route?: string;
  readonly frequency?: string;
  readonly indication?: string;
  readonly duration?: string;
  readonly status: MedicationStatus;
  readonly prescribedBy: string;
  readonly discontinuedBy?: string;
  readonly discontinuedAt?: string;
  readonly discontinuedReason?: string;
  readonly drugInteractionWarnings: readonly string[];
  readonly allergyWarnings: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Diagnosis {
  readonly icd10Code: string;    // NOT 'code'
  readonly description: string;  // NOT 'name'
  readonly diagnosedAt?: string;
}

export interface HistoryProcedure {
  readonly cptCode: string;
  readonly description: string;
  readonly performedAt?: string;
}

export interface SocialHistory {
  readonly smoking?: string;
  readonly alcohol?: string;
  readonly occupation?: string;
  readonly other?: string;
}

export interface MedicalHistory {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly diagnoses: readonly Diagnosis[];
  readonly procedures: readonly HistoryProcedure[];
  readonly familyHistory: readonly string[];
  readonly socialHistory: SocialHistory;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PreOpChecklist {
  readonly consentObtained: boolean;
  readonly npoStatus: boolean;
  readonly allergiesConfirmed: boolean;
  readonly siteMarked: boolean;
}

export interface Procedure {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly name: string;
  readonly cptCode?: string;
  readonly performedBy: string;  // name string, NOT a user ID called 'performedBy'
  readonly performedAt: string;  // date as ISO string
  readonly location?: string;
  readonly notes?: string;
  readonly operativeNoteKey?: string;  // file service key
  readonly preOpChecklist: PreOpChecklist;
  readonly followUpDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Immunization {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly vaccine: string;
  readonly dose?: string;
  readonly administeredAt: string;
  readonly lotNumber?: string;
  readonly administrator: string;
  readonly nextDueDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ChartDocumentCategory = 'referral' | 'lab_report' | 'imaging' | 'consent' | 'other';
// NOT: 'prescription', 'lab_result', 'scan' — these DO NOT EXIST

export interface ChartDocument {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly title: string;
  readonly category: ChartDocumentCategory;
  readonly fileKey: string;  // file service key
  readonly uploadedBy: string;
  readonly isSensitive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChartAccessLog {
  readonly hospitalId: string;
  readonly patientId: string;
  readonly accessedBy: string;
  readonly action: 'view_chart' | 'view_vitals' | 'view_medications' | 'view_history'
                 | 'view_procedures' | 'view_immunizations' | 'view_documents' | 'break_glass';
  readonly section: string;
  readonly reason?: string;
  readonly isBreakGlass: boolean;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly accessedAt: string;
}

export interface ChartSummary {
  readonly lastVitals: Vitals | null;
  readonly activeMedicationsCount: number;
  readonly diagnosesCount: number;
  readonly recentProcedures: readonly Procedure[];
}
```

### EMR API Response Shapes — VERIFIED

All paths use `api/v1/hospitals/${hospitalId}/patients/${patientId}` as base.

```ts
// GET .../chart  → { data: { summary } }
// Unwrap: r.data.summary

// GET .../chart/vitals?limit=  → { data: { vitals } }
// Unwrap: r.data.vitals (array)

// POST .../chart/vitals  → { data: { vitals } }  [201]
// Unwrap: r.data.vitals (single record)
// Body: { bp_systolic?, bp_diastolic?, hr?, rr?, temp?, spo2?, weight?, height?, painScore? }
// All optional; units are FIXED (temp in °C, weight in kg, height in cm); BMI auto-calculated

// GET .../chart/medications  → { data: { medications } }
// Unwrap: r.data.medications (array)

// POST .../chart/medications  → { data: { medication } }  [201, requires PRESCRIBER role]
// Unwrap: r.data.medication
// Body: { drug: string (required); strength?, route?, frequency?, indication?, duration?,
//         drugInteractionWarnings?: string[], allergyWarnings?: string[] }

// PATCH .../chart/medications/:medId  → { data: { medication } }  [200]
// Unwrap: r.data.medication
// Body: { status: 'discontinued' | 'on_hold' | 'active'; reason?: string }

// GET .../chart/history  → { data: { history } }
// Unwrap: r.data.history

// PATCH .../chart/history  → { data: { history } }  [200, PATCH not POST, requires CLINICAL role]
// Unwrap: r.data.history
// Body: { diagnoses?: [{icd10Code, description, diagnosedAt?}];
//         procedures?: [{cptCode, description, performedAt?}];
//         familyHistory?: string[]; socialHistory?: {...}; notes?: string }

// GET .../chart/procedures  → { data: { procedures } }
// Unwrap: r.data.procedures (array)

// POST .../chart/procedures  → { data: { procedure } }  [201, requires CLINICAL role]
// Unwrap: r.data.procedure
// Body: { name: string (req); cptCode?; performedBy: string (req); performedAt: string (req ISO date);
//         location?; notes?; operativeNoteKey?: string (file key);
//         preOpChecklist: { consentObtained: boolean; npoStatus: boolean;
//                          allergiesConfirmed: boolean; siteMarked: boolean } (ALL REQUIRED);
//         followUpDate?: string }

// GET .../chart/immunizations  → { data: { immunizations } }
// Unwrap: r.data.immunizations (array)

// POST .../chart/immunizations  → { data: { immunization } }  [201, requires CLINICAL role]
// Unwrap: r.data.immunization
// Body: { vaccine: string (req); dose?; administeredAt: string (req ISO date);
//         lotNumber?; administrator: string (req); nextDueDate? }

// GET .../chart/documents  → { data: { documents } }
// Unwrap: r.data.documents (array)

// POST .../chart/documents  → { data: { document } }  [201]
// Unwrap: r.data.document
// Body: { title: string (req); category: 'referral'|'lab_report'|'imaging'|'consent'|'other' (req);
//         fileKey: string (req — from file service); isSensitive?: boolean }

// PATCH .../chart/documents/:docId  → { data: { document } }  [200]
// Unwrap: r.data.document
// Body: { category?: ...; isSensitive?: boolean }

// GET .../chart/access-log?page=&limit=
// Service returns PaginatedResult<IChartAccessLog>: { items, total, page, limit, totalPages }
// Route: ResponseUtil.ok(res, result)  → { data: { items, total, page, limit, totalPages } }
// Unwrap: r.data.items (array of ChartAccessLog), r.data.total
// NOTE: key is 'items' NOT 'logs', NOT 'entries'

// POST .../chart/break-glass  → 204, NO BODY, do NOT call .json()
// Body: { reason: string (required) }
```

### Document Upload Flow (EMR documents)
1. User selects file → call `uploadFile(file)` → get `key`
2. Set `fileKey: key` in the POST body to `/chart/documents`
3. When displaying: call `getFileUri(doc.fileKey)` → signed URL

### Operative Note Upload (Procedures)
- `operativeNoteKey` in add-procedure body is a file service key
- Upload file first, then pass key as `operativeNoteKey`

---

## 6. PHASE 6 — LABS

### FSD File Structure
```
src/features/labs/
  shared/types/lab.ts
  features/
    lab-orders/
      api/use-lab-orders.ts     ← useLabOrders (patient-scoped), useHospitalLabOrders,
                                   useLabOrder, useCreateLabOrder, useUpdateLabOrder,
                                   useAdvanceLabStatus, useRecordLabResult
      screen/lab-orders-screen.tsx
      screen/parts/lab-order-table.tsx
      screen/parts/lab-order-form.tsx
      screen/parts/advance-status-panel.tsx
      screen/parts/record-result-form.tsx
```

### Lab Types (from lab.model.ts)
```ts
// src/features/labs/shared/types/lab.ts

export type LabOrderStatus =
  | 'awaiting_sample'
  | 'sample_received'
  | 'awaiting_test'
  | 'in_progress'
  | 'awaiting_result'
  | 'result_ready'
  | 'result_released';

export interface LabResult {
  readonly value: string;
  readonly unit?: string;
  readonly referenceRange?: string;
  readonly isAbnormal: boolean;
  readonly notes?: string;
}

export interface LabStateHistory {
  readonly from: LabOrderStatus;
  readonly to: LabOrderStatus;
  readonly changedBy: string;
  readonly changedAt: string;
  readonly note?: string;
}

export interface LabOrder {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly orderedBy: string;
  readonly testName: string;
  readonly testCode?: string;
  readonly category?: string;
  readonly priority: 'routine' | 'urgent' | 'stat';
  readonly status: LabOrderStatus;
  readonly stateHistory: readonly LabStateHistory[];
  readonly sampleType?: string;
  readonly sampleCollectedAt?: string;
  readonly sampleCollectedBy?: string;
  readonly result?: LabResult;
  readonly resultReleasedAt?: string;
  readonly resultReleasedBy?: string;
  readonly fileKey?: string;  // file service key for result file
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### Lab API Response Shapes — VERIFIED

Patient-scoped base: `api/v1/hospitals/${hospitalId}/patients/${patientId}/labs`

```ts
// GET .../labs/?status=&priority=&page=&limit=
// Service returns PaginatedResult<ILabOrder>: { items, total, page, limit, totalPages }
// Route: ResponseUtil.ok(res, result)  → { data: { items, total, page, limit, totalPages } }
// Unwrap: r.data.items, r.data.total

// POST .../labs/  → { data: { order } }  [201]
// Unwrap: r.data.order
// Body: { testName: string (req); testCode?; category?;
//         priority?: 'routine'|'urgent'|'stat' (default 'routine');
//         sampleType?; notes? }

// GET .../labs/:orderId  → { data: { order } }
// Unwrap: r.data.order

// PATCH .../labs/:orderId  → { data: { order } }  [200]
// Unwrap: r.data.order
// Body: { testName?; testCode?; category?; priority?; notes?; fileKey? }

// POST .../labs/:orderId/advance  → { data: { order } }  [200]
// Unwrap: r.data.order
// Body: { note?; sampleType?; sampleCollectedAt? }
// NOTE: path is /advance (not /state/advance) — EP.LAB_ORDER_STATE_ADVANCE is WRONG

// POST .../labs/:orderId/result  → { data: { order } }  [200]
// Unwrap: r.data.order
// Body: { value: string (req); unit?; referenceRange?; isAbnormal?: boolean; notes?; fileKey? }
// NOTE: EP.LAB_ORDER_RESULT is WRONG (points to /labs/orders/:orderId/result)

// Hospital-wide: GET api/v1/hospitals/:hospitalId/labs?status=&priority=&page=&limit=
// Same PaginatedResult shape: { data: { items, total, page, limit, totalPages } }
```

---

## 7. PHASE 4 — ASSETS

### FSD File Structure
```
src/features/assets/
  shared/types/asset.ts
  features/
    asset-list/
      api/use-assets.ts          ← useAssets, useCreateAsset, useUpdateAsset,
                                    useUpdateAssetStatus, useMoveAsset,
                                    useAddAssetPhoto, useRemoveAssetPhoto, useDeleteAsset
      screen/asset-list-screen.tsx
      screen/parts/asset-table.tsx
      screen/parts/asset-filters.tsx
    asset-detail/
      screen/asset-detail-screen.tsx
      screen/parts/asset-info.tsx
      screen/parts/asset-photos.tsx
      screen/parts/asset-location-history.tsx
      screen/parts/asset-status-panel.tsx
    asset-create/
      screen/asset-create-screen.tsx
      screen/parts/asset-form.tsx
      screen/parts/photo-uploader.tsx
```

### Asset Types (from asset.model.ts)
```ts
// src/features/assets/shared/types/asset.ts

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface AssetPhoto {
  readonly fileKey: string;
  readonly caption?: string;
}

export interface AssetLocationHistory {
  readonly location: string;
  readonly movedAt: string;
  readonly movedBy: string;
  readonly note?: string;
}

export interface Asset {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly assetTag?: string;
  readonly category: string;
  readonly manufacturer?: string;
  readonly modelName?: string;
  readonly serialNumber?: string;
  readonly purchaseDate?: string;
  readonly purchasePrice?: number;
  readonly warrantyExpiresAt?: string;
  readonly status: AssetStatus;
  readonly condition: AssetCondition;
  readonly currentLocation?: string;
  readonly locationHistory: readonly AssetLocationHistory[];
  readonly assignedTo?: string;
  readonly photos: readonly AssetPhoto[];
  readonly notes?: string;
  readonly lastMaintenanceAt?: string;
  readonly nextMaintenanceDue?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### Asset API Response Shapes — VERIFIED

All EP constants for assets are correct. Base: `EP.HOSPITAL_ASSETS(hospitalId)`.

```ts
// GET api/v1/hospitals/:hospitalId/assets?status=&category=&q=&page=&limit=
// Service returns PaginatedResult<IAsset>: { items, total, page, limit, totalPages }
// Route: ResponseUtil.ok(res, result)  → { data: { items, total, page, limit, totalPages } }
// Unwrap: r.data.items, r.data.total

// POST api/v1/hospitals/:hospitalId/assets  → { data: { asset } }  [201]
// Unwrap: r.data.asset
// Body: { name: string (req); assetTag?; category: string (req); manufacturer?; modelName?;
//         serialNumber?; purchaseDate?; purchasePrice?; warrantyExpiresAt?;
//         status?: AssetStatus (default 'available'); condition?: AssetCondition (default 'good');
//         currentLocation?; notes?;
//         photos?: [{fileKey: string; caption?}] }

// GET api/v1/hospitals/:hospitalId/assets/:assetId  → { data: { asset } }
// Unwrap: r.data.asset

// PATCH api/v1/hospitals/:hospitalId/assets/:assetId  → { data: { asset } }  [200]
// Unwrap: r.data.asset
// Body: { name?; assetTag?; category?; manufacturer?; modelName?; serialNumber?;
//         purchaseDate?; purchasePrice?; warrantyExpiresAt?; condition?; notes?;
//         lastMaintenanceAt?; nextMaintenanceDue? }
// NOTE: 'status' is NOT patchable here — use /status endpoint

// PATCH api/v1/hospitals/:hospitalId/assets/:assetId/status  → { data: { asset } }  [200]
// Unwrap: r.data.asset
// Body: { status: AssetStatus (req); assignedTo?: string }

// POST api/v1/hospitals/:hospitalId/assets/:assetId/move  → { data: { asset } }  [200]
// Unwrap: r.data.asset
// Body: { location: string (req); note?: string }

// POST api/v1/hospitals/:hospitalId/assets/:assetId/photos  → { data: { asset } }  [200]
// Unwrap: r.data.asset (full asset returned, not just photo)
// Body: { fileKey: string (req, from file service); caption?: string }

// DELETE api/v1/hospitals/:hospitalId/assets/:assetId/photos/:fileKey  → { data: { asset } }  [200]
// Unwrap: r.data.asset  [NOTE: 200 not 204 — HAS BODY]

// DELETE api/v1/hospitals/:hospitalId/assets/:assetId  → 204, NO BODY
```

### Asset Photo Upload
1. User selects photo → `uploadFile(file)` → `key`
2. POST to `/photos` with `{ fileKey: key, caption? }`
3. To display photo: `getFileUri(photo.fileKey)` → signed URL

---

## 8. MEEMAW PATTERNS — QUICK REFERENCE

```tsx
// Loading + error + content
<Loadable loading={isLoading} error={error ?? undefined}
  loadingComponent={<div className="...">Loading...</div>}
  errorComponent={<p role="alert" className="...">{error?.message}</p>}
>
  <Content />
</Loadable>

// Conditional (replaces &&)
<Show when={patient !== null}>
  <PatientCard patient={patient!} />
</Show>

// Conditional with fallback (replaces ternary)
<Show when={isActive} fallback={<span>Inactive</span>}>
  <span>Active</span>
</Show>

// Multi-branch (replaces chained ternaries)
<Switch>
  <Case when={status === 'admitted'}><AdmittedBadge /></Case>
  <Case when={status === 'discharged'}><DischargedBadge /></Case>
  <Default><OutpatientBadge /></Default>
</Switch>

// List (replaces .map())
// IMPORTANT: cast to mutable array — ReadonlyArray causes TS error on Repeat
<Repeat each={patients as Patient[]}>
  {(patient: Patient) => <PatientRow key={patient.id} patient={patient} />}
</Repeat>

// Copyable ID
<CopyToClipboard text={patient.patientCode}>
  {(copy, copied) => (
    <button onClick={copy} className="...">
      {patient.patientCode} {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
    </button>
  )}
</CopyToClipboard>
```

---

## 9. FORM INPUT PATTERN

No shared input primitive. Use this class string consistently:
```
mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50
```

Error display:
```tsx
<Show when={error !== null}>
  <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
</Show>
```

---

## 10. 204 vs BODY — COMPLETE LIST FOR PHASES 4/5/6

| Endpoint | Method | Response |
|---|---|---|
| POST .../patients/:id/favorite | POST | 204 — NO `.json()` |
| DELETE .../patients/:id/favorite | DELETE | 204 — NO `.json()` |
| DELETE .../patients/:id/id-card | DELETE | 204 — NO `.json()` |
| DELETE .../assets/:id | DELETE | 204 — NO `.json()` |
| POST .../chart/break-glass | POST | 204 — NO `.json()` |
| All other patient mutations (checkin, checkout, admit, discharge, update, id-card POST/issue) | POST/PATCH | 200 — HAS `.json()` |
| Transfer | POST | 201 — HAS `.json()` |
| Register patient | POST | 201 — HAS `.json()` |
| Record vitals | POST | 201 — HAS `.json()` |
| Add medication | POST | 201 — HAS `.json()` |
| Add procedure | POST | 201 — HAS `.json()` |
| Add immunization | POST | 201 — HAS `.json()` |
| Add document | POST | 201 — HAS `.json()` |
| Update medication | PATCH | 200 — HAS `.json()` |
| Update history | PATCH | 200 — HAS `.json()` |
| Update document | PATCH | 200 — HAS `.json()` |
| Create lab order | POST | 201 — HAS `.json()` |
| Advance lab status | POST | 200 — HAS `.json()` |
| Record lab result | POST | 200 — HAS `.json()` |
| Create asset | POST | 201 — HAS `.json()` |
| Update asset | PATCH | 200 — HAS `.json()` |
| Update asset status | PATCH | 200 — HAS `.json()` |
| Move asset | POST | 200 — HAS `.json()` |
| Add asset photo | POST | 200 — HAS `.json()` |
| Remove asset photo | DELETE | 200 — HAS `.json()` (returns updated asset) |

---

## 11. ROUTE REGISTRATION

When adding screens, register in `src/app.routes.tsx` inside the hospital-scoped `HospitalShell` outlet:

```tsx
// Patients
{ path: 'patients', lazy: () => import('./features/patients/features/patient-list/screen/patient-list-screen') },
{ path: 'patients/register', lazy: () => import('./features/patients/features/patient-register/screen/patient-register-screen') },
{ path: 'patients/:patientId', lazy: () => import('./features/patients/features/patient-profile/screen/patient-profile-screen') },

// EMR (nested under patient)
{ path: 'patients/:patientId/chart', lazy: () => import('./features/emr/features/chart-overview/screen/chart-overview-screen') },
{ path: 'patients/:patientId/chart/vitals', lazy: () => import('./features/emr/features/vitals/screen/vitals-screen') },
// ... etc

// Labs
{ path: 'patients/:patientId/labs', lazy: () => import('./features/labs/features/lab-orders/screen/lab-orders-screen') },

// Assets
{ path: 'assets', lazy: () => import('./features/assets/features/asset-list/screen/asset-list-screen') },
{ path: 'assets/:assetId', lazy: () => import('./features/assets/features/asset-detail/screen/asset-detail-screen') },
```

---

## 12. SIDEBAR NAV ITEMS

Assets and Patients modules are gated behind `hospital.modules`. Check:
- `hospital.modules.emr` → patients + chart
- `hospital.modules.labs` → labs
- `hospital.modules.assets` → assets

Nav items must check `moduleKey` in the AppShell sidebar logic.
