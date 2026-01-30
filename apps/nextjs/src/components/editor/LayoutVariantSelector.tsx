'use client';

import { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { LayerRenderer } from './LayerRenderer';
import type { SlideData, StyleKit, LayersBlueprint } from './types';

interface Layout {
  id: string;
  name: string;
  category: string;
  slideType: string;
  layersBlueprint: LayersBlueprint;
}

interface LayoutVariantSelectorProps {
  currentSlide: SlideData;
  onLayoutChange: (layoutId: string, blueprint: LayersBlueprint) => void;
}

const THUMBNAIL_SCALE = 0.08; // Even smaller for layout selector
const THUMBNAIL_WIDTH = 86.4; // 1080 * 0.08
const THUMBNAIL_HEIGHT = 108; // 1350 * 0.08

export function LayoutVariantSelector({ currentSlide, onLayoutChange }: LayoutVariantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [compatibleLayouts, setCompatibleLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all layouts on mount
  useEffect(() => {
    async function fetchLayouts() {
      try {
        const response = await fetch('/api/layouts');
        if (response.ok) {
          const data = await response.json();
          setLayouts(data);
        }
      } catch (error) {
        console.error('Failed to fetch layouts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLayouts();
  }, []);

  // Infer the current slide's type from its layoutId
  useEffect(() => {
    if (layouts.length === 0) return;

    // Find the current layout to get its slideType
    const currentLayout = layouts.find(l => l.id === currentSlide.layoutId);
    if (!currentLayout) {
      // If no match, show all layouts
      setCompatibleLayouts(layouts);
      return;
    }

    // Filter layouts by matching slideType
    const compatible = layouts.filter(l => l.slideType === currentLayout.slideType);
    setCompatibleLayouts(compatible);
  }, [layouts, currentSlide.layoutId]);

  const handleLayoutSelect = (layout: Layout) => {
    onLayoutChange(layout.id, layout.layersBlueprint);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="layout_selector"
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isOpen ? 'Close Layout Selector' : 'Change Layout'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div className="absolute left-0 right-0 z-20 mt-2 p-4 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">
              Compatible Layouts ({compatibleLayouts.length})
            </h3>

            {loading && (
              <div className="text-sm text-gray-500 py-4">Loading layouts...</div>
            )}

            {!loading && compatibleLayouts.length === 0 && (
              <div className="text-sm text-gray-500 py-4">No compatible layouts found.</div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {compatibleLayouts.map((layout) => {
                const isActive = layout.id === currentSlide.layoutId;
                
                return (
                  <button
                    key={layout.id}
                    onClick={() => handleLayoutSelect(layout)}
                    className={`
                      p-2 rounded-md border-2 transition-all
                      ${isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* Mini preview */}
                    <div className="mb-2 flex justify-center">
                      <Stage
                        width={THUMBNAIL_WIDTH}
                        height={THUMBNAIL_HEIGHT}
                        scaleX={THUMBNAIL_SCALE}
                        scaleY={THUMBNAIL_SCALE}
                      >
                        <Layer>
                          {/* Render background only */}
                          <Rect
                            width={1080}
                            height={1350}
                            fill={currentSlide.styleKit.colors.background}
                          />
                          
                          {/* Render text boxes as gray placeholders */}
                          {layout.layersBlueprint.layers
                            .filter((layer) => layer.type === 'text_box')
                            .map((layer, idx) => {
                              if (layer.type !== 'text_box') return null;
                              return (
                                <Rect
                                  key={idx}
                                  x={layer.position.x}
                                  y={layer.position.y}
                                  width={layer.position.width}
                                  height={layer.position.height}
                                  fill="#E5E7EB"
                                  stroke="#9CA3AF"
                                  strokeWidth={2}
                                />
                              );
                            })}
                        </Layer>
                      </Stage>
                    </div>

                    {/* Layout name */}
                    <div className="text-xs text-center">
                      <div className="font-medium text-gray-900">{layout.name}</div>
                      {isActive && (
                        <div className="text-blue-600 mt-1">✓ Active</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
