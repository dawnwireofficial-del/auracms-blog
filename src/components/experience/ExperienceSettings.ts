// DawnWire Experience Configuration & Settings
export interface ExperienceConfig {
  motionIntensity: number;
  particleDensity: number;
  cursorEnabled: boolean;
  cursorStrength: number;
  gravityStrength: number;
  sectionTransitions: boolean;
  canvasQuality: 'high' | 'adaptive' | 'performance';
  glowIntensity: number;
  parallaxDepth: number;
  mobileEffects: 'reduced' | 'full';
}

export const experienceConfig: ExperienceConfig = {
  motionIntensity: 0.75,
  particleDensity: 0.45,
  cursorEnabled: true,
  cursorStrength: 0.8,
  gravityStrength: 0.6,
  sectionTransitions: true,
  canvasQuality: 'adaptive',
  glowIntensity: 0.55,
  parallaxDepth: 0.4,
  mobileEffects: 'reduced',
};

export const sectionAtmospheres = {
  hero: {
    primary: '#4c82ff',
    secondary: '#8c6cff',
    cyan: '#2ad7f7',
    glow: 'rgba(76, 130, 255, 0.22)',
  },
  categories: {
    primary: '#2ad7f7',
    secondary: '#4c82ff',
    glow: 'rgba(42, 215, 247, 0.20)',
  },
  products: {
    primary: '#4c82ff',
    secondary: '#15345f',
    glow: 'rgba(76, 130, 255, 0.15)',
  },
  editorial: {
    primary: '#8c6cff',
    secondary: '#665cff',
    glow: 'rgba(140, 108, 255, 0.20)',
  },
  cta: {
    primary: '#ffb45b',
    secondary: '#4c82ff',
    glow: 'rgba(255, 180, 91, 0.25)',
  },
};
