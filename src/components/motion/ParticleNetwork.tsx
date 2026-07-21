import React, { useRef, useEffect } from 'react';
import { useMotion } from './MotionProvider';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'node' | 'data' | 'category';
  label?: string;
}

interface Signal {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
}

const CATEGORY_LABELS = ['AI Tools', 'Smartphones', 'Laptops', 'Gaming', 'Fitness', 'Audio', 'Home Tech'];

export default function ParticleNetwork({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Device Pixel Ratio scaling
    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? Math.floor(budgets.maxParticles * 0.4) : budgets.maxParticles;
    const maxDistance = isMobile ? budgets.connectionDistance * 0.75 : budgets.connectionDistance;

    const particles: Particle[] = [];
    const signals: Signal[] = [];

    const colors = ['#246BFF', '#00F0FF', '#7000FF', '#3B82F6'];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const isCategory = i % 10 === 0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: isCategory ? 3.5 : Math.random() * 1.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: isCategory ? 'category' : Math.random() > 0.8 ? 'data' : 'node',
        label: isCategory ? CATEGORY_LABELS[Math.floor(Math.random() * CATEGORY_LABELS.length)] : undefined,
      });
    }

    // Pointer response for desktop
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Resize Observer
    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let lastTime = performance.now();
    const frameInterval = 1000 / budgets.fpsLimit;

    // Render Loop
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (isPaused) return;

      const delta = time - lastTime;
      if (delta < frameInterval) return;
      lastTime = time - (delta % frameInterval);

      ctx.clearRect(0, 0, width, height);

      // Draw connections & update signals
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move particle
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce edges
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse interaction
        if (!isMobile && mouseX > 0) {
          const dx = mouseX - p1.x;
          const dy = mouseY - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const angle = Math.atan2(dy, dx);
            const force = (120 - dist) / 120;
            p1.x -= Math.cos(angle) * force * 0.5;
            p1.y -= Math.sin(angle) * force * 0.5;
          }
        }

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(36, 107, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Spawn traveling signals randomly
            if (Math.random() < 0.0008 && signals.length < 15) {
              signals.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03,
                color: p1.color,
              });
            }
          }
        }

        // Draw Particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.shadowBlur = p1.type === 'category' ? 10 : 0;
        ctx.shadowColor = p1.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Category Label if present
        if (p1.label && !isMobile) {
          ctx.font = '10px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillText(p1.label, p1.x + 8, p1.y + 3);
        }
      }

      // Draw & Update Signals
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.progress += sig.speed;

        const p1 = particles[sig.fromIndex];
        const p2 = particles[sig.toIndex];

        if (!p1 || !p2 || sig.progress >= 1) {
          signals.splice(s, 1);
          continue;
        }

        const currX = p1.x + (p2.x - p1.x) * sig.progress;
        const currY = p1.y + (p2.y - p1.y) * sig.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2, 0, Math.PI * 2);
        ctx.fillStyle = sig.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = sig.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [globalEnabled, budgets, isPaused]);

  if (!globalEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
