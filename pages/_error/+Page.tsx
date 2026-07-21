import React from 'react';
import { usePageContext } from 'vike-react/usePageContext';

export default function Page() {
  const { is404 } = usePageContext();
  if (is404) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-brand-dark flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-display font-bold text-6xl text-brand-secondary">404</h1>
          <h2 className="font-display font-bold text-xl text-brand-primary dark:text-white">Page Not Found</h2>
          <p className="text-brand-muted text-sm">The page you are looking for does not exist or has been moved.</p>
          <a href="/" className="inline-block bg-brand-secondary hover:bg-blue-600 text-white font-semibold text-xs px-6 py-3 rounded-lg transition-all">Back to Home</a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-brand-bg dark:bg-brand-dark flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="font-display font-bold text-6xl text-red-500">500</h1>
        <h2 className="font-display font-bold text-xl text-brand-primary dark:text-white">Internal Server Error</h2>
        <p className="text-brand-muted text-sm">Something went wrong. Please try again later.</p>
        <a href="/" className="inline-block bg-brand-secondary hover:bg-blue-600 text-white font-semibold text-xs px-6 py-3 rounded-lg transition-all">Back to Home</a>
      </div>
    </div>
  );
}
