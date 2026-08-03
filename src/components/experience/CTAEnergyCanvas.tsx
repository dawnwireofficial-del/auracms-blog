import React, { useEffect, useRef } from 'react';
import { experienceConfig } from './ExperienceSettings';

export const CTAEnergyCanvas: React.FC<{ className?: string }> = ({ className = 'absolute inset-0' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Converging energy rays toward center
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      angle += 0.004 * experienceConfig.motionIntensity;

      for (let i = 0; i < 16; i++) {
        const rayAngle = (i / 16) * Math.PI * 2 + angle;
        const x1 = centerX + Math.cos(rayAngle) * 350;
        const y1 = centerY + Math.sin(rayAngle) * 350;
        const x2 = centerX + Math.cos(rayAngle) * 60;
        const y2 = centerY + Math.sin(rayAngle) * 60;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'rgba(255, 180, 91, 0)');
        gradient.addColorStop(1, 'rgba(255, 180, 91, 0.25)');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none z-0 ${className}`}
    />
  );
};
