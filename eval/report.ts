import type { Kind } from "./questions.js";

export interface Result {
  id: string;
  kind: Kind;
  arm: "baseline" | "tools";
  expected: string;
  answer: string | null;
  correct: boolean;
  stop: string;
  usage: { input: number; output: number };
  toolCalls: number;
  error?: string;
}

/** Per-million-token prices in USD, for the cost line. */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

const pct = (n: number, d: number) => (d === 0 ? "-" : `${Math.round((100 * n) / d)}%`);

function score(results: Result[], arm: Result["arm"], kind?: Kind) {
  const rows = results.filter((r) => r.arm === arm && (!kind || r.kind === kind));
  return { correct: rows.filter((r) => r.correct).length, total: rows.length };
}

/** Prints a Markdown table that can be pasted straight into the README. */
export function printReport(results: Result[], model: string): void {
  const kinds: Kind[] = ["to_bangla", "to_gregorian", "weekday", "district", "operator"];
  console.log("\n| Question type | Without tools | With tools |");
  console.log("| --- | --- | --- |");
  for (const kind of [...kinds, undefined]) {
    const b = score(results, "baseline", kind);
    const t = score(results, "tools", kind);
    if (b.total === 0) continue;
    const label = kind ? `${kind} (${b.total})` : `**All (${b.total})**`;
    console.log(`| ${label} | ${b.correct}/${b.total} (${pct(b.correct, b.total)}) | ${t.correct}/${t.total} (${pct(t.correct, t.total)}) |`);
  }

  const errors = results.filter((r) => r.error || r.stop === "refusal");
  if (errors.length) console.log(`\n${errors.length} call(s) errored or refused; they count as wrong. See the results file.`);

  const price = PRICES[model];
  for (const arm of ["baseline", "tools"] as const) {
    const rows = results.filter((r) => r.arm === arm);
    const input = rows.reduce((s, r) => s + r.usage.input, 0);
    const output = rows.reduce((s, r) => s + r.usage.output, 0);
    const cost = price ? ` (~$${((input * price.input + output * price.output) / 1e6).toFixed(2)})` : "";
    const calls = rows.reduce((s, r) => s + r.toolCalls, 0);
    console.log(`${arm}: ${input} input + ${output} output tokens${cost}${arm === "tools" ? `, ${calls} tool calls` : ""}`);
  }
}
