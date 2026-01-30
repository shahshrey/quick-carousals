import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from './use-auto-save';

// Mock fetch globally
global.fetch = vi.fn();

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Debouncing', () => {
    it('should not save immediately on change', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'project-1' }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.save({ title: 'Test Project' });
      });

      // Should not call fetch immediately
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('should save after debounce delay (500ms)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'project-1' }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.save({ title: 'Test Project' });
      });

      // Fast-forward time by 500ms and flush promises
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Test Project' }),
      });
    });

    it('should cancel previous save if new change comes within debounce window', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'project-1' }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      // First change
      act(() => {
        result.current.save({ title: 'First' });
      });

      // Advance 300ms (not enough to trigger save)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Second change (should cancel first save)
      act(() => {
        result.current.save({ title: 'Second' });
      });

      // Advance 500ms from second change and flush promises
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should only save once with the latest value
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Second' }),
      });
    });
  });

  describe('Save Status Indicator', () => {
    it('should transition from idle -> saving -> saved', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'project-1' }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      // Initial state
      expect(result.current.status).toBe('idle');

      // Trigger save
      act(() => {
        result.current.save({ title: 'Test' });
      });

      // Still idle during debounce
      expect(result.current.status).toBe('idle');

      // Advance past debounce and run async operations
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should be saved
      expect(result.current.status).toBe('saved');
    });

    it('should show error state on save failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Save failed' },
        }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.save({ title: 'Test' });
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Save failed');
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.save({ title: 'Test' });
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Custom Save Function', () => {
    it('should use custom onSave if provided', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
          onSave: mockOnSave,
        })
      );

      act(() => {
        result.current.save({ title: 'Test' });
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({ title: 'Test' });

      // Should NOT call fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Enabled Flag', () => {
    it('should not save when enabled is false', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: 'project-1',
          debounceMs: 500,
          enabled: false,
        })
      );

      act(() => {
        result.current.save({ title: 'Test' });
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not save when projectId is missing', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useAutoSave({
          projectId: undefined,
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.save({ title: 'Test' });
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
