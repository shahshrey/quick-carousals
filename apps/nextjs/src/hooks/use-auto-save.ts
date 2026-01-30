import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
  projectId?: string;
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
}

export interface UseAutoSaveReturn {
  status: SaveStatus;
  save: (data: any) => void;
  error: string | null;
}

/**
 * Hook for auto-saving project changes with debouncing
 * 
 * @param options - Configuration options
 * @returns Auto-save state and save function
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    projectId,
    debounceMs = 500,
    enabled = true,
    onSave,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<any>(null);

  // Save function with debouncing
  const save = useCallback((data: any) => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store pending data
    pendingDataRef.current = data;

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);
  }, [enabled, debounceMs]);

  // Actual save operation
  const performSave = async (data: any) => {
    if (!enabled || !projectId) return;

    setStatus('saving');
    setError(null);

    try {
      if (onSave) {
        // Use custom save function if provided
        await onSave(data);
      } else {
        // Default: Call PATCH /api/projects/:id
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to save project');
        }
      }

      setStatus('saved');
      setError(null);
    } catch (err: any) {
      console.error('Auto-save error:', err);
      setStatus('error');
      setError(err.message || 'Failed to save changes');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    save,
    error,
  };
}
