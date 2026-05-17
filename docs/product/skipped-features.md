# Medcord MVP — Skipped & Deferred Features

Features from `docs/product/mvp.md` that were not built in the initial MVP. Each entry notes the spec section, what was skipped, and whether it was an explicit deferral or a gap.

---

## Module 2 — Staff Profiles & Roles

### 2.2 Per-member permission overrides
**Spec:** "As a super-admin, I should be able to override permissions for specific staff members."
**Built:** Role-level permissions only. All members of a role share the same permission set.
**Status:** Gap — not built. Custom roles are the current workaround (create a role with the exact permission set needed).

### 2.3 Approval workflow configuration
**Spec:** "Define which actions require manager approval per role."
**Built:** Review queue exists (submit → approve/reject/request-changes). The per-role configuration of which actions trigger a review is not built — everything that goes to the queue is hardcoded in the service layer.
**Status:** Gap.

### 2.3 Co-sign documents
**Spec:** "Co-sign documents (e.g., resident note co-signed by attending)."
**Built:** Review queue approval exists but co-signature as a distinct concept (multiple signatories on a single document) is not implemented.
**Status:** Gap.

---

## Module 3 — Patient Management

### 3.2 Print physical ID card
**Spec:** "Print a physical ID card."
**Built:** ID card issuance and digital QR/barcode generation. No print-to-paper flow.
**Status:** Gap — browser print of the ID card view was not implemented.

### 3.2 Share patient code via email/SMS
**Spec:** "Share the patient code via email or SMS with the patient."
**Built:** Patient code is visible in the profile and ID card panel. No send-via-email or send-via-SMS action.
**Status:** Gap.

### 3.1 Duplicate patient detection
**Spec:** "Detect potential duplicate patients during registration (by name + DOB match)."
**Built:** A `duplicate-warning.tsx` component exists in the registration screen — this may be partially implemented. Needs verification before treating as a full gap.
**Status:** Possibly partial — verify in QA.

---

## Module 4 — EMR

### 4.2 Vitals trend graph
**Spec:** "View vitals as a trend graph over time."
**Built:** Vitals history table. No time-series chart.
**Status:** Gap.

### 4.2 Pediatric growth charts
**Spec:** "View pediatric growth charts (height, weight, head circumference percentiles) for patients under 18."
**Built:** Not built.
**Status:** Gap — significant scope. Requires WHO/CDC reference data and charting library integration.

### 4.2 Out-of-range vitals flagging
**Spec:** "See out-of-range vitals flagged automatically."
**Built:** Vitals are recorded but no automatic threshold comparison or flag display.
**Status:** Gap.

### 4.3 Drug-interaction warnings
**Spec:** "See drug-interaction warnings when prescribing."
**Built:** Not built. Requires integration with a drug database (e.g. DrugBank, RxNorm).
**Status:** Deferred — requires third-party data integration.

### 4.3 Drug-allergy warnings
**Spec:** "See drug-allergy warnings when prescribing."
**Built:** Not built.
**Status:** Deferred — same dependency as drug-interaction warnings.

### 4.3 Warning override with audit capture
**Spec:** "Override warnings with a reason captured in the audit log."
**Built:** Not built (depends on warnings existing first).
**Status:** Deferred.

### 4.3 E-prescribing / pharmacy routing
**Spec:** "E-prescribe: send the prescription electronically to a pharmacy."
**Built:** Not built.
**Status:** Explicitly deferred in spec open questions — Surescripts and country-specific pharmacy networks are non-trivial integrations. MVP generates prescription data only.

### 4.3 Medication reconciliation prompts
**Spec:** "View medication reconciliation prompts at admission, transfer, and discharge."
**Built:** Not built.
**Status:** Gap.

### 4.5 Pre-op checklist
**Spec:** "Complete a pre-op checklist (consent, NPO status, allergies confirmed, site marked, etc.)."
**Built:** Procedures can be recorded but no structured pre-op checklist workflow.
**Status:** Gap.

### 4.5 Operative note
**Spec:** "Write or attach an operative note."
**Built:** Chart documents can be uploaded but no dedicated operative note type or structured form.
**Status:** Gap — chart document upload is the current workaround.

### 4.5 Post-op follow-up scheduling
**Spec:** "Schedule and document post-op follow-up."
**Built:** Not built.
**Status:** Gap.

### 4.6 Upcoming / overdue vaccine scheduling
**Spec:** "See upcoming or overdue vaccines based on age and history. Schedule future vaccine doses."
**Built:** Immunization history and recording. No scheduling or overdue detection.
**Status:** Gap — requires immunization schedule reference data (e.g. ACIP schedule).

### 4.9 Restricted-access / VIP patients
**Spec:** "Mark patients as restricted-access (VIPs, employees, sensitive cases). Configure sensitivity restrictions on specific record types."
**Built:** Not built. All patients with the same role permissions are equally accessible.
**Status:** Gap.

### 4.9 Break-glass review queue (admin side)
**Spec:** "Review break-the-glass events."
**Built:** Break-glass submission is built (access log records it). No dedicated admin review queue or flag-for-review workflow on top of the access log.
**Status:** Gap — access log is the workaround.

### 4.9 Privacy incident reporting
**Spec:** "Report a suspected privacy incident. See the status of incidents I have reported."
**Built:** Not built.
**Status:** Gap.

---

## Module 5 — Labs

### 5.3 Critical result paging / notification
**Spec:** "Be paged or notified for critical results."
**Built:** Notifications infrastructure exists. Critical lab result as a notification trigger is not wired up.
**Status:** Gap — notification system needs a trigger hooked into result entry when `isAbnormal: true` and value is outside critical thresholds.

### 5.1 Lab order from instrument import
**Spec:** "Enter test results (manually or by importing from instrument)."
**Built:** Manual result entry only.
**Status:** Deferred — instrument integration (HL7, ASTM) is significant scope.

---

## Cross-Cutting

### Patient consent for inter-hospital transfer
**Spec (open question):** "Whether the platform requires explicit patient consent (electronic signature) before sending records to another hospital."
**Built:** Transfer can be initiated without in-app consent capture. Consent is assumed to happen offline.
**Status:** Explicitly left as an open question in the spec. Not built.

### Staff credentialing / license tracking
**Spec:** Explicitly excluded from MVP scope.
**Status:** Deferred to v2.

### Continuous vitals monitoring
**Spec:** Explicitly excluded from MVP scope.
**Status:** Deferred to v2 — makes Medcord unsuitable for ICU use cases at current version.

### Online consultation
**Spec:** Module flag exists (`onlineConsultation`) and is disabled by default.
**Status:** Deferred to v2.
