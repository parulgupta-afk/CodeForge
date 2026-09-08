import { GeneratedCode } from "../types/generation";
import { ExecutionResult } from "../types/execution";

export function buildRepairPrompt(
  task: string,
  previousCode: GeneratedCode,
  execution: ExecutionResult
): string {
  const errorInfo = execution.timedOut
    ? `The program timed out after ${execution.durationMs}ms.`
    : execution.stderr
    ? execution.stderr
    : execution.error || "Unknown error";

  return `You are an expert Python programmer working inside CodeForge, an autonomous coding agent.

The previous attempt to solve the task failed. Your job is to fix the code.

STRICT RULES:
1. Return ONLY valid JSON. No markdown, no explanations outside the JSON.
2. The JSON must match this exact schema:
{
  "language": "python",
  "filename": "main.py",
  "code": "the full fixed python source code as a string",
  "dependencies": ["list", "of", "pip", "packages"],
  "explanation": "one short sentence explaining what you fixed"
}

3. Keep the original intent of the task.
4. Fix the specific error that occurred.
5. Prefer the Python standard library when possible.
6. Do not include any text before or after the JSON object.

ORIGINAL TASK:
${task}

PREVIOUS CODE:
\`\`\`python
${previousCode.code}
\`\`\`

ERROR THAT OCCURRED:
${errorInfo}

Exit code: ${execution.exitCode}
Timed out: ${execution.timedOut}

Now produce the fixed version of the code.`;
}
