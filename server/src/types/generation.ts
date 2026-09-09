export interface GeneratedCode {
  language: "python";
  filename: string;
  code: string;
  dependencies: string[];
  explanation: string;
}

export interface GenerationResult {
  success: boolean;
  data?: GeneratedCode;
  error?: string;
  rawResponse?: string;
  provider?: string;
  model?: string;
}
