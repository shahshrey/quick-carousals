import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md px-8">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-800">404</h1>
          <div className="h-1 w-24 bg-primary mx-auto mt-4 mb-6 rounded-full"></div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/en/dashboard">
            <Button className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/en">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          Need help? <Link href="/en/docs" className="text-primary hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
