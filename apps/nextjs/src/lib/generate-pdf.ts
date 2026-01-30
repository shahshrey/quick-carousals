/**
 * PDF generation using PDFKit
 * Creates multi-page PDFs from rendered slide images
 */

import PDFDocument from 'pdfkit';
import type { SlideData } from '~/components/editor/types';
import { renderSlidesToCanvas } from './render-slide';

// Canvas dimensions (LinkedIn portrait format)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

// PDF page size in points (72 points = 1 inch)
// LinkedIn optimal size: 1080x1350 pixels
// At 72 DPI: 15 x 18.75 inches = 1080 x 1350 points
const PDF_WIDTH = CANVAS_WIDTH;
const PDF_HEIGHT = CANVAS_HEIGHT;

/**
 * Generate a multi-page PDF from slide data
 * @param slides Array of slide data with layouts, content, and styles
 * @returns PDF buffer
 */
export async function generatePDF(slides: SlideData[], showWatermark = false): Promise<Buffer> {
  // Render all slides to PNG buffers first
  const slideBuffers = await renderSlidesToCanvas(slides, showWatermark);
  
  // Create PDF document
  const doc = new PDFDocument({
    size: [PDF_WIDTH, PDF_HEIGHT],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    autoFirstPage: false,
  });
  
  // Collect PDF chunks
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Create promise that resolves when PDF is complete
  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
  
  // Add each slide as a page
  for (let i = 0; i < slideBuffers.length; i++) {
    const buffer = slideBuffers[i];
    
    // Add new page
    doc.addPage({
      size: [PDF_WIDTH, PDF_HEIGHT],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    
    // Add slide image to page (full bleed, no margins)
    doc.image(buffer, 0, 0, {
      width: PDF_WIDTH,
      height: PDF_HEIGHT,
      align: 'center',
      valign: 'center',
    });
  }
  
  // Finalize PDF
  doc.end();
  
  // Wait for PDF to be complete
  return pdfPromise;
}

/**
 * Generate PDF from slide data and save to file
 * @param slides Array of slide data
 * @param outputPath Path to save PDF file
 */
export async function generatePDFToFile(
  slides: SlideData[],
  outputPath: string,
  showWatermark = false
): Promise<void> {
  const pdfBuffer = await generatePDF(slides, showWatermark);
  
  // In Node.js, write to file
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    await fs.promises.writeFile(outputPath, pdfBuffer);
  }
}

/**
 * Generate PDF and return as base64 string
 * Useful for API responses or browser downloads
 */
export async function generatePDFBase64(slides: SlideData[], showWatermark = false): Promise<string> {
  const pdfBuffer = await generatePDF(slides, showWatermark);
  return pdfBuffer.toString('base64');
}
