import { z } from "zod";

export const tones = ["차분함", "전문적", "친근함", "고급스러움", "활기참"] as const;
export const colors = ["red", "black", "yellow", "purple", "orange", "blue", "white", "green"] as const;
const text = (min: number, max: number) => z.string().trim().min(min, `${min}자 이상 입력해 주세요.`).max(max, `${max}자 이하로 입력해 주세요.`);
const optional = (max: number) => z.preprocess(v => typeof v === "string" && !v.trim() ? undefined : v, text(1, max).optional());
export const inputSchema = z.object({
  industry: text(2, 40), brand_name: text(1, 80), intro: text(10, 800),
  tone: z.enum(tones).default("전문적"), region: optional(50), headline: optional(80),
  strengths: optional(1000), requirements: optional(600),
  colors: z.array(z.enum(colors)).min(1).max(2).refine(a => new Set(a).size === a.length, "서로 다른 색상을 선택해 주세요.").optional(),
}).strict();
export type Input = z.infer<typeof inputSchema>;
export class InputError extends Error {
  constructor(public fields: Record<string, string>) { super("입력 내용을 확인해 주세요."); }
}
export function normalizeInput(value: unknown): Input {
  const result = inputSchema.safeParse(value);
  if (!result.success) throw new InputError(Object.fromEntries(result.error.issues.map(e => [e.path[0] ?? "form", e.message])));
  const fields: Record<string, string> = {};
  for (const [key, val] of Object.entries(result.data)) if (typeof val === "string") {
    // ponytail: conservative recognizers; full PII detection requires a dedicated classification layer.
    if (/(?:https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+82|0\d{1,2})[- .]?\d{3,4}[- .]?\d{4}|\d{6}[- ]?[1-4]\d{6}|\d{3}-\d{2}-\d{5})/i.test(val)) fields[key] = "URL·이메일·연락처·식별번호를 제외하고 작성해 주세요.";
  }
  if (Object.keys(fields).length) throw new InputError(fields);
  return Object.fromEntries(Object.entries(result.data).filter(([,v]) => v !== undefined)) as Input;
}
