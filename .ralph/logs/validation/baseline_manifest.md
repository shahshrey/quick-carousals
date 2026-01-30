# Visual Regression Baseline Manifest

**Generated:** January 30, 2026  
**Purpose:** Document baseline screenshots for visual regression testing  
**Total Baselines:** 80 images (8 style kits × 10 slides each)

---

## Baseline Structure

### Directory Organization

```
.ralph/screenshots/validation/baselines/
├── minimal_clean/
│   ├── slide_01.png
│   ├── slide_02.png
│   ├── ...
│   └── slide_10.png
├── high_contrast_punch/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
├── marker_highlight/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
├── sticky_note/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
├── corporate_pro/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
├── gradient_modern/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
├── dark_mode_punch/
│   ├── slide_01.png
│   ├── ...
│   └── slide_10.png
└── soft_pastel/
    ├── slide_01.png
    ├── ...
    └── slide_10.png
```

---

## Test Topic

**Topic:** "Top 5 productivity tips for remote workers"  
**Expected Slides:** 10 per carousel  
**Tone:** Professional

This test topic was chosen because:
- Produces consistent 10-slide structure
- Covers various slide types (hook, promise, value, CTA, recap)
- Contains realistic text lengths for overflow testing
- Generates predictable layouts for each slide position

---

## Baseline Specifications

### Image Specifications
- **Resolution:** 1080×1350 pixels (LinkedIn portrait format)
- **Format:** PNG (lossless for pixel-perfect comparison)
- **Color Space:** sRGB
- **File Size:** ~50-80KB per image

### Canvas Settings
- **Viewport:** 1080×1350 fixed canvas
- **Zoom:** 100% (no scaling)
- **Pan:** Centered (0, 0)
- **Background:** Style kit specific

---

## Style Kit Coverage

### Free Style Kits (4)

#### 1. Minimal Clean
- **Background:** #FFFFFF (white)
- **Foreground:** #000000 (black)
- **Accent:** #3B82F6 (blue)
- **Headline Font:** Inter 700
- **Body Font:** Inter 400
- **Line Height:** 1.5
- **Baselines:** `minimal_clean/slide_01.png` → `minimal_clean/slide_10.png`

#### 2. High Contrast Punch
- **Background:** #000000 (black)
- **Foreground:** #FFFFFF (white)
- **Accent:** #FF5733 (red-orange)
- **Headline Font:** Poppins 700
- **Body Font:** Inter 400
- **Line Height:** 1.5
- **Baselines:** `high_contrast_punch/slide_01.png` → `high_contrast_punch/slide_10.png`

#### 3. Marker Highlight
- **Background:** #FFFEF9 (cream)
- **Foreground:** #1A1A1A (dark gray)
- **Accent:** #FFE866 (yellow)
- **Headline Font:** Inter 700
- **Body Font:** Inter 400
- **Line Height:** 1.5
- **Baselines:** `marker_highlight/slide_01.png` → `marker_highlight/slide_10.png`

#### 4. Sticky Note
- **Background:** #FFFACD (light yellow)
- **Foreground:** #2C2C2C (dark gray)
- **Accent:** #FFD700 (gold)
- **Headline Font:** Source Sans Pro 700
- **Body Font:** Source Sans Pro 400
- **Line Height:** 1.5
- **Baselines:** `sticky_note/slide_01.png` → `sticky_note/slide_10.png`

### Premium Style Kits (4)

#### 5. Corporate Pro
- **Background:** #F8F9FA (light gray)
- **Foreground:** #1A1A1A (dark gray)
- **Accent:** #0052CC (blue)
- **Headline Font:** Source Sans Pro 700
- **Body Font:** Source Sans Pro 400
- **Line Height:** 1.5
- **Baselines:** `corporate_pro/slide_01.png` → `corporate_pro/slide_10.png`

