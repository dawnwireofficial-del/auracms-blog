import { useState, useEffect } from 'react';
import { AnimationQuality } from '../lib/motion/animation-config';

export function useDevicePerformance() {
  const [performanceQuality, setPerformanceQuality] = useState<AnimationQuality>('balanced');
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Detect device capabilities
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    // @ts-ignore - memory is a non-standard property but available in some browsers
    const deviceMemory = navigator.deviceMemory || 4;
    
    // Check if device is likely a mobile device based on screen width
    const isMobile = window.innerWidth <= 768;

    if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
      // Low-end device
      setPerformanceQuality('minimal');
      setIsLowPerformance(true);
    } else if (isMobile) {
      // Mid-range or mobile
      setPerformanceQuality('minimal');
    } else if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
      // High-end desktop
      setPerformanceQuality('full');
    } else {
      // Default / Balanced
      setPerformanceQuality('balanced');
    }

  }, []);

  return { performanceQuality, isLowPerformance };
}
