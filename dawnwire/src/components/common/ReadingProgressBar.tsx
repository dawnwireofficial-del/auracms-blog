import React, { useState, useEffect } from 'react';

export const ReadingProgressBar: React.FC = () => {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (currentScroll / scrollHeight) * 100)));
      }
    };

    window.addEventListener('scroll', updateScroll);
    updateScroll();
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200/50 dark:bg-slate-800/50 z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-150 ease-out shadow-sm"
        style={{ width: `${readingProgress}%` }}
      />
    </div>
  );
};
