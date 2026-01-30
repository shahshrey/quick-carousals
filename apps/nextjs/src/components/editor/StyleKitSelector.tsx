'use client';

import { useState, useEffect } from 'react';
import type { StyleKit } from './types';

interface StyleKitSelectorProps {
  currentStyleKitId: string;
  onStyleKitChange: (styleKit: StyleKit) => void;
}

export function StyleKitSelector({ currentStyleKitId, onStyleKitChange }: StyleKitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [styleKits, setStyleKits] = useState<StyleKit[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch style kits from API
  useEffect(() => {
    async function fetchStyleKits() {
      try {
        const response = await fetch('/api/style-kits');
        if (!response.ok) throw new Error('Failed to fetch style kits');
        const data = await response.json();
        setStyleKits(data);
      } catch (error) {
        console.error('Error fetching style kits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStyleKits();
  }, []);

  const currentKit = styleKits.find(kit => kit.id === currentStyleKitId);

  const handleKitSelect = (kit: StyleKit) => {
    onStyleKitChange(kit);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <p className="text-sm text-gray-500">Loading style kits...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current selection button */}
      <button
        data-testid="style_kit_selector"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-gray-300 bg-white p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentKit?.name || 'Select Style Kit'}
            </p>
            <p className="text-xs text-gray-500">
              {currentKit ? `${currentKit.typography.headline_font} / ${currentKit.typography.body_font}` : 'Choose a style'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Color preview */}
            {currentKit && (
              <div className="flex space-x-1">
                <div
                  className="h-6 w-6 rounded border border-gray-200"
                  style={{ backgroundColor: currentKit.colors.background }}
                />
                <div
                  className="h-6 w-6 rounded border border-gray-200"
                  style={{ backgroundColor: currentKit.colors.accent }}
                />
              </div>
            )}
            {/* Chevron icon */}
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Style kit grid */}
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[600px] overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Free Style Kits
              </p>
              <div className="grid grid-cols-2 gap-3">
                {styleKits.filter(kit => !kit.isPremium).map(kit => (
                  <button
                    key={kit.id}
                    data-testid={`style_kit_${kit.id}`}
                    onClick={() => handleKitSelect(kit)}
                    className={`rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                      kit.id === currentStyleKitId
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Preview canvas */}
                    <div
                      className="mb-2 flex h-24 items-center justify-center rounded border"
                      style={{
                        backgroundColor: kit.colors.background,
                        borderColor: kit.colors.foreground + '20',
                      }}
                    >
                      <div className="space-y-1 p-2 text-center">
                        <div
                          className="text-xs font-bold"
                          style={{
                            color: kit.colors.foreground,
                            fontFamily: kit.typography.headline_font,
                          }}
                        >
                          Headline
                        </div>
                        <div
                          className="text-[10px]"
                          style={{
                            color: kit.colors.foreground,
                            fontFamily: kit.typography.body_font,
                          }}
                        >
                          Body text preview
                        </div>
                        <div
                          className="mx-auto h-1 w-8 rounded"
                          style={{ backgroundColor: kit.colors.accent }}
                        />
                      </div>
                    </div>

                    {/* Kit info */}
                    <p className="mb-1 text-sm font-medium text-gray-900">
                      {kit.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {kit.typography.headline_font}
                    </p>
                  </button>
                ))}
              </div>

              {styleKits.some(kit => kit.isPremium) && (
                <>
                  <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Premium Style Kits
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {styleKits.filter(kit => kit.isPremium).map(kit => (
                      <button
                        key={kit.id}
                        data-testid={`style_kit_${kit.id}`}
                        onClick={() => handleKitSelect(kit)}
                        className={`rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                          kit.id === currentStyleKitId
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Premium badge */}
                        <div className="mb-1 flex items-center justify-between">
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            PRO
                          </span>
                        </div>

                        {/* Preview canvas */}
                        <div
                          className="mb-2 flex h-24 items-center justify-center rounded border"
                          style={{
                            backgroundColor: kit.colors.background,
                            borderColor: kit.colors.foreground + '20',
                          }}
                        >
                          <div className="space-y-1 p-2 text-center">
                            <div
                              className="text-xs font-bold"
                              style={{
                                color: kit.colors.foreground,
                                fontFamily: kit.typography.headline_font,
                              }}
                            >
                              Headline
                            </div>
                            <div
                              className="text-[10px]"
                              style={{
                                color: kit.colors.foreground,
                                fontFamily: kit.typography.body_font,
                              }}
                            >
                              Body text preview
                            </div>
                            <div
                              className="mx-auto h-1 w-8 rounded"
                              style={{ backgroundColor: kit.colors.accent }}
                            />
                          </div>
                        </div>

                        {/* Kit info */}
                        <p className="mb-1 text-sm font-medium text-gray-900">
                          {kit.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {kit.typography.headline_font}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
