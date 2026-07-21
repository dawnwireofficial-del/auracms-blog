import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';

interface ProductSpotlightProps {
  className?: string;
  accentColor?: string;
}

export default function ProductSpotlight({
  className = '',
  accentColor = '#246BFF',
}: ProductSpotlightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles = Array.from({ length: 15 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 100,
      speed: 0.005 + Math.random() * 0.005,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Radial Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, width * 0.45);
      gradient.addColorStop(0, `${accentColor}30`);
      gradient.addColorStop(0.5, `${accentColor}10`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Orbiting particles
      for (const p of particles) {
        p.angle += p.speed;
        const px = centerX + Math.cos(p.angle) * p.radius;
        const py = centerY + Math.sin(p.angle) * p.radius;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${accentColor}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [globalEnabled, accentColor, isPaused, budgets]);

  if (!globalEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
