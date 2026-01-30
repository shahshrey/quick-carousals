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

  // Calculate responsive scaling based on container size
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Calculate scale to fit within container while maintaining aspect ratio
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to avoid upscaling

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
  }, []);

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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        position: 'relative',
      }}
      data-testid="canvas_surface"
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

      {/* Inline text editor overlay */}
      {editingLayerId && editPosition && (
        <div
          style={{
            position: 'absolute',
            left: `calc(50% - ${stageSize.width / 2}px + ${editPosition.x}px)`,
            top: `calc(50% - ${stageSize.height / 2}px + ${editPosition.y}px)`,
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
