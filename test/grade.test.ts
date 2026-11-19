import { describe, expect, it } from "vitest";
import { extractAnswer, isCorrect } from "../eval/grade.js";
import type { Question } from "../eval/questions.js";

const q = (kind: Question["kind"], expected: string): Question => ({ id: "t", kind, prompt: "", expected });

describe("eval grading", () => {
  it("takes the last ANSWER line", () => {
    expect(extractAnswer("ANSWER: 1\nthinking...\nANSWER: **2 Choitro 1432**.")).toBe("2 Choitro 1432");
    expect(extractAnswer("no answer here")).toBeNull();
  });

  it("accepts alternate month spellings but not wrong dates", () => {
    expect(isCorrect(q("to_bangla", "2 Choitro 1432"), "2 Chaitra 1432")).toBe(true);
    expect(isCorrect(q("to_bangla", "2 Choitro 1432"), "3 Choitro 1432")).toBe(false);
  });

  it("accepts either brand for Airtel (Robi)", () => {
    expect(isCorrect(q("operator", "Airtel (Robi)"), "Robi Axiata")).toBe(true);
    expect(isCorrect(q("operator", "Airtel (Robi)"), "Teletalk")).toBe(false);
  });
});
