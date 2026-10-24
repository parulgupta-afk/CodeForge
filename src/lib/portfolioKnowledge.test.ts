import { describe, it, expect } from 'vitest';
import { answerPortfolioQuery } from './portfolioKnowledge';

describe('answerPortfolioQuery', () => {
  it('returns EMPTY for blank input', () => {
    expect(answerPortfolioQuery('').intent).toBe('EMPTY');
  });

  it('returns CONTACT for contact queries', () => {
    const a = answerPortfolioQuery('how do I contact Parul?');
    expect(a.intent).toBe('CONTACT');
    expect(a.bullets.length).toBeGreaterThan(0);
  });

  it('returns EXPERIENCE for experience queries', () => {
    expect(answerPortfolioQuery('internship experience').intent).toBe('EXPERIENCE');
  });

  it('finds CodeForge for agent/sandbox queries', () => {
    const a = answerPortfolioQuery('autonomous coding agent sandbox docker');
    expect(a.projects.some((p) => p.id === 'codeforge') || /codeforge|agent/i.test(a.summary)).toBe(true);
  });

  it('finds Priceloop for stripe/price queries', () => {
    const a = answerPortfolioQuery('stripe price tracking postgresql');
    expect(a.projects.some((p) => p.id === 'priceloop') || /price|priceloop/i.test(a.summary)).toBe(true);
  });

  it('does not invent Google internship', () => {
    const a = answerPortfolioQuery('internship at Google');
    expect(a.summary.toLowerCase()).not.toMatch(/google intern/);
  });
});
