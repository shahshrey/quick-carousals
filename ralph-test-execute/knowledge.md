# Test Execution Knowledge Base

> Accumulated learnings from test execution sessions.

## Environment Setup

### Dev Server
- Start with: `cd apps/nextjs && bun dev`
- Health check: `curl -s http://localhost:3000/api/health`
- Wait ~10 seconds for full startup

### Database
- Uses Prisma + PostgreSQL
- Seed data required for most tests
- Run `cd packages/db && bun db:push` if schema issues

### Authentication
- Uses Clerk for auth
- Protected endpoints require Bearer token
- Get token from Clerk session after login

## Browser Automation

### Chrome DevTools MCP (`user-chrome-devtools`)
- **Server name:** `user-chrome-devtools`
- Always take `take_snapshot` first to get element `uid` values
- Use `uid` (not ref) for click, fill, and other element interactions
- `wait_for` waits for specific text to appear on page

### Key Tools:
| Tool | Purpose | Key Args |
|------|---------|----------|
| `navigate_page` | Go to URL | `type: "url"`, `url: "..."` |
| `take_snapshot` | Get page elements with uid | `verbose: false` |
| `take_screenshot` | Capture page image | `filePath: "path/to/file.png"` |
| `click` | Click element | `uid: "from_snapshot"` |
| `fill` | Type into input | `uid`, `value` |
| `wait_for` | Wait for text | `text`, `timeout` |
| `list_console_messages` | Check console | `types: ["error", "warn"]` |
| `list_network_requests` | Check API calls | `resourceTypes: ["xhr", "fetch"]` |

### Screenshot Evidence
- Save to `ralph-test-execute/evidence/`
- Naming: `{test_id}-{description}.png`
- Always capture on failure
- Use `filePath` arg in `take_screenshot` to save directly

## API Testing

### Common Patterns
```bash
# Health check
curl -s "$BASE_URL/api/health"

# Authenticated request
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/projects"

# POST with JSON
curl -s -X POST "$BASE_URL/api/endpoint" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

### Expected Status Codes
- 200: Success (GET, PUT, DELETE)
- 201: Created (POST)
- 400: Validation error
- 401: Unauthorized
- 404: Not found
- 429: Rate limited
- 500: Server error

## Patterns and Insights

---

