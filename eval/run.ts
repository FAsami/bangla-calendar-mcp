/**
 * Eval: does giving Claude these tools improve its answers?
 *
 * Every question is asked twice with the same system prompt: once with no tools (baseline)
 * and once with the MCP server's tools. Answers are graded deterministically.
 *
 *   pnpm eval                # all 50 questions
 *   pnpm eval -- --limit 5   # quick, cheap trial
 *
 * Env: EVAL_MODEL (default claude-opus-5-5), EVAL_EFFORT (low|medium|high, default medium).
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { mkdirSync, writeFileSync } from "node:fs";
import { TOOLS, runTool, type ToolDef } from "../src/tools.js";
import { buildQuestions, type Question } from "./questions.js";
import { extractAnswer, isCorrect } from "./grade.js";
import { printReport, type Result } from "./report.js";

const MODEL = process.env.EVAL_MODEL ?? "claude-opus-5-5";
const EFFORT = (process.env.EVAL_EFFORT ?? "medium") as "low" | "medium" | "high";
const SYSTEM =
  "You answer questions about Bangladesh. Think it through, then end your reply with a final line " +
  "in the form `ANSWER: <answer>` using exactly the format the question asks for.";

const client = new Anthropic({ maxRetries: 4 });

const runnableTools = (TOOLS as ToolDef<z.ZodRawShape>[]).map((def) =>
  betaZodTool({
    name: def.name,
    description: def.description,
    inputSchema: z.object(def.shape),
    run: async (args) => runTool(def, args).text,
  }),
);

type Usage = { input: number; output: number };

function textOf(content: Array<{ type: string; text?: string }>): string {
  return content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
}

async function askBaseline(q: Question): Promise<{ text: string; stop: string; usage: Usage }> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: EFFORT },
    messages: [{ role: "user", content: q.prompt }],
  });
  return { text: textOf(res.content), stop: res.stop_reason ?? "", usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } };
}

async function askWithTools(q: Question): Promise<{ text: string; stop: string; usage: Usage; toolCalls: number }> {
  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 8,
    system: SYSTEM,
    output_config: { effort: EFFORT },
    tools: runnableTools,
    messages: [{ role: "user", content: q.prompt }],
  });
  const usage: Usage = { input: 0, output: 0 };
  let toolCalls = 0;
  let last: Anthropic.Beta.BetaMessage | undefined;
  for await (const message of runner) {
    usage.input += message.usage.input_tokens;
    usage.output += message.usage.output_tokens;
    toolCalls += message.content.filter((b) => b.type === "tool_use").length;
    last = message;
  }
  if (!last) throw new Error("tool runner returned no message");
  return { text: textOf(last.content), stop: last.stop_reason ?? "", usage, toolCalls };
}

async function evaluate(q: Question, arm: "baseline" | "tools"): Promise<Result> {
  try {
    const r = arm === "baseline" ? { ...(await askBaseline(q)), toolCalls: 0 } : await askWithTools(q);
    const answer = r.stop === "refusal" ? null : extractAnswer(r.text);
    return {
      id: q.id, kind: q.kind, arm, expected: q.expected, answer,
      correct: isCorrect(q, answer), stop: r.stop, usage: r.usage, toolCalls: r.toolCalls,
    };
  } catch (err) {
    const error = err instanceof Anthropic.APIError ? `${err.status ?? ""} ${err.message}` : String(err);
    return { id: q.id, kind: q.kind, arm, expected: q.expected, answer: null, correct: false, stop: "error", usage: { input: 0, output: 0 }, toolCalls: 0, error };
  }
}

/** Runs jobs with at most `limit` in flight, to stay under rate limits. */
async function pool<T>(jobs: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      results[i] = await jobs[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}

async function main() {
  const limitFlag = process.argv.indexOf("--limit");
  const all = buildQuestions();
  const questions = limitFlag > -1 ? all.slice(0, Number(process.argv[limitFlag + 1])) : all;
  console.log(`Running ${questions.length} questions x 2 arms on ${MODEL} (effort ${EFFORT})...`);

  const jobs = questions.flatMap((q) => [() => evaluate(q, "baseline"), () => evaluate(q, "tools")]);
  const results = await pool(jobs, 5);

  mkdirSync("eval/results", { recursive: true });
  const file = `eval/results/${MODEL}-${EFFORT}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({ model: MODEL, effort: EFFORT, results }, null, 2));
  printReport(results, MODEL);
  console.log(`\nFull results: ${file}`);
}

await main();
