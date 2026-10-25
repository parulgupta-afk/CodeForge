import { useEffect } from "react";

/**
 * Full-screen animated intro (the "eye made of code").
 * The artwork lives in /public/codeforge-intro.html and is shown in an iframe so its
 * canvas code stays exactly as designed. When the visitor presses
 * "Enter CodeForge" it posts a message and we call onEnter().
 */
export default function Intro({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === "codeforge:enter") onEnter();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onEnter]);

  return (
    <iframe
      title="CodeForge intro"
      src="/codeforge-intro.html"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, background: "#050811" }}
    />
  );
}
