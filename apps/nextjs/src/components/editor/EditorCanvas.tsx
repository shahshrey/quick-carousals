'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { LayerRenderer } from './LayerRenderer';
import type { SlideData } from './types';

interface EditorCanvasProps {
  className?: string;
  slide?: SlideData;
  onContentChange?: (layerId: string, content: string | string[]) => void;
  showWatermark?: boolean; // Add watermark prop
}

// Fixed canvas dimensions (LinkedIn portrait format)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export function EditorCanvas({ className, slide, onContentChange, showWatermark = false }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isFixingWithAI, setIsFixingWithAI] = useState(false);
  
  // Zoom and pan controls
  const [zoom, setZoom] = useState(100); // 50-200%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate responsive scaling based on container size and zoom
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Calculate base scale to fit within container while maintaining aspect ratio
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const baseScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to avoid upscaling

      // Apply zoom percentage on top of base scale
      const newScale = baseScale * (zoom / 100);

      setScale(newScale);
      setStageSize({
        width: CANVAS_WIDTH * newScale,
        height: CANVAS_HEIGHT * newScale,
      });
    };

    updateScale();

    // Update on window resize
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [zoom]);

  // Handle text box click to enter edit mode
  const handleTextBoxClick = (layerId: string, position: { x: number; y: number; width: number; height: number }) => {
    setEditingLayerId(layerId);
    // Convert canvas coordinates to screen coordinates (accounting for scale)
    setEditPosition({
      x: position.x * scale,
      y: position.y * scale,
      width: position.width * scale,
      height: position.height * scale,
    });
  };

  // Handle content change from text editor
  const handleContentChange = (content: string) => {
    if (!editingLayerId || !slide) return;
    
    const layerContent = slide.content[editingLayerId];
    // Preserve array structure if it was an array
    const newContent = Array.isArray(layerContent) 
      ? content.split('\n').filter(line => line.trim())
      : content;
    
    onContentChange?.(editingLayerId, newContent);
  };

  // Close editor on click outside
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking the stage background (not a text box), close editor
    if (e.target === e.target.getStage()) {
      setEditingLayerId(null);
      setEditPosition(null);
    }
  };

  // Handle zoom slider change
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value, 10);
    setZoom(newZoom);
  };

  // Fit to screen (reset zoom and pan)
  const handleFitToScreen = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only enable panning if zoomed in (zoom > 100%)
    if (zoom > 100 && !editingLayerId) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Get current editing content
  const editingContent = editingLayerId && slide ? slide.content[editingLayerId] : '';
  const editingText = Array.isArray(editingContent) ? editingContent.join('\n') : editingContent;

  // Rewrite menu state
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [rewritingAction, setRewritingAction] = useState<string | null>(null);

  // Handle rewrite action
  const handleRewriteAction = async (action: 'shorter' | 'punchier' | 'examples' | 'reduce_jargon') => {
    if (!editingLayerId || !slide) return;

    setRewritingAction(action);
    setShowRewriteMenu(false);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editingText,
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Rewrite failed:', error);
        alert(`Failed to rewrite: ${error.error?.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      handleContentChange(data.rewritten_text);

    } catch (error) {
      console.error('Rewrite error:', error);
      alert('Failed to rewrite text. Please try again.');
    } finally {
      setRewritingAction(null);
    }
  };

  // Check if current text overflows
  const checkIfOverflows = (layerId: string): boolean => {
    if (!slide) return false;
    
    // Find the layer in the blueprint
    const layer = slide.blueprint.layers.find(l => l.type === 'text_box' && l.id === layerId);
    if (!layer || layer.type !== 'text_box') return false;

    // Import text measurement utilities
    const { measureText } = require('~/lib/text-measure');
    if (typeof window === 'undefined') return false;

    const content = slide.content[layerId];
    const isHeadline = layerId.includes('headline');
    const fontFamily = isHeadline 
      ? slide.styleKit.typography.headline_font 
      : slide.styleKit.typography.body_font;
    const fontWeight = isHeadline 
      ? slide.styleKit.typography.headline_weight 
      : slide.styleKit.typography.body_weight;
    const lineHeight = slide.styleKit.spacingRules.line_height;

    try {
      const measurement = measureText(content, {
        fontSize: layer.constraints.min_font,
        fontFamily,
        fontWeight,
        lineHeight,
        maxWidth: layer.position.width,
      });

      return measurement.height > layer.position.height;
    } catch {
      return false;
    }
  };

  const currentTextOverflows = editingLayerId ? checkIfOverflows(editingLayerId) : false;

  // Fix with AI handler
  const handleFixWithAI = async () => {
    if (!editingLayerId || !slide) return;

    setIsFixingWithAI(true);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editingText,
          action: 'shorter',
          maxWords: 12, // For headlines, shorter text
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Fix with AI failed:', error);
        alert(`Failed to fix text: ${error.error?.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      handleContentChange(data.rewritten_text);

    } catch (error) {
      console.error('Fix with AI error:', error);
      alert('Failed to fix text. Please try again.');
    } finally {
      setIsFixingWithAI(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
          position: 'relative',
        }}
        data-testid="canvas_surface"
      >
      {/* Zoom and Pan Controls */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <span>Zoom:</span>
          <input
            type="range"
            min="50"
            max="200"
            value={zoom}
            onChange={handleZoomChange}
            data-testid="zoom_slider"
            style={{ width: '150px' }}
          />
          <span style={{ minWidth: '45px' }}>{zoom}%</span>
        </label>
        <button
          onClick={handleFitToScreen}
          data-testid="fit_screen_button"
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Fit to Screen
        </button>
      </div>

      {/* Canvas Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: zoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            style={{
              border: '1px solid #ddd',
              backgroundColor: '#fff',
            }}
            onClick={handleStageClick}
          >
            <Layer>
              {slide && (
                <LayerRenderer
                  layers={slide.blueprint.layers}
                  content={slide.content}
                  styleKit={slide.styleKit}
                  onTextBoxClick={handleTextBoxClick}
                  showWatermark={showWatermark}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Inline text editor overlay */}
      {editingLayerId && editPosition && (
        <div
          style={{
            position: 'absolute',
            left: `calc(50% - ${stageSize.width / 2}px + ${editPosition.x}px + ${pan.x}px)`,
            top: `calc(50% - ${stageSize.height / 2}px + ${editPosition.y}px + ${pan.y}px + 60px)`,
            width: `${editPosition.width}px`,
            zIndex: 1000,
          }}
        >
          {/* Text area */}
          <textarea
            autoFocus
            value={editingText as string}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={() => {
              setEditingLayerId(null);
              setEditPosition(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingLayerId(null);
                setEditPosition(null);
              }
            }}
            style={{
              width: '100%',
              height: `${editPosition.height}px`,
              padding: '8px',
              fontSize: '16px',
              fontFamily: 'inherit',
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              resize: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              outline: 'none',
            }}
          />
          
          {/* Rewrite Menu Button */}
          <div style={{ marginTop: '8px', position: 'relative' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRewriteMenu(!showRewriteMenu);
              }}
              onMouseDown={(e) => {
                // Prevent blur event from closing editor
                e.preventDefault();
              }}
              disabled={!!rewritingAction}
              data-testid="rewrite_menu"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: rewritingAction ? '#9ca3af' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: rewritingAction ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {rewritingAction ? (
                <>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Rewriting...
                </>
              ) : (
                <>
                  ✨ Rewrite
                </>
              )}
            </button>

            {/* Rewrite Menu Dropdown */}
            {showRewriteMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRewriteMenu(false);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                />
                
                {/* Menu */}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    minWidth: '200px',
                    overflow: 'hidden',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRewriteAction('shorter');
                    }}
                    data-testid="rewrite_shorter"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'left',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    ✂️ Make Shorter
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRewriteAction('punchier');
                    }}
                    data-testid="rewrite_punchier"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'left',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    💥 Make Punchier
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRewriteAction('examples');
                    }}
                    data-testid="rewrite_examples"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'left',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    📝 Add Examples
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRewriteAction('reduce_jargon');
                    }}
                    data-testid="rewrite_jargon"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'left',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    🔧 Reduce Jargon
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Fix with AI button - only show if text overflows */}
          {currentTextOverflows && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFixWithAI();
              }}
              onMouseDown={(e) => {
                // Prevent blur event from closing editor
                e.preventDefault();
              }}
              disabled={isFixingWithAI}
              data-testid="fix_with_ai_button"
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: isFixingWithAI ? '#9ca3af' : '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isFixingWithAI ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {isFixingWithAI ? (
                <>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Fixing...
                </>
              ) : (
                <>
                  ✨ Fix with AI
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
