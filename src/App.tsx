import React, { useState, useEffect, useCallback } from 'react';
import { ShaderBackground } from './components/ShaderBackground';
import { IntroSequence } from './components/IntroSequence';
import { BootSequence } from './components/BootSequence';
import { TopNavBar } from './components/TopNavBar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ProjectModal } from './components/ProjectModal';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { ExperienceSection } from './components/ExperienceSection';
import { CommsTerminal } from './components/CommsTerminal';
import { BentoOverview } from './components/BentoOverview';
import { MobileDrawer } from './components/MobileDrawer';
import { Footer } from './components/Footer';
import { CommandCenter } from './components/CommandCenter';
import { TelemetryHUD } from './components/TelemetryHUD';
import { RecruiterMode } from './components/RecruiterMode';
import { AIAgent } from './components/AIAgent';
import { OSDashboard } from './components/OSDashboard';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { SkillGraph } from './components/SkillGraph';
import { PerformanceLab } from './components/PerformanceLab';
import { EngineeringLab } from './components/EngineeringLab';
import { SecurityCenter } from './components/SecurityCenter';
import { PortfolioDNA } from './components/PortfolioDNA';
import { GitHubActivity } from './components/GitHubActivity';
import { SpatialMode } from './components/SpatialMode';
import { InteractiveResume } from './components/InteractiveResume';
import { VoiceInterface } from './components/VoiceInterface';
import { MissionTimeline } from './components/MissionTimeline';
import { ContactCTA } from './components/ContactCTA';
import { SystemTrace } from './components/SystemTrace';
import { StackSection } from './components/StackSection';
import { ThirtySecondRead } from './components/ThirtySecondRead';
import { ProjectItem } from './types';
import { PROJECTS_DATA } from './data/portfolioData';
import { playCyberClick, playTransmitSuccess } from './utils/audioSynth';
import { usePerformanceMode } from './hooks/usePerformanceMode';

export function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showBoot, setShowBoot] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'bento'>('desktop');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [recruiterOpen, setRecruiterOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const { performanceMode, toggle: togglePerf } = usePerformanceMode();

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'hero',
        'dashboard',
        'about',
        'projects',
        'architecture',
        'capabilities',
        'skill-graph',
        'experience',
        'mission-log',
        'perf-lab',
        'lab',
        'security',
        'dna',
        'resume',
        'spatial',
        'github-activity',
        'connect',
      ];
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
        playCyberClick();
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setRecruiterOpen(false);
        setAiOpen(false);
        setVoiceOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let buffer = '';
    const onType = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      buffer = (buffer + e.key).slice(-20).toLowerCase();
      if (buffer.includes('sudo parul')) {
        playTransmitSuccess();
        buffer = '';
        document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('keypress', onType);
    return () => window.removeEventListener('keypress', onType);
  }, []);

  const handleNavigate = useCallback(
    (sectionId: string) => {
      if (viewMode === 'bento' && sectionId !== 'bento') setViewMode('desktop');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
    [viewMode]
  );

  return (
    <div className="relative min-h-screen bg-[#05070a] text-[#e8eef6] overflow-x-hidden selection:bg-[#4cd9e0] selection:text-[#062a2c]">
      {!performanceMode && <ShaderBackground />}
      {performanceMode && (
        <div className="fixed inset-0 bg-[#05070a] pointer-events-none" style={{ zIndex: 0 }} aria-hidden />
      )}

      {showBoot && (
        <BootSequence
          onComplete={() => {
            setShowBoot(false);
            setShowIntro(false);
          }}
          onSkip={() => {
            setShowBoot(false);
            setShowIntro(false);
          }}
        />
      )}
      {!showBoot && showIntro && (
        <IntroSequence onComplete={() => setShowIntro(false)} onSkip={() => setShowIntro(false)} />
      )}

      <TopNavBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onReplayIntro={() => setShowIntro(true)}
        currentView={viewMode}
        onToggleView={(mode) => setViewMode(mode)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenCommand={() => setCommandOpen(true)}
        onOpenRecruiter={() => setRecruiterOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        onOpenVoice={() => setVoiceOpen(true)}
      />

      <main className="relative z-10">
        {viewMode === 'bento' ? (
          <BentoOverview
            onSelectProject={(project) => setSelectedProject(project)}
            onNavigateSection={handleNavigate}
          />
        ) : (
          <>
            <HeroSection
              onInitSequence={() => setShowIntro(true)}
              onExploreProjects={() => handleNavigate('projects')}
            />
            <ThirtySecondRead />
            <ProjectsSection onSelectProject={setSelectedProject} />
            <AboutSection />
            <StackSection />
            <ExperienceSection />
            <MissionTimeline />
            <ArchitectureExplorer />
            <PerformanceLab performanceMode={performanceMode} onTogglePerf={togglePerf} />
            <EngineeringLab />
            <SecurityCenter />
            <InteractiveResume />
            <ContactCTA />
            {/* Deeper / experimental — still on page but after primary path */}
            <OSDashboard
              onSelectProject={setSelectedProject}
              onNavigate={handleNavigate}
              onOpenAI={() => setAiOpen(true)}
              onOpenRecruiter={() => setRecruiterOpen(true)}
            />
            <CapabilitiesSection />
            <SkillGraph />
            <PortfolioDNA />
            <SpatialMode onSelectProject={setSelectedProject} />
            <GitHubActivity />
            <CommsTerminal />
          </>
        )}
      </main>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onReplayIntro={() => setShowIntro(true)}
        currentView={viewMode}
        onToggleView={(mode) => setViewMode(mode)}
      />
      <CommandCenter
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={handleNavigate}
        onSelectProject={setSelectedProject}
        onOpenRecruiter={() => setRecruiterOpen(true)}
        onToggleBento={() => setViewMode((m) => (m === 'bento' ? 'desktop' : 'bento'))}
        onTrace={(id) => setTraceId(id)}
      />
      <RecruiterMode
        open={recruiterOpen}
        onClose={() => setRecruiterOpen(false)}
        onSelectProject={setSelectedProject}
      />
      <AIAgent
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onSelectProject={setSelectedProject}
        onNavigate={handleNavigate}
      />
      <VoiceInterface
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSelectProject={setSelectedProject}
        onNavigate={handleNavigate}
      />
      <SystemTrace
        projectId={traceId}
        onClose={() => setTraceId(null)}
        onOpenProject={(id) => {
          const p = PROJECTS_DATA.find((x) => x.id === id);
          if (p) setSelectedProject(p);
        }}
      />
      {!showBoot && !showIntro && <TelemetryHUD compact />}
      <Footer />
    </div>
  );
}

export default App;
