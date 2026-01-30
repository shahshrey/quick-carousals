'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Unable to Load Dashboard
          </h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          We're having trouble loading your dashboard. This might be a temporary issue.
        </p>
        
        {error.message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-left">
            <p className="font-medium text-red-800">Error:</p>
            <p className="text-red-700 mt-1">{error.message}</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            Retry
          </Button>
          <Link href="/en">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
