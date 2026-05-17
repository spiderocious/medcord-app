# Backend Test Plan — Patient History & Admission Records

**Handoff source**: `docs/qas/backend/patient-history-handoff.md`  
**Prepared**: 2026-05-17  
**Environment**: http://localhost:8085 / MongoDB local  
**State file**: `docs/qas/backend/scripts/.state.json`

---

## Actors

| Handle | Role | Token via |
|--------|------|-----------|
| alice | hospital_owner | `/auth/login` |
| carol | doctor (PATIENT_VIEW) | `/auth/login` |
| frank | lab_tech (PATIENT_VIEW) | `/auth/login` |
| eve | reception (PATIENT_ADMIT, no PATIENT_VIEW) | `/auth/login` |
| grace | hospital_owner of Hospital B | `/auth/login` |

## Fixed IDs

| Name | ID |
|------|----|
| Hospital A | `HSP-e505e6a1-d8e8-4cc4-b7cf-5c193defc9f1` |
| PAT1 John Doe | `PAT-4b2fe9c6-04c8-4c5c-9703-13b01bfcfae7` |
| PAT2 Jane Smith | `PAT-d82c25ea-46b2-46f2-a56c-960df6b98348` |
| PAT3 John Marcus | `PAT-f11a9748-2cb3-43de-a509-f4bce6d2d67f` |
| Hospital B | from `.state.json` |

---

## Section 1: POST /admit — changed behaviour (creates PatientAdmission record)

### B1 — Admit with department + assignedTo
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat1/admit`  
  Body: `{ "department": "Cardiology", "assignedTo": "<carol memberId>" }`  
- **Expected**: 200; `patient.admissionStatus === "admitted"`; `patient_admissions` collection has new record with `ADM-` prefix id, `department: "Cardiology"`, `assignedTo` set, `dischargedAt` absent

### B2 — Admit with no optional fields
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat2/admit`  
  Body: `{}`  
- **Expected**: 200; admission created with only required fields (`patientId`, `hospitalId`, `admittedAt`, `admittedBy`); `department` and `assignedTo` absent

### B3 — Admit without token
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat3/admit` (no Authorization header)  
- **Expected**: 401

### B4 — Admit without PATIENT_ADMIT permission
- **Actor**: carol (doctor — has PATIENT_VIEW but not PATIENT_ADMIT)  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat3/admit`  
- **Expected**: 403

### B5 — Admit a patient not linked to hospital
- **Actor**: grace  
- **Request**: `POST /api/v1/hospitals/:hospB/patients/:pat1/admit` (pat1 is a Hospital A patient)  
- **Expected**: 404

### B6 — Verify ADM- prefix on admission record
- **Derived from B1**: inspect the admission record returned or fetched via GET /admissions  
- **Expected**: `admission.id` starts with `ADM-`

---

## Section 2: POST /discharge — changed behaviour (closes PatientAdmission)

### B7 — Discharge currently admitted patient
- **Prereq**: pat1 is admitted (from B1)  
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat1/discharge`  
  Body: `{}`  
- **Expected**: 200; `patient.admissionStatus === "discharged"`; open admission record now has `dischargedAt` + `dischargedBy` set

### B8 — Discharge with notes
- **Prereq**: Admit pat2 first (pat2 was admitted in B2 with no department)  
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat2/discharge`  
  Body: `{ "notes": "Stable, follow-up in 2 weeks" }`  
- **Expected**: 200; closed admission has `dischargeNotes: "Stable, follow-up in 2 weeks"`

### B9 — Discharge patient with no open admission (soft no-op)
- **Prereq**: pat3 is outpatient (never admitted)  
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat3/discharge`  
  Body: `{}`  
- **Expected**: 200 OK; patient `admissionStatus` updated to `"discharged"`; no error thrown; no crash

### B10 — Discharge without token
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat1/discharge` (no token)  
- **Expected**: 401

---

## Section 3: GET /admissions — new endpoint

### B11 — Fetch admissions for patient with prior admissions
- **Prereq**: pat1 has been admitted + discharged (from B1/B7); perform 2 more admit/discharge cycles on pat1  
- **Actor**: carol (has PATIENT_VIEW)  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat1/admissions`  
- **Expected**: 200; `admissions` array has ≥ 1 record; sorted `admittedAt` descending (newest first)

### B12 — Fetch admissions for patient with no history
- **Prereq**: Register a fresh patient with no admission history (or use pat3 if still clean)  
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat3/admissions` (after discharge/re-set, or use clean patient)  
- **Expected**: 200; `admissions: []`

