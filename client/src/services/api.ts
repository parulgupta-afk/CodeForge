import { RunResponse } from "../types/run";

export async function createRun(task: string): Promise<RunResponse> {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.finalError || "Agent request failed");
  }
  return data as RunResponse;
}

export async function getHealth() {
  const res = await fetch("/api/health");
  return res.json();
}
