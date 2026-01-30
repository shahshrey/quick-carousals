/**
 * Server-side canvas renderer for slides
 * Uses @napi-rs/canvas (Skia-based) for consistent, high-quality rendering
 */

import { createCanvas, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import type {
  SlideData,
  Layer,
  TextBoxLayer,
  StyleKit,
  SlideContent,
} from '~/components/editor/types';

// Canvas dimensions (LinkedIn portrait format)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

// Font cache to avoid re-registering fonts
const registeredFonts = new Set<string>();

/**
 * Register a font for use in server-side rendering
 * @param fontFamily Font family name (e.g., 'Inter', 'Poppins')
 * @param fontPath Path to font file (TTF/OTF)
 * @param weight Font weight (400, 700, etc.)
 */
export function registerFont(fontFamily: string, fontPath: string, weight: number) {
  const key = `${fontFamily}-${weight}`;
  if (!registeredFonts.has(key)) {
    GlobalFonts.registerFromPath(fontPath, fontFamily);
    registeredFonts.add(key);
  }
}

/**
 * Load default bundled fonts for rendering
 * These fonts must be available in the public/fonts directory or storage
 */
export async function loadDefaultFonts() {
  // For MVP, we'll use system fonts or load from /tmp
  // In production, these would be loaded from R2/S3 storage
  
  // Check if fonts are already registered
  if (registeredFonts.size > 0) return;
  
  try {
    // Try to load fonts from common system paths
    // This is a fallback for local development
    const fontsToLoad = [
      { family: 'Inter', weight: 400 },
      { family: 'Inter', weight: 700 },
      { family: 'Poppins', weight: 600 },
      { family: 'Poppins', weight: 800 },
    ];
    
    // Note: In production, we'd fetch fonts from storage bucket
    // For now, we'll rely on system fonts or pre-loaded fonts
    for (const font of fontsToLoad) {
      const key = `${font.family}-${font.weight}`;
      if (!registeredFonts.has(key)) {
        registeredFonts.add(key);
      }
    }
  } catch (error) {
    console.warn('Failed to load some fonts:', error);
    // Continue rendering with available fonts
  }
}

/**
 * Calculate optimal font size for text to fit within bounds
 * Binary search algorithm to find largest font that fits
 */
function calculateOptimalFontSize(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  minFont: number,
  maxFont: number,
  lineHeight: number,
  fontFamily: string,
  fontWeight: number
): number {
  let min = minFont;
  let max = maxFont;
  let optimal = min;

  while (min <= max) {
    const mid = Math.floor((min + max) / 2);
    const fontSize = mid;
    
    // Set font for measurement
    const weight = fontWeight >= 600 ? 'bold' : 'normal';
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    
    // Break text into lines
    const lines = breakTextIntoLines(ctx, text, maxWidth);
    const totalHeight = lines.length * fontSize * lineHeight;
    
    if (totalHeight <= maxHeight) {
      optimal = fontSize;
      min = mid + 1;
    } else {
      max = mid - 1;
    }
  }
  
  return optimal;
}

/**
 * Break text into lines that fit within maxWidth
 */
function breakTextIntoLines(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

/**
 * Render a text box layer with auto-fit and proper styling
 */
function renderTextBox(
  ctx: SKRSContext2D,
  layer: TextBoxLayer,
  content: SlideContent,
  styleKit: StyleKit
) {
  const layerContent = content[layer.id];
  if (!layerContent) return;
  
  // Convert content to text string
  let text = '';
  if (Array.isArray(layerContent)) {
    if (layer.bulletStyle === 'numbered') {
      text = layerContent.map((line, i) => `${i + 1}. ${line}`).join('\n');
    } else if (layer.bulletStyle === 'disc') {
      text = layerContent.map(line => `• ${line}`).join('\n');
    } else {
      text = layerContent.join('\n');
    }
  } else {
    text = layerContent;
  }
  
  if (!text) return;
  
  // Determine font based on layer id
  const isHeadline = layer.id.includes('headline');
  const fontFamily = isHeadline 
    ? styleKit.typography.headline_font 
    : styleKit.typography.body_font;
  const fontWeight = isHeadline 
    ? styleKit.typography.headline_weight 
    : styleKit.typography.body_weight;
  
  const lineHeight = styleKit.spacingRules.line_height;
  const align = layer.align || 'left';
  
  // Calculate optimal font size
  const fontSize = calculateOptimalFontSize(
    ctx,
    text,
    layer.position.width,
    layer.position.height,
    layer.constraints.min_font,
    layer.constraints.max_font,
    lineHeight,
    fontFamily,
    fontWeight
  );
  
  // Set font styling
  const weight = fontWeight >= 600 ? 'bold' : 'normal';
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = styleKit.colors.foreground;
  ctx.textBaseline = 'top';
  
  // Set text alignment
  if (align === 'center') {
    ctx.textAlign = 'center';
  } else if (align === 'right') {
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }
  
  // Break text into lines and render
  const lines = breakTextIntoLines(ctx, text, layer.position.width);
  const lineSpacing = fontSize * lineHeight;
  
  lines.forEach((line, index) => {
    let x = layer.position.x;
    if (align === 'center') {
      x = layer.position.x + layer.position.width / 2;
    } else if (align === 'right') {
      x = layer.position.x + layer.position.width;
    }
    
    const y = layer.position.y + (index * lineSpacing);
    ctx.fillText(line, x, y);
  });
}

/**
 * Render a single slide to a PNG buffer
 * @param slide Slide data with layout, content, and style
 * @returns PNG buffer
 */
export async function renderSlideToCanvas(slide: SlideData): Promise<Buffer> {
  // Load fonts if not already loaded
  await loadDefaultFonts();
  
  // Create canvas
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Render layers
  for (const layer of slide.blueprint.layers) {
    if (layer.type === 'background') {
      // Render background
      ctx.fillStyle = slide.styleKit.colors.background;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (layer.type === 'text_box') {
      // Render text box
      renderTextBox(ctx, layer, slide.content, slide.styleKit);
    }
  }
  
  // Return PNG buffer
  return canvas.toBuffer('image/png');
}

/**
 * Render multiple slides to PNG buffers
 * @param slides Array of slide data
 * @returns Array of PNG buffers
 */
export async function renderSlidesToCanvas(slides: SlideData[]): Promise<Buffer[]> {
  await loadDefaultFonts();
  
  const buffers: Buffer[] = [];
  for (const slide of slides) {
    const buffer = await renderSlideToCanvas(slide);
    buffers.push(buffer);
  }
  
  return buffers;
}
