# Agent Browser QA Guide — Zero to 100

> A complete field guide for automated UI testing with `agent-browser`. Written from real execution experience across multiple full test suites. Covers everything from first launch to writing bug reports. Applicable to any web UI, not just this project.

---

## Table of Contents

1. [What You Are Doing](#1-what-you-are-doing)
2. [Agent Browser Fundamentals](#2-agent-browser-fundamentals)
3. [Starting a Session](#3-starting-a-session)
4. [Navigating and Reading Pages](#4-navigating-and-reading-pages)
5. [Interacting with Elements](#5-interacting-with-elements)
6. [React-Specific Techniques](#6-react-specific-techniques)
7. [Modal Detection and Interaction](#7-modal-detection-and-interaction)
8. [Network and API Inspection](#8-network-and-api-inspection)
9. [Writing a Test Plan](#9-writing-a-test-plan)
10. [Cross-Cutting Checks](#10-cross-cutting-checks)
11. [Executing Tests](#11-executing-tests)
12. [Error Handling and Recovery](#12-error-handling-and-recovery)
13. [Writing the Report](#13-writing-the-report)
14. [Bug Reporting Standards](#14-bug-reporting-standards)
15. [Screenshots and Evidence](#15-screenshots-and-evidence)
16. [Common Patterns Cheat Sheet](#16-common-patterns-cheat-sheet)
17. [Anti-Patterns to Avoid](#17-anti-patterns-to-avoid)

---

## 1. What You Are Doing

You are a QA engineer operating a real browser through the `agent-browser` CLI. You are not running unit tests. You are not calling APIs directly (except to seed data). You are testing the UI as a user would — navigating pages, clicking buttons, filling forms, reading what the screen shows, and deciding whether it matches what it should.

Your job produces three outputs:
1. A **test plan** (written before testing) — what you will test and how
2. **Screenshots** — visual evidence for every major state
3. A **report** (written after testing) — what passed, what failed, what was blocked, and why

You do not delegate testing to sub-agents. You do not use Playwright. You do not use curl to "test" the UI. You use `agent-browser`. Every test result must come from what the browser shows.

---

## 2. Agent Browser Fundamentals

### Installation and launch

```bash
# Launch browser and navigate
agent-browser open http://localhost:5173

# Launch without navigation (for pre-setup)
agent-browser open

# Close everything when done
agent-browser close --all
```

### The daemon model

`agent-browser` runs a persistent daemon. Commands in a session share state — cookies, sessionStorage, navigation history. You do not re-open the browser between commands. If you need a clean state, use `agent-browser close --all` and reopen.

### Sessions

Each session is isolated (separate cookies, storage, history):

```bash
# Default session (most tests)
agent-browser open http://localhost:5173

# Named session (for multi-tab or parallel flows)
agent-browser --session agent1 open http://localhost:5173
agent-browser --session agent2 open http://localhost:5173
```

### The two ways to find elements

**1. Semantic locators** (`find` command) — preferred when they work:
```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find placeholder "Password" fill "secret"
```

**2. Refs from snapshot** — use after `snapshot` or `screenshot --annotate`:
```bash
agent-browser snapshot -i          # Get interactive elements with refs like @e1, @e2
agent-browser click @e3            # Click by ref
agent-browser fill @e4 "value"     # Fill by ref
```

Refs are **session-scoped and reset on every snapshot**. Always re-snapshot if you need fresh refs after navigation or DOM changes.

**3. JavaScript eval** — fallback when semantic and ref approaches fail:
```bash
agent-browser eval "document.querySelector('button').click()"
agent-browser eval "document.body.innerText"
```

---

## 3. Starting a Session

### Standard login flow

```bash
# 1. Close any stale sessions first
agent-browser close --all

# 2. Open app
agent-browser open http://localhost:5173

# 3. Get snapshot to find form refs
agent-browser snapshot -i

# 4. Fill login form
agent-browser fill @e4 "user@app.test"
agent-browser fill @e8 "Password123!"
agent-browser click @e6   # Sign in button

# 5. Wait for post-login navigation
agent-browser wait --url "**/dashboard"
agent-browser get url     # Confirm where we landed
```

### Verify backend is running first

Always confirm both the backend and frontend are up before starting:

```bash
curl http://localhost:8085/api/v1/health    # Backend
curl http://localhost:5173 | head -3        # Frontend
```

If either is down, do not start testing. Fix it first.

### Pre-condition: seed data

Many tests require data to exist. Before testing a list screen, confirm data exists via API:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

# Check data
curl -s "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
```

If data doesn't exist, create it via API before opening the browser — don't try to create test data through the UI during the test (it pollutes results and wastes time).

---

## 4. Navigating and Reading Pages

### Navigation

```bash
agent-browser navigate http://localhost:5173/h/hospital-a/patients
agent-browser wait --load networkidle      # Wait for all requests to settle
agent-browser get url                      # Confirm current URL
agent-browser back                         # Go back
agent-browser forward                      # Go forward
agent-browser reload                       # Reload page
```

### Reading page content

The two most important commands:

```bash
# Full text content — fastest way to verify everything on a page
agent-browser eval "document.body.innerText"

# Interactive elements only — for finding buttons/inputs to interact with
agent-browser snapshot -i

# Scoped snapshot — when you only care about a section
agent-browser snapshot -i -s "#main-content"

# Compact — removes empty structural noise
agent-browser snapshot -i -c
```

### When to use what

| Situation | Command |
|-----------|---------|
| "Is this text on the page?" | `agent-browser eval "document.body.innerText"` |
| "What buttons/links are available?" | `agent-browser snapshot -i` |
| "What is the current URL?" | `agent-browser get url` |
| "Is this element visible?" | `agent-browser is visible <sel>` |
| "Is this button enabled?" | `agent-browser is enabled <sel>` or `eval "el.disabled"` |
| "What does the page look like?" | `agent-browser screenshot <path>` |

### Waiting correctly

Never use `sleep`. Use targeted waits:

```bash
agent-browser wait --load networkidle        # After navigation — wait for network
agent-browser wait --text "Dashboard"         # Wait for specific text to appear
agent-browser wait --url "**/h/**"            # Wait for URL pattern after login
agent-browser wait 500                        # Fixed delay — use sparingly, only for animations
agent-browser wait "#spinner" --state hidden  # Wait for spinner to disappear
agent-browser wait --fn "document.querySelector('.toast') !== null"  # Custom condition
```

---

## 5. Interacting with Elements

### Preferred interaction order

Try in this order — stop at the first that works:

1. `agent-browser find role button click --name "Submit"` — semantic, most reliable
2. `agent-browser click @eN` — ref from snapshot
3. `agent-browser eval "document.querySelectorAll('button')[N].click()"` — JS fallback

### Filling inputs

```bash
# Standard fill (clear + type)
agent-browser fill @e4 "value"

# Type into currently focused element
agent-browser keyboard type "value"

# Select dropdown option
agent-browser select @e5 "option-value"

# Check/uncheck checkbox
agent-browser check @e6
agent-browser uncheck @e6
```

### When fill doesn't work (React controlled inputs)

React inputs have controlled state — setting `.value` directly doesn't trigger React's change handler. Use the native setter pattern:

```bash
agent-browser eval "
  const input = document.querySelector('input[name=email]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'new@value.com');
  input.dispatchEvent(new Event('input', {bubbles: true}));
"
```

For selects:
```bash
agent-browser eval "
  const sel = document.querySelector('select');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, 'option-value');
  sel.dispatchEvent(new Event('change', {bubbles: true}));
"
```

### When click doesn't work

React onClick handlers sometimes don't fire from `agent-browser click`. Try:

```bash
# By index
agent-browser eval "document.querySelectorAll('button')[2].click()"

# By text content
agent-browser eval "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit').click()"

# By class or attribute
agent-browser eval "document.querySelector('[data-action=submit]').click()"
```

### Tabs and new windows

```bash
agent-browser tab                    # List all tabs
agent-browser tab t1                 # Switch to tab t1
agent-browser tab new http://url     # Open new tab
agent-browser tab close t2           # Close tab t2
```

For `window.open()` popups (not tabs), intercept via JS:
```bash
agent-browser eval "
  window._popup = null;
  const orig = window.open;
  window.open = function() { window._popup = orig.apply(this, arguments); return window._popup; };
"
# Then click the button that calls window.open
agent-browser eval "document.querySelectorAll('button')[3].click()"
agent-browser wait 1000
agent-browser eval "window._popup ? window._popup.document.body.innerText : 'no popup'"
```

---

## 6. React-Specific Techniques

### Identifying React apps

Look for: Vite dev server, `#root` div, TanStack Query or React Query in network requests, React DevTools hook in page source.

### State mutations don't always update the DOM immediately

After clicking a button that triggers a mutation:
1. Wait for the network request to complete (`agent-browser wait --load networkidle`)
2. Check the DOM
3. If stale — reload and check again

If it's still wrong after reload, the backend mutation failed. If it's correct after reload but not before, the frontend is not invalidating its query cache (a bug).

### Toast notifications

Most React apps use a toast library. Toasts appear briefly. Check them immediately after an action:

```bash
agent-browser eval "document.querySelector('[role=status], .toast, [class*=toast]')?.innerText"
# Or just get all body text immediately after action
agent-browser eval "document.body.innerText" | grep -E "✓|success|error|failed"
```

Toasts often appear as a 3rd child of `<body>` in portal-based implementations.

### Detecting if a modal is open

The most reliable technique for portal-based modals (DrawerService, Radix, etc.):

```bash
agent-browser eval "document.body.childElementCount"
# Returns 2 = no modal
# Returns 3 = modal open
```

Read modal content:
```bash
agent-browser eval "document.body.children[2].innerText"
```

List modal buttons:
```bash
agent-browser eval "Array.from(document.body.children[2].querySelectorAll('button')).map((b,i) => i+': '+b.textContent.trim())"
```

Click modal buttons:
```bash
agent-browser eval "document.body.children[2].querySelectorAll('button')[1].click()"  # Cancel (index 1)
agent-browser eval "document.body.children[2].querySelectorAll('button')[2].click()"  # Confirm (index 2)
```

> **Note:** Index 0 is usually the X/close button, index 1 is Cancel, index 2 is the confirm action. Verify for each app's modal structure before assuming.

---

## 7. Modal Detection and Interaction

### Full modal workflow

```bash
# 1. Trigger the modal
agent-browser find role button click --name "Delete"
agent-browser wait 500

# 2. Confirm it opened
agent-browser eval "document.body.childElementCount"  # Should be 3

# 3. Read modal content
agent-browser eval "document.body.children[2].innerText"
agent-browser screenshot /path/to/modal-screenshot.png

# 4. Interact with modal fields (if any)
agent-browser eval "
  const input = document.body.children[2].querySelector('input');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'reason text');
  input.dispatchEvent(new Event('input', {bubbles:true}));
"

# 5. Click confirm
agent-browser eval "document.body.children[2].querySelectorAll('button')[2].click()"
agent-browser wait 1000

# 6. Verify modal closed and action took effect
agent-browser eval "document.body.childElementCount"  # Should be 2 again
agent-browser eval "document.body.innerText"           # Check the result
```

### Confirmation modal with destructive flag

Some apps style confirmation modals differently when `destructive: true`. The confirm button will be red/danger-styled. Verify visually with a screenshot:

```bash
agent-browser screenshot /path/to/destructive-modal.png
# Then visually confirm the confirm button has danger styling
```

---

## 8. Network and API Inspection

### Watching API calls

Start HAR recording before an action you want to inspect:

```bash
agent-browser network har start
# ... do the action ...
agent-browser network requests --filter /api --method POST
```

Filter requests:
```bash
agent-browser network requests --filter patients          # URL contains "patients"
agent-browser network requests --method POST              # Only POSTs
agent-browser network requests --status 2xx              # Only successes
agent-browser network requests --status 4xx              # Only errors
```

View full request detail:
```bash
agent-browser network requests --filter /api | grep "LAB-"  # Find the request ID
agent-browser network request <requestId>                    # Full headers + body
```

### Blocking/mocking requests

```bash
# Simulate a backend error
agent-browser network route "*/api/v1/hospitals*" --body '{"error":"Service unavailable"}' 

# Block a resource type
agent-browser network route "*" --abort --resource-type script

# Clean up
agent-browser network unroute
```

### Checking if a specific mutation was called

This is how you verify a button called the right endpoint:

```bash
agent-browser network har start
agent-browser eval "document.querySelectorAll('button')[3].click()"
agent-browser wait 2000
agent-browser network requests --method POST --filter /result
# If empty — button did NOT call the result endpoint
# If present — it did
```

---

## 9. Writing a Test Plan

A test plan is written **before** executing any tests. It comes from reading:
1. The spec/handoff document
2. The source code of the screens being tested

### Plan structure

```markdown
# Test Plan — [Module Name]

**Prepared:** YYYY-MM-DD
**Spec:** path/to/spec.md
**Seed user:** user@app.test / Password123!
**Screenshots →** /path/to/screenshots/

---

## Pre-flight

Steps to run before any tests.

---

## [Screen Name] — [Route]

### [Section]

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| X-01 | [what you're testing] | [what should happen] | [which command to run] |
```

### What makes a good test case

- **ID** — unique, hierarchical (A1-01, A1-02 etc.)
- **Test** — one specific behaviour (not "test the whole form")
- **Expected** — concrete and measurable ("URL changes to `/assets/:id`", not "navigates correctly")
- **How to verify** — the exact agent-browser command or technique

### Bug probes vs functional tests

Mark tests explicitly if they're confirming a known bug:

```markdown
| A3-06 | **Bug to verify:** no success toast after save | No toast appears after form submit | Submit form; check `document.body.childElementCount` — stays 2 |
```

### Reading source code before writing the plan

Always read the source files for every screen you're testing. Look for:

- **Meemaw violations** — raw `&&` in JSX, `.map()` instead of `<Repeat>`, ternaries instead of `<Switch>`
- **Color token violations** — raw hex values like `#166534` in Tailwind `className`
- **FSD violations** — form components defined inline in screen files
- **DOM queries** — `document.getElementById()` instead of React state
- **Hardcoded values** — production URLs, hardcoded IDs, `patientId=""` passed to mutations
- **Missing error handlers** — `onError` absent from mutations means silent failures
- **Non-null assertions** — `thing!` in TypeScript when `thing` could be undefined
- **Dead state** — state variables set but never read in render
- **Dead imports** — unused imports at the top of the file

Document all of these as "bug to verify" entries in the plan, then confirm them at runtime.

### Execution order

Plan tests in dependency order:
1. Create data (so later tests have something to work with)
2. Test list screens (after data exists)
3. Test detail screens (after navigating from list)
4. Test mutations (after verifying read state)
5. Test error states (last — don't break data for other tests)

---

## 10. Cross-Cutting Checks

Cross-cutting checks apply to every screen, regardless of feature. Run them after all functional tests. They are **source-level audits** — you grep the code, not just the browser.

### Standard cross-cutting checklist

#### Meemaw / JSX correctness

```bash
# Find raw && in JSX (should be <Show when={...}>)
grep -rn "{.*&&" apps/src/features/ --include="*.tsx" | grep -v "//\|test\|spec" | head -20

# Find .map() in JSX render (should be <Repeat>)
grep -rn "\.map(" apps/src/features/ --include="*.tsx" | grep -v "//\|test\|spec\|const\|let\|=" | head -20
```

#### Color token violations

```bash
# Find raw hex in Tailwind classNames
grep -rn "bg-\[#\|text-\[#\|border-\[#" apps/src/features/ --include="*.tsx" | head -20
```

#### Icon imports (only via the proxy, never lucide-react directly)

```bash
grep -rn "from 'lucide-react'" apps/src/features/ --include="*.tsx"
# Expected: empty output
```

#### FSD structure (form components should be in screen/parts/)

```bash
# Find components defined inline in screen files (>50 lines suggests inline components)
wc -l apps/src/features/**/screen/*.tsx | sort -rn | head -20
```

#### DOM queries (should not exist in React components)

```bash
grep -rn "document.getElementById\|document.querySelector" apps/src/features/ --include="*.tsx" | grep -v "//\|eval\|test" | head -20
```

#### Hardcoded config values

```bash
grep -rn "https://.*production\|localhost:.*hardcoded\|\"HSP-\|patientId=\"\"" apps/src/ --include="*.tsx" --include="*.ts" | head -10
```

#### Missing error handlers on mutations

```bash
grep -rn "useMutation\|mutationFn" apps/src/features/ --include="*.ts" -l | xargs grep -L "onError"
# Files listed have mutations without onError handlers
```

### How to report cross-cutting findings

Create a table per category in the plan and report:

```markdown
| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-01 | `screen.tsx:42` | `{items.map(...)}` in JSX render | Medium |
| CC-07 | `filters.tsx:22` | `{q && <Button>}` — raw && | High |
```

---

## 11. Executing Tests

### The execution loop

For each test case:

1. **Navigate** to the correct page
2. **Set up state** (ensure pre-conditions are met)
3. **Take a before screenshot** if testing a state change
4. **Perform the action**
5. **Verify the result** with `eval "document.body.innerText"` or `get url`
6. **Take an after screenshot**
7. **Record the result** — PASS, FAIL, SKIP, or BLOCKED

### PASS vs FAIL vs SKIP vs BLOCKED

- **PASS** — outcome matches expected
- **FAIL** — outcome does not match expected (this is a bug)
- **SKIP** — could not test (e.g., loading state too fast to screenshot)
- **BLOCKED** — cannot test because a prerequisite is broken (e.g., all profile tests blocked because profile endpoint returns 404)

### Batch multiple commands

Use batch to reduce overhead when doing sequential non-dependent steps:

```bash
agent-browser batch \
  "navigate http://localhost:5173/dashboard" \
  "wait --load networkidle" \
  "screenshot /screenshots/dashboard.png"
```

### State verification after mutations

After every mutation (form submit, button click that calls an API):

```bash
# Check the immediate DOM update
agent-browser wait 1000
agent-browser eval "document.body.innerText" | grep -E "success|error|toast|✓"

# Then reload to verify backend persisted
agent-browser reload
agent-browser wait --load networkidle
agent-browser eval "document.body.innerText"
```

If the DOM updates before reload = live query invalidation (good).  
If only correct after reload = query not invalidated (bug, document it).  
If wrong even after reload = mutation didn't call the API or API rejected it.

---

## 12. Error Handling and Recovery

### When a command fails

```
✗ Unknown ref: e6
```

The snapshot refs are stale. Re-snapshot:
```bash
agent-browser snapshot -i
# Use the new refs
```

```
✗ Element not found
```

The element doesn't exist yet. Either:
- Wait for it: `agent-browser wait ".my-element"`
- Check if the page is in a different state than expected: `agent-browser eval "document.body.innerText"`

```
✗ Navigation failed: net::ERR_CONNECTION_REFUSED
```

The dev server died. Restart it:
```bash
pnpm nx run medcord-web:serve --port 5173 &
sleep 8 && curl -s http://localhost:5173 | head -3
```

Then re-open browser:
```bash
agent-browser open http://localhost:5173
# Re-login
```

### When a modal won't open

Try multiple approaches in order:
```bash
# 1. Semantic click
agent-browser find role button click --name "Delete"

# 2. Ref click
agent-browser snapshot -i
agent-browser click @eN

# 3. JS click by text
agent-browser eval "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Delete')).click()"

# 4. JS click by index
agent-browser eval "document.querySelectorAll('button')[2].click()"
```

### When the app crashes or goes blank

```bash
agent-browser eval "document.body.innerText"   # If empty — React crashed
agent-browser errors                             # Check for JS exceptions
agent-browser console                            # Check console errors
```

A blank page after navigation usually means:
- A non-null assertion (`thing!`) crashed because `thing` was undefined
- A component threw an error not caught by an ErrorBoundary
- The route wasn't registered

### When actions don't seem to do anything

```bash
# Check if the button is actually disabled
agent-browser eval "document.querySelector('button').disabled"

# Check if there's a loading state blocking it
agent-browser eval "document.body.innerText" | grep -i "loading\|spinner\|pending"

# Check if an error toast appeared
agent-browser eval "document.body.innerText" | grep -i "error\|failed\|something went wrong"

# Check if the mutation was called at all
agent-browser network requests --method POST
```

### When tests are producing inconsistent results

The most common causes:
1. **Race condition** — add `agent-browser wait --load networkidle` before reading state
2. **Stale refs** — re-snapshot after any navigation or DOM change
3. **Cache** — previous test left dirty state. Reload: `agent-browser reload`
4. **Session pollution** — close and reopen: `agent-browser close --all && agent-browser open <url>`

---

## 13. Writing the Report

A report is written **after** executing all tests. Never write the report during testing.

### Report structure

```markdown
# QA Execution Report — [Module Name]

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Build:** [branch / commit]
**Auth:** [user@app.test / Password]
**Screenshots:** /path/to/screenshots/

---

## Summary Table

| Phase | Passed | Failed | Blocked | Skipped | Notes |
|-------|--------|--------|---------|---------|-------|
| Phase 1 — Feature A | 22 | 1 | 0 | 2 | |
| Phase 2 — Feature B | 0 | 0 | 15 | 0 | Blocked by BE-01 |

**Total: X PASS / Y FAIL / Z BLOCKED**

---

## Pre-flight Notes

[Any infrastructure issues discovered before testing — backend bugs, broken auth, missing data, workarounds applied]

---

## [Phase / Screen Name]

### [Section]

| ID | Result | Notes |
|----|--------|-------|
| A1-01 | **PASS** | Table renders with 3 assets |
| A1-06 | **FAIL** | **BUG:** No toast after save — silent success |
| A1-11 | **SKIP** | Could not capture loading state (too fast) |
| A3-01 | **BLOCKED** | Blocked by BUG-CRIT-02 (patient profile 404) |
```

### Result notation

- `**PASS**` — always bold
- `**FAIL**` — always bold, followed immediately by `**BUG:**` description
- `**SKIP**` — always bold, reason in Notes
- `**BLOCKED**` — always bold, reference the blocking bug in Notes

### What to include in Notes for failures

Always include:
1. What actually happened
2. What was expected
3. File and line if known from source review
4. The bug ID if already catalogued

Example:
```
| A3-06 | **FAIL** | **BUG:** No success toast after saving asset info. Form submits silently — no toast, no inline confirmation. Source: `asset-info-form.tsx` has no `onSuccess` toast. (CC-36) |
```

---

## 14. Bug Reporting Standards

### Bug severity levels

| Level | Meaning | Example |
|-------|---------|---------|
| **P0** | App-breaking — feature completely non-functional | Auth context always null; all data screens show empty |
| **P1** | Major — core user flow broken | Form submits to wrong endpoint; no error handling on mutations |
| **P2** | Moderate — degraded UX, no data loss | No success toast after save; stale UI after mutation |
| **P3** | Minor — code quality, visual polish | Dead imports; unused state variables; raw hex instead of tokens |

### Bug report format in the report

```markdown
### BUG-NEW-01 — [Title] (P0)

**File:** `apps/src/features/.../screen.tsx`

[One paragraph describing exactly what is wrong — observed behaviour vs expected behaviour. Include the specific mechanism of failure if known.]

**Fix:** [What needs to change — specific enough that a dev can act on it without asking questions.]
```

### Naming bugs

- `BUG-CRIT-XX` — critical bugs found pre-testing (infrastructure level)
- `BE-XX` — backend bugs (not frontend)
- `CC-XX` — cross-cutting / code quality bugs
- `BUG-NEW-XX` — bugs found during test execution

### What NOT to report as a bug

- Behaviour that matches the spec exactly (even if it feels wrong)
- Performance (unless spec defines a threshold)
- Things you couldn't test (mark as SKIP or BLOCKED instead)
- Aesthetics (unless the spec defines specific styling)

---

## 15. Screenshots and Evidence

### When to take screenshots

Take screenshots at:
- Initial page load for each screen under test
- Before and after any significant state change
- Every modal (open state)
- Every empty state
- Every error state
- Every toast (immediately after action)
- Any visual bug (badge wrong colour, missing element, etc.)

### Naming convention

```
phase{N}-{screen}-{state}.png

Examples:
phase4-asset-list.png
phase4-asset-list-empty.png
phase4-asset-delete-modal.png
phase4-asset-detail.png
phase7-lab-order-advance-modal.png
phase9-review-item-reject-modal.png
```

### Annotated screenshots

Use `--annotate` when you need to reference specific elements:

```bash
agent-browser screenshot --annotate /path/to/annotated.png
# Output lists: [1] @e1 button "Submit"
# You can then click @e1 immediately
```

### Screenshot directory

Set a consistent directory at the start of each session:

```bash
SCREENSHOTS="/Users/you/project/screenshots"
mkdir -p $SCREENSHOTS

# Then use in every screenshot command
agent-browser screenshot $SCREENSHOTS/phase1-login.png
```

---

## 16. Common Patterns Cheat Sheet

### Login

```bash
agent-browser close --all
agent-browser open http://localhost:5173
agent-browser snapshot -i
agent-browser fill @e4 "user@app.test"
agent-browser fill @e8 "Password123!"
agent-browser click @e6
agent-browser wait --url "**/dashboard"
```

### Navigate and verify text

```bash
agent-browser navigate http://localhost:5173/h/slug/patients
agent-browser wait --load networkidle
agent-browser eval "document.body.innerText" | grep -E "Patient|error|empty"
```

### Click a table row

```bash
agent-browser eval "document.querySelector('tbody tr').click()"
agent-browser wait 500
agent-browser get url
```

### Open a modal and confirm

```bash
agent-browser find role button click --name "Delete"
agent-browser wait 500
agent-browser eval "document.body.childElementCount"   # Expect 3
agent-browser eval "document.body.children[2].innerText"
agent-browser eval "document.body.children[2].querySelectorAll('button')[2].click()"  # Confirm
agent-browser wait 1000
agent-browser eval "document.body.childElementCount"   # Expect 2 (closed)
```

### Fill a React controlled input

```bash
agent-browser eval "
  const input = document.querySelector('input[name=email]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'new@email.com');
  input.dispatchEvent(new Event('input', {bubbles: true}));
"
```

### Fill a React select

```bash
agent-browser eval "
  const sel = document.querySelectorAll('select')[0];
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, 'pending');
  sel.dispatchEvent(new Event('change', {bubbles: true}));
"
```

### Check if button is disabled

```bash
agent-browser eval "document.querySelector('button[type=submit]').disabled"
# or
agent-browser is enabled "button[type=submit]"
```

### Intercept window.open

```bash
agent-browser eval "window._popup = null; const o = window.open; window.open = function() { window._popup = o.apply(this, arguments); return window._popup; };"
agent-browser eval "document.querySelectorAll('button')[3].click()"
agent-browser wait 1000
agent-browser eval "window._popup?.document.body.innerText"
```

### Check for toast

```bash
agent-browser eval "document.body.innerText" | grep -E "✓|success|error|toast"
```

### Verify API was called

```bash
agent-browser network har start
# ... do the action ...
agent-browser network requests --method POST --filter /api/v1/result
```

### List all buttons on page

```bash
agent-browser eval "Array.from(document.querySelectorAll('button')).map((b,i) => i+': '+b.textContent.trim())"
```

### List all inputs on page

```bash
agent-browser eval "Array.from(document.querySelectorAll('input, select, textarea')).map((el,i) => i+': '+el.tagName+' name='+el.name+' type='+el.type)"
```

### Seed data via API (from bash, not browser)

```bash
LOGIN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

curl -s -X POST "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients/$PAT_ID/labs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testName":"CBC","priority":"routine"}' | python3 -m json.tool
```

---

## 17. Anti-Patterns to Avoid

### ❌ Never use sub-agents for testing

You do not delegate testing to a sub-agent. Sub-agents do not have the browser session context, cannot see the screenshots you've taken, and produce results you cannot verify. Do all testing yourself with `agent-browser` via `Bash`.

### ❌ Never use Playwright

`agent-browser` is the tool. Do not install or use Playwright, Puppeteer, or any other browser automation library.

### ❌ Never use curl to "test" the UI

Testing the API directly with curl tells you nothing about whether the UI works. The frontend could be calling the wrong endpoint, passing wrong values, or not updating the DOM after a successful mutation. Always test through the browser.

### ❌ Never skip the pre-flight

Before every test session: verify backend is running, verify frontend is running, verify you have test data, verify auth works. Skipping pre-flight means you'll discover infrastructure problems halfway through a test run and waste time.

### ❌ Never write the report during testing

Write test results in scratch form during execution, then consolidate into the report file after all tests complete. Writing the report mid-run introduces errors and interrupts the testing flow.

### ❌ Never hardcode test IDs

Every ID (hospital ID, patient ID, asset ID) changes between environments and test runs. Always fetch them at the start of each session:

```bash
# Wrong — hardcoded
agent-browser navigate http://localhost:5173/h/hospital-a/assets/AST-12345

# Right — fetched at runtime
ASSET_ID=$(curl -s "http://localhost:8085/api/v1/hospitals/$HSP_ID/assets?limit=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][0]['id'])")
agent-browser navigate "http://localhost:5173/h/hospital-a/assets/$ASSET_ID"
```

### ❌ Never use `sleep`

`sleep N` is a guess. Use targeted waits:
```bash
# Wrong
sleep 3

# Right
agent-browser wait --load networkidle
agent-browser wait --text "Dashboard"
agent-browser wait 500   # Only acceptable for short animation waits
```

### ❌ Never report PASS if you didn't verify it

If a test says "verify the badge is green" and you only read the text (not the colour), mark it PASS only for the text part. Note that visual colour was not verified or take a screenshot and check. Guessing is not testing.

### ❌ Never mark a test PASS based on source code alone

Source review can confirm a bug exists. It cannot confirm a test passes. A test only passes if you ran it in the browser and the outcome matched expected. If you can only verify from source, mark as "CONFIRMED (source)" or "PASS (source)" with a note.

### ❌ Never stop investigating on the first error

When something fails, dig one level deeper:
- Toast didn't appear → check if the API call was made at all
- API call not made → check if the button click fired (add event listener via eval)
- Button click fired → check if the mutation was set up correctly (read the source)
- Mutation wrong → check what endpoint it's calling (HAR recording)

The first failure tells you something went wrong. The investigation tells you what, and that's what goes in the bug report.

---

## Appendix — Test Plan Template

```markdown
# Test Plan — [Phase X] [Feature Name]

**Prepared:** YYYY-MM-DD
**Ref:** cross-cutting-test-plan.md (applies to all tests here)
**Source spec:** `docs/spec.md`
**Seed user:** user@app.test / Password123!
**Screenshots →** `/path/to/screenshots/`

---

## Pre-flight

1. Confirm backend running: `curl http://localhost:PORT/health`
2. Confirm frontend running: open `http://localhost:5173`
3. Log in as seed user
4. Fetch live IDs:
   ```
   GET /api/v1/resource — get IDs needed for direct URL navigation
   ```
5. Seed test data if needed

---

## [Screen Name] — [Route]

**File:** `apps/src/features/.../screen.tsx`

### [Section]

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| X1-01 | Screen renders with heading | "My Feature" heading visible | `agent-browser eval "document.body.innerText"` |
| X1-02 | Empty state shown with no data | Icon + "No items found." | Check body text |
| X1-03 | Row click navigates to detail | URL: `/h/:slug/items/:id` | `agent-browser eval "document.querySelector('tbody tr').click()"`, check URL |

---

## Cross-Cutting Checks

### Meemaw Violations

| ID | File | Violation | Severity |
|----|------|-----------|----------|

### Color Token Violations

| ID | File | Tokens | Violation |
|----|------|--------|-----------|

### FSD Violations

| ID | File | Issue |
|----|------|-------|

### Critical Bug Catalogue

| ID | Bug | File | Severity |
|----|-----|------|----------|

---

## Test Execution Order

1. Create data first
2. Test list screen
3. Test detail screen
4. Test mutations
5. Cross-cutting checks last

---

## Screenshots Naming Convention

```
phaseN-screen-state.png
```

---

## Total Test Count

| Section | Functional | Bug checks | CC | Total |
|---------|-----------|------------|-----|-------|
| | | | | |
| **Total** | | | | |
```

---

## Appendix — Report Template

```markdown
# QA Execution Report — [Phase X] [Feature Name]

**Date:** YYYY-MM-DD
**Tester:** [Name / Claude]
**Build:** main branch, typecheck clean ✅ · lint clean ✅
**Auth:** user@app.test / Password123!
**Hospital/Workspace:** [Name] (`ID-...`, slug `name`)
**Screenshots:** `/path/to/screenshots/phase-*`

---

## Summary

| Phase | Passed | Failed | Blocked | Skipped | Notes |
|-------|--------|--------|---------|---------|-------|
| | | | | | |

**Total: X PASS / Y FAIL / Z BLOCKED**

---

## Pre-flight Notes

[BUG-CRIT entries, workarounds applied, infrastructure issues]

---

## [Phase / Screen]

### [Section]

| ID | Result | Notes |
|----|--------|-------|
| X1-01 | **PASS** | [what was observed] |
| X1-02 | **FAIL** | **BUG:** [what went wrong — file, line if known] |
| X1-03 | **SKIP** | [why skipped] |
| X1-04 | **BLOCKED** | [reference to blocking bug] |

---

## Cross-Cutting Checks

[Tables per category]

---

## New Bugs Found

### BUG-NEW-01 — [Title] (PX)

**File:** `...`

[Description, mechanism, evidence]

**Fix:** [What to change]

---

## Screenshots Taken

| File | Description |
|------|-------------|

---

## Priority Fix List

### Must Fix Before Sign-off
1. ...

### Should Fix Before Launch
2. ...

### Code Quality (Post-MVP)
3. ...
```
