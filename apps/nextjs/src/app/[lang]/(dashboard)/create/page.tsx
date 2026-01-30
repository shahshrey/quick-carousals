'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';

interface StyleKit {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
  };
  typography: {
    headline_font: string;
    headline_weight: number;
    body_font: string;
    body_weight: number;
  };
  isPremium: boolean;
}

export default function CreateCarouselPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'topic' | 'text'>('topic');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [tone, setTone] = useState<'bold' | 'calm' | 'contrarian' | 'professional'>('professional');
  const [selectedStyleKit, setSelectedStyleKit] = useState<string>('minimal_clean');
  const [styleKits, setStyleKits] = useState<StyleKit[]>([]);
  const [applyBrandKit, setApplyBrandKit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch style kits on mount
  useEffect(() => {
    async function fetchStyleKits() {
      try {
        const response = await fetch('/api/style-kits');
        if (response.ok) {
          const kits = await response.json();
          setStyleKits(kits);
        }
      } catch (err) {
        console.error('Failed to fetch style kits:', err);
      }
    }
    fetchStyleKits();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'topic' ? '/api/generate/topic' : '/api/generate/text';
      const body = mode === 'topic' 
        ? { topic, slideCount, tone, applyBrandKit, styleKitId: selectedStyleKit }
        : { text, slideCount, tone, applyBrandKit, styleKitId: selectedStyleKit };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Generation failed');
      }

      const data = await response.json();
      
      // TODO: Navigate to editor with generated slides
      // For now, just log the data
      console.log('Generated slides:', data);
      
      // In feature-40, this will navigate to the editor with the project ID
      // router.push(`/en/editor/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isValid = mode === 'topic' 
    ? topic.trim().length > 0 
    : text.trim().length >= 10;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Carousel</h1>
        <p className="text-gray-600">Generate a professional LinkedIn carousel in minutes</p>
      </div>

      <Card className="p-6 mb-6">
        {/* Mode Selection */}
        <div className="mb-6">
          <Label className="mb-3 block">Choose Mode</Label>
          <div className="flex gap-2">
            <Button
              data-testid="mode_topic"
              variant={mode === 'topic' ? 'default' : 'outline'}
              onClick={() => setMode('topic')}
            >
              From Topic
            </Button>
            <Button
              data-testid="mode_text"
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
            >
              From Text
            </Button>
          </div>
        </div>

        {/* Input Area */}
        {mode === 'topic' ? (
          <div className="mb-6">
            <Label htmlFor="topic" className="mb-2 block">Topic</Label>
            <Input
              id="topic"
              data-testid="topic_input"
              placeholder="e.g., 5 ways to improve your LinkedIn engagement"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">{topic.length}/500 characters</p>
          </div>
        ) : (
          <div className="mb-6">
            <Label htmlFor="text" className="mb-2 block">Text Content</Label>
            <textarea
              id="text"
              data-testid="text_input"
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your text, notes, or draft content here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
            />
            <p className="text-sm text-gray-500 mt-1">{text.length}/10,000 characters</p>
          </div>
        )}

        {/* Style Kit Selection */}
        <div className="mb-6">
          <Label className="mb-3 block">Choose Style Kit</Label>
          {styleKits.length === 0 ? (
            <p className="text-sm text-gray-500">Loading style kits...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {styleKits.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => setSelectedStyleKit(kit.id)}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    selectedStyleKit === kit.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded mb-2"
                    style={{ backgroundColor: kit.colors.background }}
                  >
                    <div
                      className="w-1/2 h-full rounded"
                      style={{ backgroundColor: kit.colors.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{kit.name}</p>
                  {kit.isPremium && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      PRO
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Slide Count */}
          <div>
            <Label htmlFor="slideCount" className="mb-2 block">Slide Count</Label>
            <select
              id="slideCount"
              data-testid="slide_count"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
            >
              {[8, 9, 10, 11, 12].map(count => (
                <option key={count} value={count}>{count} slides</option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <Label htmlFor="tone" className="mb-2 block">Tone</Label>
            <select
              id="tone"
              data-testid="tone_selector"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
            >
              <option value="professional">Professional</option>
              <option value="bold">Bold</option>
              <option value="calm">Calm</option>
              <option value="contrarian">Contrarian</option>
            </select>
          </div>
        </div>

        {/* Brand Kit Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="brand_kit_toggle" className="font-medium">Apply Brand Kit</Label>
              <p className="text-sm text-gray-600 mt-1">
                Use your brand colors, fonts, logo, and handle
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="brand_kit_toggle"
                data-testid="brand_kit_toggle"
                className="sr-only peer"
                checked={applyBrandKit}
                onChange={(e) => setApplyBrandKit(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <Button
          data-testid="generate_button"
          className="w-full"
          onClick={handleGenerate}
          disabled={!isValid || loading}
        >
          {loading ? 'Generating...' : 'Generate Carousel'}
        </Button>
      </Card>
    </div>
  );
}