### B13 — Patient not linked to hospital returns 404
- **Actor**: grace (Hospital B token)  
- **Request**: `GET /api/v1/hospitals/:hospB/patients/:pat1/admissions`  
- **Expected**: 404

### B14 — Fetch admissions by patientCode
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/<pat1Code>/admissions` (use `CAE-xxx` code)  
- **Expected**: 200; same result as by ID

### B15 — Fetch admissions without PATIENT_VIEW permission
- **Actor**: eve (reception — has PATIENT_ADMIT but not PATIENT_VIEW)  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat1/admissions`  
- **Expected**: 403

### B16 — Closed admissions have dischargedAt; open admissions do not
- **Derived from B11**: Inspect returned records  
- **Expected**: Discharged records have `dischargedAt` set; if any open record exists, `dischargedAt` is absent

---

## Section 4: GET /check-ins — new endpoint

### B17 — Fetch check-ins for patient with prior visits
- **Prereq**: pat2 or pat3 has been checked in and out at least once  
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat2/check-ins`  
- **Expected**: 200; `visits` array non-empty; sorted `checkedInAt` descending

### B18 — Fetch check-ins for patient with no history
- **Prereq**: use a patient that has never been checked in  
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat1/check-ins` (pat1 is admitted, not a check-in patient)  
- **Expected**: 200; `visits: []`

### B19 — Patient not linked to hospital returns 404
- **Actor**: grace  
- **Request**: `GET /api/v1/hospitals/:hospB/patients/:pat2/check-ins`  
- **Expected**: 404

### B20 — Fetch check-ins by patientCode
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/<pat2Code>/check-ins`  
- **Expected**: 200; same result as by ID

### B21 — Active visit has no checkedOutAt field
- **Prereq**: Check in pat3 (do not check out)  
- **Actor**: carol  
- **Request**: `GET /api/v1/hospitals/:hospA/patients/:pat3/check-ins`  
- **Expected**: 200; active visit row has no `checkedOutAt` key (or `checkedOutAt: undefined`)

---

## Section 5: Regression checks

### B22 — Checkin flow still works end-to-end
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat2/checkin` (pat2 should be outpatient)  
  Body: `{ "department": "General" }`  
- **Expected**: 200; visit created in `checkin_visits`; patient returns with visit data

### B23 — Checkout flow still works
- **Prereq**: pat2 has an active check-in visit from B22  
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat2/checkout`  
- **Expected**: 200

### B24 — Transfer flow unaffected
- **Actor**: alice  
- **Request**: `POST /api/v1/hospitals/:hospA/patients/:pat1/transfer`  
  Body: `{ "toHospitalId": ":hospB", "reason": "Regression check", "recordsPackage": { "includeVitals": true, "includeMedications": false, "includeHistory": false, "includeLabs": false, "includeDocuments": false } }`  
- **Expected**: 200 or 201; transfer record created

### B25 — Patient list pagination unaffected
- **Actor**: alice  
- **Request**: `GET /api/v1/hospitals/:hospA/patients?limit=10`  
- **Expected**: 200; paginated list returns correctly; `items` array present; existing patients visible

---

## Response shape verification

### GET /admissions — verify full shape
```json
{
  "data": {
    "admissions": [
      {
        "id": "ADM-xxx",
        "patientId": "PAT-xxx",
        "hospitalId": "HSP-xxx",
        "admittedAt": "<ISO date>",
        "admittedBy": "STF-xxx or USR-xxx",
        "department": "Cardiology",
        "assignedTo": "STF-xxx",
        "dischargedAt": "<ISO date>",
        "dischargedBy": "STF-xxx",
        "dischargeNotes": "...",
        "createdAt": "<ISO date>",
        "updatedAt": "<ISO date>"
      }
    ]
  }
}
```

### GET /check-ins — verify full shape
```json
{
  "data": {
    "visits": [
      {
        "id": "VIS-xxx",
        "hospitalId": "HSP-xxx",
        "patientId": "PAT-xxx",
        "patientCode": "CAE-xxx",
        "queueNumber": 4,
        "checkedInAt": "<ISO date>",
        "checkedInBy": "STF-xxx",
        "checkedOutAt": "<ISO date>",
        "stage": "done",
        "department": "General",
        "createdAt": "<ISO date>",
        "updatedAt": "<ISO date>"
      }
    ]
  }
}
```

---

## Execution order

1. Run `node docs/qas/backend/scripts/restore-seed.mjs` to ensure clean baseline
2. Re-login all actors to get fresh tokens
3. B1–B6 (admit changed behaviour)
4. B7–B10 (discharge changed behaviour)
5. B11–B16 (GET /admissions)
6. B17–B21 (GET /check-ins)
7. B22–B25 (regressions)
