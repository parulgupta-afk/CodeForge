import { describe, it, expect } from 'vitest';
import { PROJECTS_DATA, PROFILE, SYSTEM_METRICS } from './portfolioData';

describe('portfolioData integrity', () => {
  it('has profile contact fields', () => {
    expect(PROFILE.name).toBe('Parul Gupta');
    expect(PROFILE.email).toContain('@');
    expect(PROFILE.github).toMatch(/^https:\/\/github\.com\//);
    expect(PROFILE.linkedin).toMatch(/^https:\/\//);
  });

  it('includes flagship projects', () => {
    const ids = PROJECTS_DATA.map((p) => p.id);
    expect(ids).toContain('priceloop');
    expect(ids).toContain('codeforge');
    expect(ids).toContain('pulseops');
  });

  it('flagship tier hierarchy is preserved', () => {
    const byTier = (t: string) => PROJECTS_DATA.filter((p) => p.tier === t).map((p) => p.id);
    expect(byTier('flagship')).toEqual(expect.arrayContaining(['priceloop', 'codeforge', 'pulseops']));
    expect(byTier('applied')).toEqual(expect.arrayContaining(['pocket-triage', 'skycall']));
    expect(byTier('experiment').length).toBeGreaterThanOrEqual(2);
  });

  it('every project github is real or empty', () => {
    for (const p of PROJECTS_DATA) {
      if (p.githubUrl) {
        expect(p.githubUrl).toMatch(/^https:\/\/github\.com\//);
      }
    }
  });

  it('CodeForge has live demo URL', () => {
    const cf = PROJECTS_DATA.find((p) => p.id === 'codeforge');
    expect(cf?.liveDemoUrl).toBe('https://code-forge-jade.vercel.app');
  });

  it('no fake uptime marketing percentages', () => {
    const blob = JSON.stringify(PROJECTS_DATA) + JSON.stringify(SYSTEM_METRICS);
    expect(blob).not.toMatch(/99\.999%/);
    expect(blob).not.toMatch(/99\.9%/);
  });

  it('flagship projects have engineering decisions', () => {
    for (const id of ['priceloop', 'codeforge', 'pulseops']) {
      const p = PROJECTS_DATA.find((x) => x.id === id);
      expect(p?.decisions?.length).toBeGreaterThan(0);
    }
  });

  it('evidence types are constrained', () => {
    const allowed = new Set(['measured', 'implemented', 'demo', 'target', 'count']);
    for (const p of PROJECTS_DATA) {
      for (const e of p.evidence ?? []) {
        expect(allowed.has(e.type)).toBe(true);
      }
    }
  });
});
