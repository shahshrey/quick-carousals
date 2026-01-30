/**
 * Text Measurement Utility
 * 
 * Uses Canvas 2D API to measure text dimensions and calculate line breaks.
 * This is critical for the auto-fit feature to determine optimal font sizes.
 */

export interface TextMeasurement {
  width: number;
  height: number;
  lines: string[];
}

export interface MeasureTextOptions {
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  lineHeight?: number;
  maxWidth?: number;
}

// Singleton canvas for text measurement (browser environment only)
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;

/**
 * Get or create the measurement canvas context
 */
function getContext(): CanvasRenderingContext2D {
  if (typeof window === 'undefined') {
    throw new Error('Text measurement requires browser environment');
  }

  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementContext = measurementCanvas.getContext('2d');
    
    if (!measurementContext) {
      throw new Error('Failed to get canvas 2D context');
    }
  }

  return measurementContext as CanvasRenderingContext2D;
}

/**
 * Build font string for Canvas API
 */
function buildFontString(options: MeasureTextOptions): string {
  const weight = options.fontWeight || 400;
  return `${weight} ${options.fontSize}px ${options.fontFamily}`;
}

/**
 * Measure text dimensions and calculate line breaks
 * 
 * @param text - Text to measure (string or array of strings)
 * @param options - Font and layout options
 * @returns Measured dimensions and line-broken text
 */
export function measureText(
  text: string | string[],
  options: MeasureTextOptions
): TextMeasurement {
  const ctx = getContext();
  const fontString = buildFontString(options);
  ctx.font = fontString;

  const lineHeight = options.lineHeight || 1.2;
  const lineHeightPx = options.fontSize * lineHeight;

  // Handle array input (for bullet points)
  if (Array.isArray(text)) {
    const allLines: string[] = [];
    let totalWidth = 0;

    for (const line of text) {
      if (options.maxWidth) {
        const brokenLines = breakTextIntoLines(ctx, line, options.maxWidth);
        allLines.push(...brokenLines);
        
        // Track max width
        for (const brokenLine of brokenLines) {
          const metrics = ctx.measureText(brokenLine);
          totalWidth = Math.max(totalWidth, metrics.width);
        }
      } else {
        allLines.push(line);
        const metrics = ctx.measureText(line);
        totalWidth = Math.max(totalWidth, metrics.width);
      }
    }

    return {
      width: totalWidth,
      height: allLines.length * lineHeightPx,
      lines: allLines,
    };
  }

  // Handle string input
  if (options.maxWidth) {
    const lines = breakTextIntoLines(ctx, text, options.maxWidth);
    const maxWidth = Math.max(
      ...lines.map((line) => ctx.measureText(line).width)
    );

    return {
      width: maxWidth,
      height: lines.length * lineHeightPx,
      lines,
    };
  } else {
    const metrics = ctx.measureText(text);
    return {
      width: metrics.width,
      height: lineHeightPx,
      lines: [text],
    };
  }
}

/**
 * Break text into lines that fit within maxWidth
 */
function breakTextIntoLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      // Line is too long, push current line and start new one
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  // Push remaining text
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Calculate optimal font size to fit text within bounds
 * 
 * @param text - Text to fit
 * @param options - Font and layout options with maxWidth and maxHeight
 * @param minFontSize - Minimum font size
 * @param maxFontSize - Maximum font size
 * @returns Optimal font size
 */
export function calculateOptimalFontSize(
  text: string | string[],
  options: MeasureTextOptions & { maxHeight: number },
  minFontSize: number,
  maxFontSize: number
): number {
  if (!options.maxWidth) {
    throw new Error('maxWidth is required for optimal font size calculation');
  }

  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  let bestFit = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const measurement = measureText(text, { ...options, fontSize: mid });

    if (measurement.height <= options.maxHeight && measurement.width <= options.maxWidth) {
      // Text fits, try larger size
      bestFit = mid;
      low = mid + 1;
    } else {
      // Text doesn't fit, try smaller size
      high = mid - 1;
    }
  }

  return bestFit;
}

/**
 * Check if text fits within bounds at given font size
 */
export function doesTextFit(
  text: string | string[],
  options: MeasureTextOptions & { maxHeight: number }
): boolean {
  if (!options.maxWidth) {
    return false;
  }

  const measurement = measureText(text, options);
  return measurement.height <= options.maxHeight && measurement.width <= options.maxWidth;
}
