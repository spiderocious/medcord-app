/**
 * runner.mjs — Simple test runner for QA scripts.
 *
 * Exports:
 *   results      — accumulated test result array
 *   test(id, description, fn) — registers and runs a test
 *   summary()    — prints pass/fail table and lists failures
 *   assert(condition, message)
 *   assertEqual(actual, expected, message)
 *   assertContains(obj, key, message)
 *   assertStatus(res, expectedStatus, message)
 *
 * CLI: node runner.mjs  — runs a self-test
 */

export const results = [];

/**
 * Run a single test case.
 * @param {string} id          Short identifier, e.g. 'AUTH-01'
 * @param {string} description Human-readable description
 * @param {() => Promise<void>} fn
 */
export async function test(id, description, fn) {
  try {
    await fn();
    results.push({ id, description, status: 'PASS', error: null });
    console.log(`  [PASS] ${id} — ${description}`);
  } catch (err) {
    results.push({ id, description, status: 'FAIL', error: err.message ?? String(err) });
    console.error(`  [FAIL] ${id} — ${description}`);
    console.error(`         ${err.message ?? err}`);
  }
}

/**
 * Print a summary table after all tests have run.
 * Returns the number of failures (useful for process.exit).
 * @returns {number}
 */
export function summary() {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = total - passed;

  console.log('\n' + '─'.repeat(60));
  console.log(`  Tests: ${total}   Passed: ${passed}   Failed: ${failed}`);
  console.log('─'.repeat(60));

  if (failed > 0) {
    console.log('\nFailures:');
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      console.log(`  ✗ [${r.id}] ${r.description}`);
      console.log(`      ${r.error}`);
    }
  }

  console.log('');
  return failed;
}

// ── Assertion helpers ────────────────────────────────────────────────────────

/**
 * Throw if condition is falsy.
 * @param {boolean} condition
 * @param {string} [message]
 */
export function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

/**
 * Throw if actual !== expected (strict equality).
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [message]
 */
export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

/**
 * Throw if key is not present in obj.
 * @param {Record<string, unknown>} obj
 * @param {string} key
 * @param {string} [message]
 */
export function assertContains(obj, key, message) {
  if (obj == null || !(key in obj)) {
    throw new Error(
      message ?? `Expected object to contain key "${key}". Keys present: ${obj == null ? 'null' : Object.keys(obj).join(', ')}`,
    );
  }
}

/**
 * Throw if res.status !== expectedStatus.
 * @param {{ status: number, data: unknown }} res
 * @param {number} expectedStatus
 * @param {string} [message]
 */
export function assertStatus(res, expectedStatus, message) {
  if (res.status !== expectedStatus) {
    const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
    throw new Error(
      message ??
        `Expected HTTP ${expectedStatus}, got ${res.status}.\nResponse body:\n${body}`,
    );
  }
}

// ── CLI entry-point ──────────────────────────────────────────────────────────
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('Running runner self-test...\n');

  await test('RUNNER-01', 'assert passes for true', () => {
    assert(true, 'should not throw');
  });

  await test('RUNNER-02', 'assertEqual passes for matching values', () => {
    assertEqual(1 + 1, 2, '1+1 should equal 2');
  });

  await test('RUNNER-03', 'assertContains passes when key exists', () => {
    assertContains({ foo: 'bar' }, 'foo');
  });

  await test('RUNNER-04', 'assertStatus passes on matching status', () => {
    assertStatus({ status: 201, data: {} }, 201);
  });

  await test('RUNNER-05', 'assert correctly catches a failure', async () => {
    let threw = false;
    try {
      assert(false, 'expected failure');
    } catch {
      threw = true;
    }
    assert(threw, 'assert should have thrown');
  });

  const failures = summary();
  process.exit(failures > 0 ? 1 : 0);
}
