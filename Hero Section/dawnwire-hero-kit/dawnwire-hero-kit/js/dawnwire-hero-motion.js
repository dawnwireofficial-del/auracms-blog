/** Optional pointer parallax. The SVG files already animate without JavaScript. */
export function initDawnwireHeroMotion(root = document.querySelector('.dw-hero')) {
  if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const visual = root.querySelector('.dw-visual');
  const mascot = root.querySelector('.dw-visual__mascot');
  const cards = [...root.querySelectorAll('.dw-card')];
  if (!visual) return () => {};

  let raf = 0;
  const onMove = (event) => {
    const rect = visual.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      cards.forEach((card, index) => {
        const depth = 5 + (index % 3) * 3;
        card.style.setProperty('--px', `${x * depth}px`);
        card.style.setProperty('--py', `${y * depth}px`);
      });
      if (mascot) mascot.style.filter = `drop-shadow(${-x * 10}px ${30 + y * 8}px 34px rgba(42,65,146,.24))`;
    });
  };

  const onLeave = () => {
    cards.forEach((card) => {
      card.style.removeProperty('--px');
      card.style.removeProperty('--py');
    });
    if (mascot) mascot.style.removeProperty('filter');
  };

  visual.addEventListener('pointermove', onMove, { passive: true });
  visual.addEventListener('pointerleave', onLeave, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    visual.removeEventListener('pointermove', onMove);
    visual.removeEventListener('pointerleave', onLeave);
  };
}
