import { z } from "zod";
import { banglaToGregorian, gregorianToBangla, resolveMonth, toBanglaDigits } from "./calendar.js";
import { nationalDays, NATIONAL_DAYS_NOTE } from "./national-days.js";
import { findDistrict, listDivisions } from "./districts.js";
import { validateMobile } from "./mobile.js";

/**
 * Tool definitions shared by the MCP server and the eval, so both exercise the same code.
 * Each handler returns a JSON-serialisable value.
 */
export interface ToolDef<S extends z.ZodRawShape> {
  name: string;
  description: string;
  shape: S;
  handler: (args: z.infer<z.ZodObject<S>>) => unknown;
}

const define = <S extends z.ZodRawShape>(def: ToolDef<S>) => def;

export const TOOLS = [
  define({
    name: "gregorian_to_bangla",
    description:
      "Convert a Gregorian date to the Bangladesh Bengali calendar (Bangla Academy 2019 revision). " +
      "Returns the Bengali day, month, year, season (ritu) and weekday, in English and Bengali script.",
    shape: { date: z.string().describe("Gregorian date as YYYY-MM-DD") },
    handler: ({ date }) => gregorianToBangla(date),
  }),
  define({
    name: "bangla_to_gregorian",
    description:
      "Convert a Bangladesh Bengali calendar date to a Gregorian date (YYYY-MM-DD). " +
      "Month can be 1-12 (Boishakh = 1), an English spelling such as 'Poush', or Bengali script.",
    shape: {
      day: z.number().int().describe("Day of the Bengali month, 1-31"),
      month: z.union([z.number().int(), z.string()]).describe("Bengali month: 1-12 or its name"),
      year: z.number().int().describe("Bengali year (Bangabda), e.g. 1433"),
    },
    handler: ({ day, month, year }) => {
      const date = banglaToGregorian(day, resolveMonth(month), year);
      return { date, weekday: gregorianToBangla(date).weekday };
    },
  }),
  define({
    name: "bd_national_days",
    description:
      "List Bangladesh's fixed-date national days for a Gregorian year, with weekday and Bengali date. " +
      "Lunar holidays such as the Eids are not included because they depend on moon sighting.",
    shape: { year: z.number().int().describe("Gregorian year, e.g. 2027") },
    handler: ({ year }) => ({ days: nationalDays(year), note: NATIONAL_DAYS_NOTE }),
  }),
  define({
    name: "bd_district",
    description:
      "Look up a Bangladeshi district and its division. Accepts old spellings (Comilla, Jessore, Bogra, " +
      "Chittagong, Barisal). Leave name empty to list all 64 districts by division.",
    shape: { name: z.string().optional().describe("District name; omit to list all districts") },
    handler: ({ name }) => {
      if (!name) return { divisions: listDivisions() };
      return findDistrict(name) ?? { error: `No Bangladeshi district called "${name}"` };
    },
  }),
  define({
    name: "bd_mobile_number",
    description:
      "Validate a Bangladeshi mobile number in any common format and return its operator " +
      "(Grameenphone, Banglalink, Robi, Airtel, Teletalk) and normalised forms.",
    shape: { number: z.string().describe("Mobile number, e.g. 01712-345678 or +8801712345678") },
    handler: ({ number }) => validateMobile(number),
  }),
  define({
    name: "to_bangla_digits",
    description: "Write a number or text with Bengali digits (০-৯) instead of 0-9.",
    shape: { text: z.string().describe("Text or number to convert") },
    handler: ({ text }) => ({ text: toBanglaDigits(text) }),
  }),
];

/** Runs a tool and always returns text: a JSON result, or an error message the model can read. */
export function runTool(def: ToolDef<z.ZodRawShape>, args: unknown): { text: string; isError: boolean } {
  try {
    const parsed = z.object(def.shape).parse(args);
    return { text: JSON.stringify(def.handler(parsed), null, 2), isError: false };
  } catch (err) {
    return { text: err instanceof Error ? err.message : String(err), isError: true };
  }
}
