import React, { useEffect, useRef } from 'react';
import { experienceConfig } from './ExperienceSettings';

export const FeaturedProductOrbitCanvas: React.FC<{ className?: string }> = ({ className = 'absolute inset-0' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Orbital rings around featured product stage
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      angle += 0.005 * experienceConfig.motionIntensity;

      // Concentric illuminated orbit rings
      [90, 150, 220].forEach((r, idx) => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 0.45, angle * (idx % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
        ctx.strokeStyle = idx === 1 ? 'rgba(76, 130, 255, 0.25)' : 'rgba(42, 215, 247, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash(idx === 0 ? [8, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Orbiting pulse node
      const nodeAngle = angle * 2;
      const nx = centerX + Math.cos(nodeAngle) * 150;
      const ny = centerY + Math.sin(nodeAngle) * (150 * 0.45);

      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4c82ff';
      ctx.shadowColor = '#4c82ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

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
