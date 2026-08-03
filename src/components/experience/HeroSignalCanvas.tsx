import React, { useEffect, useRef } from 'react';
import { experienceConfig } from './ExperienceSettings';

export const HeroSignalCanvas: React.FC<{ className?: string }> = ({ className = 'absolute inset-0' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Orbital particles around the hero center
    const orbits = Array.from({ length: 18 }, (_, i) => ({
      angle: (i / 18) * Math.PI * 2,
      radius: 100 + i * 14,
      speed: 0.003 + (i % 3) * 0.002,
      size: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.7;
      const centerY = height * 0.5;

      // Draw flowing signal wire curves
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const offset = i * 40;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3 + offset);

        const controlX = mouseX || width * 0.5;
        const controlY = mouseY || height * 0.5;

        ctx.quadraticCurveTo(controlX, controlY + offset, width, height * 0.2 + offset);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(42, 215, 247, 0.05)');
        gradient.addColorStop(0.5, 'rgba(76, 130, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(140, 108, 255, 0.05)');

        ctx.strokeStyle = gradient;
        ctx.stroke();
      }

      // Draw orbital node paths around hero bot center
      orbits.forEach((orb) => {
        orb.angle += orb.speed;

        const x = centerX + Math.cos(orb.angle) * orb.radius;
        const y = centerY + Math.sin(orb.angle) * (orb.radius * 0.5);

        ctx.beginPath();
        ctx.arc(x, y, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(42, 215, 247, 0.6)';
        ctx.shadowColor = '#2ad7f7';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
