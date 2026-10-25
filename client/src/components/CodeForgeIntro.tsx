import { useEffect, useRef, useState } from "react";

type CodeParticle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  text: string;
  speed: number;
  phase: number;
};

const CODE = [
  '<div className="agent" data-core="ai">',
  '<html lang="en">',
  'const model = await think(context);',
  '<section data-active="true">',
  'function generate(code) { return build(code); }',
  '<span className="neural-core">',
  'if (error) await selfRepair();',
  '<meta name="intelligence" content="adaptive" />',
  'return await forge.create(solution);',
  '</section>',
  'const [vision, setVision] = useState(true);',
  '<CodeForge mode="autonomous" />',
  'while (task.running) { agent.observe(); }',
  '</div>',
];

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const ease = (n: number) => {
  const t = clamp(n, 0, 1);
  return t * t * (3 - 2 * t);
};

export default function CodeForgeIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      setVisible(false);
      return;
    }

    let reducedMotion = false;
    try {
      reducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    } catch {
      reducedMotion = false;
    }

    let hasSeenIntro = false;
    try {
      hasSeenIntro = typeof sessionStorage !== "undefined" && sessionStorage.getItem("codeforge-intro-seen") === "1";
    } catch {
      hasSeenIntro = false;
    }

    if (reducedMotion || hasSeenIntro) {
      setVisible(false);
      return;
    }

    let raf = 0;
    let start = 0;
    let width = 0;
    let height = 0;
    let particles: CodeParticle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const duration = 5900;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const createParticles = () => {
      const cx = width * 0.5;
      const cy = height * 0.49;
      const eyeW = Math.min(width * 0.34, 330);
      const eyeH = Math.min(height * 0.17, 105);
      const next: CodeParticle[] = [];
      const rowStep = width < 600 ? 15 : 18;
      const colStep = width < 600 ? 48 : 62;

      // Each target point is inside the almond-shaped eye. The code itself
      // forms the eye silhouette, iris, and pupil—there is no drawn eye icon.
      for (let row = -Math.floor(eyeH / rowStep); row <= eyeH / rowStep; row++) {
        const y = row * rowStep;
        for (let col = -Math.floor(eyeW / colStep); col <= eyeW / colStep; col++) {
          const x = col * colStep;
          const nx = x / eyeW;
          const ny = y / eyeH;
          const insideEye = Math.abs(ny) < 1 - Math.pow(Math.abs(nx), 1.55);
          const irisRadius = Math.sqrt(x * x + y * y);
          const inIris = irisRadius < eyeH * 0.57;
          const inPupil = irisRadius < eyeH * 0.25;

          if (insideEye && Math.random() > 0.15) {
            let text = CODE[Math.floor(Math.random() * CODE.length)];
            if (inPupil) text = ["{ }", "</>", "=>", "01", "AI"][Math.floor(Math.random() * 5)];
            else if (inIris) text = ["<code>", "{}", "0x01", "AI()", "</>"][Math.floor(Math.random() * 5)];
            next.push({
              x: -Math.random() * width - 80,
              y: cy + y + (Math.random() - 0.5) * 12,
              tx: cx + x,
              ty: cy + y,
              text,
              speed: 0.7 + Math.random() * 0.6,
              phase: Math.random() * 0.18,
            });
          }
        }
      }

      // Extra code streams enter from the left and continue through to the right.
      for (let i = 0; i < 20; i++) {
        next.push({
          x: -Math.random() * width,
          y: cy + (Math.random() - 0.5) * eyeH * 2.6,
          tx: cx + (Math.random() - 0.5) * eyeW * 2.8,
          ty: cy + (Math.random() - 0.5) * eyeH * 2.6,
          text: CODE[i % CODE.length],
          speed: 0.8 + Math.random() * 0.7,
          phase: Math.random() * 0.2,
        });
      }
      particles = next;
    };

    const markSeen = () => {
      try {
        sessionStorage.setItem("codeforge-intro-seen", "1");
      } catch {
        // Ignore storage failures and still hide the intro.
      }
    };

    const draw = (now: number) => {
      if (!start) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#030405";
      ctx.fillRect(0, 0, width, height);

      // A restrained field of tiny code-like traces; no extra logo or tagline.
      ctx.font = "10px 'Courier New', monospace";
      ctx.textBaseline = "middle";

      const build = ease((t - 500) / 1900);
      const exit = ease((t - 3650) / 1300);
      const blink = t > 2920 && t < 3160
        ? Math.max(0.035, Math.abs((t - 3040) / 120))
        : 1;

      for (const p of particles) {
        let x = p.x + (p.tx - p.x) * build;
        let y = p.y + (p.ty - p.y) * build;

        if (t < 500) {
          x = p.x;
        } else if (t >= 500 && t < 3650) {
          x += Math.sin(t / 250 + p.phase * 10) * 1.5;
          const centerY = height * 0.49;
          y = centerY + (y - centerY) * blink;
        } else {
          x = p.tx + exit * (width * 1.35 + Math.abs(p.tx - width / 2));
          y = p.ty + Math.sin(exit * 5 + p.phase * 12) * exit * 28;
        }

        const alpha = t < 500
          ? clamp((t - 180) / 320, 0, 0.9)
          : t < 3650
            ? 0.82 + Math.sin(t / 360 + p.phase * 20) * 0.15
            : 0.9 * (1 - exit);

        if (x < -500 || x > width + 500 || alpha <= 0) continue;
        const eyeCenterX = width / 2;
        const eyeCenterY = height * 0.49;
        const dist = Math.hypot((p.tx - eyeCenterX) / 1.2, p.ty - eyeCenterY);
        ctx.fillStyle = dist < 26 ? `rgba(218,255,255,${alpha})`
          : dist < 58 ? `rgba(86,221,255,${alpha})`
          : `rgba(92,173,202,${alpha * 0.9})`;
        ctx.fillText(p.text, x, y);
      }

      // Draw nothing but black after the code has exited, then reveal the app.
      if (t < duration) {
        raf = requestAnimationFrame(draw);
      } else {
        markSeen();
        setVisible(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelAnimationFrame(raf);
        markSeen();
        setVisible(false);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#030405",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
