'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';
import { useSubscription } from '~/hooks/use-subscription';

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
  const subscription = useSubscription();
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
  const [projectCount, setProjectCount] = useState<number>(0);

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

  // Fetch project count for carousel limit check
  useEffect(() => {
    async function fetchProjectCount() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projects = await response.json();
          setProjectCount(projects.length);
        }
      } catch (err) {
        console.error('Failed to fetch project count:', err);
      }
    }
    fetchProjectCount();
  }, []);

  // Check if user can create more carousels
  const carouselLimit = subscription.getLimit('carousels');
  const hasReachedCarouselLimit = carouselLimit !== -1 && projectCount >= carouselLimit;

  // Check if user can access selected style kit
  const selectedKit = styleKits.find(kit => kit.id === selectedStyleKit);
  const canAccessStyleKit = !selectedKit?.isPremium || subscription.tier !== 'FREE';

  // Filter style kits based on tier
  const availableStyleKits = styleKits.filter(kit => {
    if (!kit.isPremium) return true; // Free kits available to all
    return subscription.tier !== 'FREE'; // Premium kits only for Creator/Pro
  });

  // Get max slides for tier
  const maxSlides = subscription.getLimit('slides');

  const handleGenerate = async () => {
    // Check carousel limit
    if (hasReachedCarouselLimit) {
      setError(`You've reached your limit of ${carouselLimit} carousels. Upgrade to create more.`);
      return;
    }

    // Check style kit access
    if (!canAccessStyleKit) {
      setError('This style kit requires a Creator or Pro subscription.');
      return;
    }

    // Check slide count limit
    if (slideCount > maxSlides) {
      setError(`Your plan allows up to ${maxSlides} slides. Upgrade for more.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Generate slides with AI
      const endpoint = mode === 'topic' ? '/api/generate/topic' : '/api/generate/text';
      const body = mode === 'topic' 
        ? { topic, slideCount, tone, applyBrandKit, styleKitId: selectedStyleKit }
        : { text, slideCount, tone, applyBrandKit, styleKitId: selectedStyleKit };

      const generateResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error?.message || 'Generation failed');
      }

      const generateData = await generateResponse.json();
      const { slides, metadata } = generateData;

      // Step 2: Create project
      const projectTitle = mode === 'topic' 
        ? metadata.topic 
        : `Carousel - ${new Date().toLocaleDateString()}`;

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          styleKitId: selectedStyleKit,
        }),
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create project');
      }

      const project = await projectResponse.json();

      // Step 3: Create slides for the project
      const slidePromises = slides.map((slide: any, index: number) => 
        fetch('/api/slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            orderIndex: index,
            layoutId: slide.layoutId,
            slideType: slide.slideType,
            content: {
              headline: slide.headline,
              body: slide.body || [],
              emphasis: slide.emphasis || [],
            },
          }),
        })
      );

      await Promise.all(slidePromises);

      // Step 4: Navigate to editor
      router.push(`/en/editor/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

      {/* Carousel Limit Warning */}
      {hasReachedCarouselLimit && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Carousel Limit Reached</h3>
              <p className="text-sm text-yellow-800 mb-2">
                You've created {projectCount} of {carouselLimit} carousels allowed on your {subscription.tier} plan.
              </p>
              <Link href="/settings/billing">
                <Button size="sm" variant="default" data-testid="upgrade_prompt">
                  Upgrade to Create More
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

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
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableStyleKits.map((kit) => (
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
              {subscription.tier === 'FREE' && styleKits.some(kit => kit.isPremium) && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md" data-testid="upgrade_prompt">
                  <p className="text-sm text-purple-900">
                    🎨 <strong>Unlock all {styleKits.length} style kits</strong> with Creator or Pro. 
                    <Link href="/settings/billing" className="ml-1 text-purple-700 font-medium hover:underline">
                      Upgrade now
                    </Link>
                  </p>
                </div>
              )}
            </>
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
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].filter(count => count <= maxSlides).map(count => (
                <option key={count} value={count}>{count} slides</option>
              ))}
            </select>
            {subscription.tier !== 'PRO' && maxSlides < 20 && (
              <p className="text-xs text-gray-500 mt-1">
                Your plan allows up to {maxSlides} slides. <Link href="/settings/billing" className="text-blue-600 hover:underline">Upgrade</Link> for more.
              </p>
            )}
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
          {loading ? (
            <span data-testid="generation_loading" className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Carousel'
          )}
        </Button>
      </Card>
    </div>
  );
}
