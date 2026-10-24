export interface ProjectItem {
  id: string;
  modNumber: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  fullOverview: string;
  architectureDetails: string[];
  metrics: {
    health: string;
    exec: string;
    uptime?: string;
    requestsPerSec?: string;
  };
  tags: string[];
  imageUrl: string;
  statusVariant: 'clinical' | 'organic' | 'urgent' | 'primary';
  liveDemoUrl?: string;
  githubUrl?: string;
  specs: {
    latency: string;
    concurrency: string;
    availability: string;
    encryption: string;
  };
  /** Roles this project best demonstrates (Recruiter Mode) */
  roleFit?: RecruiterRole[];
  /** Short decision records for Architecture Explorer */
  decisions?: EngineeringDecision[];
  evidence?: EvidenceItem[];
  tier?: 'flagship' | 'applied' | 'experiment';
}

export interface CapabilityItem {
  id: string;
  code: string;
  title: string;
  description: string;
  capacity: number;
  icon: string;
  accentColor: string;
  subMetrics: { label: string; value: string }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  status: 'ACTIVE' | 'COMPLETED';
  bullets: string[];
  techStack: string[];
  impactScore?: string;
}

export interface TerminalLog {
  id: string;
  sender: 'system' | 'user' | 'error' | 'success';
  text: string;
  timestamp: string;
}

export interface EvidenceItem {
  claim: string;
  type: 'measured' | 'implemented' | 'demo' | 'target' | 'count';
  source?: string;
  url?: string;
}

export type RecruiterRole = 'software' | 'fullstack' | 'backend' | 'frontend' | 'ai' | 'product';

export interface EngineeringDecision {
  question: string;
  problem: string;
  options: string[];
  chosen: string;
  reason: string;
}

export interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  section?: string;
  action: 'navigate' | 'project' | 'recruiter' | 'external' | 'mode' | 'trace';
  payload?: string;
  group: 'nav' | 'projects' | 'modes' | 'external';
}

export interface BrowserTelemetry {
  fps: number | null;
  viewport: string;
  deviceMemory: string;
  connection: string;
  online: boolean;
  reducedMotion: boolean;
  webgl: string;
  language: string;
}
