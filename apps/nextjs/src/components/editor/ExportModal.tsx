'use client';

import { useState } from 'react';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  format: 'PDF' | 'PNG';
  filename: string;
  includeCoverThumbnail: boolean;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<'PDF' | 'PNG'>('PDF');
  const [filename, setFilename] = useState('my-carousel');
  const [includeCoverThumbnail, setIncludeCoverThumbnail] = useState(false);

  const handleExport = () => {
    onExport({
      format,
      filename,
      includeCoverThumbnail,
    });
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
            onClick={onClose}
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
      </div>
    </>
  );
}