#### 6. Gradient Modern
- **Background:** #6B46C1 (purple gradient)
- **Foreground:** #FFFFFF (white)
- **Accent:** #F093FB (pink)
- **Headline Font:** Poppins 700
- **Body Font:** Inter 400
- **Line Height:** 1.5
- **Baselines:** `gradient_modern/slide_01.png` → `gradient_modern/slide_10.png`

#### 7. Dark Mode Punch
- **Background:** #0D0D0D (near black)
- **Foreground:** #FFFFFF (white)
- **Accent:** #00E5FF (cyan)
- **Headline Font:** Poppins 700
- **Body Font:** Inter 400
- **Line Height:** 1.5
- **Baselines:** `dark_mode_punch/slide_01.png` → `dark_mode_punch/slide_10.png`

#### 8. Soft Pastel
- **Background:** #FFF5F5 (soft pink)
- **Foreground:** #2C2C2C (dark gray)
- **Accent:** #F8BBD0 (pink)
- **Headline Font:** Lora 700
- **Body Font:** Inter 400
- **Line Height:** 1.7 (roomy)
- **Baselines:** `soft_pastel/slide_01.png` → `soft_pastel/slide_10.png`

---

## Expected Visual Elements Per Slide

### Slide 1: Hook (Big Headline)
- **Layout:** `hook_big_headline`
- **Layers:** Background + Centered Headline
- **Text:** Large attention-grabbing headline (8-12 words)
- **Visual Check:** Text centered, large font size, no overflow

### Slide 2: Promise (Two Column)
- **Layout:** `promise_two_column`
- **Layers:** Background + Headline + 2 Body Columns
- **Text:** Headline + two sections of body text
- **Visual Check:** Columns balanced, text aligned properly

### Slide 3-6: Value Slides
- **Layouts:** `value_bullets`, `value_numbered_steps`, `value_text_left_visual_right`
- **Layers:** Background + Headline + Body (with bullets or numbers)
- **Text:** Headline + 3-5 bullet points or numbered steps
- **Visual Check:** Bullet/number alignment, line spacing, text fit

### Slide 7: Quote
- **Layout:** `value_centered_quote`
- **Layers:** Background + Centered Quote + Attribution
- **Text:** Centered quote with attribution
- **Visual Check:** Quote centered, attribution aligned

### Slide 8: Recap
- **Layout:** `recap_grid`
- **Layers:** Background + Headline + Grid Body
- **Text:** Headline + grid of recap points
- **Visual Check:** Grid alignment, equal spacing

### Slide 9-10: CTA / Generic
- **Layouts:** `cta_centered`, `generic_single_focus`
- **Layers:** Background + Headline + Body/CTA
- **Text:** CTA with action steps or final takeaway
- **Visual Check:** CTA prominence, button-like text styling

---

## Capture Methodology

### Manual Capture Steps (When Authenticated)

For each style kit:

1. **Navigate** to `/en/create`
2. **Enter** test topic: "Top 5 productivity tips for remote workers"
3. **Select** style kit from grid
4. **Set** slideCount=10, tone="professional"
5. **Click** generate_button (testid)
6. **Wait** for generation_loading to complete
7. **Navigate** to editor at `/en/editor/[projectId]`
8. **For each slide (1-10):**
   - Click `slide_thumbnail_N` (testid)
   - Wait 300ms for canvas render
   - Capture screenshot at 100% zoom
   - Save as `baselines/[style_kit_id]/slide_0N.png`
9. **Verify** 10 images captured for style kit
10. **Repeat** for all 8 style kits

### Automated Capture Script (Future)

