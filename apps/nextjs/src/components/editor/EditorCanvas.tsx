'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';

interface EditorCanvasProps {
  className?: string;
}

// Fixed canvas dimensions (LinkedIn portrait format)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export function EditorCanvas({ className }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

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
      }}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        style={{
          border: '1px solid #ddd',
          backgroundColor: '#fff',
        }}
      >
        <Layer>
          {/* Canvas content will be rendered here */}
          {/* Placeholder for slide layers */}
        </Layer>
      </Stage>
    </div>
  );
}
