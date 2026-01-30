'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditorCanvas, ThumbnailRail, StyleKitSelector, ThemeControls, LayoutVariantSelector, ExportModal } from '~/components/editor';
import type { SlideData, StyleKit, ExportOptions } from '~/components/editor/types';
import { useAutoSave } from '~/hooks/use-auto-save';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  // Auto-save hook
  const { status: saveStatus } = useAutoSave({
    projectId,
    enabled: slides.length > 0,
    onSave: async (data) => {
      // Save slides to backend
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          slides: slides.map(slide => ({
            id: slide.id,
            layoutId: slide.layoutId,
            content: slide.content,
            layers: slide.layers,
          })),
        }),
      });
    },
  });

  // Load project and slides on mount
  useEffect(() => {
    async function loadProject() {
      try {
        // Fetch project
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('Failed to load project');
        }
        const project = await projectResponse.json();
        setProjectTitle(project.title);

        // Fetch slides
        const slidesResponse = await fetch(`/api/projects/${projectId}/slides`);
        if (!slidesResponse.ok) {
          throw new Error('Failed to load slides');
        }
        const slidesData = await slidesResponse.json();

        // Fetch style kit
        const styleKitResponse = await fetch(`/api/style-kits/${project.styleKitId}`);
        if (!styleKitResponse.ok) {
          throw new Error('Failed to load style kit');
        }
        const styleKit = await styleKitResponse.json();

        // Fetch layouts for all slides
        const layoutsResponse = await fetch('/api/layouts');
        if (!layoutsResponse.ok) {
          throw new Error('Failed to load layouts');
        }
        const layouts = await layoutsResponse.json();

        // Transform slides data into SlideData format
        const transformedSlides: SlideData[] = slidesData.map((slide: any) => {
          const layout = layouts.find((l: any) => l.id === slide.layoutId);
          const content = typeof slide.content === 'string' ? JSON.parse(slide.content) : slide.content;
          
          return {
            id: slide.id,
            layoutId: slide.layoutId,
            slideType: slide.slideType,
            styleKit,
            layersBlueprint: layout?.layersBlueprint || { layers: [] },
            content: {
              headline: content.headline || '',
              body: content.body || [],
              emphasis: content.emphasis || [],
            },
            layers: [],
          };
        });

        setSlides(transformedSlides);
        setLoading(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Slide management handlers
  const handleContentChange = (slideIndex: number, layerId: string, newContent: string | string[]) => {
    setSlides(prev => {
      const updated = [...prev];
      const slide = updated[slideIndex];
      if (!slide) return prev;

      // Update content based on layer ID
      if (layerId === 'headline') {
        slide.content.headline = newContent as string;
      } else if (layerId === 'body') {
        slide.content.body = Array.isArray(newContent) ? newContent : [newContent];
      }

      return updated;
    });
  };

  const handleSlideAdd = () => {
    const newSlide: SlideData = {
      id: `temp-${Date.now()}`,
      layoutId: 'generic_single_focus',
      slideType: 'generic',
      styleKit: slides[0]?.styleKit || ({} as StyleKit),
      layersBlueprint: { layers: [] },
      content: { headline: 'New Slide', body: [], emphasis: [] },
      layers: [],
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleSlideDuplicate = (index: number) => {
    const duplicate = { ...slides[index], id: `temp-${Date.now()}` };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, duplicate);
    setSlides(newSlides);
    setActiveSlideIndex(index + 1);
  };

  const handleSlideDelete = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setActiveSlideIndex(Math.min(activeSlideIndex, newSlides.length - 1));
  };

  const handleSlideReorder = (fromIndex: number, toIndex: number) => {
    const newSlides = [...slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    setSlides(newSlides);
    setActiveSlideIndex(toIndex);
  };

  const handleStyleKitChange = (newStyleKit: StyleKit) => {
    setSlides(prev => prev.map(slide => ({ ...slide, styleKit: newStyleKit })));
  };

  const handleLayoutChange = (newLayoutId: string) => {
    setSlides(prev => {
      const updated = [...prev];
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        layoutId: newLayoutId,
      };
      return updated;
    });
  };

  const handleExport = async (options: ExportOptions) => {
    console.log('Exporting:', options);
    // Export functionality will be implemented here
    setShowExportModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => router.push('/en/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">No slides found for this project</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => router.push('/en/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/en/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold">{projectTitle}</h1>
            <div className="text-sm text-gray-500">
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✓ Saved'}
              {saveStatus === 'error' && '⚠️ Error saving'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export
        </button>
      </div>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Thumbnail Rail */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <ThumbnailRail
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSlideClick={setActiveSlideIndex}
            onSlideAdd={handleSlideAdd}
            onSlideDuplicate={handleSlideDuplicate}
            onSlideDelete={handleSlideDelete}
            onSlideReorder={handleSlideReorder}
          />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <EditorCanvas
            slide={slides[activeSlideIndex]}
            onContentChange={(layerId, content) => 
              handleContentChange(activeSlideIndex, layerId, content)
            }
          />
        </div>

        {/* Right: Controls */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="font-medium mb-2">Slide {activeSlideIndex + 1} of {slides.length}</h3>
            <p className="text-sm text-gray-600">{slides[activeSlideIndex]?.slideType}</p>
          </div>

          <StyleKitSelector
            currentStyleKitId={slides[activeSlideIndex]?.styleKit?.id || ''}
            onStyleKitChange={handleStyleKitChange}
          />

          <ThemeControls
            styleKit={slides[activeSlideIndex]?.styleKit || ({} as StyleKit)}
            onStyleKitUpdate={(updated) => handleStyleKitChange(updated)}
          />

          <LayoutVariantSelector
            currentLayoutId={slides[activeSlideIndex]?.layoutId || ''}
            slideType={slides[activeSlideIndex]?.slideType || ''}
            onLayoutChange={handleLayoutChange}
          />
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
