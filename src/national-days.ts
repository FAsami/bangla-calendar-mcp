import { gregorianToBangla } from "./calendar.js";

/**
 * Fixed-date national days in Bangladesh. Lunar holidays (the two Eids, Shab-e-Barat,
 * Ashura, Eid-e-Milad-un-Nabi) depend on moon sighting, and the government's yearly
 * holiday list changes, so neither is included here.
 */
const FIXED_DAYS = [
  { monthDay: "02-21", name: "Shaheed Dibosh and International Mother Language Day", nameBn: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস" },
  { monthDay: "03-26", name: "Independence Day", nameBn: "স্বাধীনতা দিবস" },
  { monthDay: "04-14", name: "Pohela Boishakh (Bengali New Year)", nameBn: "পহেলা বৈশাখ" },
  { monthDay: "05-01", name: "May Day", nameBn: "মে দিবস" },
  { monthDay: "12-16", name: "Victory Day", nameBn: "বিজয় দিবস" },
  { monthDay: "12-25", name: "Christmas Day (Boro Din)", nameBn: "বড়দিন" },
] as const;

export interface NationalDay {
  date: string;
  name: string;
  nameBn: string;
  weekday: string;
  banglaDate: string;
}

export function nationalDays(year: number): NationalDay[] {
  if (!Number.isInteger(year) || year < 1972 || year > 2200) {
    throw new Error(`Year must be between 1972 and 2200, got ${year}`);
  }
  return FIXED_DAYS.map((d) => {
    const date = `${year}-${d.monthDay}`;
    const bn = gregorianToBangla(date);
    return { date, name: d.name, nameBn: d.nameBn, weekday: bn.weekday, banglaDate: bn.formattedBn };
  });
}

export const NATIONAL_DAYS_NOTE =
  "Only fixed-date national days are listed. Lunar holidays (Eid-ul-Fitr, Eid-ul-Adha, Shab-e-Barat, Ashura, " +
  "Eid-e-Milad-un-Nabi) depend on moon sighting; check the government's official holiday list for those.";
