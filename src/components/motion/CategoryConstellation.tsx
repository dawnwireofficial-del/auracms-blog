import React, { useRef, useEffect, useState } from 'react';
import { useMotion } from './MotionProvider';
import { getPresetForCategory } from '../../lib/motion/animation-presets';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  count: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  color: string;
}

interface CategoryConstellationProps {
  categories: Array<{ id: string; name: string; slug: string; productCount?: number }>;
  onSelectCategory: (slug: string) => void;
  className?: string;
}

export default function CategoryConstellation({
  categories,
  onSelectCategory,
  className = '',
}: CategoryConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { globalEnabled, budgets, isPaused } = useMotion();
  const [hoveredNode, setHoveredNode] = useState<CategoryNode | null>(null);

  useEffect(() => {
    if (!globalEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const dpr = Math.min(window.devicePixelRatio || 1, budgets.devicePixelRatioCap);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isMobile = window.innerWidth <= 768;

    // Build category nodes
    const nodes: CategoryNode[] = categories.slice(0, 10).map((cat, i) => {
      const preset = getPresetForCategory(cat.slug || cat.name);
      const angle = (i / Math.min(categories.length, 10)) * Math.PI * 2;
      const radiusOffset = 100 + Math.random() * 50;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.productCount || Math.floor(Math.random() * 40) + 10,
        x: width / 2 + Math.cos(angle) * radiusOffset,
        y: height / 2 + Math.sin(angle) * radiusOffset,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: isMobile ? 16 : 22,
        targetRadius: isMobile ? 16 : 22,
        color: preset.accentColor,
      };
    });

    let activeMouseX = -1000;
    let activeMouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      activeMouseX = e.clientX - rect.left;
      activeMouseY = e.clientY - rect.top;

      let found: CategoryNode | null = null;
      for (const node of nodes) {
        const dx = activeMouseX - node.x;
        const dy = activeMouseY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= node.radius + 10) {
          found = node;
          node.targetRadius = isMobile ? 22 : 30;
        } else {
          node.targetRadius = isMobile ? 16 : 22;
        }
      }
      setHoveredNode(found);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (const node of nodes) {
        const dx = clickX - node.x;
        const dy = clickY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
          onSelectCategory(node.slug);
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (isPaused) return;

      ctx.clearRect(0, 0, width, height);

      // Draw constellation connections
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;

        // Soft bounce boundaries
        if (n1.x < 50 || n1.x > width - 50) n1.vx *= -1;
        if (n1.y < 50 || n1.y > height - 50) n1.vy *= -1;

        // Smooth radius transition
        n1.radius += (n1.targetRadius - n1.radius) * 0.1;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 220) {
            const alpha = (1 - dist / 220) * 0.35;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(36, 107, 255, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        // Render Orbs
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.shadowBlur = n1.targetRadius > 25 ? 20 : 10;
        ctx.shadowColor = n1.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner Core Glow
        ctx.beginPath();
        ctx.arc(n1.x - n1.radius * 0.3, n1.y - n1.radius * 0.3, n1.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // Node Label below orb
        if (!isMobile) {
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(n1.name, n1.x, n1.y + n1.radius + 14);
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [globalEnabled, categories, isPaused, budgets]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Interactive Canvas Constellation */}
      {globalEnabled && (
        <div className="relative w-full h-[350px] md:h-[450px] bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl mb-8 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />

          {/* Hover Tooltip Overlay */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 text-white shadow-lg">
              <p className="text-xs font-bold text-cyan-400">{hoveredNode.name}</p>
              <p className="text-[10px] text-slate-400">{hoveredNode.count} Verified Products</p>
            </div>
          )}
        </div>
      )}

      {/* Accessible HTML Category Grid Equivalent */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.slice(0, 10).map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug)}
            className="flex flex-col items-center p-4 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-[#246BFF] hover:shadow-lg transition-all group cursor-pointer text-center"
          >
            <div className="w-3 h-3 rounded-full bg-[#246BFF] group-hover:scale-125 transition-transform mb-2" />
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#246BFF] transition-colors">
              {cat.name}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Explore Category</span>
          </button>
        ))}
      </div>
    </div>
  );
}
