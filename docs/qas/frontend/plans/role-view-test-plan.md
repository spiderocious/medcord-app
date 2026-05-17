# Test Plan — Role View Screen + Member Counts + BUG-RE-01

**Prepared:** 2026-05-17  
**Handoff:** `docs/qas/frontend/role-view-handoff.md`  
**Scope:** Frontend — roles list (Members column, View/Edit split, super_admin gating) + new role view page (2-col layout, permissions panel, members panel) + BUG-RE-01 end-to-end  
**Environment:** `http://localhost:5173` · Backend `http://localhost:8085`  
**Primary user:** `alice@medcord.test` / `Medcord123!` (super_admin, Hospital A)  
**Low-perm user:** `eve@medcord.test` / `Medcord123!` (reception, no `settings.update`)  
**Doctor account:** `qa-doctor@medcord.test` / `Medcord123!` (Hospital A, Doctor role)  
**Screenshots →** `docs/qas/frontend/screenshots/role-view/`

---

## Source files under test

| File | Role |
|------|------|
| `roles-screen.tsx` | Roles list — Members column, View/Edit/Delete buttons |
| `role-view-screen.tsx` | Role view page — 2-col layout, permissions, members, edit gate |

---

## Seed state (verify before testing)

| Item | Expected | How to check |
|------|----------|-------------|
| Hospital A roles loaded | 10 system + ≥2 custom | `GET /hospitals/HSP-0fe2c032.../roles` |
| Doctor role | `ROL-9c25c960...` · 23 permissions · 3 members | API response |
| Nurse Practitioner role | 0 members | API response — use for "zero members" tests |
| Cleaner Updated | 3 permissions · 0 members | Custom role from prior test run |
| QA Test Role | 2 permissions · 0 members | Custom role from prior test run |
| qa-doctor@medcord.test | Active doctor in Hospital A | `GET /staff?role=doctor&status=active` |

---

## Pre-flight

1. `curl http://localhost:8085/api/v1/health` — expect 200
2. `curl http://localhost:5173 | head -3` — expect HTML
3. Login as alice, enter Hospital A, confirm roles list loads at `/h/hospital-a/staff/roles`
4. Confirm Doctor row shows "3" in Members column and at least 1 custom role exists

---

## Section 1 — Roles List: Members Column

**Route:** `/h/hospital-a/staff/roles` · **Actor:** alice

| ID | Test | Expected |
|----|------|----------|
| RV-L-01 | Load roles list | System roles table renders; Members column header present in both system and custom tables |
| RV-L-02 | Doctor row Members value | Integer `3` — not blank, not "undefined", not "NaN" |
| RV-L-03 | Nurse Practitioner row Members value | `0` — zero renders as `0`, not blank |
| RV-L-04 | Pharmacist row Members value | `0` |
| RV-L-05 | Custom roles table Members column | "Cleaner Updated" row shows `0`; "QA Test Role" row shows `0` |
| RV-L-06 | Members count cross-check with view page | Doctor row shows 3 in list; Doctor view page "Members · 3" matches |

> RV-L-04 and RV-L-03 independently cover the zero case because they are different roles — guards against a lucky coincidence.

---

## Section 2 — Roles List: View/Edit Button Split (Manager)

**Actor:** alice (has `settings.update`)

| ID | Test | Expected |
|----|------|----------|
| RV-B-01 | `super_admin` row actions | **View** present · **Edit** absent · **Delete** absent |
| RV-B-02 | Doctor row actions | **View** present · **Edit** present · **Delete** absent |
| RV-B-03 | Custom role row actions | **View** present · **Edit** present · **Delete** present |
| RV-B-04 | Click **View** on Doctor | URL → `/h/hospital-a/staff/roles/ROL-9c25c960-a1c4-4047-b28f-6845770a7288` |
| RV-B-05 | Click **Edit** on Doctor | URL → `/h/hospital-a/staff/roles/ROL-9c25c960-a1c4-4047-b28f-6845770a7288/edit` |
| RV-B-06 | Click **View** on `super_admin` | URL → `/h/hospital-a/staff/roles/ROL-d029eb76-f751-44ff-a7e8-afb0e2fbadcd` |

---

## Section 3 — Roles List: View/Edit Button Split (Non-Manager)

**Actor:** eve (no `settings.update`)

| ID | Test | Expected |
|----|------|----------|
| RV-NM-01 | Load roles list as eve | Both tables render · "New role" button absent |
| RV-NM-02 | Doctor row actions | **View** only — Edit absent |
| RV-NM-03 | `super_admin` row actions | **View** only — Edit absent |
| RV-NM-04 | Custom role row actions | **View** only — Edit and Delete absent |
| RV-NM-05 | Click **View** as eve on any role | Navigates to view page — no permission wall, page loads |

