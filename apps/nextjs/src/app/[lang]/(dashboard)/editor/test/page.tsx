'use client';

import { useState, useEffect } from 'react';
import { EditorCanvas, ThumbnailRail, StyleKitSelector, ThemeControls, LayoutVariantSelector, ExportModal } from '~/components/editor';
import type { SlideData, StyleKit, LayersBlueprint, ExportOptions } from '~/components/editor';
import { useAutoSave } from '~/hooks/use-auto-save';

// Sample style kit (Minimal Clean)
const minimalCleanStyleKit = {
  id: 'minimal_clean',
  name: 'Minimal Clean',
  typography: {
    headline_font: 'Inter',
    headline_weight: 700,
    body_font: 'Inter',
    body_weight: 400,
  },
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    accent: '#000000',
  },
  spacingRules: {
    padding: 'normal' as const,
    line_height: 1.5,
  },
  isPremium: false,
};

// Sample slides with different layouts
const sampleSlides: SlideData[] = [
  // Slide 1: Hook - Big Headline
  {
    layoutId: 'hook_big_headline',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 400, width: 960, height: 400 },
          constraints: { max_font: 72, min_font: 48, max_lines: 3 },
        },
      ],
    },
    content: {
      headline: '5 Mistakes That Kill Your LinkedIn Reach',
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 2: Promise - Two Column
  {
    layoutId: 'promise_two_column',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body_left',
          type: 'text_box',
          position: { x: 60, y: 280, width: 450, height: 900 },
          constraints: { max_font: 24, min_font: 18, max_lines: 8 },
        },
        {
          id: 'body_right',
          type: 'text_box',
          position: { x: 570, y: 280, width: 450, height: 900 },
          constraints: { max_font: 24, min_font: 18, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: "Here's What You'll Learn",
      body_left: "How to write hooks that stop the scroll\n\nWhy engagement pods hurt you\n\nThe 80/20 rule of LinkedIn",
      body_right: "How to optimize posting times\n\nThe algorithm change in 2024\n\nWhat format performs best",
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 3: Value - Bullets
  {
    layoutId: 'value_bullets',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body',
          type: 'text_box',
          bulletStyle: 'disc',
          position: { x: 60, y: 280, width: 960, height: 900 },
          constraints: { max_font: 28, min_font: 20, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: 'Mistake #1: Weak Hooks',
      body: [
        'Your first line must stop the scroll',
        'Ask a provocative question',
        'Share a surprising stat',
        'Make a bold promise',
      ],
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 4: Value - Numbered Steps
  {
    layoutId: 'value_numbered_steps',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body',
          type: 'text_box',
          bulletStyle: 'numbered',
          position: { x: 60, y: 280, width: 960, height: 900 },
          constraints: { max_font: 28, min_font: 20, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: 'How to Write Better Hooks',
      body: [
        'Start with curiosity',
        'Use pattern interrupts',
        'Test 3 variations',
        'Analyze what works',
      ],
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 5: CTA - Centered
  {
    layoutId: 'cta_centered',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 400, width: 960, height: 300 },
          constraints: { max_font: 56, min_font: 40, max_lines: 3 },
        },
        {
          id: 'subtext',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 750, width: 960, height: 150 },
          constraints: { max_font: 28, min_font: 20, max_lines: 3 },
        },
        {
          id: 'footer',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 1100, width: 960, height: 100 },
          constraints: { max_font: 24, min_font: 18, max_lines: 2 },
        },
      ],
    },
    content: {
      headline: 'Ready to 10x Your LinkedIn Reach?',
      subtext: 'Follow for daily LinkedIn growth tips',
      footer: '@yourhandle',
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 6: Overflow test - Text that's too long and needs AI fixing
  {
    layoutId: 'hook_big_headline',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 400, width: 960, height: 200 },
          constraints: { max_font: 48, min_font: 24, max_lines: 3 },
        },
      ],
    },
    content: {
      headline: 'This is an extremely long headline that contains way too much text and will definitely overflow the text box boundaries causing the red border overflow indicator to appear which then triggers the Fix with AI button to show up',
    },
    styleKit: minimalCleanStyleKit,
  },
];

