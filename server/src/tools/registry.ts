/**
 * Tool registry – Phase 4.
 * Each tool has name, permission class, timeout, and a run handler.
 * Input is validated with lightweight runtime checks (Zod optional later).
 */

export type PermissionClass = "read" | "write" | "execute";

export interface ToolContext {
  workspaceRoot: string;
  runId: string;
  /** When true, write tools that touch disallowed paths require approval */
  requireApproval?: boolean;
  allowedWritePaths?: string[];
}

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  /** Set when human approval is required before applying */
  needsApproval?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: PermissionClass;
  timeoutMs: number;
  /**
   * Validate and normalise args. Throw on invalid input.
   */
  validate: (args: Record<string, unknown>) => Record<string, unknown>;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

const registry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  registry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

export function listTools(): Array<{
  name: string;
  description: string;
  permission: PermissionClass;
}> {
  return Array.from(registry.values()).map((t) => ({
    name: t.name,
    description: t.description,
    permission: t.permission,
  }));
}

export async function invokeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const tool = registry.get(name);
  if (!tool) {
    return { ok: false, error: `unknown_tool: ${name}` };
  }
  let validated: Record<string, unknown>;
  try {
    validated = tool.validate(args || {});
  } catch (err: any) {
    return { ok: false, error: `invalid_args: ${err.message}` };
  }

  const timeout = tool.timeoutMs;
  try {
    const result = await Promise.race([
      tool.run(validated, ctx),
      new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`tool_timeout: ${name}`)), timeout)
      ),
    ]);
    return result;
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

/** Schema helper – require string field */
export function reqString(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return v;
}

export function optString(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new Error(`${key} must be a string`);
  return v;
}

export function optNumber(args: Record<string, unknown>, key: string, def?: number): number | undefined {
  const v = args[key];
  if (v === undefined || v === null) return def;
  if (typeof v !== "number" || Number.isNaN(v)) throw new Error(`${key} must be a number`);
  return v;
}
