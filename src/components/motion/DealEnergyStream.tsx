import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';

export default function DealEnergyStream({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const lines = Array.from({ length: 3 }, (_, i) => ({
      y: (height / 4) * (i + 1),
      speed: 0.5 + i * 0.3,
      offset: i * 100,
    }));

    let progress = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      progress += 1;
      ctx.clearRect(0, 0, width, height);

      for (const line of lines) {
        const x = (progress * line.speed + line.offset) % (width + 200) - 100;
        const gradient = ctx.createLinearGradient(x - 100, line.y, x + 100, line.y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)'); // Energy red accent for deals
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(x - 100, line.y);
        ctx.lineTo(x + 100, line.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
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
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
