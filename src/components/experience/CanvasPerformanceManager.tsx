import React, { useEffect } from 'react';
import { experienceConfig } from './ExperienceSettings';

export const CanvasPerformanceManager: React.FC = () => {
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const checkPerformance = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 2000) {
        const fps = (frameCount * 1000) / delta;
        if (fps < 40) {
          experienceConfig.particleDensity = 0.25;
          experienceConfig.canvasQuality = 'performance';
        }
        frameCount = 0;
        lastTime = now;
      }

      animId = requestAnimationFrame(checkPerformance);
    };

    animId = requestAnimationFrame(checkPerformance);

    return () => cancelAnimationFrame(animId);
  }, []);

  return null;
};
