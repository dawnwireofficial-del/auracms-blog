import React, { useEffect, useRef } from 'react';

/**
 * SiteEffects — global premium motion layer:
 *  1. Scroll progress bar (top, gradient)
 *  2. Cursor glow follower (desktop, fine pointers only)
 *  3. Scroll-reveal for [data-reveal] elements (fade-up on enter)
 * All effects respect prefers-reduced-motion and are disabled on touch.
 */
export default function SiteEffects() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // ---- 1. scroll progress ----
    const onScroll = () => {
      if (barRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        barRef.current.style.width = pct + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---- 2. cursor glow ----
    let glowVisible = false;
    const onMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      if (!glowVisible) { glowRef.current.style.opacity = '1'; glowVisible = true; }
      glowRef.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
    };
    if (finePointer && !reduced) {
      window.addEventListener('mousemove', onMove, { passive: true });
    }

    // ---- 3. scroll reveal ----
    const cleanups: Array<() => void> = [];
    if (!reduced) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('dw-revealed');
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      const observeAll = () => {
        document.querySelectorAll('[data-reveal]:not(.dw-revealed)').forEach(el => io.observe(el));
      };
      observeAll();
      // Re-observe after SPA route changes
      const mo = new MutationObserver(() => observeAll());
      mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
      cleanups.push(() => { io.disconnect(); mo.disconnect(); });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={barRef}
        aria-hidden="true"
        className="fixed top-0 left-0 h-[3px] z-[9999] pointer-events-none"
        style={{ width: '0%', background: 'linear-gradient(90deg,#246BFF,#FF8A00)', transition: 'width 0.08s linear' }}
      />
      {/* Cursor glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full z-[1] pointer-events-none hidden lg:block"
        style={{
          opacity: 0,
          background: 'radial-gradient(circle, rgba(36,107,255,0.07) 0%, rgba(255,138,0,0.04) 40%, transparent 70%)',
          transition: 'opacity 0.4s ease, transform 0.12s ease-out',
        }}
      />
    </>
  );
}