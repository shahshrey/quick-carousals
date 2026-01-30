import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @napi-rs/canvas
vi.mock('@napi-rs/canvas', () => {
  const mockContext = {
    fillStyle: '',
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 10, // Rough estimate: 10px per character
    })),
  };

  const mockCanvas = {
    getContext: vi.fn(() => mockContext),
    toBuffer: vi.fn((format: string) => Buffer.from(`mock-${format}-buffer`)),
  };

  return {
    createCanvas: vi.fn(() => mockCanvas),
    GlobalFonts: {
      registerFromPath: vi.fn(),
    },
  };
});

describe('renderSlideToCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a slide with background and text', async () => {
    const { renderSlideToCanvas } = await import('./render-slide');
    
    const slide = {
      layoutId: 'hook_big_headline',
      blueprint: {
        layers: [
          { type: 'background' as const, properties: {} },
          {
            type: 'text_box' as const,
            id: 'headline',
            position: { x: 100, y: 200, width: 880, height: 300 },
            constraints: { max_font: 48, min_font: 24, max_lines: 2 },
            align: 'center' as const,
          },
        ],
      },
      content: {
        headline: 'Test Headline',
      },
      styleKit: {
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
          accent: '#3B82F6',
        },
        spacingRules: {
          padding: 'normal' as const,
          line_height: 1.5,
        },
      },
    };

    const buffer = await renderSlideToCanvas(slide);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should render slides with bullet lists', async () => {
    const { renderSlideToCanvas } = await import('./render-slide');
    
    const slide = {
      layoutId: 'value_bullets',
      blueprint: {
        layers: [
          { type: 'background' as const, properties: {} },
          {
            type: 'text_box' as const,
            id: 'body',
            position: { x: 100, y: 400, width: 880, height: 600 },
            constraints: { max_font: 24, min_font: 16, max_lines: 5 },
            bulletStyle: 'disc' as const,
          },
        ],
      },
      content: {
        body: ['First point', 'Second point', 'Third point'],
      },
      styleKit: {
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
          accent: '#3B82F6',
        },
        spacingRules: {
          padding: 'normal' as const,
          line_height: 1.5,
        },
      },
    };

    const buffer = await renderSlideToCanvas(slide);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should render slides with numbered lists', async () => {
    const { renderSlideToCanvas } = await import('./render-slide');
    
    const slide = {
      layoutId: 'value_numbered_steps',
      blueprint: {
        layers: [
          { type: 'background' as const, properties: {} },
          {
            type: 'text_box' as const,
            id: 'body',
            position: { x: 100, y: 400, width: 880, height: 600 },
            constraints: { max_font: 24, min_font: 16, max_lines: 5 },
            bulletStyle: 'numbered' as const,
          },
        ],
      },
      content: {
        body: ['Step one', 'Step two', 'Step three'],
      },
      styleKit: {
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
          accent: '#3B82F6',
        },
        spacingRules: {
          padding: 'normal' as const,
          line_height: 1.5,
        },
      },
    };

    const buffer = await renderSlideToCanvas(slide);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should render multiple slides', async () => {
    const { renderSlidesToCanvas } = await import('./render-slide');
    
    const slides = [
      {
        layoutId: 'hook_big_headline',
        blueprint: {
          layers: [
            { type: 'background' as const, properties: {} },
            {
              type: 'text_box' as const,
              id: 'headline',
              position: { x: 100, y: 200, width: 880, height: 300 },
              constraints: { max_font: 48, min_font: 24, max_lines: 2 },
            },
          ],
        },
        content: { headline: 'Slide 1' },
        styleKit: {
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
            accent: '#3B82F6',
          },
          spacingRules: {
            padding: 'normal' as const,
            line_height: 1.5,
          },
        },
      },
      {
        layoutId: 'hook_big_headline',
        blueprint: {
          layers: [
            { type: 'background' as const, properties: {} },
            {
              type: 'text_box' as const,
              id: 'headline',
              position: { x: 100, y: 200, width: 880, height: 300 },
              constraints: { max_font: 48, min_font: 24, max_lines: 2 },
            },
          ],
        },
        content: { headline: 'Slide 2' },
        styleKit: {
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
            accent: '#3B82F6',
          },
          spacingRules: {
            padding: 'normal' as const,
            line_height: 1.5,
          },
        },
      },
    ];

    const buffers = await renderSlidesToCanvas(slides);
    
    expect(buffers).toHaveLength(2);
    expect(buffers[0]).toBeInstanceOf(Buffer);
    expect(buffers[1]).toBeInstanceOf(Buffer);
  });

  it('should handle empty content gracefully', async () => {
    const { renderSlideToCanvas } = await import('./render-slide');
    
    const slide = {
      layoutId: 'hook_big_headline',
      blueprint: {
        layers: [
          { type: 'background' as const, properties: {} },
          {
            type: 'text_box' as const,
            id: 'headline',
            position: { x: 100, y: 200, width: 880, height: 300 },
            constraints: { max_font: 48, min_font: 24, max_lines: 2 },
          },
        ],
      },
      content: {},
      styleKit: {
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
          accent: '#3B82F6',
        },
        spacingRules: {
          padding: 'normal' as const,
          line_height: 1.5,
        },
      },
    };

    const buffer = await renderSlideToCanvas(slide);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
