/**
 * Tests for /api/generate/text
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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

describe('POST /api/generate/text', () => {
  let mockAuth: any;
  let mockGenerateSlidePlan: any;
  let mockGenerateSlideCopy: any;
  let mockSelectLayoutsForSlides: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Import mocked functions
    const clerkModule = await import('@clerk/nextjs/server');
    mockAuth = clerkModule.auth as any;
    
    const openaiModule = await import('~/lib/openai');
    mockGenerateSlidePlan = openaiModule.generateSlidePlan as any;
    mockGenerateSlideCopy = openaiModule.generateSlideCopy as any;
    mockSelectLayoutsForSlides = openaiModule.selectLayoutsForSlides as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null });
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: 'Test text for carousel generation' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('returns 400 when text is missing', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('returns 400 when text is too short', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: 'hi' }), // Only 2 chars
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('returns 400 when text is too long', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    const { POST } = await import('./route');
    
    const longText = 'a'.repeat(10001); // 10,001 chars
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: longText }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('generates slides successfully with short text', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    // Mock AI responses
    const mockPlan = {
      slides: [
        { slideType: 'hook', goal: 'Grab attention', headline: 'Great Hook', body: ['Engaging'], emphasis: [] },
        { slideType: 'value', goal: 'Provide value', headline: 'Value Point', body: ['Detail 1', 'Detail 2'], emphasis: [] },
      ],
      tone: 'professional',
      targetSlideCount: 5,
    };
    
    const mockCopy = [
      { headline: 'Great Hook', body: ['Engaging opener'], emphasis_text: [] },
      { headline: 'Value Point', body: ['Detail 1', 'Detail 2'], emphasis_text: [] },
    ];
    
    const mockLayouts = ['hook_big_headline', 'value_bullets'];
    
    mockGenerateSlidePlan.mockResolvedValue(mockPlan);
    mockGenerateSlideCopy.mockResolvedValue(mockCopy);
    mockSelectLayoutsForSlides.mockReturnValue(mockLayouts);
    
    const { POST } = await import('./route');
    
    const shortText = 'This is a short piece of text that needs to be expanded.';
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ 
        text: shortText,
        slideCount: 5,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.slides).toBeDefined();
    expect(data.slides.length).toBe(2);
    expect(data.metadata.textLength).toBe(shortText.length);
    expect(data.metadata.slideCount).toBe(2);
  });

  it('generates slides successfully with long text', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    // Mock AI responses for long text (should condense)
    const mockPlan = {
      slides: Array.from({ length: 15 }, (_, i) => ({
        slideType: i === 0 ? 'hook' : i === 14 ? 'cta' : 'value',
        goal: `Goal ${i}`,
        headline: `Headline ${i}`,
        body: [`Body ${i}`],
        emphasis: [],
      })),
      tone: 'professional',
      targetSlideCount: 15,
    };
    
    const mockCopy = Array.from({ length: 15 }, (_, i) => ({
      headline: `Headline ${i}`,
      body: [`Body ${i}`],
      emphasis_text: [],
    }));
    
    const mockLayouts = Array.from({ length: 15 }, () => 'generic_single_focus');
    
    mockGenerateSlidePlan.mockResolvedValue(mockPlan);
    mockGenerateSlideCopy.mockResolvedValue(mockCopy);
    mockSelectLayoutsForSlides.mockReturnValue(mockLayouts);
    
    const { POST } = await import('./route');
    
    const longText = 'a'.repeat(7000); // 7000 chars
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: longText }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.slides).toBeDefined();
    expect(data.slides.length).toBe(15);
    expect(data.metadata.textLength).toBe(7000);
  });

  it('handles AI generation errors', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    mockGenerateSlidePlan.mockRejectedValue(new Error('OpenAI API error'));
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: 'Test text for error handling' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
  });

  it('handles rate limit errors', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    mockGenerateSlidePlan.mockRejectedValue(new Error('Rate limit exceeded'));
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ text: 'Test text for rate limit' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(429);
  });

  it('respects requested slideCount', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123' });
    
    const mockPlan = {
      slides: Array.from({ length: 8 }, (_, i) => ({
        slideType: 'value',
        goal: `Goal ${i}`,
        headline: `Headline ${i}`,
        body: [`Body ${i}`],
        emphasis: [],
      })),
      tone: 'bold',
      targetSlideCount: 8,
    };
    
    const mockCopy = Array.from({ length: 8 }, (_, i) => ({
      headline: `Headline ${i}`,
      body: [`Body ${i}`],
      emphasis_text: [],
    }));
    
    const mockLayouts = Array.from({ length: 8 }, () => 'generic_single_focus');
    
    mockGenerateSlidePlan.mockResolvedValue(mockPlan);
    mockGenerateSlideCopy.mockResolvedValue(mockCopy);
    mockSelectLayoutsForSlides.mockReturnValue(mockLayouts);
    
    const { POST } = await import('./route');
    
    const req = new NextRequest('http://localhost:3000/api/generate/text', {
      method: 'POST',
      body: JSON.stringify({ 
        text: 'Medium length text that should be chunked appropriately for the requested slide count.',
        slideCount: 8,
        tone: 'bold',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.slides.length).toBe(8);
    expect(data.metadata.tone).toBe('bold');
  });
});
