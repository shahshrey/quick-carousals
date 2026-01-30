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
}

// Fixed canvas dimensions (LinkedIn portrait format)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export function EditorCanvas({ className, slide, onContentChange }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
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

  return (
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
            height: `${editPosition.height}px`,
            zIndex: 1000,
          }}
        >
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
              height: '100%',
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
        </div>
      )}
    </div>
  );
}
