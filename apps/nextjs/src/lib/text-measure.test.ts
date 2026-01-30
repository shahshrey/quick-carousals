import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock canvas API for testing
class MockCanvasRenderingContext2D {
  font = '';
  
  measureText(text: string) {
    // Rough approximation: 10px per character
    return {
      width: text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
    };
  }
}

// Mock canvas element
const mockCanvas = {
  getContext: () => new MockCanvasRenderingContext2D(),
};

// Mock document.createElement
beforeEach(() => {
  global.document = {
    createElement: vi.fn(() => mockCanvas),
  } as any;
});

describe('text-measure', () => {
  describe('measureText', () => {
    it('measures single line text', async () => {
      const { measureText } = await import('./text-measure');
      
      const result = measureText('Hello World', {
        fontSize: 24,
        fontFamily: 'Inter',
      });

      expect(result.lines).toEqual(['Hello World']);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('breaks text into multiple lines when maxWidth is set', async () => {
      const { measureText } = await import('./text-measure');
      
      const result = measureText('This is a long sentence that should wrap', {
        fontSize: 24,
        fontFamily: 'Inter',
        maxWidth: 100,
      });

      expect(result.lines.length).toBeGreaterThan(1);
      expect(result.height).toBeGreaterThan(24); // More than one line height
    });

    it('handles array input (bullet points)', async () => {
      const { measureText } = await import('./text-measure');
      
      const result = measureText(['Point 1', 'Point 2', 'Point 3'], {
        fontSize: 20,
        fontFamily: 'Inter',
        maxWidth: 200,
      });

      expect(result.lines.length).toBeGreaterThanOrEqual(3);
    });

    it('applies line height to total height calculation', async () => {
      const { measureText } = await import('./text-measure');
      
      const result = measureText(['Line 1', 'Line 2'], {
        fontSize: 20,
        fontFamily: 'Inter',
        lineHeight: 1.5,
      });

      expect(result.height).toBe(20 * 1.5 * 2); // fontSize * lineHeight * numLines
    });

    it('uses custom font weight', async () => {
      const { measureText } = await import('./text-measure');
      
      const result = measureText('Bold Text', {
        fontSize: 24,
        fontFamily: 'Poppins',
        fontWeight: 700,
      });

      expect(result.lines).toEqual(['Bold Text']);
    });
  });

  describe('calculateOptimalFontSize', () => {
    it('finds font size that fits within bounds', async () => {
      const { calculateOptimalFontSize } = await import('./text-measure');
      
      const fontSize = calculateOptimalFontSize(
        'Short text',
        {
          fontSize: 24, // Initial size (will be overridden)
          fontFamily: 'Inter',
          maxWidth: 300,
          maxHeight: 100,
        },
        12,
        48
      );

      expect(fontSize).toBeGreaterThanOrEqual(12);
      expect(fontSize).toBeLessThanOrEqual(48);
    });

    it('returns minimum size when text is too long', async () => {
      const { calculateOptimalFontSize } = await import('./text-measure');
      
      const fontSize = calculateOptimalFontSize(
        'This is an extremely long piece of text that cannot possibly fit in a small box even at minimum size',
        {
          fontSize: 24,
          fontFamily: 'Inter',
          maxWidth: 50,
          maxHeight: 30,
        },
        8,
        24
      );

      expect(fontSize).toBe(8); // Should return minimum
    });

    it('throws error when maxWidth is not provided', async () => {
      const { calculateOptimalFontSize } = await import('./text-measure');
      
      expect(() => {
        calculateOptimalFontSize(
          'Text',
          {
            fontSize: 24,
            fontFamily: 'Inter',
            maxHeight: 100,
          } as any,
          12,
          48
        );
      }).toThrow('maxWidth is required');
    });
  });

  describe('doesTextFit', () => {
    it('returns true when text fits', async () => {
      const { doesTextFit } = await import('./text-measure');
      
      const fits = doesTextFit('Short', {
        fontSize: 12,
        fontFamily: 'Inter',
        maxWidth: 500,
        maxHeight: 100,
      });

      expect(fits).toBe(true);
    });

    it('returns false when text exceeds bounds', async () => {
      const { doesTextFit } = await import('./text-measure');
      
      const fits = doesTextFit('Very long text that definitely will not fit', {
        fontSize: 48,
        fontFamily: 'Inter',
        maxWidth: 100,
        maxHeight: 50,
      });

      expect(fits).toBe(false);
    });

    it('returns false when maxWidth is not provided', async () => {
      const { doesTextFit } = await import('./text-measure');
      
      const fits = doesTextFit('Text', {
        fontSize: 24,
        fontFamily: 'Inter',
        maxHeight: 100,
      } as any);

      expect(fits).toBe(false);
    });
  });
});
