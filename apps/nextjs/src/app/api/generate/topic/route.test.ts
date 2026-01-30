/**
 * Tests for POST /api/generate/topic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock OpenAI functions
vi.mock('~/lib/openai', () => ({
  generateSlidePlan: vi.fn(),
  generateSlideCopy: vi.fn(),
  selectLayoutsForSlides: vi.fn(),
}));

describe('POST /api/generate/topic', () => {
  let mockAuth: any;
  let mockGenerateSlidePlan: any;
  let mockGenerateSlideCopy: any;
  let mockSelectLayoutsForSlides: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup auth mock
    const clerkModule = await import('@clerk/nextjs/server');
    mockAuth = clerkModule.auth as any;

    // Setup OpenAI mocks
    const openaiModule = await import('~/lib/openai');
    mockGenerateSlidePlan = openaiModule.generateSlidePlan as any;
    mockGenerateSlideCopy = openaiModule.generateSlideCopy as any;
    mockSelectLayoutsForSlides = openaiModule.selectLayoutsForSlides as any;

    // Default: authenticated user
    mockAuth.mockResolvedValue({ userId: 'test-user-123' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  it('returns 401 if not authenticated', async () => {
    // Mock unauthenticated request
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  it('returns 400 for empty request body', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing topic field', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideCount: 10 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid slideCount (too low)', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic', slideCount: 5 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid slideCount (too high)', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic', slideCount: 20 }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid tone', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic', tone: 'invalid-tone' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  // ============================================================================
  // Success Tests
  // ============================================================================

  it('generates slides successfully with valid input', async () => {
    // Mock OpenAI responses
    const mockPlan = {
      slides: [
        { slideType: 'hook', goal: 'Hook goal', headline: 'Hook headline', body: ['Hook body'], emphasis: [] },
        { slideType: 'promise', goal: 'Promise goal', headline: 'Promise headline', body: ['Promise body'], emphasis: [] },
        { slideType: 'value', goal: 'Value goal', headline: 'Value headline', body: ['Value body'], emphasis: [] },
        { slideType: 'value', goal: 'Value goal 2', headline: 'Value headline 2', body: ['Value body 2'], emphasis: [] },
        { slideType: 'value', goal: 'Value goal 3', headline: 'Value headline 3', body: ['Value body 3'], emphasis: [] },
        { slideType: 'value', goal: 'Value goal 4', headline: 'Value headline 4', body: ['Value body 4'], emphasis: [] },
        { slideType: 'value', goal: 'Value goal 5', headline: 'Value headline 5', body: ['Value body 5'], emphasis: [] },
        { slideType: 'recap', goal: 'Recap goal', headline: 'Recap headline', body: ['Recap body'], emphasis: [] },
        { slideType: 'cta', goal: 'CTA goal', headline: 'CTA headline', body: ['CTA body'], emphasis: [] },
      ],
    };

    const mockCopy = [
      { headline: 'Hook headline', body: ['Hook body'], emphasis_text: [] },
      { headline: 'Promise headline', body: ['Promise body'], emphasis_text: [] },
      { headline: 'Value headline', body: ['Value body'], emphasis_text: [] },
      { headline: 'Value headline 2', body: ['Value body 2'], emphasis_text: [] },
      { headline: 'Value headline 3', body: ['Value body 3'], emphasis_text: [] },
      { headline: 'Value headline 4', body: ['Value body 4'], emphasis_text: [] },
      { headline: 'Value headline 5', body: ['Value body 5'], emphasis_text: [] },
      { headline: 'Recap headline', body: ['Recap body'], emphasis_text: [] },
      { headline: 'CTA headline', body: ['CTA body'], emphasis_text: [] },
    ];

    const mockLayouts = [
      'hook_big_headline',
      'promise_two_column',
      'value_bullets',
      'value_bullets',
      'value_bullets',
      'value_bullets',
      'value_bullets',
      'recap_grid',
      'cta_centered',
    ];

    mockGenerateSlidePlan.mockResolvedValue(mockPlan);
    mockGenerateSlideCopy.mockResolvedValue(mockCopy);
    mockSelectLayoutsForSlides.mockReturnValue(mockLayouts);

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'How to build a SaaS product' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.slides).toBeDefined();
    expect(json.slides.length).toBeGreaterThanOrEqual(8);
    expect(json.slides.length).toBeLessThanOrEqual(12);
    expect(json.metadata.topic).toBe('How to build a SaaS product');

    // Verify each slide has required fields
    json.slides.forEach((slide: any) => {
      expect(slide.orderIndex).toBeGreaterThanOrEqual(0);
      expect(slide.slideType).toBeTruthy();
      expect(slide.layoutId).toBeTruthy();
      expect(slide.headline).toBeTruthy();
      expect(Array.isArray(slide.body)).toBe(true);
    });
  });

  it('uses default values for optional fields', async () => {
    // Mock OpenAI responses
    const mockPlan = {
      slides: Array.from({ length: 10 }, (_, i) => ({
        slideType: 'value',
        goal: `Slide ${i} goal`,
        headline: `Slide ${i} headline`,
        body: [`Slide ${i} body`],
        emphasis: [],
      })),
    };

    const mockCopy = Array.from({ length: 10 }, (_, i) => ({
      headline: `Slide ${i} headline`,
      body: [`Slide ${i} body`],
      emphasis_text: [],
    }));

    const mockLayouts = Array.from({ length: 10 }, () => 'value_bullets');

    mockGenerateSlidePlan.mockResolvedValue(mockPlan);
    mockGenerateSlideCopy.mockResolvedValue(mockCopy);
    mockSelectLayoutsForSlides.mockReturnValue(mockLayouts);

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }), // No optional fields
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.metadata.tone).toBe('professional'); // Default tone
    expect(json.metadata.slideCount).toBe(10); // Default slideCount
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('handles OpenAI timeout gracefully', async () => {
    mockGenerateSlidePlan.mockRejectedValue(new Error('Request timeout'));

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.message).toContain('timed out');
  });

  it('handles OpenAI rate limit error', async () => {
    mockGenerateSlidePlan.mockRejectedValue(new Error('Rate limit exceeded'));

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(429);

    const json = await response.json();
    expect(json.error.code).toBe('RATE_LIMITED');
  });

  it('handles generic OpenAI failure', async () => {
    mockGenerateSlidePlan.mockRejectedValue(new Error('OpenAI service error'));

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });

  it('handles empty slide plan from AI', async () => {
    mockGenerateSlidePlan.mockResolvedValue({ slides: [] });

    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/generate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test topic' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error.message).toContain('empty slide plan');
  });
});
