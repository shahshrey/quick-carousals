
---
## Iteration 15 - Auto-Save Hook

**Files analyzed**:
- apps/nextjs/src/hooks/use-auto-save.ts (106 lines)
- apps/nextjs/src/hooks/use-auto-save.test.ts (291 lines) - Existing automated tests

**Test cases created**: 8 (TC-AUTOSAVE-001 through TC-AUTOSAVE-008)

**Key business logic discovered**:
- **Debounce Mechanism**: 500ms default debounce delay prevents excessive API calls during rapid editing
- **Save Function**: save(data) queues save operation, clearTimeout cancels previous if new change comes within debounce window
- **Perform Save**: performSave() executes actual API call after debounce period expires
- **Status Management**: Four states - 'idle' (no recent activity), 'saving' (API call in progress), 'saved' (success), 'error' (failure)
- **Custom Save Support**: Optional onSave callback allows custom save logic (editor uses this for bulk slide updates)
- **Enabled Flag**: enabled=false disables all saves (useful for test/demo modes, test page uses this)
- **ProjectId Guard**: performSave returns early if projectId is missing, prevents invalid API calls
- **Default API Call**: PATCH /api/projects/:id with JSON body if no custom onSave provided
- **Error Handling**: Catches API errors and network failures, sets error state with user-friendly message
- **Cleanup**: useEffect cleanup clears pending timeout on unmount, prevents memory leaks and orphaned API calls

**Potential bugs noticed**:
1. **No Visual Feedback for Unsaved Changes**: If user navigates away during debounce window (before save triggers), changes are lost silently. No warning dialog or confirmation prompt.
2. **No Offline Support**: If user is offline during save attempt, error is shown but no retry queue or offline storage fallback exists.
3. **No Conflict Resolution**: If two users edit same project simultaneously, last save wins (no optimistic locking or conflict detection).
4. **Status Doesn't Auto-Reset**: 'Saved' status persists indefinitely until next change. Could confuse users who expect it to fade after a few seconds.
5. **No Save Queue for Rapid Navigation**: If user navigates between multiple projects rapidly, pending saves might be lost without being flushed.
6. **Error Message Not User-Actionable**: Error message is generic ("Failed to save changes"). Doesn't tell user what to do (e.g., "Check your internet connection", "Try refreshing the page").

**Patterns for other modules**:
- **Debounce Hook Pattern**: useAutoSave is reusable pattern for any auto-save scenario - could be used for auto-saving user preferences, draft emails, etc.
- **Custom Callback Pattern**: Optional onSave allows flexibility while providing sensible default (PATCH endpoint)
- **Status Enum Pattern**: Four-state enum (idle, saving, saved, error) is clean, predictable pattern for async operations
- **Cleanup Pattern**: useEffect cleanup with timeout clearing prevents memory leaks - good pattern for any timer-based hooks
- **Ref for Pending Data**: pendingDataRef stores latest data without re-rendering, ensures correct data saved even if component re-renders
- **Early Return Pattern**: Multiple guard clauses (!enabled, !projectId) prevent unnecessary work

**Codebase patterns discovered**:
- **Hook Return Type**: Explicit interface (UseAutoSaveReturn) with status, save function, error
- **Options Interface**: UseAutoSaveOptions with optional fields and defaults (debounceMs=500, enabled=true)
- **useCallback for Stable Identity**: save function wrapped in useCallback with deps, prevents unnecessary re-renders in parent
- **setTimeout + clearTimeout**: Classic debounce implementation with timeoutRef to track pending timer
- **Status State Machine**: setStatus calls transition through idle → saving → saved/error states
- **Error State with Message**: Separate error state (string | null) provides context for failures
- **Async Error Handling**: try-catch with specific error extraction from response.json()
- **console.error for Debugging**: Line 85 logs errors to console for developer debugging (should also send to error tracking service in production)

**Additional insights**:
- Auto-save is CRITICAL for editor UX - prevents data loss, builds user trust
- 500ms debounce is well-tuned balance between responsiveness and API efficiency
- Existing automated tests (use-auto-save.test.ts) are comprehensive with 8 test suites covering debouncing, status, errors, custom save, enabled flag
- Hook is used by editor page (lines 55-60 in editor/[id]/page.tsx) with custom onSave for bulk slide updates
- Test page (/editor/test) uses enabled=false to prevent saving demo data
- Status indicator must be rendered by parent component - hook only manages state
- Hook is stateful (useState for status, error) but save function is callback-only (doesn't return promise)
- No built-in retry logic - user must make another change to trigger new save attempt
- No save confirmation UI - user must trust status indicator
- performSave is NOT exposed in return value, only save() function is public
---
