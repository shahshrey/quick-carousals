'use client';

import { Stage, Layer } from 'react-konva';
import { LayerRenderer } from './LayerRenderer';
import type { SlideData } from './types';

interface SlideThumbnailProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

// Thumbnail dimensions (scaled down from 1080x1350)
const THUMBNAIL_WIDTH = 108; // 10% of original
const THUMBNAIL_HEIGHT = 135;
const THUMBNAIL_SCALE = 0.1;

export function SlideThumbnail({ slide, index, isActive, onClick }: SlideThumbnailProps) {
  return (
    <div
      onClick={onClick}
      data-testid={`slide_thumbnail_${index + 1}`}
      style={{
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: isActive ? '#e0e7ff' : '#fff',
        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 6px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#fff';
        }
      }}
    >
      {/* Slide number label */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: isActive ? '#3b82f6' : '#6b7280',
          marginBottom: '4px',
          textAlign: 'center',
        }}
      >
        {index + 1}
      </div>

      {/* Mini canvas preview */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <Stage
          width={THUMBNAIL_WIDTH}
          height={THUMBNAIL_HEIGHT}
          scaleX={THUMBNAIL_SCALE}
          scaleY={THUMBNAIL_SCALE}
        >
          <Layer>
            <LayerRenderer
              layers={slide.blueprint.layers}
              content={slide.content}
              styleKit={slide.styleKit}
              // No click interaction for thumbnails
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
