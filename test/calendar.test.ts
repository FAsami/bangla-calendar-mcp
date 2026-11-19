import { describe, expect, it } from "vitest";
import { banglaToGregorian, gregorianToBangla, monthLengths, resolveMonth, toBanglaDigits } from "../src/calendar.js";

describe("gregorianToBangla: official anchor dates", () => {
  it.each([
    ["2026-04-14", 1, "Boishakh", 1433],
    ["2025-12-16", 1, "Poush", 1432],
    ["2026-02-21", 8, "Falgun", 1432],
    ["2026-03-26", 12, "Choitro", 1432],
    ["2024-03-26", 12, "Choitro", 1430], // leap-year Falgun still lands 26 March on 12 Choitro
    ["2026-04-13", 30, "Choitro", 1432], // last day of the year
  ])("%s is %i %s %i", (iso, day, monthName, year) => {
    const bn = gregorianToBangla(iso);
    expect([bn.day, bn.monthName, bn.year]).toEqual([day, monthName, year]);
  });

  it("gets historical weekdays right", () => {
    expect(gregorianToBangla("1952-02-21").weekday).toBe("Thursday");
    expect(gregorianToBangla("1971-12-16").weekday).toBe("Thursday");
  });

  it("formats in Bengali script with season", () => {
    const bn = gregorianToBangla("2025-12-16");
    expect(bn.formattedBn).toBe("১ পৌষ ১৪৩২");
    expect(bn.seasonBn).toBe("শীত");
  });

  it("rejects impossible dates", () => {
    expect(() => gregorianToBangla("2026-02-30")).toThrow(/Not a real calendar date/);
    expect(() => gregorianToBangla("16/12/2025")).toThrow(/YYYY-MM-DD/);
  });
});

describe("year structure", () => {
  it("each Bengali year spans exactly from one 14 April to the next", () => {
    for (let y = 1990; y <= 2060; y++) {
      const days = (Date.UTC(y + 1, 3, 14) - Date.UTC(y, 3, 14)) / 86_400_000;
      expect(monthLengths(y).reduce((a, b) => a + b, 0)).toBe(days);
    }
  });
});

describe("banglaToGregorian", () => {
  it("inverts gregorianToBangla for every day from 1990 to 2060", () => {
    for (let t = Date.UTC(1990, 0, 1); t <= Date.UTC(2060, 11, 31); t += 86_400_000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      const bn = gregorianToBangla(iso);
      expect(banglaToGregorian(bn.day, bn.month, bn.year)).toBe(iso);
    }
  });

  it("rejects days beyond the month length", () => {
    expect(() => banglaToGregorian(30, 11, 1432)).toThrow(/has 29 days/);
    expect(() => banglaToGregorian(1, 13, 1432)).toThrow(/Month must be 1-12/);
  });
});

describe("helpers", () => {
  it("resolves month names and spellings", () => {
    expect(resolveMonth("Poush")).toBe(9);
    expect(resolveMonth("paush")).toBe(9);
    expect(resolveMonth("চৈত্র")).toBe(12);
    expect(resolveMonth("3")).toBe(3);
  });

  it("converts digits", () => {
    expect(toBanglaDigits("2026-12-16")).toBe("২০২৬-১২-১৬");
  });
});
