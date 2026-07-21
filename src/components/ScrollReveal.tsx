import React from 'react';
import { motion, type Variant } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';

type AnimationVariant = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'scaleDown' | 'flipUp';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  distance?: number;
  as?: 'div' | 'section' | 'span' | 'article';
}

const variants: Record<AnimationVariant, { hidden: Record<string, number>; visible: Record<string, number> }> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  scaleDown: {
    hidden: { opacity: 0, scale: 1.1 },
    visible: { opacity: 1, scale: 1 },
  },
  flipUp: {
    hidden: { opacity: 0, rotateX: 15, y: 30 },
    visible: { opacity: 1, rotateX: 0, y: 0 },
  },
};

export default function ScrollReveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.5,
  className = '',
  once = true,
  distance = 40,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  const v = variants[variant];
  const hidden: Record<string, number> = { ...v.hidden };
  if (variant === 'fadeUp' || variant === 'fadeDown') {
    hidden.y = variant === 'fadeUp' ? distance : -distance;
  }
  if (variant === 'fadeLeft' || variant === 'fadeRight') {
    hidden.x = variant === 'fadeLeft' ? -distance : distance;
  }

  return (
    <Tag className={className}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px' }}
        variants={{
          hidden,
          visible: {
            ...v.visible,
            transition: {
              duration,
              delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
          },
        }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.08,
  delay = 0,
  once = true,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
  as?: 'div' | 'section';
}) {
  const reduced = useReducedMotion();
  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag className={className}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: delay,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}

export function StaggerItem({
  children,
  className = '',
  variant: animVariant = 'fadeUp',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: AnimationVariant;
}) {
  const reduced = useReducedMotion();
  const v = variants[animVariant];
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: v.hidden as Variant,
        visible: { ...v.visible, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } as Variant,
      }}
    >
      {children}
    </motion.div>
  );
}

export function HoverScale({ children, className = '', scale = 1.03 }: { children: React.ReactNode; className?: string; scale?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ scale, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
