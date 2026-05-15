# Medcord — MVP Product Requirements

> Hospital management SaaS. Multi-tenant. Hospitals sign up, set up their workspace, and run patient management, EMR, labs, and asset tracking from a single platform.

---

## Scope notes

- **Pricing**: All hospitals get the Pro plan by default at no cost during the current phase. Plan tiers exist internally and feature gates should be implemented from day one, but the gating is a no-op for now.
- **Domains**: Custom CNAME setup happens outside the app (DNS-level). The app itself does not provide a UI for managing CNAMEs.
- **Tenant provisioning**: There is no separate provisioning step. A user creates a hospital workspace inside the app, configures it, and shares the link with their team. The "tenant" is just a workspace the user creates and manages.
- **Continuous vitals monitoring**: Deferred to v2.
- **Patient code**: Globally unique across the entire platform (not per-tenant). This enables seamless inter-hospital transfer.

---

## Module 1 — Workspace & Hospital Management

The entry point. A user signs up to Medcord, then creates one or more hospital workspaces. Each hospital is fully isolated from the others.

### 1.1 Account Signup & Login

**As a new user, I should be able to:**
- Sign up with email and password
- Verify my email
- Log in with email + password
- Reset my password
- Set up two-factor authentication

**As a logged-in user, I should be able to:**
- See all hospitals I belong to (as creator, admin, or staff)
- Switch between hospitals from a workspace switcher
- Create a new hospital workspace
- Accept or decline invitations to join existing hospitals
- Update my personal profile (name, photo, contact)
- Change my password
- Log out

### 1.2 Hospital Creation

**As a user creating a hospital, I should be able to:**
- Enter hospital name, type (general, specialty, clinic, etc.), location, and contact details
- Become the initial super-admin of that hospital
- Generate a workspace URL (e.g., `Medcord.app/h/stmarys`)
- Be redirected into the new hospital workspace once created

**As the creator, I should automatically:**
- Receive super-admin role
- Be able to invite others
- Be able to configure the workspace

### 1.3 Hospital Settings (Super-Admin Console)

**As a super-admin, I should be able to:**

**General**
- View and edit hospital profile (name, type, location, contact)
- Upload and replace the hospital logo
- Configure color theming (primary color, accent color)
- Preview how branding looks on the patient portal, ID cards, and emails
- Configure the patient ID card template (logo position, color scheme, layout)
- Set hospital time zone and locale
- Set business hours

**Modules**
- Enable or disable modules (EMR, Labs, Assets, Online Consultation) per hospital
- See which modules are part of the current plan

**Domain**
- View the auto-assigned subdomain (e.g., `stmarys.Medcord.app`)
- See instructions for setting up a custom domain via CNAME (instructions only — actual DNS work happens outside the app)
- Mark a custom domain as configured once DNS is pointed correctly

**Plan & billing (placeholder for now)**
- View current plan (defaults to Pro)
- See usage stats (number of staff, patients, storage used)

**Danger zone**
- Transfer hospital ownership to another super-admin
- Archive the hospital
- Delete the hospital (with confirmation)

### 1.4 Staff Invitation & Management

**As a super-admin or hospital admin, I should be able to:**
- Invite staff via email
- Bulk-invite staff via CSV upload
- Assign role at time of invitation (MD, RN, NP, PA, Tech, Admin, Pharmacist, Lab Tech, etc.)
- Assign department and unit at time of invitation
- See all pending invitations
- Resend or revoke invitations
- View the full staff directory
- Edit staff role, department, and reporting line
- Suspend a staff member (revokes access, preserves data)
- Reactivate a suspended staff member
- Remove a staff member from the hospital

**As an invited staff member, I should be able to:**
- Receive an invitation email with a join link
- Sign up or log in via the link
- Be automatically added to the hospital with the assigned role

### 1.5 Sharing the Workspace

**As a super-admin, I should be able to:**
- Copy a shareable link to the workspace login page
- Send invite emails directly from the admin console
- Generate a printable QR code that links to the workspace login (for staff onboarding)

---

## Module 2 — Staff Profiles & Roles

### 2.1 Staff Profile

**As any staff member, I should be able to:**
- View my own profile
- Edit my photo, contact info, and personal details
- View my role, department, specialty, and manager (read-only)
- View my assigned permissions (read-only)

