'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <div className="text-center max-w-md px-8">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-12 h-12 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Something Went Wrong</h1>
          <div className="h-1 w-24 bg-red-500 mx-auto mt-4 mb-6 rounded-full"></div>
        </div>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          We encountered an unexpected error. Don't worry, your work has been saved.
        </p>
        
        {error.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-left">
            <p className="font-semibold text-red-800 mb-1">Error Details:</p>
            <p className="text-red-700 break-words">{error.message}</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Link href="/en/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          If this issue persists, please <Link href="/en/docs" className="text-primary hover:underline">contact support</Link>
        </p>
      </div>
    </div>
  );
}
