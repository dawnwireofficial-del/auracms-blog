import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';

export default function TrendWave({ className = '' }: { className?: string }) {
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
    let height = (canvas.height = canvas.parentElement?.clientHeight || 150);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let step = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      step += 0.03;
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x < width; x += 10) {
        const y = Math.sin(x * 0.01 + step) * 20 + Math.cos(x * 0.015 + step) * 10 + height / 2;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00F0FF';
      ctx.stroke();
      ctx.shadowBlur = 0;
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
