import { resolveMonth } from "../src/calendar.js";
import type { Question } from "./questions.js";

/** Takes the text after the last "ANSWER:" line, or null if the model never gave one. */
export function extractAnswer(text: string): string | null {
  const matches = [...text.matchAll(/ANSWER:\s*(.+)/gi)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1].trim().replace(/^["'`*]+|["'`*.]+$/g, "");
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function sameBanglaDate(answer: string, expected: string): boolean {
  const parse = (s: string) => {
    const m = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(s.trim().replace(/,/g, ""));
    if (!m) return null;
    try {
      return `${Number(m[1])}-${resolveMonth(m[2])}-${m[3]}`;
    } catch {
      return null;
    }
  };
  const a = parse(answer);
  return a !== null && a === parse(expected);
}

/** Deterministic grading: no LLM judge, so scores are reproducible. */
export function isCorrect(q: Question, answer: string | null): boolean {
  if (answer === null) return false;
  switch (q.kind) {
    case "to_bangla":
      return sameBanglaDate(answer, q.expected);
    case "to_gregorian":
      return answer.slice(0, 10) === q.expected;
    case "operator":
      // "Airtel (Robi)": accept either brand for 016 numbers
      return q.expected.split(/[()]/).map(norm).filter(Boolean).some((e) => norm(answer).includes(e));
    default:
      return norm(answer) === norm(q.expected);
  }
}
