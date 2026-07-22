import React, { useState, useEffect } from 'react';

interface PageProgressBarProps {
  isLoading?: boolean;
}

export const PageProgressBar: React.FC<PageProgressBarProps> = ({ isLoading: externalIsLoading }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timerFinish: NodeJS.Timeout;

    const startProgress = () => {
      setIsVisible(true);
      setProgress(15);

      timer1 = setTimeout(() => {
        setProgress(45);
      }, 100);

      timer2 = setTimeout(() => {
        setProgress(75);
      }, 250);

      timer3 = setTimeout(() => {
        setProgress(90);
      }, 400);
    };

    const finishProgress = () => {
      setProgress(100);
      timerFinish = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    };

    const handleNavStart = () => {
      startProgress();
    };

    const handleNavEnd = () => {
      finishProgress();
    };

    // Listen for custom navigation events and popstate
    window.addEventListener('page-navigation-start', handleNavStart);
    window.addEventListener('page-navigation-end', handleNavEnd);
    window.addEventListener('popstate', startProgress);

    if (externalIsLoading) {
      startProgress();
    } else if (isVisible && progress > 0) {
      finishProgress();
    }

    return () => {
      window.removeEventListener('page-navigation-start', handleNavStart);
      window.removeEventListener('page-navigation-end', handleNavEnd);
      window.removeEventListener('popstate', startProgress);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFinish);
    };
  }, [externalIsLoading]);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none h-1 bg-transparent overflow-hidden">
      {/* Glowing animated progress bar */}
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(249,115,22,0.9)] relative"
        style={{ width: `${progress}%` }}
      >
        {/* Leading edge light pulse */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/80 blur-xs shadow-[0_0_10px_#fff]" />
      </div>
    </div>
  );
};
