import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';

export default function DigitalHorizon({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 80);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let step = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      step += 0.5;
      ctx.clearRect(0, 0, width, height);

      // Horizontal Horizon Line
      const horizonY = height - 10;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.strokeStyle = 'rgba(36, 107, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Traveling horizon pulses
      const pulseX = (step * 2) % (width + 200) - 100;
      const grad = ctx.createLinearGradient(pulseX - 80, horizonY, pulseX + 80, horizonY);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.6)');
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(pulseX - 80, horizonY);
      ctx.lineTo(pulseX + 80, horizonY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [globalEnabled, isPaused, budgets]);

  if (!globalEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-16 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