**As a super-admin or hospital admin, I should be able to:**
- View any staff member's profile
- Edit role, department, unit, specialty, manager assignment
- See a staff member's activity history (logins, key actions)

### 2.2 Roles

**Roles available:**
- Super-Admin (full hospital control)
- Hospital Admin (operational control, no danger-zone actions)
- Doctor / MD
- Nurse / RN
- Nurse Practitioner / NP
- Physician Assistant / PA
- Lab Tech
- Pharmacist
- Reception / Front Desk
- Tech (general technician, includes asset management)
- Custom role (super-admin defined)

**As a super-admin, I should be able to:**
- View the default permissions for each role
- Override permissions for specific staff members
- Create custom roles with custom permission sets

### 2.3 Reporting Hierarchy & Approvals

**As a super-admin or hospital admin, I should be able to:**
- Assign a manager to each staff member
- View the full org chart for the hospital
- Define which actions require manager approval per role

**As a staff member subject to review, I should be able to:**
- Submit work for review (notes, prescriptions, lab results, transfers, etc.)
- See the status of my submissions (pending / approved / changes-requested / rejected)
- Receive notifications when my submission is reviewed

**As a manager / reviewer, I should be able to:**
- See a queue of items awaiting my review
- Approve, reject, or request changes with comments
- See the full context of what I'm reviewing (e.g., the full note, the full prescription, the patient context)
- Co-sign documents (e.g., resident note co-signed by attending)

---

## Module 3 — Patient Management

### 3.1 Patient Registration

**As reception staff, I should be able to:**
- Register a new patient via a registration form
- Capture demographics: full name, preferred name, date of birth, sex, gender, address, phone, email
- Capture emergency contact details (name, relationship, phone)
- Capture guarantor / responsible party / next of kin (especially for minors and dependents)
- Capture religious or cultural preferences relevant to care
- Take and upload a patient photo
- Generate a globally unique patient code at registration
- Detect potential duplicate patients during registration (by name + DOB match)

**As a patient (or staff registering on their behalf), I should be able to:**
- Upload supporting documents (ID, insurance card if applicable)

### 3.2 Patient ID Card

**As reception staff, I should be able to:**
- Preview the ID card before issuance
- Print a physical ID card
- Issue a digital ID card (QR code, barcode, patient code visible)
- Reissue a card if lost or damaged
- Deactivate a card
- Share the patient code via email or SMS with the patient

**As a patient, I should be able to:**
- Receive my patient code and ID card digitally
- Use my card to check in at any participating Medcord hospital

### 3.3 Patient Search & Lookup

**As any clinical or reception staff member, I should be able to:**
- Search for a patient by name, MRN, patient code, DOB, phone, or email
- See a list of recently accessed patients
- Star a patient to favorite them
- See my favorited patients in a quick-access list
- Open a patient's record from search results

### 3.4 Check-In

**As reception staff, I should be able to:**
- Scan a patient's card (barcode or QR) for instant check-in
- Manually check in a patient by looking them up
- Record the arrival time
- Assign the patient to a queue, department, or provider

### 3.5 Check-Out & Discharge

**As reception or clinical staff, I should be able to:**
- Check out a patient (record departure for outpatient visits)
- Initiate a discharge workflow for inpatients
- Confirm discharge requirements are met (notes signed, prescriptions sent, follow-up booked)
- Mark discharge as complete

### 3.6 Admission & Transfer

**As clinical staff, I should be able to:**
- Admit a patient (move from outpatient/ED to inpatient)
- Transfer a patient between units within the hospital
- Initiate an inter-hospital transfer to another Medcord hospital (see 4.7)

---

## Module 4 — Medical Records (EMR)

The EMR is structured around the patient chart. Every action below happens in the context of a specific patient.

### 4.1 Patient Chart Overview

**As any clinician with access, I should be able to:**
- Open a patient's chart from search, recent, or favorites
- See the patient banner (persistent: photo, name, DOB+age, patient code, allergies, code status, attending) at the top of every chart view
- Navigate between chart sections: Summary, Vitals, Medications, History, Procedures, Immunizations, Documents
- See an at-a-glance chart summary

### 4.2 Vitals

