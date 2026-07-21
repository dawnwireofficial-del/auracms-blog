import { describe, it, expect } from 'vitest';
import { getDripCampaignConfig, getNextDripStep } from '../server/drip-campaign';

describe('getDripCampaignConfig', () => {
  it('returns 5 email steps', () => {
    const config = getDripCampaignConfig();
    expect(config.length).toBe(5);
  });

  it('each step has required fields', () => {
    const config = getDripCampaignConfig();
    for (const email of config) {
      expect(email.step).toBeGreaterThan(0);
      expect(email.subject).toBeTruthy();
      expect(typeof email.delayDays).toBe('number');
    }
  });

  it('steps are ordered sequentially', () => {
    const config = getDripCampaignConfig();
    for (let i = 0; i < config.length; i++) {
      expect(config[i].step).toBe(i + 1);
    }
  });
});

describe('getNextDripStep', () => {
  it('returns step 1 for new subscriber', () => {
    const sub = { id: '1', email: 'test@test.com', createdAt: new Date().toISOString(), dripStep: 0 };
    const next = getNextDripStep(sub);
    expect(next).toBe(1);
  });

  it('returns null for completed subscriber', () => {
    const sub = { id: '1', email: 'test@test.com', createdAt: new Date().toISOString(), dripStep: 5, dripLastSentAt: new Date().toISOString() };
    const next = getNextDripStep(sub);
    expect(next).toBeNull();
  });

  it('returns null if delay has not passed', () => {
    const sub = { id: '1', email: 'test@test.com', createdAt: new Date().toISOString(), dripStep: 1, dripLastSentAt: new Date().toISOString() };
    const next = getNextDripStep(sub);
    expect(next).toBeNull();
  });
});
