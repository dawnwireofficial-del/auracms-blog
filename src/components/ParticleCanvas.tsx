import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface ParticleCanvasProps {
  color?: string;
  particleCount?: number;
}

export default function ParticleCanvas({ 
  color = 'rgba(0, 210, 255, 0.5)', 
  particleCount = 50 
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];

    const isMobile = window.innerWidth < 768;
    const finalCount = isMobile ? Math.min(particleCount, 25) : particleCount;

    for (let i = 0; i < finalCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // Dynamic opacity based on distance
            const alpha = (1 - dist / 100) * 0.2;
            ctx.strokeStyle = color.replace(/[\d.]+\)$/g, `${alpha})`);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    // Pause on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, particleCount, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-brand-primary/5"></div>;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
    />
  );
}
