import React, { useEffect, useRef, useState } from 'react';

interface GravityParticleCanvasProps {
  className?: string;
  particleCount?: number;
  interactiveGravity?: boolean;
}

export const GravityParticleCanvas: React.FC<GravityParticleCanvasProps> = ({
  className = '',
  particleCount = 65,
  interactiveGravity = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gravityMode, setGravityMode] = useState<'attract' | 'swirl' | 'repulse'>('swirl');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Cursor state with velocity & shockwave bursts
    const mouse = {
      x: width / 2,
      y: height / 2,
      lastX: width / 2,
      lastY: height / 2,
      vx: 0,
      vy: 0,
      active: false,
      radius: 200,
      pulse: 0,
      bursts: [] as Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }>,
    };

    const updatePointerPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      // Active when within or near canvas bounds
      if (
        currentX >= -100 &&
        currentX <= rect.width + 100 &&
        currentY >= -100 &&
        currentY <= rect.height + 100
      ) {
        mouse.vx = currentX - mouse.x;
        mouse.vy = currentY - mouse.y;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.x = currentX;
        mouse.y = currentY;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.bursts.push({
          x,
          y,
          radius: 10,
          maxRadius: 280,
          alpha: 1.0,
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
          mouse.bursts.push({
            x,
            y,
            radius: 10,
            maxRadius: 280,
            alpha: 1.0,
          });
        }
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Particle setup
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      mass: number;
      trail: Array<{ x: number; y: number; alpha: number }>;
    }

    const colors = ['#3B82F6', '#F97316', '#38BDF8', '#818CF8', '#F59E0B', '#10B981'];

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 2.8 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      mass: Math.random() * 0.8 + 0.6,
      trail: [],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.pulse += 0.04;
      const currentRadius = mouse.radius + Math.sin(mouse.pulse) * 15;

      // Process & render shockwave bursts
      for (let b = mouse.bursts.length - 1; b >= 0; b--) {
        const burst = mouse.bursts[b];
        burst.radius += 8;
        burst.alpha -= 0.025;

        if (burst.alpha <= 0 || burst.radius >= burst.maxRadius) {
          mouse.bursts.splice(b, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#F97316';
        ctx.globalAlpha = burst.alpha;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#F97316';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Shockwave impact on particles
        for (const p of particles) {
          const dx = p.x - burst.x;
          const dy = p.y - burst.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - burst.radius) < 30) {
            const shockForce = (1 - Math.abs(dist - burst.radius) / 30) * 4;
            p.vx += (dx / (dist || 1)) * shockForce;
            p.vy += (dy / (dist || 1)) * shockForce;
          }
        }
      }

      // Render Gravity Cursor Halo Effect
      if (interactiveGravity && mouse.active) {
        // Draw outer glowing orbit aura
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#3B82F6';
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;

        // Draw inner cursor core
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1D61E7';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#3B82F6';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor Gravity Physics
        if (interactiveGravity && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < currentRadius) {
            const normalizedDist = dist / currentRadius;
            const factor = (1 - normalizedDist);

            if (gravityMode === 'attract') {
              // Direct gravitational pull
              const force = factor * 0.14 * p.mass;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            } else if (gravityMode === 'swirl') {
              // Cosmic Orbital Swirl
              const pullForce = factor * 0.08 * p.mass;
              const swirlForce = factor * 0.18 * p.mass;
              // Radial pull + Tangential swirl
              p.vx += (dx / dist) * pullForce + (-dy / dist) * swirlForce;
              p.vy += (dy / dist) * pullForce + (dx / dist) * swirlForce;
            } else if (gravityMode === 'repulse') {
              // Gravitational Shield Push
              const pushForce = factor * 0.25 * p.mass;
              p.vx -= (dx / dist) * pushForce;
              p.vy -= (dy / dist) * pushForce;
            }

            // Transfer cursor movement velocity momentum
            if (Math.abs(mouse.vx) > 2 || Math.abs(mouse.vy) > 2) {
              p.vx += mouse.vx * 0.012;
              p.vy += mouse.vy * 0.012;
            }
          }
        }

        // Apply motion & damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;

        // Smooth drift baseline
        if (Math.abs(p.vx) < 0.15) p.vx += (Math.random() - 0.5) * 0.08;
        if (Math.abs(p.vy) < 0.15) p.vy += (Math.random() - 0.5) * 0.08;

        // Bounce off canvas boundaries
        if (p.x < 0) { p.x = 0; p.vx *= -0.8; }
        if (p.x > width) { p.x = width; p.vx *= -0.8; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.8; }
        if (p.y > height) { p.y = height; p.vy *= -0.8; }

        // Render Particle Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect cursor to nearby particles
        if (interactiveGravity && mouse.active) {
          const mdx = mouse.x - p.x;
          const mdy = mouse.y - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - mdist / 140) * 0.35;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }

        // Connect particle network neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.22;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [particleCount, interactiveGravity, gravityMode]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Interactive Gravity Mode Controls Badge */}
      {interactiveGravity && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex items-center gap-1.5 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/80 text-[11px] font-extrabold text-white shadow-xl">
          <span className="px-2 text-slate-400 uppercase text-[9px] tracking-wider hidden sm:inline">
            🌌 Cursor Gravity:
          </span>
          {[
            { id: 'swirl', label: '🌀 Swirl' },
            { id: 'attract', label: '🧲 Pull' },
            { id: 'repulse', label: '🛡️ Repel' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setGravityMode(mode.id as any)}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                gravityMode === mode.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

