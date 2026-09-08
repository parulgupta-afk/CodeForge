import { generateCode } from "./codeGenerator";
import { buildRepairPrompt } from "../prompts/repair";
import { GeneratedCode, GenerationResult } from "../types/generation";
import { ClassifiedError } from "../types/error";

/**
 * Asks the LLM to repair the previous code using a structured error classification.
 */
export async function repairCode(
  task: string,
  previousCode: GeneratedCode,
  classified: ClassifiedError
): Promise<GenerationResult> {
  const repairPrompt = buildRepairPrompt(task, previousCode, classified);
  return generateCode(repairPrompt);
}
