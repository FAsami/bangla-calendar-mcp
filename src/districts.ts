/** The 64 districts of Bangladesh, grouped by their 8 divisions. */
const DIVISIONS: Record<string, readonly string[]> = {
  Barishal: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Chattogram: [
    "Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cox's Bazar", "Cumilla",
    "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati",
  ],
  Dhaka: [
    "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj",
    "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail",
  ],
  Khulna: [
    "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura",
    "Meherpur", "Narail", "Satkhira",
  ],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Rajshahi: ["Bogura", "Chapai Nawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"],
  Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

/** Older or alternate English spellings, mapped to the current official name. */
const ALIASES: Record<string, string> = {
  barisal: "Barishal",
  chittagong: "Chattogram",
  comilla: "Cumilla",
  coxsbazar: "Cox's Bazar",
  jessore: "Jashore",
  bogra: "Bogura",
  chapainawabganj: "Chapai Nawabganj",
  nawabganj: "Chapai Nawabganj",
  jhalakathi: "Jhalokati",
  jhalokathi: "Jhalokati",
  netrakona: "Netrokona",
  maulvibazar: "Moulvibazar",
  moulvibazaar: "Moulvibazar",
  laxmipur: "Lakshmipur",
  khagrachari: "Khagrachhari",
  jaipurhat: "Joypurhat",
  narshingdi: "Narsingdi",
};

const key = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

const INDEX = new Map<string, { district: string; division: string }>();
for (const [division, districts] of Object.entries(DIVISIONS)) {
  for (const district of districts) INDEX.set(key(district), { district, division });
}

export interface DistrictMatch {
  district: string;
  division: string;
  /** True when the input was an older or alternate spelling. */
  renamedFrom?: string;
}

export function findDistrict(name: string): DistrictMatch | null {
  const k = key(name);
  const direct = INDEX.get(k);
  if (direct) return direct;
  const official = ALIASES[k];
  if (!official) return null;
  const match = INDEX.get(key(official));
  return match ? { ...match, renamedFrom: name.trim() } : null;
}

export function listDivisions(): { division: string; districts: string[] }[] {
  return Object.entries(DIVISIONS).map(([division, districts]) => ({ division, districts: [...districts] }));
}

export function districtCount(): number {
  return INDEX.size;
}
