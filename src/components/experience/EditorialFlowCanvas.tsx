import React, { useEffect, useRef } from 'react';

export const EditorialFlowCanvas: React.FC<{ className?: string }> = ({ className = 'absolute inset-0' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let waveOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      waveOffset += 0.008;

      // Soft editorial reading-flow sine waves
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = Math.sin(x * 0.005 + waveOffset + i * 1.5) * 15 + height * (0.3 + i * 0.2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(140, 108, 255, ${0.08 - i * 0.02})`;
        ctx.stroke();
      }

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
