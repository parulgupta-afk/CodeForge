import { answerPortfolioQuery, type AgentAnswer } from '../lib/portfolioKnowledge';
import { PROJECTS_DATA, PROFILE, CAPABILITIES_DATA } from '../data/portfolioData';

const API = (import.meta as any).env?.VITE_API_URL as string | undefined;

function contextPack(): string {
  return JSON.stringify(
    {
      profile: PROFILE,
      projects: PROJECTS_DATA.map((p) => ({
        id: p.id,
        title: p.title,
        tagline: p.tagline,
        tags: p.tags,
        architecture: p.architectureDetails,
        decisions: p.decisions,
      })),
      capabilities: CAPABILITIES_DATA.map((c) => ({ title: c.title, capacity: c.capacity })),
    },
    null,
    0
  );
}

/**
 * Prefer portfolio-api when VITE_API_URL is set; otherwise pure client retriever.
 * Never invents projects not in portfolioData.
 */
export async function askPortfolioAgent(message: string): Promise<AgentAnswer & { source: 'api' | 'local' }> {
  const local = answerPortfolioQuery(message);

  if (API) {
    try {
      const res = await fetch(`${API.replace(/\/$/, '')}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: contextPack() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.summary) {
          return {
            intent: data.intent || 'GEMINI',
            summary: String(data.summary),
            projects: local.projects,
            bullets: Array.isArray(data.bullets) ? data.bullets.map(String) : local.bullets,
            actions: local.actions,
            source: 'api',
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  return { ...local, source: 'local' };
}