**As clinical staff, I should be able to:**
- Record vitals: BP (systolic/diastolic), HR, RR, Temp, SpO2, weight, height, pain (0–10)
- See BMI auto-calculated from height + weight
- View vitals history as a table
- View vitals as a trend graph over time
- View pediatric growth charts (height, weight, head circumference percentiles) for patients under 18
- See out-of-range vitals flagged automatically

### 4.3 Medications

**As a prescriber, I should be able to:**
- View the patient's current medication list
- Add a new medication (drug, strength, route, frequency, indication, duration)
- Discontinue or hold an existing medication
- See drug-interaction warnings when prescribing
- See drug-allergy warnings when prescribing
- Override warnings with a reason captured in the audit log
- E-prescribe: send the prescription electronically to a pharmacy
- View medication reconciliation prompts at admission, transfer, and discharge

**As a non-prescriber clinician, I should be able to:**
- View the medication list (read-only)

### 4.4 Medical History

**As a clinician, I should be able to:**
- View and add past diagnoses (with ICD-10 codes)
- View and add past procedures
- Record family history
- Record social history (smoking, alcohol, occupation, etc.)
- Add free-text history notes

### 4.5 Procedures & Surgery

**As a clinician, I should be able to:**
- Record a procedure (CPT code, performed-by, date, location, notes)
- Write or attach an operative note
- Complete a pre-op checklist (consent, NPO status, allergies confirmed, site marked, etc.)
- Schedule and document post-op follow-up

### 4.6 Immunizations

**As a clinician, I should be able to:**
- Record a vaccine administration (vaccine, dose, date, lot, administrator)
- View the patient's immunization history
- See upcoming or overdue vaccines based on age and history
- Schedule future vaccine doses

### 4.7 Inter-Hospital Transfer

**As a clinician, I should be able to:**
- Initiate a transfer to another hospital on the Medcord platform
- Search for the receiving hospital
- Specify reason for transfer and receiving department
- Attach a records package (vitals, meds, history, recent labs, recent documents)
- Send the transfer request

**As a clinician at the receiving hospital, I should be able to:**
- See incoming transfer requests in a queue
- Review the patient's records package before accepting
- Accept or decline the transfer
- See the patient automatically appear in my hospital's patient list once accepted (with the same patient code)

### 4.8 Documents

**As clinical or admin staff, I should be able to:**
- Upload external documents to a patient's chart (referral letters, outside records, scanned documents)
- Categorize documents (referral, lab report, imaging, consent, other)
- View all documents in a patient's repository
- Download or preview documents
- Mark a document as sensitive

### 4.9 Privacy & Access Control

**As any user accessing a chart, my access should be logged:**
- Who accessed
- When
- Which sections viewed
- From what device / location

**As a super-admin or compliance officer, I should be able to:**
- View the full access log for any chart
- Filter access logs by user, patient, date range, action type
- Export access logs

**As an authorized user encountering a restricted chart, I should be able to:**
- Use break-the-glass emergency access
- Provide a reason for the access
- Have the access flagged for review

**As a super-admin, I should be able to:**
- Mark patients as restricted-access (VIPs, employees, sensitive cases)
- Configure sensitivity restrictions on specific record types (mental health, HIV, substance use)
- Define which roles can view restricted records by default
- Review break-the-glass events

**As any user, I should be able to:**
- Report a suspected privacy incident
- See the status of incidents I have reported

---

## Module 5 — Labs

Labs is a separate module with its own workflow, but it integrates with patient records.

### 5.1 Lab Order Entry

**As a doctor, I should be able to:**
- Initiate a lab order from within a patient's chart
- Select tests or panels
- Specify priority (STAT, ASAP, Routine)
- Specify specimen type
- Add clinical notes for the lab tech
- Submit the order

**As a lab tech, I should be able to:**
- Receive incoming lab orders in a queue
- Create a lab order directly (walk-in, paper-order entry)
- Look up the patient by patient code

### 5.2 Sample & Test Workflow

A lab order moves through the following states. The same state-machine pattern recurs across other modules (transfers, prescriptions, etc.).

**States:**
1. **Awaiting sample** — order placed, sample not yet collected
2. **Sample received** — sample arrived at the lab
3. **Awaiting test** — sample logged, queued for testing
4. **In progress** — test running
5. **Awaiting result** — test complete, result being entered
6. **Result ready** — result entered, awaiting provider sign-off
7. **Result released** — result released to the patient chart and visible to ordering provider

