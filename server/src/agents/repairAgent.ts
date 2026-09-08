import { generateCode } from "./codeGenerator";
import { buildRepairPrompt } from "../prompts/repair";
import { GeneratedCode, GenerationResult } from "../types/generation";
import { ExecutionResult } from "../types/execution";

/**
 * Asks the LLM to repair the previous code based on the execution error.
 * Reuses the same generateCode infrastructure (Anthropic / Gemini / Mock).
 */
export async function repairCode(
  task: string,
  previousCode: GeneratedCode,
  execution: ExecutionResult
): Promise<GenerationResult> {
  const repairPrompt = buildRepairPrompt(task, previousCode, execution);

  // We pass the repair prompt as the "task" so the existing generator can handle it.
  // A more advanced version can use a dedicated repair system prompt later.
  return generateCode(repairPrompt);
}
