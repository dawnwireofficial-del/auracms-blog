import React, { createContext, useContext, useState, useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useDevicePerformance } from '../../hooks/useDevicePerformance';
import { MotionConfig, defaultConfig, AnimationQuality, animationBudgets } from '../../lib/motion/animation-config';

interface MotionContextType extends MotionConfig {
  setGlobalEnabled: (enabled: boolean) => void;
  setQuality: (quality: AnimationQuality) => void;
  budgets: typeof animationBudgets.balanced;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

const MotionContext = createContext<MotionContextType>({
  ...defaultConfig,
  setGlobalEnabled: () => {},
  setQuality: () => {},
  budgets: animationBudgets.balanced,
  isPaused: false,
  setIsPaused: () => {}
});

export const useMotion = () => useContext(MotionContext);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const { performanceQuality, isLowPerformance } = useDevicePerformance();

  const [globalEnabled, setGlobalEnabled] = useState(defaultConfig.globalEnabled);
  const [quality, setQuality] = useState<AnimationQuality>(defaultConfig.quality);
  const [isPaused, setIsPaused] = useState(false);

  // Sync with device capabilities on mount, but allow overrides
  useEffect(() => {
    if (prefersReducedMotion) {
      setQuality('disabled');
      setGlobalEnabled(false);
    } else {
      setQuality(performanceQuality);
    }
  }, [prefersReducedMotion, performanceQuality]);

  // Handle page visibility (pause animations when tab is inactive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const currentBudgets = animationBudgets[quality] || animationBudgets.balanced;
  const isActuallyEnabled = globalEnabled && quality !== 'disabled' && !prefersReducedMotion;

  return (
    <MotionContext.Provider
      value={{
        globalEnabled: isActuallyEnabled,
        quality,
        prefersReducedMotion,
        isLowPerformance,
        batterySaver: false,
        setGlobalEnabled,
        setQuality,
        budgets: currentBudgets,
        isPaused,
        setIsPaused
      }}
    >
      {children}
    </MotionContext.Provider>
  );
}
