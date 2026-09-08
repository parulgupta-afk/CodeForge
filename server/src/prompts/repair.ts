import { GeneratedCode } from "../types/generation";
import { ClassifiedError } from "../types/error";

export function buildRepairPrompt(
  task: string,
  previousCode: GeneratedCode,
  classified: ClassifiedError
): string {
  return `You are an expert Python programmer working inside CodeForge, an autonomous coding agent.

The previous attempt to solve the task failed. Your job is to fix the code using the structured error information below.

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
4. Fix the specific problem indicated by the error category.
5. Prefer the Python standard library when possible.
6. Do not include any text before or after the JSON object.

ORIGINAL TASK:
${task}

PREVIOUS CODE:
\`\`\`python
${previousCode.code}
\`\`\`

STRUCTURED ERROR:
Category: ${classified.category}
Detail: ${classified.detail}
Retryable: ${classified.retryable}

${classified.rawStderr ? `Raw stderr (for reference):\n${classified.rawStderr.slice(0, 800)}` : ""}

Now produce the fixed version of the code.`;
}
