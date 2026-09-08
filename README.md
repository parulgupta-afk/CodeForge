# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 8 – Studio UI

Premium **CodeForge Studio** frontend applied:
- Newsreader + Source Sans 3 typography
- Craft card elevation & ambient background
- Stepper for Generate → Execute → Repair
- Working Journal for agent logs
- Task Brief input connected to real backend

### Quick Start (Windows CMD)

**Terminal 1 – Backend**
```cmd
cd codeforge\server
copy .env.example .env
notepad .env
npm install
npm run dev
```

**Terminal 2 – Frontend**
```cmd
cd codeforge\client
npm install
npm run dev
```

Open → http://localhost:5173

### Design Credits
UI language adapted from the CodeForge Studio design system (typography, cards, stepper, journal).