**As a lab tech, I should be able to:**
- Move an order through each state
- Log specimen receipt (with timestamp)
- Enter test results (manually or by importing from instrument)
- Flag values as High, Low, or Critical based on reference ranges
- Add comments or quality notes to a result
- Submit results for provider review

### 5.3 Result Logging & Sign-Off

**As the ordering provider, I should be able to:**
- See results awaiting my acknowledgement in a queue
- View results in context with reference ranges and flags
- Acknowledge a result (mark as seen)
- Sign off on a result (formally accept it)
- Add a follow-up note tied to the result
- Be paged or notified for critical results

**As any clinician with patient access, I should be able to:**
- View released lab results within the patient's chart
- See lab trends over time

---

## Module 6 — Asset Registry

### 6.1 Asset Records

**As asset-management staff (Tech or Admin), I should be able to:**
- Register a new asset (name, type, manufacturer, model, serial number, purchase date, cost)
- Upload photos of an asset
- Categorize and tag assets
- Bulk-import assets via CSV
- Edit asset details
- Archive an asset (retired, sold, disposed)

### 6.2 Identification & Labeling

**As asset-management staff, I should be able to:**
- Generate a barcode for any asset
- Generate a QR code for any asset
- Associate an RFID tag ID with an asset
- Print a label (with logo, asset name, code) for physical attachment

### 6.3 Asset Hierarchy

**As asset-management staff, I should be able to:**
- Define parent-child relationships between assets (e.g., a surgical kit and its instruments, a monitor and its cables)
- Navigate from a parent to its children and back
- See the full hierarchy of any asset

### 6.4 Location Tracking

**As asset-management staff, I should be able to:**
- Assign an asset to a department, room, and shelf (or specific location)
- Move an asset to a new location
- See location-change history per asset
- Search for assets by location

**As any staff member, I should be able to:**
- Look up an asset by scanning its barcode/QR
- See where the asset is currently located

---

## Cross-Cutting Capabilities

These apply across every module above and should be built as shared infrastructure.

### Workflow States
A consistent state-machine pattern across labs, transfers, prescriptions, approvals, and any other multi-step process. Each state machine has clearly defined transitions, who can trigger them, and what side effects occur.

### Approval & Review System
Any action that requires senior sign-off goes through: submit → reviewer queue → approve / reject / request-changes → commit. Built once, reused everywhere. Reviewers always see full context. Audit trail is automatic.

### Audit Logging
Every action across every module is logged: who, what, when, from where. Logs are immutable and exportable. Required for compliance and for break-the-glass review.

### Notifications
Centralized notification system delivering in-app, email, and SMS messages. Triggers include: critical lab results, approval requests, transfer acceptances, patient arrivals, expiring credentials, invitation events.

### Search
Global search across patients, staff, assets, and lab orders within the current hospital. Per-module scoped search where helpful. Search results respect access control — users only see what they have permission to see.

### Patient Code (Platform-Wide)
A globally unique identifier per patient that travels across hospitals. Generated at first registration, persists through inter-hospital transfers, and serves as the primary join key for the patient across labs, records, transfers, and ID cards.

---

## Open Questions & Notes

A handful of things that came up while writing this and are worth resolving early:

**Patient code format**. Globally unique is the right call. Decide whether the format is human-readable (e.g., `CAE-3F8K-2P9X`), purely numeric, or a UUID. Human-readable is friendlier for staff dictating it over the phone, which they will do.

**Staff credentialing was intentionally left out of this MVP**. License and certification tracking is genuinely valuable but adds significant scope. Worth confirming this is acceptable for v1.

**Patient consent for inter-hospital transfer**. Whether the platform requires explicit patient consent (electronic signature) before sending records to another hospital, or whether the sending hospital takes that responsibility offline, is a policy decision. Recommend explicit in-app consent capture.

**Pharmacy routing for e-prescribing**. The MVP description says "send to pharmacy" but the actual integration (Surescripts, country-specific equivalents) is non-trivial. Worth confirming whether v1 sends e-prescriptions to a real pharmacy network or just generates a prescription PDF the patient can hand over.

**Continuous monitoring is v2** as decided. Worth flagging that this means Medcord is not suitable for ICU use cases at MVP, and marketing should reflect that.