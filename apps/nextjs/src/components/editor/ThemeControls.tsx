'use client';

import { useState } from 'react';
import type { StyleKit } from './types';

interface ThemeControlsProps {
  styleKit: StyleKit;
  onStyleKitUpdate: (updatedStyleKit: StyleKit) => void;
}

// Font pair options
const FONT_PAIRS = [
  { id: 'inter', headline: 'Inter', body: 'Inter', headlineWeight: 700, bodyWeight: 400 },
  { id: 'lora-inter', headline: 'Lora', body: 'Inter', headlineWeight: 700, bodyWeight: 400 },
  { id: 'poppins', headline: 'Poppins', body: 'Inter', headlineWeight: 700, bodyWeight: 400 },
  { id: 'source-sans', headline: 'Source Sans Pro', body: 'Source Sans Pro', headlineWeight: 700, bodyWeight: 400 },
  { id: 'roboto-mono', headline: 'Roboto Mono', body: 'Roboto Mono', headlineWeight: 700, bodyWeight: 400 },
];

// Spacing options
const SPACING_OPTIONS: Array<'tight' | 'normal' | 'roomy'> = ['tight', 'normal', 'roomy'];

export function ThemeControls({ styleKit, onStyleKitUpdate }: ThemeControlsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);

  // Update a color in the style kit
  const handleColorChange = (colorKey: 'background' | 'foreground' | 'accent', newColor: string) => {
    const updatedStyleKit: StyleKit = {
      ...styleKit,
      colors: {
        ...styleKit.colors,
        [colorKey]: newColor,
      },
    };
    onStyleKitUpdate(updatedStyleKit);
  };

  // Update font pair
  const handleFontPairChange = (fontPair: typeof FONT_PAIRS[0]) => {
    const updatedStyleKit: StyleKit = {
      ...styleKit,
      typography: {
        headline_font: fontPair.headline,
        headline_weight: fontPair.headlineWeight,
        body_font: fontPair.body,
        body_weight: fontPair.bodyWeight,
      },
    };
    onStyleKitUpdate(updatedStyleKit);
    setShowFontSelector(false);
  };

  // Cycle through spacing options
  const handleSpacingToggle = () => {
    const currentIndex = SPACING_OPTIONS.indexOf(styleKit.spacingRules.padding);
    const nextIndex = (currentIndex + 1) % SPACING_OPTIONS.length;
    const nextSpacing = SPACING_OPTIONS[nextIndex];

    // Calculate line_height based on spacing
    const lineHeightMap = {
      tight: 1.3,
      normal: 1.5,
      roomy: 1.7,
    };

    const updatedStyleKit: StyleKit = {
      ...styleKit,
      spacingRules: {
        padding: nextSpacing,
        line_height: lineHeightMap[nextSpacing],
      },
    };
    onStyleKitUpdate(updatedStyleKit);
  };

  return (
    <div className="space-y-4">
      {/* Color Palette Editor */}
      <div className="relative">
        <button
          data-testid="color_picker"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Color Palette</span>
          <div className="flex space-x-1">
            <div
              className="h-5 w-5 rounded border border-gray-200"
              style={{ backgroundColor: styleKit.colors.background }}
            />
            <div
              className="h-5 w-5 rounded border border-gray-200"
              style={{ backgroundColor: styleKit.colors.foreground }}
            />
            <div
              className="h-5 w-5 rounded border border-gray-200"
              style={{ backgroundColor: styleKit.colors.accent }}
            />
          </div>
        </button>

        {/* Color picker dropdown */}
        {showColorPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowColorPicker(false)}
            />
            {/* Dropdown */}
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <div className="space-y-4">
                {/* Background color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Background
                  </label>
                  <input
                    type="color"
                    value={styleKit.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="h-10 w-full cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={styleKit.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                  />
                </div>

                {/* Foreground color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Foreground (Text)
                  </label>
                  <input
                    type="color"
                    value={styleKit.colors.foreground}
                    onChange={(e) => handleColorChange('foreground', e.target.value)}
                    className="h-10 w-full cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={styleKit.colors.foreground}
                    onChange={(e) => handleColorChange('foreground', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                  />
                </div>

                {/* Accent color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Accent
                  </label>
                  <input
                    type="color"
                    value={styleKit.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="h-10 w-full cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={styleKit.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Font Pair Selector */}
      <div className="relative">
        <button
          data-testid="font_selector"
          onClick={() => setShowFontSelector(!showFontSelector)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Font Pair</span>
          <span className="text-xs text-gray-500">
            {styleKit.typography.headline_font} / {styleKit.typography.body_font}
          </span>
        </button>

        {/* Font selector dropdown */}
        {showFontSelector && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowFontSelector(false)}
            />
            {/* Dropdown */}
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {FONT_PAIRS.map((fontPair) => {
                  const isActive =
                    fontPair.headline === styleKit.typography.headline_font &&
                    fontPair.body === styleKit.typography.body_font;

                  return (
                    <button
                      key={fontPair.id}
                      onClick={() => handleFontPairChange(fontPair)}
                      className={`flex w-full flex-col items-start px-4 py-3 text-left hover:bg-gray-50 ${
                        isActive ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="text-sm font-semibold"
                          style={{ fontFamily: fontPair.headline }}
                        >
                          {fontPair.headline}
                        </span>
                        {isActive && (
                          <svg
                            className="h-4 w-4 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-xs text-gray-500"
                        style={{ fontFamily: fontPair.body }}
                      >
                        Body: {fontPair.body}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Spacing Scale Toggle */}
      <button
        data-testid="spacing_toggle"
        onClick={handleSpacingToggle}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Spacing</span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
          {styleKit.spacingRules.padding}
        </span>
      </button>

      {/* Spacing explanation */}
      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p>
          <strong>Tight:</strong> Compact spacing, 1.3 line height
        </p>
        <p>
          <strong>Normal:</strong> Balanced spacing, 1.5 line height
        </p>
        <p>
          <strong>Roomy:</strong> Generous spacing, 1.7 line height
        </p>
      </div>
    </div>
  );
}
