/**
 * The states and union territories a parcel can be sent to, and a matcher
 * forgiving enough to recognise what people actually type.
 *
 * The value that leaves here is the one the courier's manifest sees. A guest
 * typing "maharastra", "MH" or "Orissa" is not making an interesting
 * distinction — they are describing one place — so the field resolves all of
 * them to the canonical spelling rather than shipping the difference onward.
 */

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

/**
 * Everything else a customer might reasonably write, mapped to the canonical
 * name: the official two-letter codes, the pre-rename spellings that are still
 * in common use, and the ampersand forms.
 */
const ALIASES: Record<string, IndianState> = {
  // Official state codes — plenty of people type these.
  ap: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  cg: "Chhattisgarh",
  ct: "Chhattisgarh",
  ga: "Goa",
  gj: "Gujarat",
  hr: "Haryana",
  hp: "Himachal Pradesh",
  jh: "Jharkhand",
  ka: "Karnataka",
  kl: "Kerala",
  mp: "Madhya Pradesh",
  mh: "Maharashtra",
  mn: "Manipur",
  ml: "Meghalaya",
  mz: "Mizoram",
  nl: "Nagaland",
  od: "Odisha",
  or: "Odisha",
  pb: "Punjab",
  rj: "Rajasthan",
  sk: "Sikkim",
  tn: "Tamil Nadu",
  tg: "Telangana",
  ts: "Telangana",
  tr: "Tripura",
  up: "Uttar Pradesh",
  uk: "Uttarakhand",
  ut: "Uttarakhand",
  wb: "West Bengal",
  an: "Andaman and Nicobar Islands",
  ch: "Chandigarh",
  dh: "Dadra and Nagar Haveli and Daman and Diu",
  dd: "Dadra and Nagar Haveli and Daman and Diu",
  dl: "Delhi",
  jk: "Jammu and Kashmir",
  la: "Ladakh",
  ld: "Lakshadweep",
  py: "Puducherry",
  pn: "Puducherry",

  // Renamed, but the old names are still what many people say.
  orissa: "Odisha",
  pondicherry: "Puducherry",
  puduchery: "Puducherry",
  uttaranchal: "Uttarakhand",
  newdelhi: "Delhi",
  nctofdelhi: "Delhi",
  delhincr: "Delhi",
  nationalcapitalterritoryofdelhi: "Delhi",
  bangalore: "Karnataka",
  pondy: "Puducherry",

  // The merged UT, still written as its two halves.
  dadraandnagarhaveli: "Dadra and Nagar Haveli and Daman and Diu",
  damananddiu: "Dadra and Nagar Haveli and Daman and Diu",
  andamanandnicobar: "Andaman and Nicobar Islands",
  andamannicobar: "Andaman and Nicobar Islands",
};

/**
 * Case, punctuation and "&" versus "and" are not differences worth keeping, so
 * comparison happens on a form with none of them.
 */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

const BY_FOLDED = new Map<string, IndianState>(
  INDIAN_STATES.map((state) => [fold(state), state])
);

/**
 * The canonical state for whatever was typed, or null if it is not a place we
 * ship to. Null is the useful answer — it is what lets the form say "choose
 * from the list" instead of sending a courier somewhere that does not exist.
 */
export function matchState(input: string | null | undefined): IndianState | null {
  if (!input) return null;
  const folded = fold(input);
  if (!folded) return null;
  return BY_FOLDED.get(folded) ?? ALIASES[folded] ?? null;
}

export function isKnownState(input: string | null | undefined): boolean {
  return matchState(input) !== null;
}

/**
 * States to offer for what has been typed so far.
 *
 * Prefix matches come first: someone typing "ma" wants Maharashtra before
 * Himachal Pradesh, even though both contain "ma".
 */
export function suggestStates(query: string, limit = 8): IndianState[] {
  const folded = fold(query);
  if (!folded) return INDIAN_STATES.slice(0, limit) as unknown as IndianState[];

  const startsWith: IndianState[] = [];
  const contains: IndianState[] = [];

  for (const state of INDIAN_STATES) {
    const candidate = fold(state);
    if (candidate.startsWith(folded)) startsWith.push(state);
    else if (candidate.includes(folded)) contains.push(state);
  }

  // A code or old name matches nothing textually, so offer what it resolves to.
  const aliased = ALIASES[folded];
  if (aliased && !startsWith.includes(aliased) && !contains.includes(aliased)) {
    startsWith.unshift(aliased);
  }

  return [...startsWith, ...contains].slice(0, limit);
}
