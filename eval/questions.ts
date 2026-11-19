import { banglaToGregorian, gregorianToBangla, MONTHS } from "../src/calendar.js";
import { findDistrict } from "../src/districts.js";
import { validateMobile } from "../src/mobile.js";

export type Kind = "to_bangla" | "to_gregorian" | "weekday" | "district" | "operator";

export interface Question {
  id: string;
  kind: Kind;
  prompt: string;
  /** Expected answer in the format the prompt asks for. */
  expected: string;
}

/** Small seeded PRNG so the question set is identical on every run. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

function isoDate(rand: () => number): string {
  const start = Date.UTC(2024, 0, 1);
  const days = Math.floor(rand() * 365 * 6); // 2024-2029
  return new Date(start + days * 86_400_000).toISOString().slice(0, 10);
}

function calendarQuestions(rand: () => number): Question[] {
  const out: Question[] = [];
  for (let i = 0; i < 20; i++) {
    const iso = isoDate(rand);
    const bn = gregorianToBangla(iso);
    out.push({
      id: `to_bangla_${i + 1}`,
      kind: "to_bangla",
      prompt: `In Bangladesh's official Bengali calendar, what is the Bengali date for ${iso}? Answer as "<day> <month> <year>", e.g. "1 Boishakh 1433".`,
      expected: `${bn.day} ${bn.monthName} ${bn.year}`,
    });
  }
  for (let i = 0; i < 12; i++) {
    const bn = gregorianToBangla(isoDate(rand));
    out.push({
      id: `to_gregorian_${i + 1}`,
      kind: "to_gregorian",
      prompt: `In Bangladesh's official Bengali calendar, which Gregorian date is ${bn.day} ${bn.monthName} ${bn.year}? Answer as YYYY-MM-DD.`,
      expected: banglaToGregorian(bn.day, bn.month, bn.year),
    });
  }
  for (let i = 0; i < 6; i++) {
    const year = 1434 + i;
    const month = Math.floor(rand() * 12) + 1;
    const iso = banglaToGregorian(1, month, year);
    out.push({
      id: `weekday_${i + 1}`,
      kind: "weekday",
      prompt: `On which weekday does 1 ${MONTHS[month - 1].en} ${year} (Bangladesh's Bengali calendar) fall? Answer with the English weekday name.`,
      expected: gregorianToBangla(iso).weekday,
    });
  }
  return out;
}

function lookupQuestions(): Question[] {
  const districts = ["Comilla", "Jessore", "Bogra", "Netrokona", "Lalmonirhat", "Shariatpur"];
  const numbers = ["01312-456789", "+880 1912 345678", "01812345678", "016 1234 5678", "01512-987654", "8801712000111"];
  return [
    ...districts.map((name, i) => ({
      id: `district_${i + 1}`,
      kind: "district" as const,
      prompt: `Which division of Bangladesh is the district "${name}" in? Answer with the division name.`,
      expected: findDistrict(name)!.division,
    })),
    ...numbers.map((number, i) => ({
      id: `operator_${i + 1}`,
      kind: "operator" as const,
      prompt: `Which mobile operator does the Bangladeshi number ${number} belong to? Answer with the operator name.`,
      expected: validateMobile(number).operator!,
    })),
  ];
}

export function buildQuestions(): Question[] {
  return [...calendarQuestions(rng(1433)), ...lookupQuestions()];
}