export default function EditorTestPage() {
  // Use state to manage editable slides
  const [slides, setSlides] = useState<SlideData[]>(sampleSlides);
  
  // Track active slide index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Track current style kit (start with minimal_clean)
  const [currentStyleKitId, setCurrentStyleKitId] = useState('minimal_clean');

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Mock project ID for testing (in real app, this would come from route params)
  const mockProjectId = 'test-project-123';

  // Auto-save hook with custom save function for test page
  const { status: saveStatus, save, error: saveError } = useAutoSave({
    projectId: mockProjectId,
    debounceMs: 500,
    enabled: true,
    // Custom save function for test page (logs instead of calling API)
    onSave: async (data) => {
      console.log('Auto-save triggered:', data);
      // In production, this would call PATCH /api/projects/:id
      // For test page, we just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
    },
  });

  // Trigger auto-save whenever slides change
  useEffect(() => {
    if (slides !== sampleSlides) { // Don't save initial state
      save({ slides });
    }
  }, [slides]);

  // Handle content change for a specific slide
  const handleContentChange = (slideIndex: number, layerId: string, content: string | string[]) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx === slideIndex) {
        return {
          ...slide,
          content: {
            ...slide.content,
            [layerId]: content,
          },
        };
      }
      return slide;
    }));
  };

  // Handle style kit change - update all slides
  const handleStyleKitChange = (newStyleKit: StyleKit) => {
    setCurrentStyleKitId(newStyleKit.id);
    setSlides(prev => prev.map(slide => ({
      ...slide,
      styleKit: newStyleKit,
    })));
  };

  // Handle theme controls update - update all slides with fine-tuned style kit
  const handleStyleKitUpdate = (updatedStyleKit: StyleKit) => {
    setSlides(prev => prev.map(slide => ({
      ...slide,
      styleKit: updatedStyleKit,
    })));
  };

  // Handle layout change for the active slide
  const handleLayoutChange = (layoutId: string, blueprint: LayersBlueprint) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx === activeSlideIndex) {
        // Preserve existing content that matches layer IDs in the new blueprint
        const newContent: { [key: string]: string | string[] } = {};
        
        blueprint.layers.forEach(layer => {
          if (layer.type === 'text_box' && layer.id) {
            // If the old slide has content for this layer ID, keep it
            if (slide.content[layer.id]) {
              newContent[layer.id] = slide.content[layer.id];
            } else {
              // Otherwise, provide placeholder content
              newContent[layer.id] = 'Click to edit';
            }
          }
        });

        return {
          ...slide,
          layoutId,
          blueprint,
          content: newContent,
        };
      }
      return slide;
    }));
  };

  // Add a new slide (copy of generic_single_focus layout)
  const handleAddSlide = () => {
    const newSlide: SlideData = {
      layoutId: 'generic_single_focus',
      blueprint: {
        layers: [
          { type: 'background', properties: {} },
          {
            id: 'headline',
            type: 'text_box',
            position: { x: 60, y: 100, width: 960, height: 150 },
            constraints: { max_font: 48, min_font: 32, max_lines: 3 },
          },
          {
            id: 'body',
            type: 'text_box',
            position: { x: 60, y: 300, width: 960, height: 800 },
            constraints: { max_font: 28, min_font: 20, max_lines: 12 },
          },
        ],
      },
      content: {
        headline: 'New Slide',
        body: 'Click to edit this text',
      },
      styleKit: minimalCleanStyleKit,
    };

    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length); // Switch to the new slide
  };

  // Duplicate the selected slide
  const handleDuplicateSlide = (index: number) => {
    const slideToDuplicate = slides[index];
    const duplicatedSlide: SlideData = {
      ...slideToDuplicate,
      content: { ...slideToDuplicate.content }, // Deep copy content
    };

    setSlides(prev => {
      const newSlides = [...prev];
      newSlides.splice(index + 1, 0, duplicatedSlide); // Insert after current slide
      return newSlides;
    });
    setActiveSlideIndex(index + 1); // Switch to the duplicated slide
  };

  // Delete the selected slide
  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return; // Don't delete the last slide

    setSlides(prev => prev.filter((_, idx) => idx !== index));
    
    // Adjust active slide index
    if (index === activeSlideIndex) {
      // If deleting active slide, move to previous or next
      setActiveSlideIndex(Math.max(0, index - 1));
    } else if (index < activeSlideIndex) {
      // If deleting before active slide, adjust index
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  // Reorder slides via drag-drop
  const handleSlideReorder = (fromIndex: number, toIndex: number) => {
    setSlides(prev => {
      const newSlides = [...prev];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);
      return newSlides;
    });

    // Update active slide index to follow the moved slide
    if (fromIndex === activeSlideIndex) {
      setActiveSlideIndex(toIndex);
    } else if (fromIndex < activeSlideIndex && toIndex >= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (fromIndex > activeSlideIndex && toIndex <= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  // Handle export
  const handleExport = async (options: ExportOptions): Promise<{ exportId: string; projectId: string }> => {
    console.log('Export with options:', options);
    
    // For testing purposes, simulate the export flow
    // In a real implementation, this would call POST /api/exports with a real projectId
    // Since this is a test page without a database project, we simulate the response
    
    // Generate mock export ID
    const mockExportId = `test-export-${Date.now()}`;
    const mockProjectId = 'test-project-id';
    
    // Simulate export status progression for testing
    // In real implementation, the worker would process the job
    setTimeout(() => {
      // Simulate status updates that the polling will detect
      console.log('Mock export processing...');
    }, 1000);
    
    return {
      exportId: mockExportId,
      projectId: mockProjectId,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-8">
        {/* Header with Save Indicator and Export Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Editor Canvas Test - Auto-Save
            </h1>
            <p className="mt-2 text-gray-600">
              Make changes to slides and watch the auto-save indicator. Changes are saved automatically after 500ms of inactivity.
            </p>
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Feature 37:</strong> Auto-save with 500ms debounce, save indicator showing saving/saved/error states.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Save Indicator */}
            <div 
              data-testid="save_indicator"
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm"
            >
              {saveStatus === 'saving' && (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-700">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-700">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">Error</span>
                </>
              )}
              {saveStatus === 'idle' && (
                <>
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  <span className="text-sm text-gray-500">Not saved</span>
                </>
              )}
            </div>
            <button
              data-testid="export_button"
              onClick={() => setIsExportModalOpen(true)}
              title="Export carousel (Cmd+E)"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 font-medium"
            >
              <span className="text-lg">📥</span>
              <span>Export</span>
              <span className="text-xs opacity-75 ml-1">⌘E</span>
            </button>
          </div>
        </div>

        {/* Editor with thumbnail rail and controls */}
        <div className="flex gap-6">
          {/* Thumbnail rail on the left */}
          <div className="w-[180px] flex-shrink-0">
            <ThumbnailRail
              slides={slides}
              activeSlideIndex={activeSlideIndex}
              onSlideSelect={setActiveSlideIndex}
              onSlideAdd={handleAddSlide}
              onSlideDuplicate={handleDuplicateSlide}
              onSlideDelete={handleDeleteSlide}
              onSlideReorder={handleSlideReorder}
            />
          </div>

          {/* Main canvas editor */}
          <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-lg">
            <EditorCanvas 
              slide={slides[activeSlideIndex]} 
              onContentChange={(layerId, content) => handleContentChange(activeSlideIndex, layerId, content)}
            />
          </div>

          {/* Controls panel on the right */}
          <div className="w-[340px] flex-shrink-0 space-y-5">
            {/* Style Kit Selector */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <h3 className="mb-4 text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span>🎨</span>
                Style Kit
              </h3>
              <StyleKitSelector
                currentStyleKitId={currentStyleKitId}
                onStyleKitChange={handleStyleKitChange}
              />
            </div>

            {/* Theme Controls */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <h3 className="mb-4 text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span>⚙️</span>
                Theme Controls
              </h3>
              <ThemeControls
                styleKit={slides[activeSlideIndex].styleKit}
                onStyleKitUpdate={handleStyleKitUpdate}
              />
            </div>

            {/* Layout Variant Selector */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <h3 className="mb-4 text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span>📐</span>
                Layout Variant
              </h3>
              <LayoutVariantSelector
                currentSlide={slides[activeSlideIndex]}
                onLayoutChange={handleLayoutChange}
              />
            </div>

            {/* Slide info */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md border border-blue-100">
              <h3 className="mb-4 text-sm font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                <span>📄</span>
                Active Slide
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Slide:</span>
                  <span className="font-semibold text-gray-900">{activeSlideIndex + 1} of {slides.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Layout:</span>
                  <span className="font-medium text-gray-800 text-xs">{slides[activeSlideIndex].layoutId}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Layers:</span>
                  <span className="font-semibold text-gray-900">{slides[activeSlideIndex].blueprint.layers.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Text Boxes:</span>
                  <span className="font-semibold text-gray-900">
                    {slides[activeSlideIndex].blueprint.layers.filter(l => l.type === 'text_box').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-md border border-purple-100">
              <h3 className="mb-4 text-sm font-bold text-purple-900 uppercase tracking-wide flex items-center gap-2">
                <span>⌨️</span>
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Export</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd+E</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Save</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd+S</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Duplicate</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd+D</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Delete</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Delete</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Zoom In</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd++</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Zoom Out</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd+-</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-gray-600">Fit Screen</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-gray-700">Cmd+0</kbd>
                </div>
              </div>
            </div>

            {/* Current style kit info */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-gray-100">
              <h3 className="mb-4 text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span>🎯</span>
                Current Style
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-xs">Kit</span>
                  <p className="font-semibold text-gray-900">{slides[activeSlideIndex].styleKit.name}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-xs">Headline</span>
                  <p className="font-medium text-gray-800">{slides[activeSlideIndex].styleKit.typography.headline_font} {slides[activeSlideIndex].styleKit.typography.headline_weight}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-xs">Body</span>
                  <p className="font-medium text-gray-800">{slides[activeSlideIndex].styleKit.typography.body_font} {slides[activeSlideIndex].styleKit.typography.body_weight}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-xs block mb-2">Colors</span>
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-gray-200 shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: slides[activeSlideIndex].styleKit.colors.background }}
                        title="Background"
                      />
                      <span className="text-xs text-gray-500">BG</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-gray-200 shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: slides[activeSlideIndex].styleKit.colors.foreground }}
                        title="Foreground"
                      />
                      <span className="text-xs text-gray-500">FG</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-gray-200 shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: slides[activeSlideIndex].styleKit.colors.accent }}
                        title="Accent"
                      />
                      <span className="text-xs text-gray-500">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
