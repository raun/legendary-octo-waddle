'use strict';

const { simulateRun } = require('../lib/validate');

// ---------------------------------------------------------------------------
// Exercise fixtures (minimal representations matching the MODULES array shape)
// ---------------------------------------------------------------------------

const exercise1 = {
  id: 'hello-workflow',
  validations: [
    { id: 'v1', rule: 'push_trigger',    description: "Triggers on 'push' events" },
    { id: 'v2', rule: 'main_branch',     description: "Scoped to the 'main' branch" },
    { id: 'v3', rule: 'job_named_greet', description: "Has a job named 'greet'" },
    { id: 'v4', rule: 'prints_hello',    description: 'Prints "Hello, FDE"' },
    { id: 'v5', rule: 'runs_on_ubuntu',  description: "Uses 'ubuntu-latest' runner" },
  ],
};

const exercise2 = {
  id: 'triggers',
  validations: [
    { id: 'v1', rule: 'has_push_trigger', description: 'Has a push trigger' },
    { id: 'v2', rule: 'has_pr_trigger',   description: 'Has a pull_request trigger' },
    { id: 'v3', rule: 'has_dispatch',     description: 'Has a workflow_dispatch trigger' },
  ],
};

const exercise3 = {
  id: 'github-context',
  validations: [
    { id: 'v1', rule: 'uses_github_sha',   description: 'References github.sha' },
    { id: 'v2', rule: 'uses_github_actor', description: 'References github.actor' },
  ],
};

// Starter YAML strings (unchanged from page.jsx)
const MODULE1_STARTER = `# .github/workflows/hello.yml
# TODO: Complete this workflow so it:
#   1. Runs on every push to the 'main' branch
#   2. Has a job named 'greet'
#   3. Prints "Hello, FDE" using the 'run' step

name: Hello Workflow

on:
  # Add trigger here

jobs:
  # Add job here
`;

const MODULE1_SOLUTION = `name: Hello Workflow

on:
  push:
    branches:
      - main

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, FDE"
`;

const MODULE2_STARTER = `name: Multi-Trigger Workflow

on:
  # TODO: Add three triggers:
  #   - push to main
  #   - pull_request to main
  #   - workflow_dispatch (manual)

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by \${{ github.event_name }}"
`;

const MODULE2_SOLUTION = `name: Multi-Trigger Workflow

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by \${{ github.event_name }}"
`;

// ---------------------------------------------------------------------------
// Empty YAML
// ---------------------------------------------------------------------------

