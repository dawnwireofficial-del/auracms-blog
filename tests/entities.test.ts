import { describe, it, expect } from 'vitest';
import { findEntities, getAllEntities } from '../server/entities';

describe('findEntities', () => {
  it('finds known entities in text', () => {
    const text = 'Google and Apple are leading technology companies.';
    const entities = findEntities(text);
    expect(entities.some(e => e.name === 'Google')).toBe(true);
    expect(entities.some(e => e.name === 'Apple')).toBe(true);
  });

  it('matches by alias', () => {
    const text = 'I use GSC to monitor my search performance.';
    const entities = findEntities(text);
    expect(entities.some(e => e.name === 'Google Search Console')).toBe(true);
  });

  it('returns empty array for text with no entities', () => {
    const entities = findEntities('This is some random text with no known entities.');
    expect(entities.length).toBe(0);
  });

  it('prefers longer matches over shorter ones', () => {
    const text = 'Google Analytics is a powerful tool.';
    const entities = findEntities(text);
    const googleAnalytics = entities.find(e => e.name === 'Google Analytics');
    const google = entities.find(e => e.name === 'Google');
    expect(googleAnalytics).toBeDefined();
  });

  it('is case insensitive', () => {
    const text = 'openai released a new model.';
    const entities = findEntities(text);
    expect(entities.some(e => e.name === 'OpenAI')).toBe(true);
  });
});

describe('getAllEntities', () => {
  it('returns all entities', () => {
    const all = getAllEntities();
    expect(all.length).toBeGreaterThan(80);
  });

  it('each entity has required fields', () => {
    const all = getAllEntities();
    for (const e of all) {
      expect(e.name).toBeTruthy();
      expect(Array.isArray(e.aliases)).toBe(true);
      expect(e.sameAs).toMatch(/^https?:\/\//);
      expect(e.type).toBeTruthy();
      expect(e.category).toBeTruthy();
    }
  });
});