---

## Section 4 — Role View Page: Header + Subtitle + Edit Gating

**Route:** `/h/hospital-a/staff/roles/:roleId` · **Actor:** alice unless specified

| ID | Test | Expected |
|----|------|----------|
| RV-H-01 | Open `super_admin` view page | Heading: "Super Admin" · Subtitle: "Super Admin bypasses all permission checks." |
| RV-H-02 | Open Doctor view page | Heading: "Doctor" · Subtitle: "System role — permissions are editable, name is fixed." |
| RV-H-03 | Open a custom role view page | Subtitle: "Custom role" |
| RV-H-04 | `super_admin` view page — Edit button | "Edit permissions" button **not rendered at all** (not just disabled — inspect DOM) |
| RV-H-05 | Doctor view page as alice — Edit button | "Edit permissions" button rendered and clickable |
| RV-H-06 | Doctor view page as eve — Edit button | "Edit permissions" button **not rendered** |
| RV-H-07 | Click **Back to roles** | Navigates to `/h/hospital-a/staff/roles` |
| RV-H-08 | Click **Edit permissions** on Doctor as alice | Navigates to `/h/hospital-a/staff/roles/ROL-9c25c960-.../edit` |

> RV-H-04 and RV-H-06 test two independent gates from the same source: `canManage && !isSuperAdmin`. Test both separately — one is a role gate (super_admin), the other is a user permission gate (eve).

---

## Section 5 — Role View Page: Permissions Panel

**Actor:** alice

| ID | Test | Expected |
|----|------|----------|
| RV-P-01 | `super_admin` permissions panel | Badge "All permissions (bypass)" — zero list items |
| RV-P-02 | Doctor permissions panel — count | 23 permission rows rendered |
| RV-P-03 | Doctor permissions panel — content format | Human-readable descriptions (e.g. "Can view the staff directory") — no raw strings like `staff.view` |
| RV-P-04 | Doctor permissions panel — row anatomy | Each row has a dot indicator + description text |
| RV-P-05 | "QA Test Role" permissions panel (2 permissions) | 2 rows: descriptions matching `staff.view` + `staff.invite` — not raw keys |
| RV-P-06 | Role with 0 permissions — open "Cleaner Updated" | Wait — Cleaner Updated has 3 permissions. Create (or use API to patch) a custom role with 0 permissions for this test; panel shows "No permissions assigned." |

> For RV-P-06: if no zero-permission custom role exists, use API `PATCH /hospitals/:id/roles/:id` with `{"permissions":[]}` on a disposable role, test, then restore.

---

## Section 6 — Role View Page: Members Panel

**Actor:** alice

| ID | Test | Expected |
|----|------|----------|
| RV-M-01 | Doctor view page — Members panel title | "Members · 3" (matches list count) |
| RV-M-02 | Doctor view page — member rows present | Carol Osei, Phero, QA Doctor — all three visible |
| RV-M-03 | Member row anatomy | Name bold + email muted; one per row |
| RV-M-04 | Click a member row | Navigates to `/h/hospital-a/staff/:memberId` |
| RV-M-05 | Nurse view page — Members panel | "Members · 4"; 4 rows — only nurses (not doctors or other roles) |
| RV-M-06 | Nurse Practitioner view page | "Members · 0" · "No active members with this role." message |
| RV-M-07 | `super_admin` view page — Members panel | "Members · 1" · Alice Mensah visible |
| RV-M-08 | Loading state | On first load (cache cold or cleared), spinner visible in members panel before rows appear |

> RV-M-05 specifically verifies role isolation: the `?role={slug}` filter is actually applied — a common bug is fetching all staff instead.

---

## Section 7 — Error and Edge Cases

| ID | Test | Expected |
|----|------|----------|
| RV-ERR-01 | Navigate to bogus role ID via SPA (popstate trick) | Red alert: "Role not found." · Back to roles button still works |
| RV-ERR-02 | Role with department on a member | Department text rendered right-aligned in the member row |

> RV-ERR-01: from within Hospital A context, trigger `pushState + popstate` to `/h/hospital-a/staff/roles/ROL-BOGUS` — same technique used in prior role-editing test run.

---

## Section 8 — BUG-RE-01 End-to-End Verification

**What:** System role permission edits now take effect on the next login. Previously `resolvePermissions()` returned hardcoded defaults. The backend fix queries `CustomRoleModel` first.

