import React, { useEffect, useRef } from 'react';
import { experienceConfig } from './ExperienceSettings';

export const ToolDataFlowCanvas: React.FC<{ className?: string }> = ({ className = 'absolute inset-0' }) => {
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

    // Data streams flowing vertically/horizontally
    const streams = Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render matrix data stream lines
      streams.forEach((s) => {
        s.y += s.speed * experienceConfig.motionIntensity;
        if (s.y > height) {
          s.y = -s.length;
          s.x = Math.random() * width;
        }

        const gradient = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.length);
        gradient.addColorStop(0, 'rgba(42, 215, 247, 0)');
        gradient.addColorStop(1, `rgba(42, 215, 247, ${s.alpha})`);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.length);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

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
