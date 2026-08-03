import React, { useEffect, useState, useRef } from 'react';

export default function GravityCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [follower, setFollower] = useState({ x: -100, y: -100 });
  const [mode, setMode] = useState<string>('default');
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentFollower = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Disable custom cursor on touch devices or reduced motion
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || isReduced) return;

    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      // Detect interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('a, button, input, select, textarea, [role="button"], .cursor-pointer, [data-gravity-cursor]');
        if (interactive) {
          setIsHovered(true);
          const cursorAttr = interactive.getAttribute('data-gravity-cursor');
          setMode(cursorAttr || 'magnetic');
        } else {
          setIsHovered(false);
          setMode('default');
        }
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth lerp loop for follower ring
    const loop = () => {
      currentFollower.current.x += (targetPos.current.x - currentFollower.current.x) * 0.15;
      currentFollower.current.y += (targetPos.current.y - currentFollower.current.y) * 0.15;
      setFollower({ x: currentFollower.current.x, y: currentFollower.current.y });
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Follower Outer Ring */}
      <div
        className={`pointer-events-none absolute -top-4 -left-4 rounded-full border transition-all duration-300 ${
          isHovered
            ? mode === 'explore'
              ? 'w-16 h-16 border-cyan-400/80 bg-cyan-500/10 backdrop-blur-[2px] scale-110'
              : mode === 'view'
              ? 'w-14 h-14 border-purple-500/80 bg-purple-500/10 scale-105'
              : 'w-12 h-12 border-blue-500/70 bg-blue-500/10 scale-100'
            : 'w-8 h-8 border-slate-400/30 bg-transparent'
        }`}
        style={{
          transform: `translate3d(${follower.x}px, ${follower.y}px, 0)`,
          willChange: 'transform',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {isHovered && mode === 'explore' && (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-wider text-cyan-300 opacity-90">
            Explore
          </span>
        )}
        {isHovered && mode === 'view' && (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-wider text-purple-300 opacity-90">
            View
          </span>
        )}
      </div>

      {/* Central Cursor Dot */}
      <div
        className={`pointer-events-none absolute -top-1 -left-1 rounded-full transition-transform duration-150 ${
          isHovered ? 'w-3 h-3 bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]' : 'w-2 h-2 bg-blue-500'
        }`}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
