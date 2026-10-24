import React from 'react';

const ROWS = [
  {
    threat: 'Credential stuffing / brute force',
    mitigation: 'Rate limits on auth routes',
    impl: 'PulseOps authRateLimit · Pocket-Triage authLimiter',
  },
  {
    threat: 'Unauthorized API access',
    mitigation: 'JWT + role checks',
    impl: 'requireAuth / RBAC on staff routes',
  },
  {
    threat: 'XSS from user content',
    mitigation: 'React escaping · validate inputs',
    impl: 'Zod/schemas on API bodies where present',
  },
  {
    threat: 'CORS misconfiguration',
    mitigation: 'Explicit allowed origins',
    impl: 'CORS_ORIGIN env on API (not *)',
  },
  {
    threat: 'Secret leakage',
    mitigation: 'Env vars · never commit .env',
    impl: '.gitignore · Render/Vercel secrets',
  },
  {
    threat: 'Queue poison / retry storms',
    mitigation: 'DLQ + max attempts',
    impl: 'BullMQ failed jobs / DLQ patterns in PulseOps',
  },
];

export const SecurityCenter: React.FC = () => (
  <section
    id="security"
    className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
  >
    <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">SECURITY_CENTER</p>
    <h2 className="text-3xl font-bodoni text-white mt-1 mb-2">Threat → mitigation → implementation</h2>
    <p className="text-sm text-[#c5c6ca] mb-8 max-w-2xl">
      Patterns reflected in featured systems work — interview-friendly, not a penetration test report.
    </p>
    <div className="space-y-3">
      {ROWS.map((r) => (
        <div key={r.threat} className="glass-panel rounded-xl p-4 grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] font-mono-custom text-[#ffb4ab]">THREAT</p>
            <p className="text-[#dce3ed]">{r.threat}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-custom text-[#80d4d8]">MITIGATION</p>
            <p className="text-[#dce3ed]">{r.mitigation}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-custom text-[#4cd9e0]">IMPLEMENTATION</p>
            <p className="text-[#c5c6ca] text-xs">{r.impl}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