**Setup:**
- Window/tab A: alice (`alice@medcord.test`) — manager session
- Window/tab B (incognito): `qa-doctor@medcord.test` · `Medcord123!` — doctor session in Hospital A

**Doctor role ID:** `ROL-9c25c960-a1c4-4047-b28f-6845770a7288`  
**Baseline permission count:** 23

| ID | Step | Actor | Expected |
|----|------|-------|----------|
| BUG-01 | Log in as qa-doctor in Window B; navigate to any EMR page (e.g. `/h/hospital-a/emr`) | Doctor | Page loads — EMR access confirmed at baseline |
| BUG-02 | In Window A, open Doctor role view page; note "23 permissions" in Members panel title | Alice | Confirmed: 23 permissions shown |
| BUG-03 | In Window A, click **Edit permissions**; uncheck all except `patient.view`; Save | Alice | Toast "Role updated." · Doctor row in list shows **1 permission** |
| BUG-04 | In Window B, make any API call (reload current page or navigate to new page) | Doctor | 401 response → app redirects to login (token version bumped by backend) |
| BUG-05 | In Window B, log in again as `qa-doctor@medcord.test` | Doctor | Login succeeds; new token issued |
| BUG-06 | In Window B, open DevTools → Network → find `GET /auth/login` response or `/staff/me` call; inspect permissions | Doctor | `permissions` array: `["patient.view"]` — NOT 23 items. This is the bug verification. |
| BUG-07 | In Window B, attempt to navigate to EMR page (requires `emr.view`) | Doctor | Access denied or redirected — confirms permission was actually removed |
| BUG-08 | **Cleanup** — In Window A, restore Doctor permissions: edit back to original 23; Save | Alice | Toast "Role updated." · Doctor row shows 23 permissions |
| BUG-09 | In Window B, log out and log back in after BUG-08 | Doctor | New token; `GET /staff/me` returns full 23-permission set; EMR page accessible again |

> **Critical assertion is BUG-06.** Before the fix, this would return 23 permissions regardless of what was saved. After the fix, it returns exactly what was saved. BUG-07 provides a behavioral confirmation on top of the network inspection.

---

## Section 9 — Regression: Existing Screen Behaviour

Quick pass to confirm nothing regressed from the role-editing work.

| ID | Test | Expected |
|----|------|----------|
| RV-REG-01 | Create new custom role via "New role" button | Create page loads; role created; appears in custom table with `0` in Members column |
| RV-REG-02 | Edit a custom role via "Edit" | Edit screen pre-fills name + permissions |
| RV-REG-03 | Delete a custom role via "Delete" | Role removed immediately (no confirm prompt); query invalidated; list updates |
| RV-REG-04 | System role rows have no Delete button | Confirmed absent |
| RV-REG-05 | `super_admin` has no Edit or Delete anywhere | List row: View only · View page: no "Edit permissions" button |

> RV-REG-03: The existing plan incorrectly said "Confirmation prompt appears." There is no confirm dialog in the code — delete fires immediately. Test accordingly.

---

## Total Test Count

| Section | Tests |
|---------|-------|
| 1 — Members Column | 6 |
| 2 — View/Edit Split (Manager) | 6 |
| 3 — View/Edit Split (Non-Manager) | 5 |
| 4 — Header + Edit Gating | 8 |
| 5 — Permissions Panel | 6 |
| 6 — Members Panel | 8 |
| 7 — Error + Edge Cases | 2 |
| 8 — BUG-RE-01 | 9 |
| 9 — Regression | 5 |
| **Total** | **55** |

---

## Notes

- **SPA navigation:** Enter via `/hospitals` → click Hospital A card — never use `agent-browser navigate` to a deep route directly. Only the initial `/hospitals` entry point survives a full reload without losing context.
- **Members column data:** `memberCount` is populated at load time by `GET /hospitals/:id/roles` — it reflects active members at the moment of the request.
- **Permissions panel:** Uses `data.permissionDescriptions` from the roles API — raw strings like `staff.view` must never appear in the UI.
- **Members panel fetch:** `GET /staff?role={slug}&status=active&limit=100` — max 100 shown.
- **Double guard on super_admin edit:** `roles-screen.tsx` uses `role.slug !== ROLES.SUPER_ADMIN`; `role-view-screen.tsx` uses `!isSuperAdmin`. Both must be verified independently (RV-B-01 and RV-H-04).
- **BUG-RE-01 cleanup is mandatory** — restore Doctor to 23 permissions after BUG-08 or subsequent tests will see incorrect baselines.
