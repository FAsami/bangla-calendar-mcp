import { describe, expect, it } from "vitest";
import { districtCount, findDistrict } from "../src/districts.js";
import { validateMobile } from "../src/mobile.js";
import { nationalDays } from "../src/national-days.js";
import { TOOLS, runTool } from "../src/tools.js";

describe("districts", () => {
  it("has all 64 districts", () => {
    expect(districtCount()).toBe(64);
  });

  it("finds districts by official and old spellings", () => {
    expect(findDistrict("Sylhet")).toEqual({ district: "Sylhet", division: "Sylhet" });
    expect(findDistrict("Comilla")).toMatchObject({ district: "Cumilla", division: "Chattogram" });
    expect(findDistrict("cox's bazar")?.division).toBe("Chattogram");
    expect(findDistrict("Atlantis")).toBeNull();
  });
});

describe("mobile numbers", () => {
  it("normalises formats and finds the operator", () => {
    expect(validateMobile("01712-345678")).toMatchObject({ valid: true, e164: "+8801712345678", operator: "Grameenphone" });
    expect(validateMobile("+880 1912 345678").operator).toBe("Banglalink");
    expect(validateMobile("1512345678").operator).toBe("Teletalk");
  });

  it("rejects bad numbers", () => {
    expect(validateMobile("01212345678").valid).toBe(false);
    expect(validateMobile("0171234567").valid).toBe(false);
  });
});

describe("national days", () => {
  it("lists Victory Day with its Bengali date", () => {
    const victory = nationalDays(2025).find((d) => d.name === "Victory Day");
    expect(victory).toMatchObject({ date: "2025-12-16", banglaDate: "১ পৌষ ১৪৩২" });
  });
});

describe("runTool", () => {
  const tool = (name: string) => TOOLS.find((t) => t.name === name)!;

  it("returns JSON text for valid input", () => {
    const { text, isError } = runTool(tool("gregorian_to_bangla") as never, { date: "2026-04-14" });
    expect(isError).toBe(false);
    expect(JSON.parse(text)).toMatchObject({ day: 1, monthName: "Boishakh", year: 1433 });
  });

  it("returns a readable error instead of throwing", () => {
    const { text, isError } = runTool(tool("gregorian_to_bangla") as never, { date: "not a date" });
    expect(isError).toBe(true);
    expect(text).toMatch(/YYYY-MM-DD/);
  });
});
