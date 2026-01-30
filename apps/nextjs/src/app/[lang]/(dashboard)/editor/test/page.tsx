'use client';

import { useState } from 'react';
import { EditorCanvas, ThumbnailRail } from '~/components/editor';
import type { SlideData } from '~/components/editor';

// Sample style kit (Minimal Clean)
const minimalCleanStyleKit = {
  id: 'minimal_clean',
  name: 'Minimal Clean',
  typography: {
    headline_font: 'Inter',
    headline_weight: 700,
    body_font: 'Inter',
    body_weight: 400,
  },
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    accent: '#000000',
  },
  spacingRules: {
    padding: 'normal' as const,
    line_height: 1.5,
  },
};

// Sample slides with different layouts
const sampleSlides: SlideData[] = [
  // Slide 1: Hook - Big Headline
  {
    layoutId: 'hook_big_headline',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 400, width: 960, height: 400 },
          constraints: { max_font: 72, min_font: 48, max_lines: 3 },
        },
      ],
    },
    content: {
      headline: '5 Mistakes That Kill Your LinkedIn Reach',
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 2: Promise - Two Column
  {
    layoutId: 'promise_two_column',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body_left',
          type: 'text_box',
          position: { x: 60, y: 280, width: 450, height: 900 },
          constraints: { max_font: 24, min_font: 18, max_lines: 8 },
        },
        {
          id: 'body_right',
          type: 'text_box',
          position: { x: 570, y: 280, width: 450, height: 900 },
          constraints: { max_font: 24, min_font: 18, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: "Here's What You'll Learn",
      body_left: "How to write hooks that stop the scroll\n\nWhy engagement pods hurt you\n\nThe 80/20 rule of LinkedIn",
      body_right: "How to optimize posting times\n\nThe algorithm change in 2024\n\nWhat format performs best",
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 3: Value - Bullets
  {
    layoutId: 'value_bullets',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body',
          type: 'text_box',
          bulletStyle: 'disc',
          position: { x: 60, y: 280, width: 960, height: 900 },
          constraints: { max_font: 28, min_font: 20, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: 'Mistake #1: Weak Hooks',
      body: [
        'Your first line must stop the scroll',
        'Ask a provocative question',
        'Share a surprising stat',
        'Make a bold promise',
      ],
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 4: Value - Numbered Steps
  {
    layoutId: 'value_numbered_steps',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_font: 48, min_font: 32, max_lines: 2 },
        },
        {
          id: 'body',
          type: 'text_box',
          bulletStyle: 'numbered',
          position: { x: 60, y: 280, width: 960, height: 900 },
          constraints: { max_font: 28, min_font: 20, max_lines: 8 },
        },
      ],
    },
    content: {
      headline: 'How to Write Better Hooks',
      body: [
        'Start with curiosity',
        'Use pattern interrupts',
        'Test 3 variations',
        'Analyze what works',
      ],
    },
    styleKit: minimalCleanStyleKit,
  },
  // Slide 5: CTA - Centered
  {
    layoutId: 'cta_centered',
    blueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          id: 'headline',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 400, width: 960, height: 300 },
          constraints: { max_font: 56, min_font: 40, max_lines: 3 },
        },
        {
          id: 'subtext',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 750, width: 960, height: 150 },
          constraints: { max_font: 28, min_font: 20, max_lines: 3 },
        },
        {
          id: 'footer',
          type: 'text_box',
          align: 'center',
          position: { x: 60, y: 1100, width: 960, height: 100 },
          constraints: { max_font: 24, min_font: 18, max_lines: 2 },
        },
      ],
    },
    content: {
      headline: 'Ready to 10x Your LinkedIn Reach?',
      subtext: 'Follow for daily LinkedIn growth tips',
      footer: '@yourhandle',
    },
    styleKit: minimalCleanStyleKit,
  },
];

export default function EditorTestPage() {
  // Use state to manage editable slides
  const [slides, setSlides] = useState<SlideData[]>(sampleSlides);
  
  // Track active slide index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Handle content change for a specific slide
  const handleContentChange = (slideIndex: number, layerId: string, content: string | string[]) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx === slideIndex) {
        return {
          ...slide,
          content: {
            ...slide.content,
            [layerId]: content,
          },
        };
      }
      return slide;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Editor Canvas Test - Slide Thumbnails
          </h1>
          <p className="mt-2 text-gray-600">
            Click on thumbnails in the left rail to switch between slides. The active slide is highlighted.
          </p>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Feature 16:</strong> Slide thumbnail rail with mini canvas previews.
              Click any thumbnail to switch the main canvas.
            </p>
          </div>
        </div>

        {/* Editor with thumbnail rail */}
        <div className="flex h-[800px] overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Thumbnail rail on the left */}
          <ThumbnailRail
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSlideSelect={setActiveSlideIndex}
          />

          {/* Main canvas editor */}
          <div className="flex-1">
            <EditorCanvas 
              slide={slides[activeSlideIndex]} 
              onContentChange={(layerId, content) => handleContentChange(activeSlideIndex, layerId, content)}
            />
          </div>
        </div>

        {/* Slide info */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Active Slide: {activeSlideIndex + 1} of {slides.length}
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Layout:</strong> {slides[activeSlideIndex].layoutId}
            </p>
            <p>
              <strong>Layers:</strong> {slides[activeSlideIndex].blueprint.layers.length} (
              {slides[activeSlideIndex].blueprint.layers.map(l => l.type).join(', ')})
            </p>
            <p>
              <strong>Editable Text Boxes:</strong>{' '}
              {slides[activeSlideIndex].blueprint.layers.filter(l => l.type === 'text_box').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
