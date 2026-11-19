/** Mobile operator by the third digit of a Bangladeshi mobile number (01X...). */
const OPERATORS: Record<string, string> = {
  "3": "Grameenphone",
  "7": "Grameenphone",
  "4": "Banglalink",
  "9": "Banglalink",
  "8": "Robi",
  "6": "Airtel (Robi)",
  "5": "Teletalk",
};

export interface MobileCheck {
  valid: boolean;
  /** E.164 form, e.g. +8801712345678 */
  e164?: string;
  /** Local 11-digit form, e.g. 01712345678 */
  local?: string;
  operator?: string;
  reason?: string;
}

/** Validates a Bangladeshi mobile number written in any common format. */
export function validateMobile(input: string): MobileCheck {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  let local: string;
  if (/^8801\d{9}$/.test(digits)) local = digits.slice(2);
  else if (/^01\d{9}$/.test(digits)) local = digits;
  else if (/^1\d{9}$/.test(digits)) local = `0${digits}`;
  else return { valid: false, reason: "A Bangladeshi mobile number has 11 digits starting with 01 (or +880 1...)." };

  const operator = OPERATORS[local[2]];
  if (!operator) return { valid: false, reason: `01${local[2]} is not an assigned mobile prefix.` };
  return { valid: true, e164: `+88${local}`, local, operator };
}