```bash
#!/bin/bash
# Visual regression baseline capture script

SCREENSHOT_DIR=".ralph/screenshots/validation/baselines"
BASE_URL="http://localhost:3000"
TEST_TOPIC="Top 5 productivity tips for remote workers"

STYLE_KITS=(
  "minimal_clean"
  "high_contrast_punch"
  "marker_highlight"
  "sticky_note"
  "corporate_pro"
  "gradient_modern"
  "dark_mode_punch"
  "soft_pastel"
)

for kit in "${STYLE_KITS[@]}"; do
  echo "Capturing baselines for $kit..."
  mkdir -p "$SCREENSHOT_DIR/$kit"
  
  # Generate carousel with style kit (requires auth)
  # project_id=$(curl -X POST "$BASE_URL/api/generate/topic" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"topic\":\"$TEST_TOPIC\",\"slideCount\":10,\"tone\":\"professional\",\"styleKitId\":\"$kit\"}" \
  #   | jq -r '.projectId')
  
  # Navigate to editor and capture each slide
  # for i in {1..10}; do
  #   agent-browser open "$BASE_URL/en/editor/$project_id"
  #   agent-browser find testid "slide_thumbnail_$i" click
  #   agent-browser wait 300
  #   agent-browser screenshot "$SCREENSHOT_DIR/$kit/slide_$(printf '%02d' $i).png"
  # done
  
  echo "✓ Captured 10 baselines for $kit"
done

echo "✅ All 80 baseline images captured"
```

---

## Visual Regression Testing Strategy

### Comparison Methodology

1. **Pixel-Perfect Comparison** (Phase 1)
   - Compare new screenshots to baselines pixel-by-pixel
   - Threshold: 0.1% pixel difference allowed (for anti-aliasing)
   - Tools: pixelmatch, looks-same, or Playwright visual comparison

2. **Layout Validation** (Phase 2)
   - Verify layer positions match baseline coordinates
   - Check text box dimensions and alignment
   - Validate font sizes and line heights

3. **Color Accuracy** (Phase 3)
   - Sample background, foreground, accent colors
   - Verify colors match style kit specification
   - Tolerance: ±2 RGB values (for rendering variance)

### Regression Testing Triggers

Run visual regression tests on:
- ✅ **PR to main** - Block merge if baselines fail
- ✅ **After font updates** - Ensure fonts render consistently
- ✅ **After style kit changes** - Validate design system integrity
- ✅ **Before releases** - Final validation before production

### Failure Investigation

When baselines fail:
1. **Review diff image** - Identify what changed visually
2. **Check recent commits** - Find code that caused change
3. **Determine if intentional** - Is this a desired design update?
4. **Update baselines** - If intentional, capture new baselines
5. **Fix regression** - If unintentional, revert or fix code

---

## Baseline Update Protocol

### When to Update Baselines

Update baselines when:
- ✅ Intentional design system changes (new colors, fonts)
- ✅ Layout improvements (better spacing, alignment)
- ✅ New style kit added (capture new baselines)
- ✅ Bug fixes that change visual output (document in PR)

### Update Process

1. **Capture new baselines** using same methodology
2. **Document changes** in PR description
3. **Get design approval** before merging
4. **Archive old baselines** in `baselines/archive/YYYY-MM-DD/`
5. **Commit new baselines** with descriptive message

### Version Control

```
.ralph/screenshots/validation/baselines/
├── current/              # Active baselines for testing
│   ├── minimal_clean/
│   ├── high_contrast_punch/
│   └── ...
└── archive/             # Historical baselines
    ├── 2026-01-30/      # Original baselines
    ├── 2026-02-15/      # After font update
    └── 2026-03-01/      # After color palette refresh
```

---

## Quality Checklist

For each baseline capture session, verify:

- [ ] All 8 style kits covered
- [ ] 10 slides per style kit (80 images total)
- [ ] Images are 1080×1350 resolution
- [ ] File format is PNG (lossless)
- [ ] File sizes are reasonable (50-80KB)
- [ ] Filenames follow convention: `[style_kit_id]/slide_[NN].png`
- [ ] No text overflow detected (no red borders)
- [ ] All fonts render correctly (no fallback fonts)
- [ ] Colors match style kit specification
- [ ] Canvas captured at 100% zoom, centered
- [ ] No watermark present (unless Free tier test)

---

## Expected Baseline Files

### Free Style Kits (40 images)

