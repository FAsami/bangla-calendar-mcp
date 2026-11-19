/**
 * Bangladesh's revised Bengali calendar (Bangla Academy, 2019 revision).
 *
 * - The year starts on 14 April (Pohela Boishakh).
 * - Boishakh to Ashshin (months 1-6) have 31 days.
 * - Falgun (month 11) has 29 days, or 30 when that February is a Gregorian leap month.
 * - Every other month has 30 days.
 *
 * This keeps national days on fixed Bengali dates: 21 February = 8 Falgun,
 * 26 March = 12 Choitro, 16 December = 1 Poush.
 */

export const MONTHS = [
  { en: "Boishakh", bn: "বৈশাখ" },
  { en: "Joishtho", bn: "জ্যৈষ্ঠ" },
  { en: "Asharh", bn: "আষাঢ়" },
  { en: "Shrabon", bn: "শ্রাবণ" },
  { en: "Bhadro", bn: "ভাদ্র" },
  { en: "Ashshin", bn: "আশ্বিন" },
  { en: "Kartik", bn: "কার্তিক" },
  { en: "Ogrohayon", bn: "অগ্রহায়ণ" },
  { en: "Poush", bn: "পৌষ" },
  { en: "Magh", bn: "মাঘ" },
  { en: "Falgun", bn: "ফাল্গুন" },
  { en: "Choitro", bn: "চৈত্র" },
] as const;

const SEASONS = [
  { en: "Grishmo (summer)", bn: "গ্রীষ্ম" },
  { en: "Borsha (monsoon)", bn: "বর্ষা" },
  { en: "Shorot (early autumn)", bn: "শরৎ" },
  { en: "Hemonto (late autumn)", bn: "হেমন্ত" },
  { en: "Sheet (winter)", bn: "শীত" },
  { en: "Boshonto (spring)", bn: "বসন্ত" },
] as const;

const WEEKDAYS = [
  { en: "Sunday", bn: "রবিবার" },
  { en: "Monday", bn: "সোমবার" },
  { en: "Tuesday", bn: "মঙ্গলবার" },
  { en: "Wednesday", bn: "বুধবার" },
  { en: "Thursday", bn: "বৃহস্পতিবার" },
  { en: "Friday", bn: "শুক্রবার" },
  { en: "Saturday", bn: "শনিবার" },
] as const;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const DAY_MS = 86_400_000;

export interface BanglaDate {
  day: number;
  /** 1-12, Boishakh = 1 */
  month: number;
  year: number;
  monthName: string;
  monthNameBn: string;
  season: string;
  seasonBn: string;
  weekday: string;
  weekdayBn: string;
  /** e.g. "১ পৌষ ১৪৩৩" */
  formattedBn: string;
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Month lengths for the Bengali year that starts on 14 April of `startYear`. */
export function monthLengths(startYear: number): number[] {
  const falgun = isGregorianLeap(startYear + 1) ? 30 : 29;
  return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgun, 30];
}

function utc(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

/** Parses "YYYY-MM-DD" strictly and rejects impossible dates such as 2026-02-30. */
export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) throw new Error(`Expected a date as YYYY-MM-DD, got "${iso}"`);
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(utc(year, month, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`Not a real calendar date: ${iso}`);
  }
  return { year, month, day };
}

function describe(day: number, month: number, year: number, weekdayIndex: number): BanglaDate {
  const m = MONTHS[month - 1];
  const s = SEASONS[Math.floor((month - 1) / 2)];
  const w = WEEKDAYS[weekdayIndex];
  return {
    day,
    month,
    year,
    monthName: m.en,
    monthNameBn: m.bn,
    season: s.en,
    seasonBn: s.bn,
    weekday: w.en,
    weekdayBn: w.bn,
    formattedBn: `${toBanglaDigits(day)} ${m.bn} ${toBanglaDigits(year)}`,
  };
}

/** Converts a Gregorian date ("YYYY-MM-DD") to the Bangladesh Bengali calendar. */
export function gregorianToBangla(iso: string): BanglaDate {
  const { year, month, day } = parseIsoDate(iso);
  const target = utc(year, month, day);
  const startYear = target >= utc(year, 4, 14) ? year : year - 1;
  let offset = Math.round((target - utc(startYear, 4, 14)) / DAY_MS);
  const lengths = monthLengths(startYear);
  let bnMonth = 0;
  while (offset >= lengths[bnMonth]) {
    offset -= lengths[bnMonth];
    bnMonth += 1;
  }
  return describe(offset + 1, bnMonth + 1, startYear - 593, new Date(target).getUTCDay());
}

/** Converts a Bengali date (day, month 1-12, year) to a Gregorian "YYYY-MM-DD". */
export function banglaToGregorian(day: number, month: number, year: number): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Month must be 1-12 (Boishakh = 1), got ${month}`);
  }
  const startYear = year + 593;
  const lengths = monthLengths(startYear);
  if (!Number.isInteger(day) || day < 1 || day > lengths[month - 1]) {
    throw new Error(`${MONTHS[month - 1].en} ${year} has ${lengths[month - 1]} days, got day ${day}`);
  }
  const before = lengths.slice(0, month - 1).reduce((sum, n) => sum + n, 0);
  const result = new Date(utc(startYear, 4, 14) + (before + day - 1) * DAY_MS);
  return result.toISOString().slice(0, 10);
}

/** Resolves a month given as 1-12, an English spelling, or Bengali script. */
export function resolveMonth(input: string | number): number {
  if (typeof input === "number") return input;
  const value = input.trim().toLowerCase();
  if (/^\d+$/.test(value)) return Number(value);
  const index = MONTHS.findIndex(
    (m) => m.en.toLowerCase() === value || m.bn === input.trim() || ALIASES[value] === m.en,
  );
  if (index === -1) throw new Error(`Unknown Bengali month "${input}"`);
  return index + 1;
}

/** Common alternate English spellings of the month names. */
const ALIASES: Record<string, string> = {
  baishakh: "Boishakh",
  boisakh: "Boishakh",
  jyoishtho: "Joishtho",
  jaishtha: "Joishtho",
  jyoishto: "Joishtho",
  ashar: "Asharh",
  asar: "Asharh",
  ashadh: "Asharh",
  srabon: "Shrabon",
  shraban: "Shrabon",
  bhadra: "Bhadro",
  ashwin: "Ashshin",
  ashin: "Ashshin",
  kartic: "Kartik",
  agrahayan: "Ogrohayon",
  ograhayan: "Ogrohayon",
  agrahayon: "Ogrohayon",
  poush: "Poush",
  paush: "Poush",
  falgoon: "Falgun",
  phalgun: "Falgun",
  chaitra: "Choitro",
  choitra: "Choitro",
};
