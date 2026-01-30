/**
 * Tests for PDF generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PDFKit
const mockPDFDoc = {
  addPage: vi.fn().mockReturnThis(),
  image: vi.fn().mockReturnThis(),
  end: vi.fn(),
  on: vi.fn(),
};

const MockPDFDocument = vi.fn(function(this: any) {
  return mockPDFDoc;
});

vi.mock('pdfkit', () => ({
  default: MockPDFDocument,
}));

// Mock render-slide
vi.mock('./render-slide', () => ({
  renderSlidesToCanvas: vi.fn(async (slides) => {
    // Return mock PNG buffers for each slide
    return slides.map(() => Buffer.from('mock-png-data'));
  }),
}));

describe('generatePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate PDF from single slide', async () => {
    const { generatePDF } = await import('./generate-pdf');
    
    const slides = [
      {
        blueprint: {
          layers: [
            { type: 'background' as const },
            {
              type: 'text_box' as const,
              id: 'headline',
              position: { x: 100, y: 100, width: 880, height: 200 },
              constraints: { min_font: 24, max_font: 48, max_lines: 2 },
            },
          ],
        },
        content: { headline: 'Test Slide' },
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
    ];

    // Setup mock to trigger 'end' event
    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        callback(Buffer.from('mock-pdf-data'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockPDFDoc;
    });

    const pdfBuffer = await generatePDF(slides);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(mockPDFDoc.addPage).toHaveBeenCalledTimes(1);
    expect(mockPDFDoc.image).toHaveBeenCalledTimes(1);
    expect(mockPDFDoc.end).toHaveBeenCalled();
  });

  it('should generate PDF from multiple slides', async () => {
    const { generatePDF } = await import('./generate-pdf');
    
    const slides = [
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
          typography: {
            headline_font: 'Inter',
            headline_weight: 700,
            body_font: 'Inter',
            body_weight: 400,
          },
          colors: {
            background: '#000000',
            foreground: '#FFFFFF',
            accent: '#FF5733',
          },
          spacingRules: {
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
          typography: {
            headline_font: 'Poppins',
            headline_weight: 800,
            body_font: 'Inter',
            body_weight: 400,
          },
          colors: {
            background: '#FFFACD',
            foreground: '#1A1A1A',
            accent: '#FFE866',
          },
          spacingRules: {
            padding: 'tight',
            line_height: 1.3,
          },
        },
      },
    ];

    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        callback(Buffer.from('mock-pdf-data'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockPDFDoc;
    });

    const pdfBuffer = await generatePDF(slides);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(mockPDFDoc.addPage).toHaveBeenCalledTimes(3);
    expect(mockPDFDoc.image).toHaveBeenCalledTimes(3);
    expect(mockPDFDoc.end).toHaveBeenCalled();
  });

  it('should handle PDF generation errors', async () => {
    const { generatePDF } = await import('./generate-pdf');
    
    const slides = [
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
    ];

    // Setup mock to trigger 'error' event
    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'error') {
        setTimeout(() => callback(new Error('PDF generation failed')), 0);
      }
      return mockPDFDoc;
    });

    await expect(generatePDF(slides)).rejects.toThrow('PDF generation failed');
  });

  it('should generate PDF with correct dimensions', async () => {
    const { generatePDF } = await import('./generate-pdf');
    
    const slides = [
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
    ];

    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        callback(Buffer.from('mock-pdf-data'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockPDFDoc;
    });

    await generatePDF(slides);

    // Verify page was added with correct dimensions (1080x1350)
    expect(mockPDFDoc.addPage).toHaveBeenCalledWith({
      size: [1080, 1350],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // Verify image was added with correct dimensions
    expect(mockPDFDoc.image).toHaveBeenCalledWith(
      expect.any(Buffer),
      0,
      0,
      {
        width: 1080,
        height: 1350,
        align: 'center',
        valign: 'center',
      }
    );
  });

  it('should call renderSlidesToCanvas with correct slides', async () => {
    const { generatePDF } = await import('./generate-pdf');
    const { renderSlidesToCanvas } = await import('./render-slide');
    
    const slides = [
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
    ];

    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        callback(Buffer.from('mock-pdf-data'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockPDFDoc;
    });

    await generatePDF(slides);

    expect(renderSlidesToCanvas).toHaveBeenCalledWith(slides);
  });
});

describe('generatePDFBase64', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return base64 encoded PDF', async () => {
    const { generatePDFBase64 } = await import('./generate-pdf');
    
    const slides = [
      {
        blueprint: {
          layers: [{ type: 'background' as const }],
        },
        content: {},
        styleKit: {
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
            padding: 'normal',
            line_height: 1.5,
          },
        },
      },
    ];

    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        callback(Buffer.from('test-pdf-data'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockPDFDoc;
    });

    const base64 = await generatePDFBase64(slides);

    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
    // Verify it's valid base64
    expect(() => Buffer.from(base64, 'base64')).not.toThrow();
  });
});
