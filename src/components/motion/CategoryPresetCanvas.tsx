import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';
import { getPresetForCategory, CategoryPresetConfig } from '../../lib/motion/animation-presets';

interface CategoryPresetCanvasProps {
  categorySlugOrName: string;
  className?: string;
}

export default function CategoryPresetCanvas({
  categorySlugOrName,
  className = '',
}: CategoryPresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 250);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const preset: CategoryPresetConfig = getPresetForCategory(categorySlugOrName);

    // Particle objects
    const count = Math.floor(25 * preset.particleCountMultiplier);
    const items = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * preset.speedMultiplier,
      vy: (Math.random() - 0.5) * preset.speedMultiplier,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let step = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      step += 0.02 * preset.speedMultiplier;
      ctx.clearRect(0, 0, width, height);

      // Draw Preset specific visual patterns
      if (preset.particleType === 'grid') {
        ctx.strokeStyle = `${preset.accentColor}15`;
        ctx.lineWidth = 1;
        const gridSize = 35;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Render items
      for (const item of items) {
        item.x += item.vx;
        item.y += item.vy;

        if (item.x < 0 || item.x > width) item.vx *= -1;
        if (item.y < 0 || item.y > height) item.vy *= -1;

        ctx.beginPath();
        if (preset.particleType === 'pixels') {
          ctx.rect(item.x, item.y, item.size * 1.5, item.size * 1.5);
        } else {
          ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
        }

        ctx.fillStyle = `${preset.accentColor}${Math.floor(item.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = preset.accentColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [globalEnabled, categorySlugOrName, isPaused, budgets]);

  if (!globalEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
