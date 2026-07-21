export type CategoryPresetType =
  | 'technology'
  | 'laptops'
  | 'smartphones'
  | 'gaming'
  | 'home_appliances'
  | 'baby'
  | 'beauty'
  | 'fitness'
  | 'automotive'
  | 'ai_tools'
  | 'office'
  | 'outdoor'
  | 'default';

export interface CategoryPresetConfig {
  preset: CategoryPresetType;
  accentColor: string;
  secondaryColor: string;
  particleCountMultiplier: number;
  speedMultiplier: number;
  particleType: 'circles' | 'pixels' | 'waves' | 'bubbles' | 'grid';
}

export const CATEGORY_PRESETS: Record<CategoryPresetType, CategoryPresetConfig> = {
  technology: {
    preset: 'technology',
    accentColor: '#246BFF',
    secondaryColor: '#00F0FF',
    particleCountMultiplier: 1.0,
    speedMultiplier: 1.0,
    particleType: 'grid',
  },
  laptops: {
    preset: 'laptops',
    accentColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    particleCountMultiplier: 0.9,
    speedMultiplier: 0.9,
    particleType: 'grid',
  },
  smartphones: {
    preset: 'smartphones',
    accentColor: '#00D2FF',
    secondaryColor: '#3B82F6',
    particleCountMultiplier: 1.1,
    speedMultiplier: 1.2,
    particleType: 'waves',
  },
  gaming: {
    preset: 'gaming',
    accentColor: '#A855F7',
    secondaryColor: '#EC4899',
    particleCountMultiplier: 1.3,
    speedMultiplier: 1.5,
    particleType: 'pixels',
  },
  home_appliances: {
    preset: 'home_appliances',
    accentColor: '#10B981',
    secondaryColor: '#34D399',
    particleCountMultiplier: 0.8,
    speedMultiplier: 0.7,
    particleType: 'circles',
  },
  baby: {
    preset: 'baby',
    accentColor: '#F472B6',
    secondaryColor: '#FBCFE8',
    particleCountMultiplier: 0.7,
    speedMultiplier: 0.5,
    particleType: 'bubbles',
  },
  beauty: {
    preset: 'beauty',
    accentColor: '#EC4899',
    secondaryColor: '#F472B6',
    particleCountMultiplier: 0.8,
    speedMultiplier: 0.6,
    particleType: 'bubbles',
  },
  fitness: {
    preset: 'fitness',
    accentColor: '#EF4444',
    secondaryColor: '#F97316',
    particleCountMultiplier: 1.1,
    speedMultiplier: 1.3,
    particleType: 'circles',
  },
  automotive: {
    preset: 'automotive',
    accentColor: '#6366F1',
    secondaryColor: '#818CF8',
    particleCountMultiplier: 1.0,
    speedMultiplier: 1.4,
    particleType: 'grid',
  },
  ai_tools: {
    preset: 'ai_tools',
    accentColor: '#8B5CF6',
    secondaryColor: '#00F0FF',
    particleCountMultiplier: 1.2,
    speedMultiplier: 1.1,
    particleType: 'circles',
  },
  office: {
    preset: 'office',
    accentColor: '#64748B',
    secondaryColor: '#94A3B8',
    particleCountMultiplier: 0.8,
    speedMultiplier: 0.8,
    particleType: 'grid',
  },
  outdoor: {
    preset: 'outdoor',
    accentColor: '#15803D',
    secondaryColor: '#4ADE80',
    particleCountMultiplier: 0.9,
    speedMultiplier: 0.6,
    particleType: 'circles',
  },
  default: {
    preset: 'default',
    accentColor: '#246BFF',
    secondaryColor: '#00F0FF',
    particleCountMultiplier: 1.0,
    speedMultiplier: 1.0,
    particleType: 'circles',
  },
};

export function getPresetForCategory(slugOrName: string = ''): CategoryPresetConfig {
  const s = slugOrName.toLowerCase();
  if (s.includes('ai') || s.includes('intelligence')) return CATEGORY_PRESETS.ai_tools;
  if (s.includes('game') || s.includes('gaming')) return CATEGORY_PRESETS.gaming;
  if (s.includes('phone') || s.includes('mobile') || s.includes('smartphone')) return CATEGORY_PRESETS.smartphones;
  if (s.includes('laptop') || s.includes('computer') || s.includes('pc')) return CATEGORY_PRESETS.laptops;
  if (s.includes('fit') || s.includes('gym') || s.includes('sport')) return CATEGORY_PRESETS.fitness;
  if (s.includes('beauty') || s.includes('care') || s.includes('skin')) return CATEGORY_PRESETS.beauty;
  if (s.includes('baby') || s.includes('kid') || s.includes('toy')) return CATEGORY_PRESETS.baby;
  if (s.includes('home') || s.includes('appliance')) return CATEGORY_PRESETS.home_appliances;
  if (s.includes('auto') || s.includes('car')) return CATEGORY_PRESETS.automotive;
  if (s.includes('office') || s.includes('desk')) return CATEGORY_PRESETS.office;
  if (s.includes('outdoor') || s.includes('garden')) return CATEGORY_PRESETS.outdoor;
  if (s.includes('tech') || s.includes('gadget')) return CATEGORY_PRESETS.technology;
  return CATEGORY_PRESETS.default;
}
