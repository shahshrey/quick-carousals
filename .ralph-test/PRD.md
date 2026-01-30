# QuickCarousals - Test Discovery Framework

## Overview

This Ralph loop is for **test case discovery only**. The agent analyzes source code and creates comprehensive manual test cases from a **business analyst perspective**.

**Philosophy:** "Understand the business logic, define what correct behavior looks like"

**This loop does NOT:**
- Execute tests
- Mark tests as pass/fail
- Run the application
- Interact with browsers or APIs

**This loop DOES:**
- Read source code files
- Understand business logic and user flows
- Create detailed test case definitions
- Document acceptance criteria (ideal state)

---

## Discovery Process

For each module:

1. **Read source files** listed in the task
2. **Understand business logic** - What does this code do for users?
3. **Identify test scenarios** - Happy paths, errors, edge cases
4. **Write test cases** - Detailed steps and acceptance criteria
5. **Add to tests.json** - Structured test definitions
6. **Mark task complete** - Move to next module

---

## Test Case Structure

```json
{
  "id": "TC-AUTH-001",
  "name": "User can login with valid credentials",
  "module": "auth",
  "category": "frontend",
  "type": "happy_path",
  "priority": "critical",
  "description": "Validates the login flow works correctly",
  "business_context": "Users must be able to access their accounts",
  "preconditions": [
    "User has a registered account",
    "User is on the login page"
  ],
  "steps": [
    {
      "step": 1,
      "action": "Enter valid email in email field",
      "expected": "Email is accepted, no validation error"
    },
    {
      "step": 2,
      "action": "Enter valid password in password field",
      "expected": "Password field accepts input (masked)"
    },
    {
      "step": 3,
      "action": "Click the Sign In button",
      "expected": "User is redirected to dashboard"
    }
  ],
  "acceptance_criteria": [
    "Login completes within 3 seconds",
    "User lands on dashboard with their projects",
    "User's name appears in the navigation",
    "No error messages displayed"
  ],
  "related_files": [
    "apps/nextjs/src/app/[lang]/(auth)/login-clerk/[[...rest]]/page.tsx"
  ],
  "tags": ["auth", "login", "core"]
}
```

---

## File Structure

```
.ralph-test/
├── PRD.md           # This file - framework documentation
├── prompt.md        # Agent prompt for test discovery
├── tasks.json       # Discovery tasks (modules to analyze)
├── tests.json       # Test cases (populated by agent)
├── knowledge.md     # Agent learnings during discovery
├── progress.md      # Discovery progress tracking
└── ralph.sh         # Wrapper script
```

---

## Test Categories

| Category | Description |
|----------|-------------|
| **api** | API endpoint behavior |
| **frontend** | UI rendering and interactions |
| **database** | Data integrity and relationships |
| **integration** | Multi-component flows |
| **e2e** | Complete user journeys |
| **security** | Auth and data isolation |
| **performance** | Speed and responsiveness |

---

## Priority Guidelines

| Priority | Use For |
|----------|---------|
| **critical** | Core features - auth, generation, export |
| **high** | Important features - editing, style switching |
| **medium** | Secondary features - settings, polish |
| **low** | Edge cases, admin features |

---

## Coverage Goals

| Area | Target Test Cases |
|------|-------------------|
| Authentication | 5+ |
| Generation APIs | 10+ |
| Editor | 15+ |
| Export | 8+ |
| Projects | 8+ |
| Billing | 6+ |
| User Journeys | 10+ |
| Security | 5+ |
| **Total** | **100+** |

---

## Completion Criteria

Discovery is complete when:
- All 25 tasks in tasks.json are marked `"passes": true`
- 100+ test cases exist in tests.json
- All modules have `status: "analyzed"`
- All user journeys are mapped

---

*Test Discovery Framework Version: 1.0*
*Application: QuickCarousals*
