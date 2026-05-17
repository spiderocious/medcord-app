# Backend QA Agent Guide

> A ground-up playbook for an AI agent tasked with testing any Node.js/Express REST API — from zero knowledge to a complete, reproducible test run with bug reports and sign-off documentation.

---

## Table of Contents

1. [Mindset & Principles](#1-mindset--principles)
2. [Phase 0 — Reconnaissance](#2-phase-0--reconnaissance)
3. [Phase 1 — Reading & Auditing the API Docs](#3-phase-1--reading--auditing-the-api-docs)
4. [Phase 2 — Writing the Test Plan](#4-phase-2--writing-the-test-plan)
5. [Phase 3 — Environment Setup & Seeding](#5-phase-3--environment-setup--seeding)
6. [Phase 4 — Writing the Test Script](#6-phase-4--writing-the-test-script)
7. [Phase 5 — Running the Suite & Collecting Results](#7-phase-5--running-the-suite--collecting-results)
8. [Phase 6 — Bug Reporting](#8-phase-6--bug-reporting)
9. [Phase 7 — Re-runs & Fix Verification](#9-phase-7--re-runs--fix-verification)
10. [Phase 8 — Final Report & Sign-Off](#10-phase-8--final-report--sign-off)
11. [Cross-Cutting Test Patterns](#11-cross-cutting-test-patterns)
12. [Divergence Analysis (Docs vs Code)](#12-divergence-analysis-docs-vs-code)
13. [Common Failure Modes & Fixes](#13-common-failure-modes--fixes)
14. [File & Folder Conventions](#14-file--folder-conventions)
15. [Quick Reference Checklist](#15-quick-reference-checklist)

---

## 1. Mindset & Principles

**You are not the developer.** Your job is to find what is broken, document it precisely, and report it — not to assume things work unless you have verified them with a real HTTP call or source read.

**Core rules:**

- Never trust docs without reading the source. Docs lie; code is truth.
- Never claim a test passed without running it against a live server.
- Never stop at the first bug. Keep going. A real test run finishes all cases.
- Report what you observe, not what you expect. Quote status codes, response bodies, field names verbatim.
- Static analysis (reading code) finds candidate bugs. Dynamic testing (HTTP calls) confirms them. Both are required.
- If the server is down, say so explicitly and stop. Do not mark tests as passed when the connection was refused.
- If a test is blocked (no data, no endpoint, no seed), mark it BLOCKED — not FAIL and not PASS.

---

## 2. Phase 0 — Reconnaissance

Before writing a single test, spend time understanding the project. This phase takes 10–20 minutes and saves hours of wasted test effort.

### 2.1 Locate Key Files

Run these searches to orient yourself:

```bash
# Find the entry point
find . -name "index.ts" -o -name "server.ts" -o -name "app.ts" | grep -v node_modules | head -20

# Find all route registrations — this tells you the true URL prefix
grep -r "app.use\|router.use" --include="*.ts" -l | grep -v node_modules

# Find all feature modules
ls apps/*/src/features/ 2>/dev/null || ls src/features/ 2>/dev/null

# Find middleware that wraps all routes
grep -r "authenticate\|requireAuth\|protect" --include="*.ts" -l | grep -v node_modules | head -10

# Find the error handler
grep -r "errorHandler\|globalError\|AppError" --include="*.ts" -l | grep -v node_modules
```

### 2.2 Understand the URL Structure

**This is the most common mistake agents make.** Admin routes often mount at `/admin`, not `/api/v1/admin`. Feature routes may mount at `/api/v1`. Always confirm:

```bash
# Read the main index/app file
cat apps/main-backend/src/index.ts   # or wherever app.use() calls live

# Look for ALL app.use() calls — each is a mount point
grep -n "app\.use" apps/main-backend/src/index.ts
```

Example output you might see:
```
app.use('/api/v1', apiRouter);
app.use('/admin', adminRouter);
app.use('/health', healthRouter);
```

This means:
- Regular API calls: `http://localhost:PORT/api/v1/...`
- Admin calls: `http://localhost:PORT/admin/...`
- Health: `http://localhost:PORT/health`

**Write separate base URL constants for each mount point.**

### 2.3 Understand the Error Envelope

Read the global error handler to learn the exact shape of error responses:

```bash
grep -r "errorHandler\|next(new\|AppError\|HttpError" --include="*.ts" -A 10 | head -60
```

Common patterns:

```json
// Pattern A — wrapped error
{ "error": { "code": "not_found", "message": "Hospital not found" } }

// Pattern B — flat error
{ "success": false, "error": "Not found", "message": "..." }

// Pattern C — status + message
{ "status": "error", "message": "Not found" }
```

Your tests must match the actual pattern, not what you assume.

### 2.4 Understand the Success Envelope

```bash
grep -r "res.json\|res.status" --include="*.ts" apps/ | grep -v node_modules | head -30
```

Common patterns:
```json
// Wrapped
{ "data": { "user": { ... } } }

// Flat
{ "user": { ... }, "token": "..." }

// With message
{ "success": true, "data": { ... }, "message": "Created" }
```

### 2.5 Read the Auth Flow

```bash
# Find the auth middleware
cat apps/main-backend/src/middlewares/auth.middleware.ts

# Find how it's applied
grep -rn "authenticate\|requireAuth" --include="*.ts" apps/ | grep "router\." | head -20
```

Key questions:
- Does it check a DB field after verifying the JWT? (tokenVersion pattern)
- Does it attach user to `req.user`?
- Is there a separate role-guard middleware?

### 2.6 Check What Port the Server Runs On

```bash
grep -r "PORT\|listen(" --include="*.ts" apps/main-backend/src/ | head -10
cat apps/main-backend/.env 2>/dev/null || cat .env 2>/dev/null
```

---

## 3. Phase 1 — Reading & Auditing the API Docs

If API docs exist, read them and compare against the source. This is called a **divergence analysis**. It finds bugs before you even run a test.

### 3.1 What to Check in Docs vs Code

| Dimension | What to verify |
|---|---|
| Base URL | Does it match what `app.use()` registers? |
| HTTP method | GET vs POST vs PATCH — check the route file |
| Path params | `:id` vs `:hospitalId`, token in URL vs body |
| Request body fields | Field names, types, required vs optional |
| Response field names | `items` vs `hospitals`, `members` vs `staff` |
| Enums | Every allowed value — check the schema file |
| Error codes | What `code` string does the handler return? |
| Status codes | 200 vs 201, 204 vs 200 for deletes |
| Pagination | `page`/`limit` vs `offset`/`size`, default values |
| Auth requirements | Which endpoints need a token? Which don't? |

### 3.2 How to Read the Source Systematically

For each feature (e.g., `hospitals`):

```bash
# 1. Read the schema/validation file — ground truth for field names and enums
cat apps/main-backend/src/features/hospitals/hospital.schema.ts

# 2. Read the service — what it returns
cat apps/main-backend/src/features/hospitals/hospital.service.ts

# 3. Read the repo — what DB fields are selected/excluded
cat apps/main-backend/src/features/hospitals/hospital.repo.ts

# 4. Read the controller — what response shape is built
cat apps/main-backend/src/features/hospitals/hospital.controller.ts

# 5. Read the routes — paths, methods, middleware
cat apps/main-backend/src/features/hospitals/hospital.routes.ts
```

### 3.3 Recording Divergences

Create `docs/qas/reports/api-diverge.md` with entries like:

```markdown
## FIND-01 — Wrong response key for hospital list

**Severity:** Breaking  
**Doc says:** `{ "hospitals": [...] }`  
**Code returns:** `{ "items": [...] }`  
**Source:** `hospital.service.ts:34` — `return { items, total, page, limit, totalPages }`  
**Impact:** Any client iterating `response.hospitals` gets `undefined`
```

Organize by module. Tag each finding as:
- **Breaking** — client gets wrong data or wrong field name
- **Mismatch** — behavior differs but client may still work (wrong status code, extra field)
- **Undocumented** — endpoint exists in code but not in docs
- **Missing** — endpoint in docs but not in code

---

## 4. Phase 2 — Writing the Test Plan

The test plan is a human-readable list of every test case. It gets written before the script. It forces you to think about coverage.

### 4.1 Test Plan Structure

```markdown
# [Feature] Test Plan

## Scope
What is covered, what is explicitly not covered, and why.

## Test Accounts
| Handle | Email | Role | Notes |
|--------|-------|------|-------|
| alice  | alice@test.com | platform admin | isAdmin: true |
| bob    | bob@test.com | regular user | no special role |

## Section N — [Feature Name]

### TC-N-01: [Short description]
**Endpoint:** `POST /api/v1/hospitals`  
**Actor:** alice (authenticated)  
**Input:** `{ "name": "Test Hospital", "type": "general", "location": "Accra", "subdomain": "test-h1" }`  
**Expected:** 201, body has `data.hospital.id`  
**Verify:** id starts with `HSP-`, name matches

### TC-N-02: Create hospital — missing required field
**Endpoint:** `POST /api/v1/hospitals`  
**Input:** `{ "name": "Test" }` (missing location, type, subdomain)  
**Expected:** 400, `error.code = "validation_error"`
```

### 4.2 Coverage Checklist for Every Endpoint

For each endpoint, write test cases for:

- [ ] **Happy path** — valid input, expected output
- [ ] **Auth guard** — call without token → 401
- [ ] **Role guard** — call with wrong-role token → 403 (if applicable)
- [ ] **Not found** — valid ID that doesn't exist → 404
- [ ] **Validation** — missing required fields → 400
- [ ] **Conflict** — duplicate unique value → 409 (if applicable)
- [ ] **Pagination** — verify `page`, `limit`, `total`, `totalPages` (if list endpoint)
- [ ] **Idempotency** — confirm update doesn't change unrelated fields

### 4.3 Cross-Cutting Cases

Always include a section at the end of the plan for:

```markdown
## Section X — Cross-Cutting

### TC-X-01: No auth token → 401
Call any protected endpoint without Authorization header.
Expected: 401, error.code = "unauthorized"

### TC-X-02: Expired/invalid token → 401
Call with a malformed JWT.
Expected: 401, error.code = "unauthorized" or "invalid_token"

### TC-X-03: Token after account disable → 401
Log in, disable the account via admin, use old token.
Expected: 401 on next protected call (tests tokenVersion invalidation)

### TC-X-04: Error envelope shape
Every error response must match { error: { code, message } }.
Never { status, message } or { success: false, error: "..." }

### TC-X-05: Pagination defaults
Call any list endpoint with no query params.
Expected: page=1, limit=10 (or whatever the documented default is), totalPages present
```

### 4.4 Pre-Execution Fix Verification

If the dev claims they fixed bugs before you run, add a section:

```markdown
## Pre-Execution Fix Verification

Dev claims the following were fixed. Each has a dedicated test case to confirm.

| Bug ID | Claim | Test Case |
|--------|-------|-----------|
| BUG-A-01 | passwordHash no longer returned in user list | TC-G-01 checks response fields |
| BUG-A-03 | updateHospital returns updated doc, not null | TC-H-05 checks response body |
```

---

## 5. Phase 3 — Environment Setup & Seeding

### 5.1 Verify the Server is Running

```bash
curl -s http://localhost:PORT/health 2>&1 | head -5
# or
curl -s http://localhost:PORT/api/v1/health 2>&1 | head -5
```

If you get `ECONNREFUSED`, stop. Ask the user to start the server. Do not proceed.

### 5.2 Verify the Database

```bash
# MongoDB
mongosh --quiet --eval 'db = db.getSiblingDB("yourdb"); print(db.users.countDocuments({}))'

# Postgres
psql -d yourdb -c "SELECT count(*) FROM users;"
```

### 5.3 Seeding Test Data

Always seed fresh before a test run. Never rely on stale data. Your seed script should:

1. Drop and recreate collections/tables (or upsert deterministically)
2. Create all test users with known passwords
3. Create any supporting data (hospitals, roles, etc.) needed by test cases
4. Print what it created

```javascript
// docs/qas/backend/scripts/seed.mjs
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('yourdb');

async function seed() {
  await db.collection('users').deleteMany({});

  const aliceHash = await bcrypt.hash('Password123!', 12);
  const bobHash = await bcrypt.hash('Password123!', 12);

  await db.collection('users').insertMany([
    {
      id: 'USR-alice-test',
      email: 'alice@test.com',
      name: 'Alice Test',
      passwordHash: aliceHash,
      isAdmin: true,
      isEmailVerified: true,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'USR-bob-test',
      email: 'bob@test.com',
      name: 'Bob Test',
      passwordHash: bobHash,
      isAdmin: false,
      isEmailVerified: true,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('Seeded: alice (admin), bob (regular user)');
  await client.close();
}

seed().catch(console.error);
```

Run it: `node docs/qas/backend/scripts/seed.mjs`

### 5.4 Fixing Data Mid-Run

Sometimes a test user's password hash gets corrupted or a field gets wrong. Fix it directly:

```bash
# Rehash and update password
node --input-type=module <<'EOF'
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('yourdb');

const hash = await bcrypt.hash('Password123!', 12);
const result = await db.collection('users').updateOne(
  { email: 'alice@test.com' },
  { $set: { passwordHash: hash } }
);
console.log(result.modifiedCount === 1 ? 'Updated' : 'Not found');
await client.close();
EOF
```

---

## 6. Phase 4 — Writing the Test Script

Write the test script in `docs/qas/backend/scripts/your-feature.test.mjs`. Use plain Node.js `fetch` (Node 18+) — no test framework dependency.

### 6.1 Script Skeleton

```javascript
// docs/qas/backend/scripts/feature.test.mjs
import { MongoClient } from 'mongodb';

// ── Config ───────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8085/api/v1';
const ADMIN_BASE = 'http://localhost:8085/admin';  // if admin routes are separate

// ── HTTP Helpers ─────────────────────────────────────────────────────────────

async function request(base, path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const api    = (path, opts = {}) => request(BASE, path, opts);
const admin  = (path, opts = {}) => request(ADMIN_BASE, path, opts);

const get    = (path, token)       => api(path, { token });
const post   = (path, body, token) => api(path, { method: 'POST', body, token });
const patch  = (path, body, token) => api(path, { method: 'PATCH', body, token });
const del    = (path, token)       => api(path, { method: 'DELETE', token });

const aGet   = (path, token)       => admin(path, { token });
const aPost  = (path, body, token) => admin(path, { method: 'POST', body, token });
const aPatch = (path, body, token) => admin(path, { method: 'PATCH', body, token });
const aDel   = (path, token)       => admin(path, { method: 'DELETE', token });

// ── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0, blocked = 0, skipped = 0;
const failures = [];

function pass(id, label) {
  console.log(`  ✓ ${id}: ${label}`);
  passed++;
}

function fail(id, label, reason) {
  console.log(`  ✗ ${id}: ${label}`);
  console.log(`      → ${reason}`);
  failed++;
  failures.push({ id, label, reason });
}

function block(id, label, reason) {
  console.log(`  ⊘ ${id}: ${label} [BLOCKED: ${reason}]`);
  blocked++;
}

function skip(id, label, reason) {
  console.log(`  - ${id}: ${label} [SKIP: ${reason}]`);
  skipped++;
}

function section(name) {
  console.log(`\n── ${name} ─────────────────────────────────────`);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  // Set isAdmin on alice via DB (don't rely on seed state)
  const client = new MongoClient('mongodb://localhost:27017');
  const db = client.db('medcord');   // change to your DB name
  await db.collection('users').updateOne(
    { email: 'alice@test.com' },
    { $set: { isAdmin: true } }
  );
  await client.close();

  // Get fresh tokens for all test actors
  const aliceLogin = await post('/auth/login', {
    email: 'alice@test.com',
    password: 'Password123!',
  });
  if (aliceLogin.status !== 200) {
    console.error('FATAL: alice login failed', aliceLogin);
    process.exit(1);
  }

  const bobLogin = await post('/auth/login', {
    email: 'bob@test.com',
    password: 'Password123!',
  });
  if (bobLogin.status !== 200) {
    console.error('FATAL: bob login failed', bobLogin);
    process.exit(1);
  }

  return {
    alice: aliceLogin.data.data.tokens.accessToken,
    bob: bobLogin.data.data.tokens.accessToken,
  };
}

// ── Test Sections ─────────────────────────────────────────────────────────────

async function testGuards(tokens) {
  section('Auth Guards');

  // TC-G-01: No token → 401
  const r = await get('/hospitals');
  if (r.status === 401) pass('G-01', 'No token → 401');
  else fail('G-01', 'No token → 401', `got ${r.status}: ${JSON.stringify(r.data)}`);

  // TC-G-02: Invalid token → 401
  const r2 = await get('/hospitals', 'not.a.token');
  if (r2.status === 401) pass('G-02', 'Bad token → 401');
  else fail('G-02', 'Bad token → 401', `got ${r2.status}`);
}

async function testHospitals(tokens) {
  section('Hospitals');

  // TC-H-01: Create hospital
  const r = await post('/hospitals', {
    name: 'Test Hospital',
    type: 'general',
    location: 'Accra, Ghana',
    subdomain: `test-h-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, tokens.alice);

  if (r.status === 201 && r.data?.data?.hospital?.id) {
    pass('H-01', 'Create hospital → 201 with id');
    const hid = r.data.data.hospital.id;

    // TC-H-02: Get hospital
    const r2 = await get(`/hospitals/${hid}`, tokens.alice);
    if (r2.status === 200 && r2.data?.data?.hospital?.id === hid)
      pass('H-02', 'Get hospital → 200');
    else
      fail('H-02', 'Get hospital → 200', `got ${r2.status}: ${JSON.stringify(r2.data)}`);

  } else {
    fail('H-01', 'Create hospital → 201', `got ${r.status}: ${JSON.stringify(r.data)}`);
    block('H-02', 'Get hospital', 'depends on H-01');
  }

  // TC-H-03: Missing required field → 400
  const r3 = await post('/hospitals', { name: 'Bad' }, tokens.alice);
  if (r3.status === 400) pass('H-03', 'Missing field → 400');
  else fail('H-03', 'Missing field → 400', `got ${r3.status}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

function summary() {
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  ${passed} PASS / ${failed} FAIL / ${blocked} BLOCKED / ${skipped} SKIP`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    ${f.id}: ${f.label}`);
      console.log(`      ${f.reason}`);
    }
  }
  console.log('══════════════════════════════════════════════════');
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Backend QA Test Run');
console.log(`Server: ${BASE}`);
console.log(`Date: ${new Date().toISOString()}`);

const tokens = await bootstrap();
await testGuards(tokens);
await testHospitals(tokens);
summary();
```

### 6.2 Key Rules for Writing Tests

**Always use fresh tokens.** Never hardcode a token. Login at bootstrap time.

**Always propagate IDs.** Create a resource, capture its ID, use it in dependent tests. If creation fails, `block()` all dependents explicitly.

**Never swallow 204 body parsing.** A 204 response has no body. `res.json()` will throw. Guard it:

```javascript
let data;
try { data = res.status === 204 ? null : await res.json(); }
catch { data = null; }
```

**Quote the actual response in failures.** Don't just say "got 400". Say `got 400: {"error":{"code":"validation_error","message":"..."}}`

**Use `Date.now()` for unique slugs.** Never hardcode unique values like `subdomain: "test"` — the second run will get a 409 conflict.

```javascript
const subdomain = `test-h-${Date.now()}`;
```

**Isolate test state.** Tests in section A should not depend on data created in section B unless explicitly documented.

### 6.3 Testing Pagination

```javascript
// TC-P-01: Default pagination
const r = await get('/hospitals', token);
assert(r.status === 200);
const { items, page, limit, total, totalPages } = r.data.data;
assert(page === 1, 'default page should be 1');
assert(limit === 10, 'default limit should be 10');  // check docs for actual default
assert(Array.isArray(items), 'items should be array');
assert(typeof totalPages === 'number', 'totalPages should be number');

// TC-P-02: Custom page/limit
const r2 = await get('/hospitals?page=2&limit=5', token);
assert(r2.data.data.page === 2);
assert(r2.data.data.limit === 5);
```

### 6.4 Testing Error Envelope Shape

Every error test should check not just the status code but the shape:

```javascript
// Bad error check — only checks status
if (r.status === 400) pass(...);

// Good error check — checks status + envelope + code
if (
  r.status === 400 &&
  r.data?.error?.code === 'validation_error' &&
  typeof r.data?.error?.message === 'string'
) pass(...);
else fail(..., `got ${r.status}: ${JSON.stringify(r.data)}`);
```

---

## 7. Phase 5 — Running the Suite & Collecting Results

### 7.1 Pre-Run Checklist

Before executing:

- [ ] Server is running (confirmed via health check)
- [ ] DB is reachable (confirmed via mongosh/psql)
- [ ] Seed script has been run
- [ ] Test users can log in manually (spot-check alice: `curl -X POST .../auth/login`)

### 7.2 Run the Script

```bash
node docs/qas/backend/scripts/feature.test.mjs 2>&1 | tee docs/qas/reports/feature-run-$(date +%Y%m%d-%H%M).log
```

Pipe to `tee` so you get both console output and a log file.

### 7.3 While Running — What to Watch For

**Connection refused errors** — Server crashed. Stop, note where, restart server, re-run from top.

**Unexpected 404s** — Wrong URL prefix. Recheck the mount point. Check `app.use()` calls again.

**Unexpected 401s** — Token expired or wrong header format. Re-login and check `Authorization: Bearer <token>`.

**Unexpected 403s** — User missing role. Check the actor's DB fields (`isAdmin`, membership role).

**JSON parse errors** — Server returned HTML error page or empty body. Check server logs.

**All tests failing the same way** — Systematic issue: wrong base URL, wrong envelope path, wrong field name in assertion. Fix the helper, not each test individually.

### 7.4 Handling Test Failures

When a test fails, investigate immediately before moving on:

```bash
# Manually reproduce the failing call
curl -s -X POST http://localhost:8085/api/v1/hospitals \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <alice_token>' \
  -d '{"name":"Test","type":"general","location":"Accra","subdomain":"test-x1"}' | jq .
```

Then read the source to understand why:

```bash
grep -n "hospital" apps/main-backend/src/features/hospitals/hospital.controller.ts | head -20
```

---

## 8. Phase 6 — Bug Reporting

Every confirmed failure goes into a bug report file. Create it at `docs/qas/reports/feature-bugs.md`.

### 8.1 Bug Report Template

```markdown
# [Feature] Bug Report

**Date:** 2026-05-17  
**Tester:** QA Agent  
**Test Suite:** feature.test.mjs  
**Server Version:** (git SHA or commit message)

---

## BUG-01 — [Short title]

**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)  
**Status:** Open  
**Found by:** Static analysis | Dynamic test TC-H-05

### Description
What is wrong. One paragraph.

### Steps to Reproduce
1. Login as alice
2. `POST /api/v1/hospitals` with valid body
3. Observe response

### Expected
`201` with `{ data: { hospital: { id: "HSP-...", name: "...", ... } } }`

### Actual
`200` returned instead of `201`. Body shape correct.

### Source Location
`hospital.controller.ts:45` — `res.status(200).json(...)` should be `res.status(201).json(...)`

---

## BUG-02 — ...
```

### 8.2 Priority Definitions

| Priority | Meaning |
|---|---|
| P0 Critical | Core feature is completely broken — data cannot be created/read/updated |
| P1 High | Feature works but produces wrong output — clients get wrong data |
| P2 Medium | Non-breaking inconsistency — wrong status code, extra/missing field |
| P3 Low | Cosmetic, documentation-only, or rarely triggered edge case |

### 8.3 Preliminary (Static) Bug Report

After Phase 1 (doc audit) but before running tests, write a **preliminary bug report** with findings from code reading only. Mark each as "Static — not yet verified by test". This gives the dev team early signal.

After test execution, update each entry:
- **Confirmed** — dynamic test reproduced the bug
- **Fixed** — already fixed by the time tests ran
- **False positive** — code was fine, docs were wrong

---

## 9. Phase 7 — Re-runs & Fix Verification

When the dev claims they fixed bugs, your job is to verify. Do not take their word for it.

### 9.1 What to Do Before Re-running

1. Read the changed file to confirm the fix is what they claim:
   ```bash
   git diff HEAD~1 apps/main-backend/src/features/...
   ```

2. Confirm the fix matches the bug description exactly. Watch for partial fixes:
   - Bug: "returns null instead of updated doc" — Fix must return the doc, not just save it
   - Bug: "tokenVersion not checked" — Fix must do DB lookup AND compare, not just verify JWT

3. Note the git SHA of the "fixed" commit for the report.

### 9.2 Running Verification

For a specific bug fix, either:
- Run the full suite again and check that specific test now passes
- Or isolate just that test and run it standalone:

```bash
# Temporarily add a standalone verification at the bottom of the script
node -e "
import('./feature.test.mjs').then(m => m.verifyBugA03());
"
```

### 9.3 Update the Bug Report

```markdown
## BUG-A-03 — updateHospital returns null

**Status:** ~~Open~~ → Fixed (confirmed 2026-05-17)  
**Fixed in:** commit `793e866`  
**Verification:** TC-H-05 now passes — PATCH /hospitals/:id returns updated document body
```

---

## 10. Phase 8 — Final Report & Sign-Off

### 10.1 Test Report Structure

```markdown
# [Feature] QA Test Report

**Date:** 2026-05-17  
**Test Suite:** feature.test.mjs  
**Run count:** 2 (initial + post-fix re-run)  
**Server:** localhost:8085, commit 793e866

## Summary

| Result | Count |
|--------|-------|
| PASS | 45 |
| FAIL | 1 |
| BLOCKED | 3 |
| SKIP | 0 |
| **Total** | **49** |

## Failures

| ID | Test | Reason | Priority |
|----|------|--------|----------|
| BUG-NEW-01 | Save result button fires wrong mutation | Wrong endpoint called | P0 |

## Blocked Tests

| ID | Test | Blocked By |
|----|------|------------|
| TC-N-01 | Notification list | No notification data — no create endpoint |
| TC-N-02 | Mark notification read | Depends on TC-N-01 |
| TC-N-03 | Clear all notifications | Depends on TC-N-01 |

## Open Bugs

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| BUG-NEW-01 | Wrong mutation on save result | P0 | Open |

## Resolved Bugs (This Run)

| ID | Title | Fixed Commit |
|----|-------|--------------|
| BUG-A-01 | passwordHash exposed in user list | 793e866 |
| BUG-A-07 | tokenVersion not checked on authenticate | b4974b8 |

## Sign-Off

- [ ] All P0 bugs resolved before merge
- [ ] All P1 bugs have tickets filed
- [ ] Blocked tests have a known path to unblock
- [ ] Re-run after P0 fixes: (pending)
```

---

## 11. Cross-Cutting Test Patterns

These patterns apply to every backend regardless of domain.

### 11.1 Auth Guard Pattern

Test every protected endpoint without a token and with a bad token:

```javascript
async function testAuthGuards(protectedEndpoints, token) {
  for (const [method, path] of protectedEndpoints) {
    const r = await request(BASE, path, { method });
    if (r.status !== 401)
      fail(`GUARD-${path}`, `No token → 401`, `got ${r.status}`);
    else
      pass(`GUARD-${path}`, `No token → 401`);
  }
}
```

### 11.2 Role Guard Pattern

```javascript
// Alice (admin) can access, Bob (regular) gets 403
const rAlice = await get('/admin/stats', tokens.alice);
const rBob = await get('/admin/stats', tokens.bob);

if (rAlice.status === 200) pass('ROLE-01', 'Admin can access admin stats');
else fail('ROLE-01', 'Admin can access admin stats', `got ${rAlice.status}`);

if (rBob.status === 403) pass('ROLE-02', 'Non-admin blocked from admin stats');
else fail('ROLE-02', 'Non-admin blocked', `got ${rBob.status}`);
```

### 11.3 Token Invalidation Pattern

Tests that logout/disable actually invalidates tokens:

```javascript
// 1. Login and get token
const login = await post('/auth/login', { email, password });
const token = login.data.data.tokens.accessToken;

// 2. Confirm token works
const before = await get('/me', token);
assert(before.status === 200);

// 3. Trigger invalidation
await post('/auth/logout', {}, token);
// OR: disable user via admin

// 4. Use old token — must 401
const after = await get('/me', token);
if (after.status === 401) pass('TOKEN-REVOKE', 'Old token revoked after logout');
else fail('TOKEN-REVOKE', 'Old token revoked', `got ${after.status} — tokenVersion not incremented`);
```

### 11.4 Sensitive Field Exclusion Pattern

Confirm that password hashes and secrets never appear in responses:

```javascript
const r = await get('/users', adminToken);
const users = r.data.data.items;
for (const user of users) {
  if (user.passwordHash || user.password || user.twoFactorSecret) {
    fail('SEC-01', 'No sensitive fields in user list', 
      `user ${user.id} has: ${Object.keys(user).filter(k => ['passwordHash','password','twoFactorSecret'].includes(k))}`);
    return;
  }
}
pass('SEC-01', 'No sensitive fields in user list');
```

### 11.5 Idempotent Update Pattern

Confirm PATCH only changes what you send:

```javascript
// Create resource
const created = await post('/resource', { field1: 'A', field2: 'B' }, token);
const id = created.data.data.resource.id;

// Update only field1
await patch(`/resource/${id}`, { field1: 'C' }, token);

// Fetch and verify field2 is unchanged
const fetched = await get(`/resource/${id}`, token);
if (fetched.data.data.resource.field2 === 'B')
  pass('IDEMPOTENT-01', 'PATCH does not overwrite unset fields');
else
  fail('IDEMPOTENT-01', 'PATCH preserves unset fields', 
    `field2 changed from B to ${fetched.data.data.resource.field2}`);
```

### 11.6 Pagination Completeness Pattern

```javascript
const r = await get('/items?page=1&limit=5', token);
const { page, limit, total, totalPages, items } = r.data.data;

const checks = [
  [page === 1, 'page is 1'],
  [limit === 5, 'limit is 5'],
  [typeof total === 'number', 'total is number'],
  [totalPages === Math.ceil(total / limit), 'totalPages formula correct'],
  [items.length <= 5, 'items.length <= limit'],
];

for (const [cond, label] of checks) {
  if (cond) pass(`PAG-${label}`, label);
  else fail(`PAG-${label}`, label, `page=${page}, limit=${limit}, total=${total}, totalPages=${totalPages}, items.length=${items.length}`);
}
```

---

## 12. Divergence Analysis (Docs vs Code)

This is the most valuable static analysis you can do. The pattern:

### 12.1 The Systematic Read

Read these four files per feature, in order:

1. **Schema** (`*.schema.ts` or `*.validation.ts`) — field names, types, enums, required/optional
2. **Service** (`*.service.ts`) — what gets returned, what errors get thrown
3. **Controller** (`*.controller.ts`) — response status codes, response shape
4. **Routes** (`*.routes.ts`) — HTTP methods, path params, middleware chain

For each finding, note:
- What the docs claim
- What the code does
- The file and line number
- The severity

### 12.2 Field Name Divergences

Field names are the #1 doc divergence. Check every response object:

```bash
# Find what the service returns for a list endpoint
grep -A 5 "return {" apps/main-backend/src/features/hospitals/hospital.service.ts
# Output: return { items, total, page, limit, totalPages }
# If docs say "hospitals" instead of "items" → FIND-XX
```

### 12.3 Enum Divergences

```bash
grep -A 10 "z.enum" apps/main-backend/src/features/labs/lab.schema.ts
# Check every value against the docs
```

### 12.4 Path Divergences

```bash
# List all registered routes
grep -n "router\.\(get\|post\|patch\|put\|delete\)" \
  apps/main-backend/src/features/labs/lab.routes.ts
```

Compare to docs. Token in URL vs body is a common divergence:
- Docs: `POST /invitations/accept` with body `{ token, ... }`
- Code: `POST /invitations/:token/accept` — token is a path param

---

## 13. Common Failure Modes & Fixes

### "All tests get 404"

**Cause:** Wrong base URL. The route is mounted at `/admin`, not `/api/v1/admin`.

**Fix:**
```bash
grep -n "app\.use" apps/main-backend/src/index.ts
# Find the actual mount point, update your BASE constant
```

### "All tests get 401 even with token"

**Cause 1:** Token is stale — tokenVersion was bumped. Re-login.

**Cause 2:** Wrong header format. Must be `Authorization: Bearer <token>`, not `Token <token>`.

**Fix:**
```javascript
// Always re-login at test start, never hardcode tokens
const login = await post('/auth/login', { email, password });
const token = login.data.data.tokens.accessToken;
```

### "POST returns 400 validation error"

**Cause:** Missing a required field you didn't know about.

**Fix:** Read the schema file. Run the call manually with `jq` to see the validation message:
```bash
curl -X POST .../endpoint -H 'Content-Type: application/json' \
  -d '{"incomplete": "body"}' | jq '.error.message'
```

### "PATCH returns null body"

**Cause:** Developer returned the pre-update document or forgot to return the updated one.

**Root:** `findOneAndUpdate` without `{ new: true }` returns the old doc. Or: `.save()` without returning the result.

**How to find it:**
```bash
grep -n "findOneAndUpdate\|findByIdAndUpdate" \
  apps/main-backend/src/features/hospitals/hospital.repo.ts
# Look for { new: true } option
```

### "tokenVersion check not working"

**Symptom:** `POST /admin/users/:id/disable` returns 204 but old token still works.

**Cause:** The `authenticate` middleware only verifies the JWT signature, never checks `tokenVersion` against DB.

**Fix in source:**
```typescript
// authenticate middleware must do a DB lookup after JWT verify
const payload = verifyAccessToken(token);
const dbUser = await userRepo.findById(payload.sub);
if (!dbUser || dbUser.tokenVersion !== payload.tokenVersion) {
  return next(new UnauthorizedError('Token revoked'));
}
```

### "passwordHash appears in response"

**Cause:** Mongoose `select: false` not set on the field, or a `.select('+passwordHash')` somewhere.

**Fix:** Check schema definition and all repo queries that use `.select()`.

### "bcrypt.compare returns false for known password"

**Cause:** Hash in DB corresponds to a different password. The field `$2b$10$...` is bcrypt output — it does NOT encode which password was used.

**Fix:** Rehash the correct password and update the DB:
```bash
node --input-type=module <<'EOF'
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('yourdb');
const hash = await bcrypt.hash('YourPassword123!', 12);
await db.collection('users').updateOne({ email: 'user@test.com' }, { $set: { passwordHash: hash } });
console.log('done');
await client.close();
EOF
```

---

## 14. File & Folder Conventions

```
docs/
├── api/
│   └── api-docs/
│       └── api-docs.md           # Source of truth API documentation
├── qas/
│   ├── plans/
│   │   └── feature-test-plan.md  # Test plan (written before scripts)
│   ├── reports/
│   │   ├── api-diverge.md        # All doc/code divergence findings
│   │   ├── feature-bugs.md       # Bug reports for feature
│   │   └── feature-report.md     # Final test run report
│   └── backend/
│       └── scripts/
│           ├── seed.mjs           # DB seed script
│           ├── api.mjs            # Shared HTTP helpers
│           └── feature.test.mjs  # Test script for feature
```

**Naming conventions:**
- Plans: `{feature}-test-plan.md`
- Bug reports: `{feature}-bugs.md` (preliminary) or `{feature}-preliminary-bugs.md`
- Reports: `{feature}-report.md`
- Scripts: `{feature}.test.mjs`
- Divergence: `api-diverge.md` (one file, all findings)

---

## 15. Quick Reference Checklist

### Before Starting Any Test Session

- [ ] Read `index.ts` / `app.ts` — know the URL mount points
- [ ] Read the error handler — know the envelope shape
- [ ] Read the auth middleware — know what it checks
- [ ] Confirm server is running: `curl http://localhost:PORT/health`
- [ ] Confirm DB is reachable: `mongosh --eval 'db.stats()'`
- [ ] Run seed script: `node docs/qas/backend/scripts/seed.mjs`
- [ ] Spot-check login: `curl -X POST .../auth/login -d '{"email":"...","password":"..."}'`

### During Test Execution

- [ ] Fresh tokens at start — never hardcode
- [ ] Unique slugs using `Date.now()` — no hardcoded unique values
- [ ] Propagate IDs — capture created IDs, pass to dependent tests
- [ ] Guard 204 body parsing — no `.json()` on empty responses
- [ ] Quote actual response in every failure message
- [ ] Block explicitly when a dependency fails

### Before Writing a Bug Report

- [ ] Reproduce manually with `curl` — confirm it's real
- [ ] Find the source location — file + line
- [ ] Determine root cause — not just symptoms
- [ ] Assign priority — P0/P1/P2/P3

### Before Marking Tests Complete

- [ ] Every BLOCKED test has a documented reason
- [ ] Every FAIL has a corresponding bug report entry
- [ ] Final report written to `docs/qas/reports/`
- [ ] All P0 bugs filed and communicated

---

*This guide was written from direct experience running backend QA on the Medcord API (2026). The patterns generalize to any Node/Express/MongoDB REST API.*
