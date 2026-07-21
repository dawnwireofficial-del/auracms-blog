export type AnimationQuality = 'full' | 'balanced' | 'minimal' | 'disabled';

export interface MotionConfig {
  globalEnabled: boolean;
  quality: AnimationQuality;
  prefersReducedMotion: boolean;
  isLowPerformance: boolean;
  batterySaver: boolean;
}

export const defaultConfig: MotionConfig = {
  globalEnabled: true,
  quality: 'balanced', // Default to balanced, updated by provider
  prefersReducedMotion: false,
  isLowPerformance: false,
  batterySaver: false,
};

// Particle and Animation budgets per quality level
export const animationBudgets = {
  full: {
    maxParticles: 150,
    connectionDistance: 120,
    fpsLimit: 60,
    devicePixelRatioCap: 2,
  },
  balanced: {
    maxParticles: 75,
    connectionDistance: 90,
    fpsLimit: 60,
    devicePixelRatioCap: 1.5,
  },
  minimal: {
    maxParticles: 30,
    connectionDistance: 60,
    fpsLimit: 30,
    devicePixelRatioCap: 1,
  },
  disabled: {
    maxParticles: 0,
    connectionDistance: 0,
    fpsLimit: 0,
    devicePixelRatioCap: 1,
  }
};
