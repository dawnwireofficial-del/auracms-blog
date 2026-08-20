import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

/**
 * ScrollReveal — wraps children with a scroll-triggered fade/slide animation.
 * Respects prefers-reduced-motion.
 */

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean; // animate only once (default true)
}

const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 30,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-60px' });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directionMap[direction] }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerReveal — animates a list of children with staggered delays
 */
export function StaggerReveal({
  children,
  className = '',
  staggerDelay = 0.08,
  startDelay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  startDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.45, delay: startDelay + i * staggerDelay, ease: [0.22, 1, 0.36, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * ScaleReveal — elements scale up from slightly smaller on scroll
 */
export function ScaleReveal({
  children,
  className = '',
  delay = 0,
  scale = 0.95,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
