'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';

export default function CreateCarouselPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'topic' | 'text'>('topic');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [tone, setTone] = useState<'bold' | 'calm' | 'contrarian' | 'professional'>('professional');
  const [applyBrandKit, setApplyBrandKit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'topic' ? '/api/generate/topic' : '/api/generate/text';
      const body = mode === 'topic' 
        ? { topic, slideCount, tone, applyBrandKit }
        : { text, slideCount, tone, applyBrandKit };

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
              variant={mode === 'topic' ? 'default' : 'outline'}
              onClick={() => setMode('topic')}
            >
              From Topic
            </Button>
            <Button
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
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your text, notes, or draft content here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
            />
            <p className="text-sm text-gray-500 mt-1">{text.length}/10,000 characters</p>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Slide Count */}
          <div>
            <Label htmlFor="slideCount" className="mb-2 block">Slide Count</Label>
            <select
              id="slideCount"
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
