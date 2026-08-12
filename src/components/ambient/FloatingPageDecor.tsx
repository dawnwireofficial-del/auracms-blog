import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface DecorObject {
  cls: string;
  style: React.CSSProperties;
}

const DECOR: DecorObject[] = [
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      top: '9%', left: '3%', width: '58px', height: '58px',
      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(36,107,255,0.14))',
      borderRadius: '20px',
      border: '1px solid rgba(36,107,255,0.18)',
      animation: 'decorFloatY 7s ease-in-out infinite',
      boxShadow: '0 14px 34px -16px rgba(36,107,255,0.35)',
      zIndex: 4,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      top: '16%', right: '2.5%', width: '74px', height: '74px',
      border: '1.5px dashed rgba(255,138,0,0.35)',
      borderRadius: '50%',
      animation: 'decorRotateSlow 26s linear infinite',
      zIndex: 4,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      top: '30%', left: '6%', width: '12px', height: '12px',
      borderRadius: '50%',
      background: 'rgba(255,138,0,0.55)',
      animation: 'decorPulseSoft 4.2s ease-in-out infinite',
      zIndex: 4,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-sm',
    style: {
      top: '8%', left: '14%', width: '44px', height: '44px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(36,107,255,0.16), rgba(36,107,255,0.04))',
      border: '1px solid rgba(36,107,255,0.22)',
      animation: 'decorDrift 9s ease-in-out infinite',
      transform: 'rotate(18deg)',
      zIndex: 3,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      bottom: '12%', left: '4.5%', width: '120px', height: '120px',
      background: 'radial-gradient(circle, rgba(36,107,255,0.07), transparent 68%)',
      borderRadius: '50%',
      animation: 'decorPulseSoft 8s ease-in-out infinite',
      zIndex: 3,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      bottom: '20%', right: '4%', width: '16px', height: '16px',
      borderRadius: '50%',
      background: 'rgba(36,107,255,0.5)',
      boxShadow: '0 0 18px rgba(36,107,255,0.6)',
      animation: 'decorFloatY2 5.4s ease-in-out infinite',
      zIndex: 4,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-sm',
    style: {
      bottom: '26%', right: '8%', width: '52px', height: '52px',
      borderRadius: '50%',
      border: '1px solid rgba(255,138,0,0.28)',
      animation: 'decorDrift 7.5s ease-in-out infinite',
      zIndex: 3,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-sm',
    style: {
      top: '58%', left: '2%', width: '26px', height: '26px',
      borderRadius: '9px',
      background: 'rgba(255,138,0,0.10)',
      border: '1px solid rgba(255,138,0,0.3)',
      animation: 'decorFloatX 6s ease-in-out infinite',
      transform: 'rotate(45deg)',
      zIndex: 3,
    },
  },
  {
    cls: 'dw-decor-object dw-decor-hide-md',
    style: {
      top: '44%', right: '1.5%', width: '10px', height: '10px',
      borderRadius: '50%',
      background: 'rgba(74,222,128,0.55)',
      animation: 'decorPulseSoft 3.6s ease-in-out infinite',
      zIndex: 3,
    },
  },
];

/**
 * Ambient floating page decor + desktop cursor glow + subtle cursor parallax
 * and scroll reaction. Purely decorative — pointer-events none, hidden on
 * touch devices and reduced-motion users.
 */
export default function FloatingPageDecor() {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.4 });

  useEffect(() => {
    if (reduced) return;
    const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFine) return;

    document.body.classList.add('dw-cursor-glow');

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    const onScroll = () => {
      const layer = layerRef.current;
      if (!layer) return;
      const scroll = window.scrollY;
      // Slow, global scroll reaction — rotate/translate the decor layer subtly
      layer.style.transform = `rotate(${Math.max(-0.6, Math.min(0.6, (scroll / window.innerHeight) * 0.5))}deg)`;
    };

    // Parallax: shift each object by a fraction of the mouse offset
    let raf = 0;
    const loop = () => {
      const layer = layerRef.current;
      if (layer) {
        const mx = (mouse.current.x - 0.5) * 14;
        const my = (mouse.current.y - 0.5) * 14;
        const items = layer.querySelectorAll<HTMLElement>('[data-depth]');
        items.forEach((el) => {
          const depth = Number(el.dataset.depth || 0.02);
          el.style.marginLeft = `${mx * depth}px`;
          el.style.marginTop = `${my * depth}px`;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      document.body.classList.remove('dw-cursor-glow');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div ref={layerRef} className="dw-decor-layer" aria-hidden="true">
      {DECOR.map((d, i) => (
        <span key={i} className={d.cls} style={d.style} data-depth={0.012 + (i % 4) * 0.006} />
      ))}
    </div>
  );
}
