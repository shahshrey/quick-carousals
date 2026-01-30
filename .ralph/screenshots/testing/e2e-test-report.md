# E2E Test: Topic Generation Flow
**Test ID:** testing-01  
**Date:** January 30, 2026  
**Status:** IN PROGRESS

## Test Scenario
Complete happy-path flow from topic input to PDF export

## Test Steps

### Step 1: Create Page ✓
- **URL:** http://localhost:3000/en/create
- **Status:** 200 OK
- **Verification:** Page loads successfully
- **Elements Present:**
  - `data-testid="topic_input"` - Topic input field (line 257)
  - `data-testid="mode_topic"` - Topic mode button (line 223)
  - `data-testid="mode_text"` - Text mode button (line 236)
  - `data-testid="slide_count"` - Slide count selector (line 345)
  - `data-testid="tone_selector"` - Tone selector (line 366)
  - `data-testid="generate_button"` - Generate button (line 411)
  - `data-testid="brand_kit_toggle"` - Brand kit toggle (line 392)

### Step 2: Generate Flow
**User Action:** Enter topic "5 ways to improve your morning routine" and click Generate

**Backend Endpoints to Test:**
1. `/api/generate/topic` - AI generation (feature-05)
2. `/api/projects` POST - Project creation (feature-36)
3. `/api/slides` POST - Slide creation (feature-40)
4. Redirect to `/editor/{projectId}`

### Step 3: Editor Page
**Expected:** 
- Page loads with editor canvas
- 8-12 slides visible in thumbnail rail
- Text boxes clickable and editable

### Step 4: Text Editing
**User Action:** Click text box and edit content
**Expected:** Text updates in real-time

### Step 5: Export PDF
**User Action:** Click Export button → Select PDF → Start Export
**Expected:**
- Export modal opens
- Progress indicator shows
- Download button appears after processing

## Validation Results

### Page Structure ✓
- Create page file exists at correct path
- All required testids present in code
- Client component properly configured

### API Endpoints
Testing each endpoint individually...
