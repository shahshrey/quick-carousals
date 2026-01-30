'use client';

import { useState } from 'react';
import { SlideThumbnail } from './SlideThumbnail';
import type { SlideData } from './types';

interface ThumbnailRailProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd?: () => void;
  onSlideDuplicate?: (index: number) => void;
  onSlideDelete?: (index: number) => void;
  onSlideReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ThumbnailRail({
  slides,
  activeSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
  onSlideReorder,
}: ThumbnailRailProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && onSlideReorder) {
      onSlideReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddSlide = () => {
    if (onSlideAdd) {
      onSlideAdd();
    }
  };

  const handleDuplicateSlide = () => {
    if (onSlideDuplicate) {
      onSlideDuplicate(activeSlideIndex);
    }
  };

  const handleDeleteSlide = () => {
    if (onSlideDelete && slides.length > 1) {
      onSlideDelete(activeSlideIndex);
    }
  };

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
      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <button
          data-testid="add_slide_button"
          onClick={handleAddSlide}
          style={{
            padding: '8px 12px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          + Add Slide
        </button>

        <button
          data-testid="duplicate_slide_button"
          onClick={handleDuplicateSlide}
          disabled={slides.length === 0}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6b7280',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: slides.length === 0 ? 'not-allowed' : 'pointer',
            opacity: slides.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (slides.length > 0) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          Duplicate
        </button>

        <button
          data-testid="delete_slide_button"
          onClick={handleDeleteSlide}
          disabled={slides.length <= 1}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: slides.length <= 1 ? 'not-allowed' : 'pointer',
            opacity: slides.length <= 1 ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (slides.length > 1) {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          Delete
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: '#e5e7eb',
          marginBottom: '8px',
        }}
      />

      {/* Slide thumbnails with drag-drop */}
      {slides.map((slide, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: draggedIndex === index ? 0.5 : 1,
            borderTop:
              dragOverIndex === index && draggedIndex !== null && draggedIndex !== index
                ? '2px solid #3b82f6'
                : '2px solid transparent',
            transition: 'opacity 0.2s, border-top 0.2s',
          }}
        >
          <SlideThumbnail
            slide={slide}
            index={index}
            isActive={index === activeSlideIndex}
            onClick={() => onSlideSelect(index)}
          />
        </div>
      ))}
    </div>
  );
}
