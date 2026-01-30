'use client';

import { SlideThumbnail } from './SlideThumbnail';
import type { SlideData } from './types';

interface ThumbnailRailProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
}

export function ThumbnailRail({ slides, activeSlideIndex, onSlideSelect }: ThumbnailRailProps) {
  return (
    <div
      style={{
        width: '160px',
        height: '100%',
        backgroundColor: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {slides.map((slide, index) => (
        <SlideThumbnail
          key={index}
          slide={slide}
          index={index}
          isActive={index === activeSlideIndex}
          onClick={() => onSlideSelect(index)}
        />
      ))}
    </div>
  );
}