describe('simulateRun — empty YAML', () => {
  let result;
  beforeAll(() => { result = simulateRun('', exercise1); });

  it('should return success: false for empty YAML', () => {
    expect(result.success).toBe(false);
  });

  it('should include an error log entry for empty workflow', () => {
    const errorLog = result.logs.find(l => l.kind === 'error');
    expect(errorLog).toBeDefined();
    expect(errorLog.line).toMatch(/empty/i);
  });

  it('should still return the three initial info logs before the error', () => {
    const infoLogs = result.logs.filter(l => l.kind === 'info');
    expect(infoLogs.length).toBeGreaterThanOrEqual(3);
  });

  it('should return logs as an array', () => {
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it('should NOT have passed or failed arrays (early return omits them)', () => {
    expect(result.passed).toBeUndefined();
    expect(result.failed).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Whitespace-only YAML (effectively empty)
// ---------------------------------------------------------------------------

describe('simulateRun — whitespace-only YAML', () => {
  it('should return success: false for YAML with only whitespace', () => {
    const result = simulateRun('   \n   \n  ', exercise1);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Solution YAML — all checks pass
// ---------------------------------------------------------------------------

describe('simulateRun — Module 1 solution YAML passes all checks', () => {
  let result;
  beforeAll(() => { result = simulateRun(MODULE1_SOLUTION, exercise1); });

  it('should return success: true', () => {
    expect(result.success).toBe(true);
  });

  it('should have an empty failed array', () => {
    expect(result.failed).toHaveLength(0);
  });

  it('should have all 5 validation rules in the passed array', () => {
    expect(result.passed).toHaveLength(5);
  });

  it('should have passed array containing all validation rule ids', () => {
    const passedIds = result.passed.map(r => r.id);
    expect(passedIds).toContain('v1');
    expect(passedIds).toContain('v2');
    expect(passedIds).toContain('v3');
    expect(passedIds).toContain('v4');
    expect(passedIds).toContain('v5');
  });

  it('summary log should say all checks passed', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toMatch(/All 5 checks passed/);
    expect(last.kind).toBe('success');
  });

  it('summary log should be the last entry in logs', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toMatch(/checks passed|checks failed/);
  });
});

// ---------------------------------------------------------------------------
// Starter YAML — all checks fail
// ---------------------------------------------------------------------------

describe('simulateRun — Module 1 starter YAML fails all checks', () => {
  let result;
  beforeAll(() => { result = simulateRun(MODULE1_STARTER, exercise1); });

  it('should return success: false', () => {
    expect(result.success).toBe(false);
  });

  it('should have all 5 validation rules in the failed array', () => {
    expect(result.failed).toHaveLength(5);
  });

  it('should have an empty passed array', () => {
    expect(result.passed).toHaveLength(0);
  });

  it('summary log should report 5 failed checks', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toMatch(/5 of 5 checks failed/);
    expect(last.kind).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// Module 2 solution YAML — all checks pass
// ---------------------------------------------------------------------------

describe('simulateRun — Module 2 solution YAML passes all checks', () => {
  let result;
  beforeAll(() => { result = simulateRun(MODULE2_SOLUTION, exercise2); });

  it('should return success: true', () => {
    expect(result.success).toBe(true);
  });

  it('should have all 3 rules in the passed array', () => {
    expect(result.passed).toHaveLength(3);
  });

  it('should have an empty failed array', () => {
    expect(result.failed).toHaveLength(0);
  });

  it('summary log should say all 3 checks passed', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toMatch(/All 3 checks passed/);
  });
});

// ---------------------------------------------------------------------------
// Module 2 starter YAML — all checks fail
// ---------------------------------------------------------------------------

describe('simulateRun — Module 2 starter YAML fails all checks', () => {
  let result;
  beforeAll(() => { result = simulateRun(MODULE2_STARTER, exercise2); });

  it('should return success: false', () => {
    expect(result.success).toBe(false);
  });

  it('should have all 3 rules in the failed array', () => {
    expect(result.failed).toHaveLength(3);
  });

  it('summary log should report 3 failed checks', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toMatch(/3 of 3 checks failed/);
  });
});

// ---------------------------------------------------------------------------
// Return structure shape
// ---------------------------------------------------------------------------

describe('simulateRun — return value shape', () => {
  it('should always return an object with a logs array for non-empty YAML', () => {
    const result = simulateRun(MODULE1_SOLUTION, exercise1);
    expect(result).toHaveProperty('logs');
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it('should always return an object with a boolean success property for non-empty YAML', () => {
    const result = simulateRun(MODULE1_SOLUTION, exercise1);
    expect(typeof result.success).toBe('boolean');
  });

  it('should always return passed and failed arrays for non-empty YAML', () => {
    const result = simulateRun(MODULE1_SOLUTION, exercise1);
    expect(Array.isArray(result.passed)).toBe(true);
    expect(Array.isArray(result.failed)).toBe(true);
  });

  it('passed.length + failed.length should equal total number of validation rules', () => {
    const result = simulateRun(MODULE1_STARTER, exercise1);
    expect(result.passed.length + result.failed.length).toBe(exercise1.validations.length);
  });
});

// ---------------------------------------------------------------------------
// Log entry shape
// ---------------------------------------------------------------------------

describe('simulateRun — log entry shape', () => {
  let logs;
  beforeAll(() => {
    logs = simulateRun(MODULE1_SOLUTION, exercise1).logs;
  });

  it('every log entry should have a numeric t property', () => {
    logs.forEach(log => {
      expect(typeof log.t).toBe('number');
    });
  });

  it('every log entry should have a string line property', () => {
    logs.forEach(log => {
      expect(typeof log.line).toBe('string');
    });
  });

  it('every log entry should have a kind property that is info, success, or error', () => {
    logs.forEach(log => {
      expect(['info', 'success', 'error']).toContain(log.kind);
    });
  });

  it('t values should be non-negative integers', () => {
    logs.forEach(log => {
      expect(log.t).toBeGreaterThanOrEqual(0);
    });
  });

  it('first log entry should be the workflow triggered message with t=0 and kind=info', () => {
    expect(logs[0].t).toBe(0);
    expect(logs[0].kind).toBe('info');
    expect(logs[0].line).toMatch(/Workflow triggered/i);
  });
});

// ---------------------------------------------------------------------------
// Log sequence and ordering
// ---------------------------------------------------------------------------

describe('simulateRun — log ordering and summary placement', () => {
  it('t values in logs should be monotonically non-decreasing', () => {
    const { logs } = simulateRun(MODULE1_SOLUTION, exercise1);
    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].t).toBeGreaterThanOrEqual(logs[i - 1].t);
    }
  });

  it('the summary log (passed or failed) should always be the last log entry', () => {
    const passing = simulateRun(MODULE1_SOLUTION, exercise1);
    const lastPassing = passing.logs[passing.logs.length - 1];
    expect(lastPassing.line).toMatch(/checks passed|checks failed/i);

    const failing = simulateRun(MODULE1_STARTER, exercise1);
    const lastFailing = failing.logs[failing.logs.length - 1];
    expect(lastFailing.line).toMatch(/checks passed|checks failed/i);
  });

  it('logs should include one entry per validation rule (success or error kind)', () => {
    const { logs } = simulateRun(MODULE1_SOLUTION, exercise1);
    const validationLogs = logs.filter(l => l.kind === 'success' || l.kind === 'error');
    // For a fully passing run: one success per rule + 1 summary success = rules + 1
    // We check there are at least as many as the number of rules
    expect(validationLogs.length).toBeGreaterThanOrEqual(exercise1.validations.length);
  });

  it('passing logs should use kind=success and failing logs should use kind=error', () => {
    const { logs } = simulateRun(MODULE2_STARTER, exercise2);
    // All rules fail → look for ✗ entries before the summary
    const ruleErrors = logs.filter(l => l.kind === 'error' && l.line.includes('✗'));
    expect(ruleErrors.length).toBeGreaterThanOrEqual(exercise2.validations.length);
  });
});

// ---------------------------------------------------------------------------
// Partial solution — mixed pass/fail
// ---------------------------------------------------------------------------

describe('simulateRun — partial solution (some rules pass, some fail)', () => {
  const partialYaml = `name: Hello Workflow
on:
  push:
    branches:
      - main
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Not the right message
        run: echo "Goodbye"
`;

  let result;
  beforeAll(() => { result = simulateRun(partialYaml, exercise1); });

  it('should return success: false when any rule fails', () => {
    expect(result.success).toBe(false);
  });

  it('should have some rules in passed array (push_trigger, main_branch, job_named_greet, runs_on_ubuntu)', () => {
    expect(result.passed.length).toBeGreaterThan(0);
  });

  it('should have some rules in failed array (prints_hello)', () => {
    expect(result.failed.length).toBeGreaterThan(0);
  });

  it('passed + failed should still equal total validations', () => {
    expect(result.passed.length + result.failed.length).toBe(exercise1.validations.length);
  });

  it('summary log should report exact failure count', () => {
    const last = result.logs[result.logs.length - 1];
    expect(last.line).toContain(`${result.failed.length} of ${exercise1.validations.length} checks failed`);
  });
});
