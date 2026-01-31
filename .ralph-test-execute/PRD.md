# QuickCarousals - Test Execution Framework

## Overview

This Ralph loop is for **test case execution only**. The agent executes test cases defined in `.ralph-test/tests.json` and validates application behavior against acceptance criteria.

**Philosophy:** "Execute tests automatically, capture evidence, report results"

**This loop does NOT:**
- Create or modify test case definitions
- Analyze source code for new tests
- Change application code

**This loop DOES:**
- Execute test steps using browser/API tools
- Validate actual vs expected behavior
- Mark tests as passed/failed/skipped
- Capture screenshots as evidence
- Generate execution reports

---

## Execution Process

For each test case:

1. **Check preconditions** - Ensure environment is ready
2. **Execute test steps** - Run each step using appropriate tools
3. **Validate results** - Compare actual vs expected outcomes
4. **Record result** - Update test status (passed/failed/skipped)
5. **Capture evidence** - Screenshots for frontend tests, response logs for API tests
6. **Continue to next test** - Process all tests regardless of failures

---

## Test Case Structure (Input)

Test cases come from `.ralph-test/tests.json` with this structure:

```json
{
  "id": "TC-AUTH-001",
  "name": "User can login with valid credentials",
  "module": "auth",
  "category": "api | frontend | e2e | security",
  "type": "happy_path | error_path | edge_case",
  "priority": "critical | high | medium | low",
  "description": "What this test validates",
  "preconditions": ["User has account", "Dev server running"],
  "steps": [
    {
      "step": 1,
      "action": "Navigate to login page",
      "expected": "Login form is displayed"
    }
  ],
  "acceptance_criteria": ["Login completes within 3 seconds"],
  "related_files": ["apps/nextjs/src/..."],
  "tags": ["auth", "login"]
}
```

---

## Execution Result Structure

After execution, each test case gets an `execution` field:

```json
{
  "id": "TC-AUTH-001",
  "execution": {
    "status": "passed | failed | skipped",
    "executed_at": "2026-01-31T10:00:00Z",
    "duration_ms": 1500,
    "steps_completed": 3,
    "steps_total": 3,
    "failure_reason": null,
    "failed_step": null,
    "evidence": {
      "screenshots": [".ralph-test-execute/evidence/TC-AUTH-001-step1.png"],
      "api_responses": [],
      "console_logs": []
    },
    "notes": "All steps passed successfully"
  }
}
```

---

## Issue Structure (Created on Failure)

When a test fails, an `issue` field is added with detailed bug report.
Do **not** create issues for `skipped` or `blocked` tests unless a real product bug was observed.

```json
{
  "id": "TC-AUTH-001",
  "execution": { ... },
  "issue": {
    "id": "ISSUE-TC-AUTH-001",
    "title": "Login fails with valid credentials - returns 500 error",
    "severity": "critical | high | medium | low",
    "type": "bug | regression | ux | performance | security",
    "status": "open",
    "created_at": "2026-01-31T10:00:00Z",
    
    "summary": "Brief 1-2 sentence description of the issue",
    
    "environment": {
      "url": "http://localhost:3000",
      "browser": "Chrome 120",
      "os": "macOS",
      "timestamp": "2026-01-31T10:00:00Z"
    },
    
    "reproduction_steps": [
      "1. Navigate to http://localhost:3000/en/login-clerk",
      "2. Enter valid email: test@example.com",
      "3. Enter valid password: TestPass123",
      "4. Click Sign In button"
    ],
    
    "expected_behavior": "User should be redirected to dashboard with authenticated session",
    
    "actual_behavior": "Page shows 500 Internal Server Error. Console shows: 'TypeError: Cannot read property userId of undefined'",
    
    "evidence": {
      "screenshots": [".ralph-test-execute/evidence/ISSUE-TC-AUTH-001-failure.png"],
      "console_errors": ["TypeError: Cannot read property userId of undefined at AuthHandler.ts:45"],
      "network_logs": [
        {
          "url": "/api/auth/callback",
          "method": "POST",
          "status": 500,
          "response": {"error": "Internal Server Error"}
        }
      ],
      "stack_trace": "Error at AuthHandler.ts:45\n  at processAuth() ...",
      "video_url": null
    },
    
    "root_cause_hypothesis": "The auth callback handler is not checking for null userId before accessing it. Likely a race condition where session isn't fully established.",
    
    "affected_files": [
      "apps/nextjs/src/app/api/auth/callback/route.ts",
      "apps/nextjs/src/lib/with-auth.ts"
    ],
    
    "related_test_cases": ["TC-AUTH-002", "TC-AUTH-003"],
    
    "tags": ["auth", "login", "server-error", "blocking"],
    
    "notes": "This blocks all authenticated test cases. Investigate auth flow urgently."
  }
}
```

