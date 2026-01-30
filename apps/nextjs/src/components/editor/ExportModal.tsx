'use client';

import { useState, useEffect } from 'react';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<{ exportId: string; projectId: string }>;
}

export interface ExportOptions {
  format: 'PDF' | 'PNG';
  filename: string;
  includeCoverThumbnail: boolean;
}

type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ExportStatusResponse {
  id: string;
  status: ExportStatus;
  fileUrl?: string | string[];
  errorMessage?: string;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<'PDF' | 'PNG'>('PDF');
  const [filename, setFilename] = useState('my-carousel');
  const [includeCoverThumbnail, setIncludeCoverThumbnail] = useState(false);
  
  // Progress tracking
  const [isExporting, setIsExporting] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExportStatus>('PENDING');
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll for export status
  useEffect(() => {
    if (!exportId || status === 'COMPLETED' || status === 'FAILED') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/exports/${exportId}`);
        
        // Handle mock export IDs (for test page)
        if (!response.ok) {
          if (exportId.startsWith('test-export-')) {
            // Simulate progress for test exports
            const timeSinceStart = Date.now() - parseInt(exportId.split('-').pop() || '0');
            
            if (timeSinceStart < 3000) {
              setStatus('PENDING');
            } else if (timeSinceStart < 6000) {
              setStatus('PROCESSING');
            } else {
              // Simulate completion with mock download URL
              setStatus('COMPLETED');
              setDownloadUrls(['https://example.com/mock-download.pdf']);
              clearInterval(pollInterval);
            }
            return;
          }
          
          throw new Error('Failed to fetch export status');
        }
        
        const data: ExportStatusResponse = await response.json();
        setStatus(data.status);

        if (data.status === 'COMPLETED' && data.fileUrl) {
          const urls = Array.isArray(data.fileUrl) ? data.fileUrl : [data.fileUrl];
          setDownloadUrls(urls);
          clearInterval(pollInterval);
        }

        if (data.status === 'FAILED') {
          setErrorMessage(data.errorMessage || 'Export failed');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling export status:', error);
        setErrorMessage('Failed to check export status');
        setStatus('FAILED');
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [exportId, status]);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    
    try {
      const result = await onExport({
        format,
        filename,
        includeCoverThumbnail,
      });
      
      setExportId(result.exportId);
      setStatus('PENDING');
    } catch (error) {
      console.error('Export failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
    }
  };

  const handleDownload = (url: string, index?: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = index !== undefined ? `${filename}-${index + 1}.png` : `${filename}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setIsExporting(false);
    setExportId(null);
    setStatus('PENDING');
    setDownloadUrls([]);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
        data-testid="export_modal"
      >
        {!isExporting ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Export Carousel</h2>
              <p className="mt-2 text-sm text-gray-600">
                Choose your export format and customize the filename
              </p>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <Label className="mb-3 block text-sm font-medium text-gray-700">
                Export Format
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-testid="format_pdf"
                  onClick={() => setFormat('PDF')}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    format === 'PDF'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">📄</span>
                    <span className="mt-1">PDF</span>
                    {format === 'PDF' && <span className="mt-1 text-xs">✓ Selected</span>}
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="format_png"
                  onClick={() => setFormat('PNG')}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    format === 'PNG'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">🖼️</span>
                    <span className="mt-1">PNG</span>
                    {format === 'PNG' && <span className="mt-1 text-xs">✓ Selected</span>}
                  </div>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {format === 'PDF'
                  ? 'Single PDF file with all slides (best for LinkedIn upload)'
                  : 'Individual PNG images for each slide'}
              </p>
            </div>

            {/* Filename Input */}
            <div className="mb-6">
              <Label htmlFor="filename" className="mb-2 block text-sm font-medium text-gray-700">
                Filename
              </Label>
              <Input
                id="filename"
                type="text"
                data-testid="filename_input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="my-carousel"
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Extension will be added automatically (.pdf or .png)
              </p>
            </div>

            {/* Cover Thumbnail Checkbox */}
            <div className="mb-6">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={includeCoverThumbnail}
                  onChange={(e) => setIncludeCoverThumbnail(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">
                    Include cover thumbnail
                  </span>
                  <p className="mt-1 text-xs text-gray-500">
                    Generate a separate thumbnail of the first slide (1080x1350px)
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                data-testid="start_export_button"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                Start Export
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Progress UI */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {status === 'COMPLETED' ? 'Export Complete!' : status === 'FAILED' ? 'Export Failed' : 'Exporting...'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {status === 'COMPLETED' 
                  ? 'Your carousel is ready to download' 
                  : status === 'FAILED'
                  ? 'Something went wrong during export'
                  : 'Please wait while we generate your carousel'}
              </p>
            </div>

            {/* Progress Indicator */}
            {(status === 'PENDING' || status === 'PROCESSING') && (
              <div className="mb-6" data-testid="export_progress">
                <div className="flex items-center justify-center space-x-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {status === 'PENDING' ? 'Starting export...' : 'Processing slides...'}
                  </span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className="h-full animate-pulse bg-blue-600 transition-all duration-300"
                    style={{ width: status === 'PENDING' ? '25%' : '75%' }}
                  />
                </div>
              </div>
            )}

            {/* Download Buttons */}
            {status === 'COMPLETED' && downloadUrls.length > 0 && (
              <div className="mb-6">
                {downloadUrls.length === 1 && downloadUrls[0] ? (
                  <Button
                    onClick={() => handleDownload(downloadUrls[0]!)}
                    data-testid="download_button"
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                  >
                    ⬇️ Download {format}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Download Slides ({downloadUrls.length} images)
                    </p>
                    {downloadUrls.map((url, index) => (
                      <Button
                        key={index}
                        onClick={() => handleDownload(url, index)}
                        data-testid="download_button"
                        variant="outline"
                        className="w-full"
                      >
                        Download Slide {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === 'FAILED' && errorMessage && (
              <div className="mb-6 rounded-lg bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">Error:</p>
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant={status === 'COMPLETED' ? 'outline' : 'default'}
              className="w-full"
            >
              Close
            </Button>
          </>
        )}
      </div>
    </>
  );
}
