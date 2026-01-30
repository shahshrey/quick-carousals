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
        width: '180px',
        height: '100%',
        backgroundColor: '#f8fafc',
        borderRight: '2px solid #e2e8f0',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
    >
      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '12px',
        }}
      >
        <button
          data-testid="add_slide_button"
          onClick={handleAddSlide}
          title="Add new slide (Cmd+N)"
          style={{
            padding: '10px 14px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          + Add Slide
        </button>

        <button
          data-testid="duplicate_slide_button"
          onClick={handleDuplicateSlide}
          disabled={slides.length === 0}
          title="Duplicate slide (Cmd+D)"
          style={{
            padding: '8px 14px',
            backgroundColor: '#6b7280',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: slides.length === 0 ? 'not-allowed' : 'pointer',
            opacity: slides.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s',
            boxShadow: slides.length > 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (slides.length > 0) {
              e.currentTarget.style.backgroundColor = '#4b5563';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          Duplicate
        </button>

        <button
          data-testid="delete_slide_button"
          onClick={handleDeleteSlide}
          disabled={slides.length <= 1}
          title="Delete slide (Delete key)"
          style={{
            padding: '8px 14px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: slides.length <= 1 ? 'not-allowed' : 'pointer',
            opacity: slides.length <= 1 ? 0.5 : 1,
            transition: 'all 0.2s',
            boxShadow: slides.length > 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (slides.length > 1) {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          Delete
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)',
          marginBottom: '12px',
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