---

## Issue Severity Guidelines

| Severity | Criteria | Examples |
|----------|----------|----------|
| **critical** | Core functionality broken, no workaround | Login fails, generation crashes, export produces corrupt files |
| **high** | Important feature broken, has workaround | Save fails intermittently, style changes don't persist |
| **medium** | Feature impaired but usable | UI glitch, slow performance, minor validation issue |
| **low** | Cosmetic or edge case | Typo, alignment issue, rare edge case |

---

## Issue Types

| Type | Description |
|------|-------------|
| **bug** | Functionality doesn't work as specified |
| **regression** | Previously working feature now broken |
| **ux** | Confusing or poor user experience |
| **performance** | Slow, unresponsive, or resource-intensive |
| **security** | Auth bypass, data exposure, injection vulnerability |

---

## File Structure

```
.ralph-test-execute/
├── PRD.md           # This file - framework documentation
├── prompt.md        # Agent prompt for test execution
├── ralph.sh         # Wrapper script
├── knowledge.md     # Agent learnings during execution
├── progress.md      # Execution progress tracking
├── evidence/        # Screenshots and logs
│   ├── TC-AUTH-001-step1.png
│   └── ...
└── reports/         # Generated reports
    └── execution-report.md
```

---

## Test Categories & Execution Methods

| Category | Execution Method | Tools Used |
|----------|-----------------|------------|
| **api** | HTTP requests | curl, fetch MCP |
| **frontend** | Browser automation | Chrome DevTools MCP |
| **e2e** | Full user journey | Browser + API |
| **security** | Auth/isolation tests | API + Browser |
| **database** | Data integrity | API verification |
| **integration** | Multi-component | Mixed tools |

---

## Execution Status Values

| Status | Meaning |
|--------|---------|
| **passed** | All steps completed, all acceptance criteria met |
| **failed** | One or more steps failed or criteria not met |
| **skipped** | Test skipped due to unmet preconditions |
| **blocked** | Test blocked by environment issue |

---

## Priority Execution Order

Tests are executed in priority order:

1. **critical** - Core features that must work
2. **high** - Important features
3. **medium** - Secondary features
4. **low** - Edge cases, nice-to-have

---

## Environment Requirements

Before execution begins:

- [ ] Dev server running (`bun dev`)
- [ ] Database seeded with test data
- [ ] Authentication token available for protected tests
- [ ] Chrome browser accessible via DevTools MCP
- [ ] Screenshot directory writable

---

## Completion Criteria

Execution is complete when:
- All test cases have been executed
- Results are recorded in tests.json with `execution` field
- **Issues created for ALL failed tests** with `issue` field
- Evidence (screenshots, logs) captured for failed tests
- Execution report generated in progress.md with issue summary

---

## Issue Tracking Summary

After execution, you can query issues from tests.json:

```bash
# Count total issues
jq '[.test_cases[] | select(.issue != null)] | length' .ralph-test/tests.json

# List critical issues
jq '.test_cases[] | select(.issue.severity == "critical") | {id: .issue.id, title: .issue.title}' .ralph-test/tests.json

# Issues by module
jq 'group_by(.module) | map({module: .[0].module, issues: [.[] | select(.issue != null)] | length})' .ralph-test/tests.json
```

---

*Test Execution Framework Version: 1.0*
*Application: QuickCarousals*
