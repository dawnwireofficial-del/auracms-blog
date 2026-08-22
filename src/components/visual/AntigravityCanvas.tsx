import React, { useEffect, useRef } from 'react';

/**
 * Antigravity-style ambient particle field.
 * - Weightless drifting particles in brand colors, connected by faint lines
 *   when close, gently repelled by the cursor ("antigravity" feel).
 * - DPR-aware, pauses when tab hidden or offscreen, honors reduced motion.
 * Rendered behind content via absolute positioning; pointer-events: none.
 */
export default function AntigravityCanvas({
  className = '',
  density = 0.00008,
  colors = ['#246BFF', '#FF8A00', '#38BDF8', '#A78BFA'],
}: {
  className?: string;
  density?: number;
  colors?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let running = true;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    interface P { x: number; y: number; vx: number; vy: number; r: number; c: string; phase: number }
    let particles: P[] = [];
    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      const count = Math.max(28, Math.min(90, Math.floor(w * h * density)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 2.2,
        c: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    const LINK_DIST = 110;
    const tick = () => {
      if (!running || !visible) return;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.phase += 0.01;
        // weightless float
        p.x += p.vx + Math.sin(p.phase) * 0.12;
        p.y += p.vy + Math.cos(p.phase * 0.8) * 0.12;
        // cursor repulsion — antigravity push
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 120 * 120 && dist2 > 0.01) {
          const d = Math.sqrt(dist2);
          const f = ((120 - d) / 120) * 0.6;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }

      // links
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.18;
            ctx.strokeStyle = `rgba(148, 178, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // dots with glow
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.55 + Math.sin(p.phase * 2) * 0.2;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    const host = canvas.parentElement || canvas;
    host.addEventListener('pointermove', onMove as EventListener);
    host.addEventListener('pointerleave', onLeave);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const onVis = () => {
      running = !document.hidden;
      if (running && !reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
    };
    document.addEventListener('visibilitychange', onVis);

    if (reduced) {
      // static single frame
      visible = true; running = true;
      tick();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      host.removeEventListener('pointermove', onMove as EventListener);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [colors, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity: 0.7 }}
    />
  );
}