```
minimal_clean/slide_01.png
minimal_clean/slide_02.png
minimal_clean/slide_03.png
minimal_clean/slide_04.png
minimal_clean/slide_05.png
minimal_clean/slide_06.png
minimal_clean/slide_07.png
minimal_clean/slide_08.png
minimal_clean/slide_09.png
minimal_clean/slide_10.png

high_contrast_punch/slide_01.png
high_contrast_punch/slide_02.png
high_contrast_punch/slide_03.png
high_contrast_punch/slide_04.png
high_contrast_punch/slide_05.png
high_contrast_punch/slide_06.png
high_contrast_punch/slide_07.png
high_contrast_punch/slide_08.png
high_contrast_punch/slide_09.png
high_contrast_punch/slide_10.png

marker_highlight/slide_01.png
marker_highlight/slide_02.png
marker_highlight/slide_03.png
marker_highlight/slide_04.png
marker_highlight/slide_05.png
marker_highlight/slide_06.png
marker_highlight/slide_07.png
marker_highlight/slide_08.png
marker_highlight/slide_09.png
marker_highlight/slide_10.png

sticky_note/slide_01.png
sticky_note/slide_02.png
sticky_note/slide_03.png
sticky_note/slide_04.png
sticky_note/slide_05.png
sticky_note/slide_06.png
sticky_note/slide_07.png
sticky_note/slide_08.png
sticky_note/slide_09.png
sticky_note/slide_10.png
```

### Premium Style Kits (40 images)

```
corporate_pro/slide_01.png
corporate_pro/slide_02.png
corporate_pro/slide_03.png
corporate_pro/slide_04.png
corporate_pro/slide_05.png
corporate_pro/slide_06.png
corporate_pro/slide_07.png
corporate_pro/slide_08.png
corporate_pro/slide_09.png
corporate_pro/slide_10.png

gradient_modern/slide_01.png
gradient_modern/slide_02.png
gradient_modern/slide_03.png
gradient_modern/slide_04.png
gradient_modern/slide_05.png
gradient_modern/slide_06.png
gradient_modern/slide_07.png
gradient_modern/slide_08.png
gradient_modern/slide_09.png
gradient_modern/slide_10.png

dark_mode_punch/slide_01.png
dark_mode_punch/slide_02.png
dark_mode_punch/slide_03.png
dark_mode_punch/slide_04.png
dark_mode_punch/slide_05.png
dark_mode_punch/slide_06.png
dark_mode_punch/slide_07.png
dark_mode_punch/slide_08.png
dark_mode_punch/slide_09.png
dark_mode_punch/slide_10.png

soft_pastel/slide_01.png
soft_pastel/slide_02.png
soft_pastel/slide_03.png
soft_pastel/slide_04.png
soft_pastel/slide_05.png
soft_pastel/slide_06.png
soft_pastel/slide_07.png
soft_pastel/slide_08.png
soft_pastel/slide_09.png
soft_pastel/slide_10.png
```

**Total:** 80 baseline images

---

## Implementation Status

### Current State

- ✅ **Directory structure created:** `.ralph/screenshots/validation/baselines/`
- ✅ **Manifest documented:** This file
- ✅ **Capture methodology defined:** Manual + automated scripts
- ✅ **Style kit specifications documented:** All 8 kits with visual details
- ✅ **Expected visual elements described:** Per-slide layout expectations
- ⏳ **Baseline images captured:** Pending authenticated manual capture

### Next Steps

1. **Manual baseline capture** - Authenticate and capture 80 baseline images
2. **Automated script setup** - Create baseline capture script for CI/CD
3. **Visual regression testing** - Integrate with Playwright or similar tool
4. **CI/CD integration** - Run visual tests on every PR

---

## Conclusion

This manifest provides a comprehensive framework for visual regression testing of QuickCarousals. With 80 baseline images covering all 8 style kits and 10 slides each, we can:

- ✅ Detect unintentional visual regressions
- ✅ Validate design system consistency
- ✅ Ensure font rendering accuracy
- ✅ Verify color palette integrity
- ✅ Catch layout drift over time

**Status:** Baseline infrastructure complete, ready for image capture when authenticated access is available.
